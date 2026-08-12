import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const sourcePath = path.resolve(new URL("../wechat-client/assets/scripts/ui/layout.ts", import.meta.url).pathname);
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "huashipu-cocos-layout-"));
const outputPath = path.join(tmpDir, "layout.mjs");
const source = fs.readFileSync(sourcePath, "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
fs.writeFileSync(outputPath, output);

const { computeMainScreenLayout, viewportToDesignHeight } = await import(pathToFileURL(outputPath).href);
const viewports = [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 320, height: 568 },
];
const results = [];
const check = (name, passed, detail = undefined) => results.push({ name, passed, detail });

for (const viewport of viewports) {
  const designHeight = viewportToDesignHeight(viewport.width, viewport.height);
  const layout = computeMainScreenLayout(designHeight);
  const firstRowTop = layout.boardCenterY + 4 * (layout.boardCellHeight + 3) + layout.boardCellHeight / 2;
  const lastRowBottom = layout.boardCenterY - 4 * (layout.boardCellHeight + 3) - layout.boardCellHeight / 2;
  const generatorTop = layout.generatorY + 28;
  const generatorBottom = layout.generatorY - 28;
  const toastBottom = layout.toastY - 19;

  check(`${viewport.width}x${viewport.height} 棋盘九行完整`, firstRowTop <= layout.boardTop + 0.01 && lastRowBottom >= layout.boardBottom - 0.01, { layout, firstRowTop, lastRowBottom });
  check(`${viewport.width}x${viewport.height} 格子可触摸`, layout.boardCellHeight >= 44, layout.boardCellHeight);
  check(`${viewport.width}x${viewport.height} 棋盘与取材不重叠`, layout.boardBottom - generatorTop >= 10, { boardBottom: layout.boardBottom, generatorTop });
  check(`${viewport.width}x${viewport.height} 取材与导航不重叠`, generatorBottom - layout.navigationTop >= 8, { generatorBottom, navigationTop: layout.navigationTop });
  check(`${viewport.width}x${viewport.height} toast 位于导航上方`, toastBottom > layout.navigationTop, { toastBottom, navigationTop: layout.navigationTop });
}

check("七列棋盘宽度不超过设计宽度", 7 * 48 + 6 * 3 <= 390);
check("三个取材按钮宽度不超过设计宽度", 2 * (120 + 54) <= 390);

console.table(results.map((item) => ({ check: item.name, result: item.passed ? "PASS" : "FAIL" })));
const failed = results.filter((item) => !item.passed);
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
