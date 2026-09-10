# 项目上下文卡：《巷口花食铺》

更新时间：2026-09-10

## 一句话定位

《巷口花食铺》是一款面向微信小游戏的女性向治愈经营 MVP：玩家经营一间老街小店，通过生成食材花材、合成升级、制作菜品礼盒、完成顾客订单，逐步修复小店并解锁温暖故事。

## 当前阶段

项目已经从“Web 原型验证”进入“Web 参考实现 + Cocos 微信客户端产品化”阶段。

- Web MVP：用于快速验证核心循环、数值和交互参考。
- Cocos Creator 3.8.8 客户端：当前生产方向，已具备 Boot 场景、领域层、应用层、平台适配层和 Cocos UI。
- 微信平台能力：已实现 `wx.login`、本地存档、云存档适配、激励视频、分享、生命周期与埋点接口。
- 云函数：已实现 OpenID 身份、服务器时间、存档读写、revision 冲突控制与 analytics 入库。
- 正式上线仍依赖：AppID/主体/备案/类目、真实广告位、云环境、开发者工具与真机验收、隐私与提审材料。

## 核心循环

```text
体力/生成器
-> 获得基础物品
-> 棋盘二合升级
-> 制作菜品或礼盒
-> 提交顾客订单
-> 获得金币/经验/故事点
-> 升级店铺区域
-> 解锁新订单和故事
```

## 当前玩法范围

### Web 参考实现

- 7x9 棋盘。
- 3 个生成器：菜篮、花篮、杂货箱。
- 3 个制作台：蒸锅、煎台、礼盒台。
- 8 条基础物品链。
- 6 个成品菜品/礼盒。
- 14 单内容池。
- 6 个顾客。
- 本地存档、4 步教程、今日任务、合成图谱和移动端竖屏 UI。

### Cocos / 微信生产方向

- 领域层继续保持 7x9 棋盘与相同核心规则。
- 当前生产内容池目标由自动检查固定为 42 单、10 配方、12 顾客。
- 使用 schemaVersion 5 存档契约。
- 使用可复现随机运行时，便于自动试玩和存档恢复验证。
- 微信平台能力通过 PlatformAdapter 与领域层解耦。

## 事实源与同步规则

目前 Web 与 Cocos 尚有两份领域代码，禁止人工假设它们天然一致。

- `src/game/`：Web 参考实现。
- `wechat-client/assets/scripts/domain/`：Cocos 生产领域实现。
- `types.ts`、`dayTasks.ts`：要求两端严格一致。
- `catalog.ts`、`state.ts`：允许 Cocos 有生产扩展，但不得丢失 Web 已有公共导出、内容 ID 与基础合成链。
- `npm run domain:parity`：用于阻止两套实现继续静默分叉。
- 中期目标：抽取单一共享 `game-core`，由 Web 与 Cocos 共同依赖，彻底消除复制维护。

## 验证门禁

`npm run verify` 是可在 GitHub Actions / Linux 环境执行的主门禁，覆盖：

- TypeScript / Vite 构建。
- 数值平衡与需求一致性。
- 核心玩法闭环与 Web 自动试玩。
- Web/Cocos 领域一致性门禁。
- Web 移动端 Playwright。
- Cocos 领域自动检查与全内容池自动试玩。
- 微信云函数模拟检查。
- Cocos UI 静态/布局检查。

`npm run verify:local` 是装有 Cocos Creator 3.8.8 的本机完整门禁，会额外执行 Cocos Web/微信构建、Cocos Playwright 和本地工具链检查。

## 设计语气

- 温暖、明亮、治愈。
- 现代老街，不做强古风。
- 花食结合：食材、花材、手作礼盒、家常餐食。
- 剧情短而有人情味，不做狗血反转。
- UI 要像可反复玩的游戏界面，不做营销落地页。

## 美术方向

关键词：

```text
warm cozy casual game, cute but not childish, modern alley food shop, flowers and handmade meals, soft daylight, clean readable icons, light painterly UI, mobile game asset
```

当前正式美术仍不足：Web 仍大量依赖代码化 SVG/CSS 与少量 AI 基准图；Cocos 已接入部分 128x128 PNG 基础材料，但顾客、店铺阶段、菜品礼盒、分享图和完整 UI 资产仍需产品化。

## 关键指标假设

- 首次 5 分钟留存：65%+
- D1 留存：35%+
- D3 留存：18%+
- 人均订单完成：8+
- 人均激励广告观看：3-6 次
- 装修点击率：30%+

以上均为待真实用户数据验证的产品假设，不应视为已达到指标。

## 开发纪律

- 新功能优先配置化。
- 不在 UI 层硬编码大量业务内容。
- 不复制竞品名称、角色、美术、关卡、文案或数值表。
- 每次扩展玩法都要解释它服务核心循环的哪个节点。
- 每次数值、订单、任务、教程或领域逻辑调整后必须运行 `npm run verify`。
- 修改 `types.ts` / `dayTasks.ts` 时必须保持 Web 与 Cocos 严格一致。
- Cocos `catalog.ts` / `state.ts` 的生产扩展不得让 Web 已存在能力倒退。
- 需要 Cocos Creator 或微信开发者工具的验证使用 `npm run verify:local`，不要把 GUI 工具依赖混入通用 CI。
- 店铺升级当前主要是表现修复度，不承诺未实现的真实倍率、掉落或复杂解锁收益。
