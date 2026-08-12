# 微信生产工程契约

更新时间：2026-07-10

## 目录责任

- `src/`：Web MVP，只用于玩法、数值和回归验证。
- `wechat-client/assets/scripts/domain/`：Cocos 生产玩法事实源。
- `wechat-client/assets/scripts/application/`：状态提交、存档时机、场景流程。
- `wechat-client/assets/scripts/platform/`：微信与本地模拟平台能力。
- `wechat-client/assets/scripts/ui/`：Cocos 节点、触摸输入、抽屉和动效。
- `wechat-client/assets/resources/`：首场景和主包必需资源。
- `wechat-client/assets/bundles/content/`：订单、顾客、店铺阶段等可拆分内容。

## PlatformAdapter

平台层必须提供以下能力，领域层不得直接访问 `wx`：

```ts
export interface PlatformAdapter {
  now(): Promise<number>;
  login(): Promise<{ playerId: string; sessionToken?: string }>;
  readLocalSave(): string | null;
  writeLocalSave(value: string): void;
  readCloudSave(): Promise<SaveEnvelope | null>;
  writeCloudSave(value: SaveEnvelope): Promise<void>;
  showRewardedVideo(placement: "energy" | "cooker"): Promise<"completed" | "skipped" | "unavailable">;
  share(payload: SharePayload): Promise<void>;
  track(event: AnalyticsEvent): void;
  onHide(handler: () => void): () => void;
}
```

实现分为 `MockPlatformAdapter` 与 `WechatPlatformAdapter`。广告只有返回 `completed` 才能发奖励；云端不可用时继续本地游戏并记录待同步状态。

## SaveEnvelope

```ts
export interface SaveEnvelope {
  schemaVersion: 5;
  revision: number;
  updatedAt: number;
  playerId: string;
  deviceId: string;
  state: GameState;
}
```

- 本地每次关键动作立即保存，进入后台前强制保存。
- 云端采用 `revision` 优先、`updatedAt` 次优的整档覆盖策略。
- 冲突时保留较新档，并上报 `save_conflict`；不得静默合并棋盘物品。
- v4 Web 存档只在测试迁移工具中读取，不上传生产云档。

## AnalyticsEvent

首版固定事件：`game_start`、`tutorial_step`、`tutorial_complete`、`generator_used`、`merge_complete`、`recipe_start`、`recipe_collect`、`order_complete`、`task_claim`、`shop_upgrade`、`ad_request`、`ad_result`、`save_error`、`save_conflict`。

公共字段：`eventId`、`playerId`、`sessionId`、`occurredAt`、`level`、`completedOrders`、`energy`、`platform`、`clientVersion`。

## 发布约束

- 设计分辨率 `390x844`，竖屏；安全区由运行时读取。
- 三个最低回归视口：`390x844`、`375x667`、`320x568`。
- 主包目标不超过 `3.5MB`，为微信配置和审核素材预留空间。
- 中端机目标 50 FPS，低端机底线 30 FPS；棋盘操作不得产生持续分配峰值。
- 所有 AI 资产记录提示词、生成日期、原始文件、最终文件和人工修改说明。
