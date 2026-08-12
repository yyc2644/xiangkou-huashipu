import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "wechat-client");
const cocosTypes = "/Applications/CocosCreator.app/Contents/Resources/resources/3d/engine/bin/.declarations/cc.d.ts";
const tsc = path.join(root, "node_modules/typescript/bin/tsc");

const requiredFiles = [
  "package.json",
  "settings/v2/packages/engine.json",
  "build-config/web-mobile.json",
  "build-config/wechatgame.json",
  "assets/scenes/Boot.scene",
  "assets/scenes/Boot.scene.meta",
  "assets/scripts/domain/types.ts",
  "assets/scripts/domain/catalog.ts",
  "assets/scripts/domain/dayTasks.ts",
  "assets/scripts/domain/state.ts",
  "assets/scripts/domain/save-migration.ts",
  "assets/scripts/application/contracts.ts",
  "assets/scripts/application/game-runtime.ts",
  "assets/scripts/application/save-repository.ts",
  "assets/scripts/application/game-application.ts",
  "assets/scripts/platform/mock-platform-adapter.ts",
  "assets/scripts/platform/create-platform-adapter.ts",
  "assets/scripts/platform/wechat-cloud-services.ts",
  "assets/scripts/platform/wechat-platform-adapter.ts",
  "assets/scripts/ui/layout.ts",
  "assets/scripts/ui/game-bootstrap.ts",
  "assets/resources/art/items/greens_1.png",
  "assets/resources/art/items/tomato_1.png",
  "assets/resources/art/items/egg_1.png",
  "assets/resources/art/items/wheat_1.png",
  "assets/resources/art/items/daisy_1.png",
  "assets/resources/art/items/rose_1.png",
  "assets/resources/art/items/box_1.png",
  "assets/resources/art/items/ribbon_1.png",
];

const results = [];
const check = (name, passed, detail = undefined) => results.push({ name, passed, detail });
const read = (relative) => fs.readFileSync(path.join(client, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));

const directorySize = (directory) => fs.readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
  const target = path.join(directory, entry.name);
  return total + (entry.isDirectory() ? directorySize(target) : fs.statSync(target).size);
}, 0);

for (const relative of requiredFiles) check(`微信工程包含 ${relative}`, fs.existsSync(path.join(client, relative)));

const pkg = readJson("package.json");
check("Cocos 工程锁定 3.8.8", pkg.name === "xiangkou-huashipu-wechat" && pkg.creator?.version === "3.8.8", pkg);

const sceneMeta = readJson("assets/scenes/Boot.scene.meta");
check("Boot 场景使用 scene 导入器", sceneMeta.importer === "scene" && sceneMeta.uuid === "bf0757ef-bb28-4dfa-a365-c03412b96bc4", sceneMeta);

const scriptMetaFailures = requiredFiles
  .filter((relative) => relative.endsWith(".ts"))
  .map((relative) => `${relative}.meta`)
  .filter((relative) => !fs.existsSync(path.join(client, relative)) || readJson(relative).importer !== "typescript");
check("TypeScript 资源元数据完整", scriptMetaFailures.length === 0, scriptMetaFailures);

const itemPngs = requiredFiles.filter((relative) => relative.endsWith(".png"));
const itemMetaFailures = itemPngs
  .map((relative) => `${relative}.meta`)
  .filter((relative) => !fs.existsSync(path.join(client, relative)) || readJson(relative).importer !== "image");
check("AI 基础材料 PNG 均有 Cocos image/SpriteFrame 元数据", itemMetaFailures.length === 0, itemMetaFailures);

const webConfig = readJson("build-config/web-mobile.json");
const wechatConfig = readJson("build-config/wechatgame.json");
const validSceneConfig = (config) => config.startScene === sceneMeta.uuid && config.scenes?.some((scene) => scene.uuid === sceneMeta.uuid);
check("Web 构建显式指定 Boot 启动场景", webConfig.platform === "web-mobile" && validSceneConfig(webConfig));
check(
  "微信构建为发布竖屏并显式指定 Boot",
  wechatConfig.platform === "wechatgame"
    && wechatConfig.debug === false
    && wechatConfig.packages?.wechatgame?.orientation === "portrait"
    && validSceneConfig(wechatConfig),
  wechatConfig,
);

const domainFiles = ["types.ts", "catalog.ts", "dayTasks.ts", "state.ts"];
const forbidden = [];
for (const name of domainFiles) {
  const source = read(`assets/scripts/domain/${name}`);
  for (const token of ["window.", "document.", "localStorage", "from \"cc\"", "wx."]) {
    if (source.includes(token)) forbidden.push({ name, token });
  }
}
check("领域层不依赖 DOM、Cocos 或 wx", forbidden.length === 0, forbidden);

const contract = read("assets/scripts/application/contracts.ts");
check(
  "PlatformAdapter 覆盖登录、存档、广告、分享、埋点和生命周期",
  ["login()", "readLocalSave()", "readCloudSave()", "showRewardedVideo", "share(", "track(", "onHide("].every((token) => contract.includes(token)),
);
check("SaveEnvelope 固定 schemaVersion 5 和 revision", contract.includes("schemaVersion: 5") && contract.includes("revision: number"));
check("SaveEnvelope 保存可复现随机种子", contract.includes("randomSeed?: number"));

const applicationSource = read("assets/scripts/application/game-application.ts");
check("应用层时间与随机由 GameRuntime 注入", !applicationSource.includes("Date.now()") && !applicationSource.includes("Math.random()") && applicationSource.includes("DeterministicGameRuntime"));

const adapter = read("assets/scripts/platform/wechat-platform-adapter.ts");
check("激励广告只有完整观看才返回 completed", adapter.includes('result?.isEnded === false ? "skipped" : "completed"'));

const bootstrap = read("assets/scripts/ui/game-bootstrap.ts");
check(
  "触摸控件具备固定 UITransform 命中区",
  bootstrap.includes("button.addComponent(UITransform).setContentSize(width, height)") && bootstrap.includes("this.generatorButton"),
);
check("Cocos UI 加载正式 PNG 并保留 fallback", bootstrap.includes('resources.loadDir("art/items", SpriteFrame') && bootstrap.includes("if (!frame)"));

const baseSpriteNames = ["greens_1", "tomato_1", "egg_1", "wheat_1", "daisy_1", "rose_1", "box_1", "ribbon_1"];
const spriteDetails = baseSpriteNames.map((name) => {
  const relative = `assets/resources/art/items/${name}.png`;
  const target = path.join(client, relative);
  if (!fs.existsSync(target)) return { name, exists: false };
  const content = fs.readFileSync(target);
  return {
    name,
    exists: true,
    width: content.readUInt32BE(16),
    height: content.readUInt32BE(20),
    colorType: content[25],
    bytes: content.length,
  };
});
check(
  "8 张基础材料精灵为 128x128 alpha PNG",
  spriteDetails.every((sprite) => sprite.exists && sprite.width === 128 && sprite.height === 128 && [4, 6].includes(sprite.colorType)),
  spriteDetails,
);
check("基础材料精灵总量低于 256 KB", spriteDetails.reduce((total, sprite) => total + (sprite.bytes ?? 0), 0) < 256 * 1024, spriteDetails);

const domainAndPlatformFiles = requiredFiles
  .filter((relative) => relative.endsWith(".ts") && !relative.includes("/ui/"))
  .map((relative) => path.join(client, relative));
const baseArgs = ["--noEmit", "--target", "ES2022", "--module", "ESNext", "--moduleResolution", "Bundler", "--strict", "false"];
const typecheck = spawnSync(process.execPath, [tsc, ...baseArgs, ...domainAndPlatformFiles], { encoding: "utf8" });
check("微信领域与平台代码通过 TypeScript 检查", typecheck.status === 0, typecheck.stderr || typecheck.stdout);

if (fs.existsSync(cocosTypes)) {
  const uiCheck = spawnSync(process.execPath, [tsc, ...baseArgs, "--experimentalDecorators", "--skipLibCheck", cocosTypes, path.join(client, "assets/scripts/ui/game-bootstrap.ts")], { encoding: "utf8" });
  check("Cocos UI 脚本通过 3.8.8 类型检查", uiCheck.status === 0, uiCheck.stderr || uiCheck.stdout);
} else {
  check("Cocos UI 类型检查可执行", true, "Cocos Creator 未安装，跳过引擎类型检查");
}

check("微信开发者工具已安装", fs.existsSync("/Applications/wechatwebdevtools.app"));
check("Cocos Creator 3.8.8 已安装", fs.existsSync("/Applications/CocosCreator.app"));

const wechatBuild = path.join(client, "build/wechatgame");
if (fs.existsSync(wechatBuild)) {
  const requiredBuildFiles = ["game.js", "game.json", "project.config.json", "runtime-config.js", "src/settings.json", "assets/main/index.js"];
  check("微信包包含运行入口、配置、场景和脚本", requiredBuildFiles.every((relative) => fs.existsSync(path.join(wechatBuild, relative))), requiredBuildFiles);
  const gameJson = JSON.parse(fs.readFileSync(path.join(wechatBuild, "game.json"), "utf8"));
  const projectConfig = JSON.parse(fs.readFileSync(path.join(wechatBuild, "project.config.json"), "utf8"));
  const settings = JSON.parse(fs.readFileSync(path.join(wechatBuild, "src/settings.json"), "utf8"));
  const builtScripts = fs.readFileSync(path.join(wechatBuild, "assets/main/index.js"), "utf8");
  const gameSource = fs.readFileSync(path.join(wechatBuild, "game.js"), "utf8");
  const runtimeConfig = fs.readFileSync(path.join(wechatBuild, "runtime-config.js"), "utf8");
  const resourceConfig = fs.readFileSync(path.join(wechatBuild, "assets/resources/config.json"), "utf8");
  check("微信产物为竖屏小游戏", gameJson.deviceOrientation === "portrait" && projectConfig.compileType === "game", { gameJson, projectConfig });
  check("微信产物启动 Boot 并加载业务脚本", settings.launch?.launchScene === "db://assets/scenes/Boot.scene" && settings.scripting?.scriptPackages?.length > 0 && builtScripts.includes("GameBootstrap"));
  check("微信产物在引擎前加载外部运行时配置", gameSource.startsWith('require("./runtime-config.js")') && runtimeConfig.includes("__HUASHIPU_WECHAT_CONFIG__"));
  check(
    "8 张 AI 基础材料 SpriteFrame 已进入微信包",
    ["greens_1", "tomato_1", "egg_1", "wheat_1", "daisy_1", "rose_1", "box_1", "ribbon_1"].every((name) => resourceConfig.includes(`art/items/${name}/spriteFrame`)),
  );
  const buildBytes = directorySize(wechatBuild);
  check("微信包不超过 4 MB", buildBytes <= 4 * 1024 * 1024, `${(buildBytes / 1024 / 1024).toFixed(2)} MB`);
}

console.table(results.map((item) => ({ check: item.name, result: item.passed ? "PASS" : "FAIL" })));
const failed = results.filter((item) => !item.passed);
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
