# 巷口花食铺微信客户端

Cocos Creator 3.8.8 竖屏小游戏工程。领域玩法与平台能力已经分层，Web 试玩版用于快速验收，微信构建用于开发者工具和真机测试。

## 打开与构建

在仓库根目录执行：

```bash
npm install
npm run wechat:build:web
npm run wechat:build
```

也可以直接用 Cocos Creator 3.8.8 打开 `wechat-client/`。`assets/scenes/Boot.scene` 已挂载 `GameBootstrap` 并设为启动场景，设计分辨率为 `390x844`。

## 目录

- `assets/scripts/domain`：玩法与配置，不依赖 Cocos、微信 API 或 DOM。
- `assets/scripts/application`：应用状态、运行时与存档同步。
- `assets/scripts/platform`：Web Mock 与微信能力适配。
- `assets/scripts/ui`：Cocos 场景和触摸交互。
- `assets/resources`：主包首局资源与基础材料 SpriteFrame。

正式 AppID、广告位 ID、云函数环境和服务端密钥不写入仓库。
