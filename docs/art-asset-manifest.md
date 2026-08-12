# 美术资源清单

## 已生成资源

### 小店风格基准图

- 源文件：`src/assets/generated/style-reference-shop.png`
- 运行时压缩图：`src/assets/generated/style-reference-shop-runtime.jpg`
- 用途：首屏小店外观、后续 AI PNG 批量素材的风格基准。
- 生成方式：内置图像生成工具。

生成提示词摘要：

```text
巷口花食铺，现代老街小店，花材、蒸点、蔬菜篮、礼盒、温暖晨光，
2D casual game illustration，治愈、干净、适合移动端游戏。
避免复制竞品 IP、鹅、茶楼、咖啡店品牌、水印。
```

### 常用 SVG 图标资源

- 文件：`src/ui/art.ts`
- 用途：棋盘物品、订单需求、生成器、制作台、顾客头像。
- 优先级：MVP 运行时直接使用，保证小尺寸清晰、可控、易迁移到 Cocos。

覆盖范围：

- 食材：青菜、番茄、鸡蛋、小麦、面粉、面团。
- 花材：雏菊、玫瑰。
- 包装：纸盒、礼盒、丝带。
- 成品：青菜包、番茄煎蛋、香草蛋饼、清晨花礼、暖心便当、玫瑰甜点盒。
- 生成器：菜篮、花篮、杂货箱。
- 制作台：蒸锅、煎台、礼盒台。
- 顾客头像：6 位 MVP 顾客。

## 当前美术策略

MVP 不再使用“单字占位图”。运行时采用两层资产：

1. AI 生成的场景基准图，提供题材和情绪。
2. 项目内 SVG 小图标，保证棋盘和订单的可读性。

### 基础材料 PNG 图标 v1

- 生成日期：`2026-07-11`
- 生成方式：内置图像生成工具，以小店风格基准图作为风格参考。
- 原始母版：`art-source/items/base-materials-source-v1.png`
- 透明母版：`art-source/items/base-materials-atlas-v1.png`
- 最终资源：`wechat-client/assets/resources/art/items/*.png`
- 规格：8 张 `128×128` RGBA PNG，总计约 `152 KB`。
- 覆盖：菜叶、小番茄、鸡蛋、小麦、花芽、玫瑰苗、纸片、细绳。
- 人工处理：洋红色键背景转 alpha；按 4×2 网格切片；透明边界裁切、等比缩放、居中；未重绘主体。
- 运行时策略：仅替换已有正式 PNG 的 Lv.1 材料，高阶材料继续使用文字 fallback。

生成提示词：

```text
Use case: stylized-concept
Asset type: source contact sheet for mobile casual-game item sprites
Input image: style reference only; do not copy its composition, signage, text, or scene
Primary request: create exactly eight isolated item icons arranged in a precise 4 columns by 2 rows contact sheet. Reading left to right, top row: one green vegetable leaf, one red tomato, one cream chicken egg, one golden wheat sprig. Bottom row: one yellow daisy bud, one pink rose bud, one folded kraft-paper piece, one coil of pale blue twine.
Style/medium: polished hand-painted 2D casual-game illustration matching the warm clean rendering language of the reference; strong simple silhouettes readable at 48 px; consistent three-quarter view, scale, outline weight, and light direction
Composition/framing: every icon centered in an equal cell with generous identical padding; objects must not cross cell boundaries; no separators and no extra objects
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background, one uniform color with no shadows, gradients, texture, floor, reflections, or lighting variation
Constraints: exactly 8 icons, all fully visible, crisp separated edges, no cast shadow, no contact shadow, no text, no labels, no numbers, no watermark; do not use #ff00ff in any object
Avoid: characters, shop scene, baskets, plates, packaging around the items, duplicate objects, competitor IP, photorealism
```

## 后续替换路线

1. 用当前基准图生成正式 PNG 图标包。
2. 将 `src/ui/art.ts` 中的 SVG 图标作为 fallback。
3. 逐步迁移到 `src/assets/items/*.png`、`src/assets/customers/*.png`、`src/assets/ui/*.png`。
4. 在 Cocos 版本中打包为图集，减少 draw call 和包体。
