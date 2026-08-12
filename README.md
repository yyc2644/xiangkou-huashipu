# 巷口花食铺 MVP

微信小游戏方向的 Web 原型项目，先用浏览器验证核心玩法闭环，后续再迁移到 Cocos Creator / 微信小游戏。

## 当前交付

- 任务启动卡：`TASK_START_CARD.md`
- 项目上下文卡：`PROJECT_CONTEXT_CARD.md`
- 产品文档：`docs/product-document.md`
- 需求闭环与数值平衡稿：`docs/requirements-and-balance.md`
- 微信上线准备清单：`docs/wechat-launch-readiness.md`
- 微信生产工程契约：`docs/wechat-production-contract.md`
- 可运行 Web MVP：`src/main.ts`
- 主玩法配置事实源：`src/game/catalog.ts`
- 主玩法状态逻辑：`src/game/state.ts`
- UI 渲染：`src/ui/render.ts`
- Cocos 微信客户端：`wechat-client/`
- GitHub Pages 试玩包：`site/`

## 运行

```bash
npm install
npm run dev -- --port 5174
```

打开：

```text
http://127.0.0.1:5174/
```

## 验证

```bash
npm run build
npm run balance
npm run verify
```

`npm run verify` 会依次覆盖 `npm run loop`、`npm run autoplay`、`npm run ui:mobile` 和 `npm run wechat:autoplay`，同时检查 Web 与 Cocos 两套实现。

## 迁移到其他电脑

```bash
git clone https://github.com/yyc2644/xiangkou-huashipu.git
cd xiangkou-huashipu
npm install
npm run verify
```

Cocos 工程需要 Cocos Creator 3.8.8。Web MVP 可直接使用 Node.js 运行。

`npm run pages:prepare` 默认生成 Web MVP 试玩包；安装 Cocos 后可用 `PAGES_SOURCE=cocos npm run pages:prepare` 发布 Cocos 试玩包。

## MVP 已包含

- 7x9 合成棋盘。
- 点击生成器消耗体力并产出材料。
- 点击棋盘格选择，再点目标格移动或二合升级。
- 拖拽棋盘物品移动或合成。
- 制作台消耗材料并倒计时产出菜品/礼盒。
- 订单提交、金币/经验/故事点奖励。
- 店铺四区域升级。
- localStorage 本地存档。
- 模拟激励广告补体力。
- 手机竖屏一屏布局与底部入口。
- 可操作 4 步新手教程。
- 合成图谱和今日任务追踪。
- 图谱/订单卡显示缺口数量、主要来源和按当前棋盘折算的预计取材次数。

## 下一步建议

1. 在微信开发者工具完成首单、故事单、广告与前后台切换真机验收。
2. 配置正式 AppID、云环境、服务器时间与广告位。
3. 扩展高阶物品、顾客、生成器和店铺美术。
4. 完成备案、隐私指引、适龄提示与提审材料。
