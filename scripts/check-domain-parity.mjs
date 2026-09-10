import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(root, "src", "game");
const cocosRoot = path.join(root, "wechat-client", "assets", "scripts", "domain");

const normalize = (value) => value.replace(/\r\n/g, "\n").trimEnd();
const readWeb = (name) => fs.readFileSync(path.join(webRoot, name), "utf8");
const readCocos = (name) => fs.readFileSync(path.join(cocosRoot, name), "utf8");

const results = [];
const warnings = [];
const check = (name, passed, detail = undefined) => results.push({ name, passed, detail });

for (const name of ["types.ts", "dayTasks.ts"]) {
  const web = normalize(readWeb(name));
  const cocos = normalize(readCocos(name));
  check(`${name} 在 Web 与 Cocos 中保持完全一致`, web === cocos, web === cocos ? undefined : {
    webBytes: Buffer.byteLength(web),
    cocosBytes: Buffer.byteLength(cocos),
  });
}

const exportedSymbols = (source) => new Set(
  [...source.matchAll(/export\s+(?:async\s+)?(?:const|let|var|function|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g)]
    .map((match) => match[1]),
);

for (const name of ["catalog.ts", "state.ts"]) {
  const webExports = exportedSymbols(readWeb(name));
  const cocosExports = exportedSymbols(readCocos(name));
  const missing = [...webExports].filter((symbol) => !cocosExports.has(symbol));
  check(`${name} 的 Web 公共导出在 Cocos 中不缺失`, missing.length === 0, missing);
}

const explicitIds = (source) => new Set(
  [...source.matchAll(/\bid\s*:\s*["'`]([^"'`]+)["'`]/g)].map((match) => match[1]),
);

const webCatalog = readWeb("catalog.ts");
const cocosCatalog = readCocos("catalog.ts");
const webIds = explicitIds(webCatalog);
const cocosIds = explicitIds(cocosCatalog);
const missingIds = [...webIds].filter((id) => !cocosIds.has(id));
const cocosExtraIds = [...cocosIds].filter((id) => !webIds.has(id));
check("Cocos catalog 不得丢失 Web 已存在的显式内容 ID", missingIds.length === 0, missingIds);
if (cocosExtraIds.length) warnings.push({
  name: "Cocos catalog 存在 Web 尚未同步的扩展内容",
  detail: cocosExtraIds,
});

const chainIds = (source) => new Set(
  [...source.matchAll(/\.\.\.chain\(\s*["'`]([^"'`]+)["'`]/g)].map((match) => match[1]),
);
const webChains = chainIds(webCatalog);
const cocosChains = chainIds(cocosCatalog);
const missingChains = [...webChains].filter((id) => !cocosChains.has(id));
check("Cocos catalog 不得丢失 Web 已存在的合成链", missingChains.length === 0, missingChains);

const forbiddenCocosDomainTokens = ["window.", "document.", "localStorage", "from \"cc\"", "from 'cc'", "wx."];
const forbiddenHits = [];
for (const name of ["types.ts", "catalog.ts", "dayTasks.ts", "state.ts"]) {
  const source = readCocos(name);
  for (const token of forbiddenCocosDomainTokens) {
    if (source.includes(token)) forbiddenHits.push({ name, token });
  }
}
check("Cocos 领域层继续与 DOM、Cocos API、wx API 解耦", forbiddenHits.length === 0, forbiddenHits);

console.table(results.map((item) => ({ check: item.name, result: item.passed ? "PASS" : "FAIL" })));
if (warnings.length) {
  console.warn("\nDomain parity warnings (allowed deltas):");
  console.warn(JSON.stringify(warnings, null, 2));
}

const failed = results.filter((item) => !item.passed);
if (failed.length) {
  console.error("\nDomain parity failed:");
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
