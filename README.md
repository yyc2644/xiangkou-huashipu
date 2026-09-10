# 巷口花食铺 MVP

面向微信小游戏的治愈经营项目。当前已经从“Web 原型验证”进入“Web 参考实现 + Cocos Creator 3.8.8 微信客户端产品化”阶段。

## 当前交付

- 任务启动卡：`TASK_START_CARD.md`
- 项目上下文卡：`PROJECT_CONTEXT_CARD.md`
- 项目健康检查：`docs/project-health-2026-09-10.md`
- 产品文档：`docs/product-document.md`
- 需求闭环与数值平衡稿：`docs/requirements-and-balance.md`
- 微信上线准备清单：`docs/wechat-launch-readiness.md`
- 微信生产工程契约：`docs/wechat-production-contract.md`
- 可运行 Web MVP：`src/main.ts`
- Web 参考领域实现：`src/game/`
- Cocos / 微信生产客户端：`wechat-client/`
- GitHub Pages 试玩包：`site/`

## 运行 Web MVP

```bash
npm install
npm run dev -- --port 5174
```

打开：

```text
http://127.0.0.1:5174/
```

## 验证

### 通用 CI 门禁

```bash
npm run verify
```

该命令可在 GitHub Actions / Linux 环境执行，覆盖构建、数值、需求、玩法闭环、自动试玩、Web/Cocos 领域一致性、移动端 UI、Cocos 领域、微信云函数模拟和 Cocos UI 布局检查。

### 本机完整门禁

```bash
npm run verify:local
```

需要 Cocos Creator 3.8.8，额外执行 Cocos Web/微信构建、Cocos Playwright 与本地工具链检查。

GitHub Actions 会在 PR 和 `main` push 时自动执行 `npm run verify`。

## Web / Cocos 领域同步规则

当前项目仍保留两份领域实现：

```text
src/game/
wechat-client/assets/scripts/domain/
```

短期通过：

```bash
npm run domain:parity
```

阻止静默分叉：`types.ts`、`dayTasks.ts` 要求严格一致；Cocos 的 `catalog.ts`、`state.ts` 可以包含生产扩展，但不能丢失 Web 已存在的公共能力和基础内容。

中期目标是抽取单一共享 `game-core`，由 Web 与 Cocos 共同依赖。

## MVP 已包含

- 7x9 合成棋盘。
- 生成器消耗体力并产出材料。
- 棋盘移动与二合升级。
- 制作台倒计时产出菜品/礼盒。
- 订单提交、金币/经验/故事点奖励。
- 店铺四区域升级。
- 本地存档。
- 手机竖屏布局。
- 可操作新手教程。
- 合成图谱和今日任务追踪。
- 缺口数量、主要来源和预计取材次数。
- Cocos Creator 3.8.8 客户端。
- 微信登录、云存档、激励广告、分享与埋点适配代码。
- 微信云函数的 OpenID、存档、revision 冲突与 analytics 逻辑。

## 当前优先事项

1. 使用测试/正式 AppID 在微信开发者工具跑通真实首局。
2. 验证真实云存档和多设备 revision 冲突。
3. 验证真实激励视频异常路径与奖励幂等。
4. 抽取共享 `game-core`，消除双份领域代码。
5. 替换首日核心占位美术并建立 Day 1 埋点漏斗。
6. 完成备案、隐私、适龄提示与提审材料。
