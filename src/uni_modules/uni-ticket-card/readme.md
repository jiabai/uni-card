# uni-ticket-card

复刻 **票根风便签卡** 的 uni-app（Vue 3）组件。
**注意：这是独立插件，不影响既有的 `uni-glow-card`（v1 深色日文卡片）。**

## 效果

- 🎫 顶部 / 底部**打孔半圆毛边**（径向渐变纯 CSS 实现，跨端渲染）
- 📝 **ticket 品牌头**：`· ticket ·` + 虚线分隔
- 📖 **正文自动分段**：`\n` 换行，每段中「：」或「:」**之前的文字自动加粗**为小标题
- 🗂️ **元数据区**：DATE / BY / TOTAL 三行，中间用虚线自动填充
- ✏️ **手绘涂鸦分隔线**：SVG 贝塞尔曲线 + 淡虚线双层效果
- 🏷️ **条形码**：内嵌 SVG，无需额外依赖
- 📱 移动端自适应（小屏自动缩小内边距和字号）
- 🚫 **零依赖**：不依赖任何 npm 包，H5 / 小程序 / App 直接可用

## 安装

将 `uni_modules/uni-ticket-card` 整个目录拷贝到你的项目 `uni_modules/` 下即可。
无需 `npm install`，本组件零第三方依赖。

## 使用

easycom 会自动按标签引入（前提是已在 `pages.json` 的 easycom.custom 中注册），无需手动注册：

```html
<uni-ticket-card
  date="07 / 11, 2026"
  author="Aaron"
  total-memos="421"
  total-days="1841"
  content="初入职场：IC，独立贡献者，执行人，上级分配什么工作就做什么工作
阿里期间：技术DRI，Directly Responsible Individual(直接责任人)，主要架构思维，工程标准
暴风期间：配合产品负责人，DRI，同时配合产品进行对业务的洞察
明略期间：对业务的洞察，对需求的取舍，对方向的判断，全都包括"
/>
```

> 提示：`content` 中的字符串可以用模板字符串多行书写，也可以显式写 `\n` 作为换行。

## 属性

| 属性          | 类型            | 默认值  | 说明                                                                 |
| ------------- | --------------- | ------- | -------------------------------------------------------------------- |
| `content`     | String          | `''`    | 正文。`\n` 换行；每段「：」或「:」前的文字会自动加粗为小标题          |
| `date`        | String          | `''`    | DATE 字段值，例如 `"07 / 11, 2026"`                                  |
| `author`      | String          | `''`    | BY 字段值，例如 `"Aaron"`                                            |
| `totalMemos`  | String / Number | `'0'`   | TOTAL 左侧的 MEMOS 数量，例如 `"421"`                                |
| `totalDays`   | String / Number | `'0'`   | TOTAL 右侧的 DAYS 天数，例如 `"1841"`                                |

## pages.json easycom 注册（如未自动识别）

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^uni-ticket-card$": "/uni_modules/uni-ticket-card/components/uni-ticket-card/uni-ticket-card.vue"
    }
  }
}
```

## 跨端说明

所有视觉元素（打孔毛边 / 虚线 / SVG 涂鸦 / SVG 条形码）均使用 **CSS + 内联 SVG** 实现，
不依赖平台特定 API 或第三方 npm 包：

- ✅ H5
- ✅ 微信小程序 / 支付宝小程序 / 百度小程序 / 抖音小程序 / 其他小程序
- ✅ App（Android / iOS）

## 与 `uni-glow-card` 的区别

| 项目 | uni-glow-card（v1） | uni-ticket-card（本插件） |
|------|----------------------|----------------------------|
| 风格 | 深色圆角日系卡片 | **票根便签（米白纸 + 打孔边）** |
| 正文结构 | 标题 / 日期 / 💡 高亮段 / 署名 / 二维码 | 段首自动加粗标签 + DATE/BY/TOTAL + 手绘线 + 条形码 |
| 依赖 | 需要 `qrcode`（H5 二维码） | **零依赖** |
| 组件标签 | `<uni-glow-card>` | `<uni-ticket-card>` |

## 开发

- `uni_modules/uni-ticket-card/components/uni-ticket-card/uni-ticket-card.vue` — 组件源码
- `src/config.js` — 演示页卡片内容配置
- `src/pages/index/index.vue` — 演示页使用示例