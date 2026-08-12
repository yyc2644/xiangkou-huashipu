# 微信云服务接入说明

更新时间：2026-07-11

## 当前实现

- 客户端：`wechat-client/assets/scripts/platform/wechat-cloud-services.ts`
- 云函数：`cloudfunctions/game-service`
- 能力：服务器时间、OpenID 登录、整档读取、revision 冲突保护保存、分析事件上报。
- 降级：云环境未配置或请求失败时，本地存档仍可继续游戏；广告位未配置时不发奖励。

## 后台准备

1. 使用正式小游戏 AppID 开通云开发环境。
2. 创建 `player_saves` 集合，只允许云函数读写。
3. 创建 `analytics_events` 集合，只允许云函数写入，运营后台按需只读。
4. 在微信开发者工具中上传并部署 `cloudfunctions/game-service`，安装云端依赖。
5. 配置激励视频广告位；首版只使用补体力和制作加速两个位置。

## 构建配置

```bash
HUASHIPU_WECHAT_APPID=正式AppID \
HUASHIPU_CLOUD_ENV=云环境ID \
HUASHIPU_CLOUD_FUNCTION=game-service \
HUASHIPU_ENERGY_AD_UNIT_ID=补体力广告位 \
HUASHIPU_COOKER_AD_UNIT_ID=制作加速广告位 \
npm run wechat:build
```

构建脚本会生成 `build/wechatgame/runtime-config.js` 并写入产物，不修改源码配置。不得把 AppSecret、云密钥或管理员凭证放入客户端、环境文件或仓库。

## 验收顺序

1. 新账号首次登录返回稳定 playerId。
2. 完成教程和一次取材后，退出再进入可恢复。
3. A 设备保存后，B 设备登录可读取同一进度。
4. 两台设备从同一 revision 分叉时，较旧写入被拒绝；重新加载后采用 revision 较高、updatedAt 较新的整档。
5. 断网时继续本地游戏；恢复网络后不丢本地进度。
6. 广告完整播放才发奖，中断、失败和无广告均不发奖。
7. `game_start`、教程、生成、合成、制作、订单、任务、升级、广告和存档异常事件进入数据集合。

## 未完成

- 正式云环境与数据库权限尚未创建。
- 正式 AppID、广告位 ID 和服务器域名尚未提供。
- 云函数尚未在微信后台部署，当前只有本地契约测试。
- 存档删除、导出和客服恢复流程需与隐私政策及运营后台一起落地。
