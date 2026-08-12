import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultBuild = path.join(root, "wechat-client/build/wechatgame");

export const configureWechatBuild = (buildDirectory = defaultBuild, environment = process.env) => {
  const gamePath = path.join(buildDirectory, "game.js");
  const projectPath = path.join(buildDirectory, "project.config.json");
  if (!fs.existsSync(gamePath) || !fs.existsSync(projectPath)) {
    throw new Error(`微信构建产物不完整：${buildDirectory}`);
  }

  const runtimeConfig = Object.fromEntries(Object.entries({
    cloudEnv: environment.HUASHIPU_CLOUD_ENV,
    cloudFunctionName: environment.HUASHIPU_CLOUD_FUNCTION || "game-service",
    energyAdUnitId: environment.HUASHIPU_ENERGY_AD_UNIT_ID,
    cookerAdUnitId: environment.HUASHIPU_COOKER_AD_UNIT_ID,
  }).filter(([, value]) => typeof value === "string" && value.length > 0));
  const runtimeSource = `globalThis.__HUASHIPU_WECHAT_CONFIG__ = Object.freeze(${JSON.stringify(runtimeConfig)});\n`;
  fs.writeFileSync(path.join(buildDirectory, "runtime-config.js"), runtimeSource);

  const gameSource = fs.readFileSync(gamePath, "utf8");
  if (!gameSource.includes('require("./runtime-config.js")')) {
    fs.writeFileSync(gamePath, `require("./runtime-config.js");\n${gameSource}`);
  }

  if (environment.HUASHIPU_WECHAT_APPID) {
    const projectConfig = JSON.parse(fs.readFileSync(projectPath, "utf8"));
    projectConfig.appid = environment.HUASHIPU_WECHAT_APPID;
    fs.writeFileSync(projectPath, `${JSON.stringify(projectConfig)}\n`);
  }

  return runtimeConfig;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = configureWechatBuild(process.argv[2] ? path.resolve(process.argv[2]) : defaultBuild);
  console.log(`微信运行时配置已生成：${Object.keys(config).join(", ") || "local-only"}`);
}
