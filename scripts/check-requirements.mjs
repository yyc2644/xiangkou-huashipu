import fs from "node:fs";
import ts from "typescript";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

const catalogSource = read("../src/game/catalog.ts");
const stateSource = read("../src/game/state.ts");
const renderSource = read("../src/ui/render.ts");
const saveSource = read("../src/game/save.ts");
const taskSource = read("../src/game/dayTasks.ts");
const autoplaySource = read("../scripts/check-autoplay.mjs");
const packageJson = JSON.parse(read("../package.json"));
const productDoc = read("../docs/product-document.md");
const requirementsDoc = read("../docs/requirements-and-balance.md");
const readme = read("../README.md");

const compiledCatalog = ts.transpileModule(catalogSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: false,
  },
}).outputText;
const compiledTasks = ts.transpileModule(taskSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: false,
  },
}).outputText;

const catalog = await import(`data:text/javascript;base64,${Buffer.from(compiledCatalog).toString("base64")}`);
const taskModule = await import(`data:text/javascript;base64,${Buffer.from(compiledTasks).toString("base64")}`);
const { items, orders, recipes, customers, shopUpgrades } = catalog;
const { dayOneTasks, dailyTasks } = taskModule;

const checkResults = [];
const check = (name, passed, detail = undefined) => {
  checkResults.push({ name, passed, detail });
};

const stringsIn = (source) => [...source.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
const firstOrder = orders[0];
const firstOrderNeeds = firstOrder?.needs ?? [];
const secondOrder = orders[1];

const activeOrdersMatch = stateSource.match(/activeOrders:\s*\[([^\]]+)\]/);
const initialActiveOrders = activeOrdersMatch ? stringsIn(activeOrdersMatch[1]) : [];

const tutorialBoardLines = stateSource
  .slice(stateSource.indexOf("const TUTORIAL_BOARDS"), stateSource.indexOf("const createTutorialBoard"))
  .split("\n")
  .filter((line) => line.trim().startsWith("["))
  .map(stringsIn);
const stateTutorialOrderBoard = tutorialBoardLines[2] ?? [];

const renderTutorialThirdStep =
  renderSource.match(/title:\s*"第三步：确认订单目标"[\s\S]*?title:\s*"第四步：开始经营"/)?.[0] ?? "";
const renderTutorialThirdBoard = renderTutorialThirdStep.match(/board:\s*\[([^\]]+)\]/)?.[1] ?? "";
const renderTutorialThirdBoardItems = stringsIn(renderTutorialThirdBoard);

const saveKey = saveSource.match(/SAVE_KEY\s*=\s*"([^"]+)"/)?.[1];

const chainCounts = Object.entries(
  items
    .filter((item) => item.chain !== "dish" && item.chain !== "gift")
    .reduce((acc, item) => {
      acc[item.chain] = (acc[item.chain] ?? 0) + 1;
      return acc;
    }, {}),
);

const storyOrders = orders.filter((order) => order.story);
const shopEffectText = shopUpgrades.flatMap((area) => area.levels.map((level) => `${area.name}:${level.effect}`)).join("\n");
const forbiddenShopEffectTerms = ["解锁", "奖励提升", "出现率", "制作速度", "金币更高", "可使用"];
const forbiddenShopEffects = forbiddenShopEffectTerms.filter((term) => shopEffectText.includes(term));

check("首单存在且为街坊早餐", firstOrder?.id === "order_001" && firstOrder.title === "街坊早餐", firstOrder);
check("首单需求是 2 个材料", firstOrderNeeds.length === 2, firstOrderNeeds);
check("初始订单等于订单池前 2 单", initialActiveOrders.join(",") === [firstOrder?.id, secondOrder?.id].join(","), {
  initialActiveOrders,
  expected: [firstOrder?.id, secondOrder?.id],
});
check("状态层教程第三步包含首单需求", firstOrderNeeds.every((itemId) => stateTutorialOrderBoard.includes(itemId)), {
  firstOrderNeeds,
  stateTutorialOrderBoard,
});
check("UI 教程第三步包含首单标题和需求", renderTutorialThirdStep.includes(firstOrder.title) && firstOrderNeeds.every((itemId) => renderTutorialThirdBoardItems.includes(itemId)), {
  title: firstOrder.title,
  firstOrderNeeds,
  renderTutorialThirdBoardItems,
});
check("基础链均为 5 级", chainCounts.every(([, count]) => count === 5), chainCounts);
check("当前内容规模为 6 配方、14 订单、6 顾客", recipes.length === 6 && orders.length === 14 && customers.length === 6, {
  recipes: recipes.length,
  orders: orders.length,
  customers: customers.length,
});
check("故事订单都会发故事点", storyOrders.every((order) => order.storyPoints > 0), storyOrders.map((order) => ({ id: order.id, storyPoints: order.storyPoints })));
check("店铺升级文案不承诺未实现能力", forbiddenShopEffects.length === 0, forbiddenShopEffects);
check("图谱/订单提示包含缺口、来源和预计取材文案", ["已有", "还差", "主要来源", "预计还需约", "现有材料可合成"].every((text) => renderSource.includes(text)), {
  requiredText: ["已有", "还差", "主要来源", "预计还需约", "现有材料可合成"],
});
check("今日任务具备一次性领取奖励", renderSource.includes("data-claim-task") && stateSource.includes("claimTaskReward") && stateSource.includes("claimedTaskIds"), {
  render: renderSource.includes("data-claim-task"),
  stateAction: stateSource.includes("claimTaskReward"),
  claimedState: stateSource.includes("claimedTaskIds"),
});
check("首日任务都有奖励配置", dayOneTasks.length === 6 && dayOneTasks.every((task) => task.rewardLabel && Object.keys(task.reward).length > 0), {
  count: dayOneTasks.length,
  rewards: dayOneTasks.map((task) => ({ id: task.id, rewardLabel: task.rewardLabel, reward: task.reward })),
});
check("存档升级到 v5 且保留 v4 迁移入口", saveKey === "xiangkou-huashipu-save-v5" && saveSource.includes("LEGACY_SAVE_KEY") && saveSource.includes("migrateGame") && productDoc.includes(saveKey), { saveKey });
check(
  "每日委托为 3 项真实进度任务，奖励总量符合设计",
  dailyTasks.length === 3 &&
    dailyTasks.map((task) => task.id).join(",") === "daily_materials,daily_merges,daily_orders" &&
    dailyTasks.reduce((sum, task) => sum + (task.reward.coins ?? 0), 0) === 25 &&
    dailyTasks.reduce((sum, task) => sum + (task.reward.energy ?? 0), 0) === 12 &&
    dailyTasks.reduce((sum, task) => sum + (task.reward.xp ?? 0), 0) === 15,
  dailyTasks,
);
check(
  "图谱支持从缺口定位并跳转来源",
  renderSource.includes("data-atlas-item") && renderSource.includes("data-guide-source") && stateSource.includes("guideMaterialSource") && stateSource.includes("guidedGeneratorId"),
  { atlasEntry: renderSource.includes("data-atlas-item"), sourceEntry: renderSource.includes("data-guide-source") },
);
check(
  "玩法状态依赖显式运行时输入",
  stateSource.includes("GameRuntime") && stateSource.includes("runtime.nowMs") && !stateSource.includes("Date.now") && !stateSource.includes("Math.random"),
  { runtime: stateSource.includes("GameRuntime") },
);
check("需求文档声明店铺升级为纯表现修复度", requirementsDoc.includes("纯表现修复度") && productDoc.includes("纯表现修复度"), {
  requirementsDoc: requirementsDoc.includes("纯表现修复度"),
  productDoc: productDoc.includes("纯表现修复度"),
});
check("README 和产品文档包含统一验证命令", readme.includes("npm run verify") && productDoc.includes("npm run verify"), {
  readme: readme.includes("npm run verify"),
  productDoc: productDoc.includes("npm run verify"),
});
check("统一验证命令包含首局玩法闭环", packageJson.scripts?.verify?.includes("npm run loop") && readme.includes("npm run loop") && productDoc.includes("npm run loop"), {
  verify: packageJson.scripts?.verify,
  readme: readme.includes("npm run loop"),
  productDoc: productDoc.includes("npm run loop"),
});
check("统一验证命令包含 Web 基线与 Cocos 全量自动试玩", packageJson.scripts?.verify?.includes("npm run autoplay") && packageJson.scripts?.verify?.includes("npm run wechat:autoplay") && readme.includes("npm run autoplay") && productDoc.includes("npm run wechat:autoplay"), {
  verify: packageJson.scripts?.verify,
  readme: readme.includes("npm run autoplay"),
  productDoc: productDoc.includes("npm run wechat:autoplay"),
});
check("统一验证命令包含手机 Playwright 回归", packageJson.scripts?.verify?.includes("npm run ui:mobile") && readme.includes("npm run ui:mobile") && productDoc.includes("npm run ui:mobile"), {
  verify: packageJson.scripts?.verify,
});
check(
  "自动试玩覆盖 100 轮、默认 14 单、Cocos 全量和棋盘占用",
  autoplaySource.includes("SESSION_COUNT = 100") &&
    autoplaySource.includes('requestedTarget ?? "14"') &&
    packageJson.scripts?.["wechat:autoplay"]?.includes("--target=all") &&
    autoplaySource.includes("maxBoardOccupied") &&
    autoplaySource.includes("completedAllOrders"),
  {
    sessionCount: autoplaySource.includes("SESSION_COUNT = 100"),
    defaultTargetOrders: autoplaySource.includes('requestedTarget ?? "14"'),
    cocosFullPool: packageJson.scripts?.["wechat:autoplay"]?.includes("--target=all"),
    boardMetric: autoplaySource.includes("maxBoardOccupied"),
    fullPoolMetric: autoplaySource.includes("completedAllOrders"),
  },
);

console.table(checkResults.map((item) => ({ check: item.name, result: item.passed ? "PASS" : "FAIL" })));

const failed = checkResults.filter((item) => !item.passed);
if (failed.length) {
  console.error("Requirement checks failed:");
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
