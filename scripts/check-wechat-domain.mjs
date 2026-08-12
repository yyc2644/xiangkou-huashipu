import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const sourceRoot = path.resolve(new URL("../wechat-client/assets/scripts", import.meta.url).pathname);
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "huashipu-wechat-domain-"));
const sourceFiles = [
  "domain/types.ts",
  "domain/catalog.ts",
  "domain/dayTasks.ts",
  "domain/state.ts",
  "domain/save-migration.ts",
  "application/contracts.ts",
  "application/game-runtime.ts",
  "application/save-repository.ts",
  "application/game-application.ts",
  "platform/mock-platform-adapter.ts",
];

for (const relative of sourceFiles) {
  const source = fs.readFileSync(path.join(sourceRoot, relative), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  }).outputText.replace(/from\s+"(\.\.?(?:\/[^".]+)+)"/g, 'from "$1.mjs"');
  const output = path.join(tmpRoot, relative.replace(/\.ts$/, ".mjs"));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, compiled);
}

const load = (relative) => import(pathToFileURL(path.join(tmpRoot, relative)).href);
const { createInitialState, tickState, useGenerator } = await load("domain/state.mjs");
const { customers, customerById, itemById, orders, recipes } = await load("domain/catalog.mjs");
const { DeterministicGameRuntime } = await load("application/game-runtime.mjs");
const { SaveRepository } = await load("application/save-repository.mjs");
const { GameApplication } = await load("application/game-application.mjs");
const { MockPlatformAdapter } = await load("platform/mock-platform-adapter.mjs");

const results = [];
const check = (name, passed, detail = undefined) => results.push({ name, passed, detail });
const NOW = 1_735_689_600_000;

check("上线内容池包含 42 单、10 配方和 12 顾客", orders.length === 42 && recipes.length === 10 && customers.length === 12, {
  orders: orders.length,
  recipes: recipes.length,
  customers: customers.length,
});
check(
  "订单需求与顾客引用全部有效",
  orders.every((order) => customerById[order.customerId] && order.needs.every((itemId) => itemById[itemId])),
);
check(
  "配方输入输出引用全部有效且输出唯一",
  recipes.every((recipe) => itemById[recipe.output] && recipe.inputs.every((itemId) => itemById[itemId]))
    && new Set(recipes.map((recipe) => recipe.output)).size === recipes.length,
);
const recipeCounts = Object.fromEntries(["steamer", "pan", "gift_table"].map((cooker) => [
  cooker,
  recipes.filter((recipe) => recipe.cooker === cooker).length,
]));
check("单个制作设备内容不超过两个分页", Object.values(recipeCounts).every((count) => count <= 8), recipeCounts);

const firstRuntime = new DeterministicGameRuntime(() => NOW, 12345);
const secondRuntime = new DeterministicGameRuntime(() => NOW, 12345);
const firstSequence = Array.from({ length: 4 }, () => firstRuntime.random());
const secondSequence = Array.from({ length: 4 }, () => secondRuntime.random());
check("相同种子的随机序列可复现", JSON.stringify(firstSequence) === JSON.stringify(secondSequence), { firstSequence, secondSequence });

const snapshot = firstRuntime.snapshot();
const expectedNext = firstRuntime.random();
const restoredRuntime = new DeterministicGameRuntime(() => NOW, 1);
restoredRuntime.restore(snapshot);
check("随机种子存档后可继续原序列", restoredRuntime.random() === expectedNext, { snapshot, expectedNext });

const storage = new Map();
const storageAdapter = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
};
const platform = new MockPlatformAdapter(() => NOW, storageAdapter);
const legacy = createInitialState(NOW);
delete legacy.saveVersion;
delete legacy.nextUid;
delete legacy.dayKey;
delete legacy.dailyProgress;
delete legacy.dailyClaimedTaskIds;
storage.set("xiangkou-huashipu-cocos-v5", JSON.stringify(legacy));

const repository = new SaveRepository(platform, "player-1", "device-1", () => restoredRuntime.snapshot().randomSeed);
const loaded = await repository.load();
check(
  "旧裸状态迁移为 v5 SaveEnvelope",
  loaded.envelope?.schemaVersion === 5
    && loaded.envelope.revision === 0
    && loaded.envelope.state.saveVersion === 5
    && loaded.envelope.state.dailyProgress.materials === 0,
  loaded,
);

let state = loaded.envelope.state;
state = { ...state, message: "只显示一次", atlasFocusItemId: "greens_2", guidedGeneratorId: "veg_basket" };
const saved = await repository.save(state, loaded.envelope.revision);
check(
  "生产存档清除瞬时 UI 状态并保留随机种子",
  saved.state.message === ""
    && saved.state.atlasFocusItemId === undefined
    && saved.state.guidedGeneratorId === undefined
    && saved.randomSeed === restoredRuntime.snapshot().randomSeed,
  saved,
);

const nextDay = NOW + 24 * 60 * 60 * 1000;
const refreshed = tickState({ ...saved.state, dailyProgress: { materials: 3, merges: 2, orders: 1 } }, nextDay);
check("Cocos 领域层跨日重置每日进度", refreshed.dailyProgress.materials === 0 && refreshed.dailyProgress.merges === 0 && refreshed.dailyProgress.orders === 0, refreshed.dailyProgress);

const appRuntime = new DeterministicGameRuntime(() => NOW, 99);
const appRepository = new SaveRepository(platform, "player-1", "device-1", () => appRuntime.snapshot().randomSeed);
const application = new GameApplication(createInitialState(NOW), platform, appRepository, "0.1.0", appRuntime);
await application.start();
const generated = useGenerator(application.getState(), "veg_basket", appRuntime.input());
await application.commit(generated, "generator_used", { generatorId: "veg_basket" });
const committedRaw = storage.get("xiangkou-huashipu-cocos-v5");
const committed = JSON.parse(committedRaw);
check("GameApplication 提交动作后立即写入 v5 存档", committed.schemaVersion === 5 && committed.revision >= 1 && committed.state.energy === generated.energy, committed);
application.destroy();

console.table(results.map((item) => ({ check: item.name, result: item.passed ? "PASS" : "FAIL" })));
const failed = results.filter((item) => !item.passed);
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
