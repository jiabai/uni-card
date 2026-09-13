# uni-digest-card

「深色要点卡」内容卡片组件，基于 uni-app（Vue 3）。

近黑的圆角卡面，左上角固定一个书本图标，下面是标题与多段要点。
每行里第一个「：」或「:」之前的文字自动加粗成小标题，其余照排，适合把「名词解释 / 功能清单 / 知识要点」这类内容整段写出来。

## 功能

- 标题 + 正文两个字段，图标固定为 📖
- 正文用 `\n` 分行，**空行即段落间距**（空行在卡片上占一整行高度）
- 每行冒号之前的文字自动加粗为小标题，与正文同行流式排布
- 行尾会自然换行，中英文混排按字符断行
- 内容少时卡片保持 480 × 540 的最小比例，内容多时自动增高

## 安装

1. 将 `uni_modules/uni-digest-card` 整个目录拷贝到你的项目 `uni_modules/` 下；
2. easycom 会自动按标签引入，无需手动注册。

```json
// pages.json easycom
{
  "easycom": {
    "custom": {
      "^uni-digest-card$": "/uni_modules/uni-digest-card/components/uni-digest-card/uni-digest-card.vue"
    }
  }
}
```

## 使用

```html
<uni-digest-card
  title="Knowledge Dissemination"
  :content="'Research and Publishing: Enrich the learning experience.\n\nCustomer Support: Clear and helpful answers.'"
/>
```

## 属性

| 属性      | 类型   | 默认值 | 说明                                              |
| --------- | ------ | ------ | ------------------------------------------------- |
| `title`   | String | `''`   | 卡片标题                                          |
| `content` | String | `''`   | 正文，`\n` 分行、空行分段；每行冒号前自动加粗   |

## 尺寸约定

组件 CSS 的 px 基准（480 宽 / 21 圆角 / 40 图标字号 / 22 标题字号 / 20 正文字号 / 26 行高 / 40 左右内距 / 32 上内距 / 82 下内距）
与导出绘制器 `src/lib/card-painter.js` 里的 `D` 常量一一对应，改一边必须同步另一边，
否则「预览看到的」与「导出得到的」会不一致。

正文解析（分行、空行、加粗位置）由 `src/lib/digest.js` 统一提供，组件与绘制器共用同一份实现。
