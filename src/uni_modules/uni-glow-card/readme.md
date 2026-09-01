# uni-glow-card

「流れる光カード」流光风格的内容卡片组件，基于 uni-app（Vue 3）。

> 原插件名 `uni-flomo-card`，已更名为 `uni-glow-card`。

## 功能

- 标题、日期、正文、署名一键配置
- 正文按换行分块，含 💡 的段落自动高亮为小标题
- 中日文内容自动识别并切换对应字体
- 底部二维码：H5 端传入 `qrText` 自动生成，也可直接传 `qrSrc` 图片
- 顶部图标可自定义（`icon`），默认内置自行车图标

## 安装

1. 将 `uni_modules/uni-glow-card` 整个目录拷贝到你的项目 `uni_modules/` 下；
2. 项目需安装 npm 依赖（H5 端自动生成二维码时需要）：

```bash
npm i qrcode
```

> 非 H5（小程序 / App）平台不生成二维码，请传入 `qrSrc` 图片地址。

## 使用

easycom 会自动按标签引入，无需手动注册：

```html
<uni-glow-card
  title="👋 こんにちは"
  date="2024.6.28"
  content="これはカードです。\n💡 ここにテキストを入力してみてください。"
  sign="魔王のもの"
  qr-text="https://example.com"
/>
```

```json
// pages.json easycom
{
  "easycom": {
    "custom": {
      "^uni-glow-card$": "/uni_modules/uni-glow-card/components/uni-glow-card/uni-glow-card.vue"
    }
  }
}
```

## 属性

| 属性         | 类型    | 默认值             | 说明                                              |
| ------------ | ------- | ------------------ | ------------------------------------------------- |
| `title`      | String  | `''`               | 标题                                              |
| `date`       | String  | `''`               | 日期                                              |
| `content`    | String  | `''`               | 正文，`\n` 换行，含 💡 的段落高亮为小标题         |
| `sign`       | String  | `''`               | 署名                                              |
| `qrText`     | String  | `''`               | 二维码内容，H5 端自动生成二维码                    |
| `qrSrc`      | String  | `''`               | 二维码图片地址，传了则不再自动生成                |
| `footerLabel`| String  | `流れる光カード`    | 底部名称                                          |
| `showIcon`   | Boolean | `true`             | 是否显示顶部图标                                  |
| `icon`       | String  | `''`               | 自定义图标图片地址，不传使用内置自行车图标        |

## 跨端说明

- **H5**：`qrText` 自动生成二维码（依赖 `qrcode`）；内置图标为 SVG data-URI，正常显示。
- **小程序 / App**：不生成二维码，需传入 `qrSrc`；内置图标在部分平台可能无法显示 SVG，建议传入 `icon` 静态图片。

## 开发

本仓库根目录是一个完整的 uni-app 演示工程，页面 `src/pages/index/index.vue` 即为组件使用示例。