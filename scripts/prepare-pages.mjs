import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webSource = path.join(root, "dist");
const cocosSource = path.join(root, "wechat-client/build/web-mobile");
const useCocos = process.env.PAGES_SOURCE === "cocos";
const source = useCocos ? cocosSource : webSource;
const target = path.join(root, "site");

if (!fs.existsSync(path.join(source, "index.html"))) {
  const command = useCocos ? "npm run wechat:build:web" : "npm run build";
  throw new Error(`缺少 Pages 构建，请先运行 ${command}`);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
fs.writeFileSync(path.join(target, ".nojekyll"), "");

const bytes = directorySize(target);
console.log(`Pages ${useCocos ? "Cocos" : "Web MVP"} 试玩包已生成：${target} (${(bytes / 1024 / 1024).toFixed(2)} MB)`);

function directorySize(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
    const entryPath = path.join(directory, entry.name);
    return total + (entry.isDirectory() ? directorySize(entryPath) : fs.statSync(entryPath).size);
  }, 0);
}
