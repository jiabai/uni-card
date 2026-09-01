# uni-wave-card

流线渐变分享卡组件。背景为本地 PNG，标题和正文保持可编辑；无网络、无账号依赖。

## 使用

```vue
<uni-wave-card
  title="Lorem Ipsum"
  content="is simply dummy text\nof the printing and\ntypesetting industry"
/>
```

## Props

- `title`：标题，String。
- `content`：正文，String；使用换行符分段。

组件依赖项目内 `/static/wave-card-bg.png` 背景资产。
