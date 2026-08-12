import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configureWechatBuild } from "./configure-wechat-build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "cloudfunctions/game-service/index.js"), "utf8");
const documents = new Map();
const analytics = [];
const playerId = "openid-test-player";

const collection = (name) => ({
  doc: (id) => ({
    get: async () => {
      const value = documents.get(`${name}:${id}`);
      if (!value) throw Object.assign(new Error("document does not exist"), { errCode: -1 });
      return { data: value };
    },
    set: async ({ data }) => documents.set(`${name}:${id}`, data),
  }),
  add: async ({ data }) => {
    analytics.push({ collection: name, data });
    return { _id: `event-${analytics.length}` };
  },
});

const cloudMock = {
  DYNAMIC_CURRENT_ENV: "dynamic",
  init: () => undefined,
  getWXContext: () => ({ OPENID: playerId }),
  database: () => ({ collection }),
};
const module = { exports: {} };
new Function("require", "module", "exports", source)(
  (name) => {
    if (name === "wx-server-sdk") return cloudMock;
    throw new Error(`unexpected require: ${name}`);
  },
  module,
  module.exports,
);
const service = module.exports;

const results = [];
const check = (name, passed, detail = undefined) => results.push({ name, passed, detail });
const call = (action, payload = {}) => service.main({ action, ...payload });

const now = await call("now");
check("云函数返回服务器时间", now.ok && Number.isFinite(now.data), now);
const login = await call("login");
check("云函数使用 OpenID 作为玩家身份", login.ok && login.data.playerId === playerId, login);
const empty = await call("load");
check("新玩家云档为空", empty.ok && empty.data === null, empty);

const baseState = { saveVersion: 5, board: [], generators: {}, cookers: {}, shop: {} };
const firstEnvelope = {
  schemaVersion: 5,
  revision: 1,
  updatedAt: 100,
  playerId: "spoofed-player",
  deviceId: "device-a",
  state: baseState,
};
const firstSave = await call("save", { envelope: firstEnvelope });
check("云档保存时覆盖客户端伪造 playerId", firstSave.ok && firstSave.data.playerId === playerId, firstSave);
const loaded = await call("load");
check("云档可读取完整 revision", loaded.ok && loaded.data.revision === 1 && loaded.data.playerId === playerId, loaded);

const conflict = await call("save", { envelope: { ...firstEnvelope, deviceId: "device-b", updatedAt: 101 } });
check("同 revision 的其他设备被判定冲突", !conflict.ok && conflict.conflict === true && conflict.data.revision === 1, conflict);
const nextSave = await call("save", { envelope: { ...firstEnvelope, revision: 2, updatedAt: 102 } });
check("更高 revision 可覆盖云档", nextSave.ok && nextSave.data.revision === 2, nextSave);

const analyticsResult = await call("analytics", { event: { name: "game_start", eventId: "event-1" } });
check(
  "分析事件附加 OpenID 与服务端时间",
  analyticsResult.ok && analytics.length === 1 && analytics[0].data.playerId === playerId && Number.isFinite(analytics[0].data.serverReceivedAt),
  analytics,
);

const configBuild = fs.mkdtempSync(path.join(os.tmpdir(), "huashipu-wechat-config-"));
fs.writeFileSync(path.join(configBuild, "game.js"), "console.log('game');\n");
fs.writeFileSync(path.join(configBuild, "project.config.json"), JSON.stringify({ appid: "touristappid", compileType: "game" }));
const injected = configureWechatBuild(configBuild, {
  HUASHIPU_WECHAT_APPID: "wx-test-appid",
  HUASHIPU_CLOUD_ENV: "cloud-test",
  HUASHIPU_CLOUD_FUNCTION: "game-service-test",
  HUASHIPU_ENERGY_AD_UNIT_ID: "ad-energy",
  HUASHIPU_COOKER_AD_UNIT_ID: "ad-cooker",
});
const configuredGame = fs.readFileSync(path.join(configBuild, "game.js"), "utf8");
const configuredRuntime = fs.readFileSync(path.join(configBuild, "runtime-config.js"), "utf8");
const configuredProject = JSON.parse(fs.readFileSync(path.join(configBuild, "project.config.json"), "utf8"));
check(
  "发布注入器写入 AppID、云环境和广告位",
  injected.cloudEnv === "cloud-test"
    && configuredProject.appid === "wx-test-appid"
    && configuredGame.startsWith('require("./runtime-config.js")')
    && configuredRuntime.includes("ad-energy")
    && configuredRuntime.includes("ad-cooker"),
  { injected, configuredProject, configuredRuntime },
);

console.table(results.map((item) => ({ check: item.name, result: item.passed ? "PASS" : "FAIL" })));
const failed = results.filter((item) => !item.passed);
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
