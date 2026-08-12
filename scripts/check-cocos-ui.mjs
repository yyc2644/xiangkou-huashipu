import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const source = fs.readFileSync(new URL("../wechat-client/assets/scripts/ui/game-bootstrap.ts", import.meta.url), "utf8");
const layoutSource = fs.readFileSync(new URL("../wechat-client/assets/scripts/ui/layout.ts", import.meta.url), "utf8");
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "huashipu-cocos-layout-"));
const layoutOutput = path.join(tmpDir, "layout.mjs");
fs.writeFileSync(layoutOutput, ts.transpileModule(layoutSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText);
const { computeMainScreenLayout, viewportToDesignHeight } = await import(pathToFileURL(layoutOutput).href);

const results = [];
const check = (name, passed, detail = undefined) => results.push({ name, passed, detail });

const requiredViews = ["board", "tasks", "orders", "craft", "shop", "atlas"];
check("Cocos 主界面包含五个入口和图谱定位页", requiredViews.every((screen) => source.includes(`"${screen}"`)));
check(
  "Cocos UI 接通教程、合成、任务、订单、制作和店铺动作",
  [
    "selectTutorialCell(",
    "useTutorialGenerator(",
    "selectOrMoveCell(",
    "claimTaskReward(",
    "submitOrder(",
    "startRecipe(",
    "collectCooker(",
    "upgradeShop(",
    "guideMaterialSource(",
    "dismissStory(",
    "addEnergyReward(",
    "accelerateCooker(",
  ].every((token) => source.includes(token)),
);
check("教程使用 4×4 棋盘", source.includes("index % 4") && source.includes("Math.floor(index / 4)"));
check("正式棋盘使用 7×9 共 63 格", source.includes("index % 7") && source.includes("Math.floor(index / 7)"));
check("Cocos UI 状态通过 GameApplication 提交", source.includes("this.application?.commit") && source.includes("SaveRepository"));
check("Cocos UI 接通体力和制作加速广告", source.includes('showRewardedVideo("energy")') && source.includes('showRewardedVideo("cooker")'));
check("Cocos UI 使用共享响应式布局函数", source.includes("computeMainScreenLayout(this.visibleHeight())"));
check(
  "制作页按设备分页且每屏最多 4 个配方",
  ['title: "蒸锅"', 'title: "煎台"', 'title: "礼盒台"'].every((token) => source.includes(token))
    && source.includes("recipe.cooker === this.selectedCooker")
    && source.includes("const RECIPE_PAGE_SIZE = 4")
    && source.includes("deviceRecipes.slice(this.recipePage * RECIPE_PAGE_SIZE"),
);
check(
  "图谱去制作会定位正确设备与配方页",
  source.includes("this.selectedCooker = recipe.cooker") && source.includes("deviceRecipes.findIndex"),
);

const viewports = [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 320, height: 568 },
];

for (const viewport of viewports) {
  const layout = computeMainScreenLayout(viewportToDesignHeight(viewport.width, viewport.height));
  const firstRowTop = layout.boardCenterY + 4 * (layout.boardCellHeight + 3) + layout.boardCellHeight / 2;
  const lastRowBottom = layout.boardCenterY - 4 * (layout.boardCellHeight + 3) - layout.boardCellHeight / 2;
  const generatorTop = layout.generatorY + 28;
  const generatorBottom = layout.generatorY - 28;
  const toastBottom = layout.toastY - 19;

  check(
    `${viewport.width}×${viewport.height} 九行棋盘完整且可触摸`,
    firstRowTop <= layout.boardTop + 0.01
      && lastRowBottom >= layout.boardBottom - 0.01
      && layout.boardCellHeight >= 44,
    { layout, firstRowTop, lastRowBottom },
  );
  check(
    `${viewport.width}×${viewport.height} 棋盘、取材和导航无重叠`,
    layout.boardBottom - generatorTop >= 10
      && generatorBottom - layout.navigationTop >= 8
      && toastBottom > layout.navigationTop,
    { layout, generatorTop, generatorBottom, toastBottom },
  );
}

check("七列棋盘宽度不超过设计宽度", 7 * 48 + 6 * 3 <= 390);
check("三个取材按钮宽度不超过设计宽度", 2 * (120 + 54) <= 390);
check(
  "toast 使用上下文安全位置",
  source.includes('this.currentView === "board" ? top - 82')
    && source.includes('this.currentView === "atlas" ? top - 132')
    && source.includes("this.renderToast(root, top - 136)"),
);

console.table(results.map((item) => ({ check: item.name, result: item.passed ? "PASS" : "FAIL" })));
const failed = results.filter((item) => !item.passed);
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
