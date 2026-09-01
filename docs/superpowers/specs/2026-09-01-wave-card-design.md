# 流线渐变卡设计说明

## 目标

以 `C:\Users\bicho\Pictures\ScreenShot_2026-09-01_230237_398.png` 为唯一视觉标准，新增可独立复用的 `uni-wave-card` 组件，并作为 uni-card 第三套模板完整接入模板选择、输入、草稿、归档、预览复用、2× 导出和缩略样图。

实现必须保持既有「两段两页」主流程：选择页 → 输入页 → 「下一步」直接出图 → 分享图片页。不得把预览页重新放回主流程。

## 已确认范围

- 模板 id：`wave`。
- 模板名称：`流线渐变卡`。
- 组件标签：`<uni-wave-card>`。
- 用户可编辑字段：`title` 与 `content`。
- 出厂示例：标题为 `Lorem Ipsum`，正文为 `is simply dummy text\nof the printing and\ntypesetting industry`。
- 默认卡片逻辑尺寸：`480 × 896px`，与参考图 `264 × 493px` 的宽高比一致。
- 默认内容下优先追求同尺寸视觉复刻；用户内容增长时允许内容框与卡片高度自适应，以保留长文成卡能力。

## 视觉结构

卡片由三个视觉层组成：

1. 背景资产：暖橙、珊瑚红、玫粉过渡的竖向抽象背景，以及从左上向右下汇聚、再向底部扩散的白色流线。
2. 内容框：位于卡片中部偏上，白色圆角描边，无填充、无阴影。
3. 文字：白色衬线体，标题加粗并居中，正文常规字重、居中、紧凑行距。

参考图的基准测量按 `264 × 493px` 记录：

- 内容框约为 `x=26, y=184, width=212, height=123`。
- 换算到 `480 × 896px` 后约为 `x=47, y=334, width=386, height=224`。
- 内容框圆角换算后约为 `18px`，描边约为 `4px`。
- 标题字号目标约为 `42px`，正文目标约为 `29px`；最终数值以同尺寸设计 QA 为准。

字体栈使用离线系统衬线字体：`Georgia, "Times New Roman", "Songti SC", serif`。不引入网络字体，保持项目纯本地、无网络约束。

## 背景资产策略

使用参考图通过 Image Gen 编辑生成干净背景：移除标题、正文和中部圆角边框，同时保持原有渐变、白色流线走向、画面密度和色彩不变。生成结果归一化为 `480 × 896px` PNG。

不使用 CSS 渐变、CSS 曲线、内联 SVG、手工 SVG 或元素堆叠近似流线。组件预览与 Canvas 导出必须复用同一张背景资产，避免两套视觉源产生漂移。

背景资产放在 `src/static/wave-card-bg.png`。该位置符合现有模板资产路径约定；缩略样图放在 `src/static/templates/wave-thumb.png`。

## 组件设计

新增目录：

```text
src/uni_modules/uni-wave-card/
  components/uni-wave-card/uni-wave-card.vue
  package.json
  readme.md
```

组件公开接口：

```vue
<uni-wave-card
  :title="fields.title"
  :content="fields.content"
/>
```

Props：

- `title: String`，默认空字符串。
- `content: String`，默认空字符串；换行符保留为显式段落换行。

组件内部职责：

- 渲染背景 PNG。
- 渲染圆角描边内容框。
- 对标题与正文执行换行、居中和垂直布局。
- 默认内容时保持 `480 × 896px` 的参考构图。
- 内容增加时扩展内容框；只有内容框无法在最小卡片高度内容纳时才增加卡片高度。

组件不负责草稿、归档、分享、导出或页面导航。

## 模板注册与默认内容

`src/lib/templates.js` 的 `TEMPLATES` 新增固定五字段项：

```js
{
  id: 'wave',
  name: '流线渐变卡',
  comp: 'uni-wave-card',
  thumb: '/static/templates/wave-thumb.png',
  theme: '#f66b61',
}
```

默认内容继续以 `src/config.js` 为唯一来源，新增 `waveConfig`。同时在 `config.js` 导出模板默认值映射和输入字段描述，使输入页按配置渲染字段，不再为每套模板增加页面级条件分支。

输入字段描述保持现有字段文案和布局：票根卡的两个 TOTAL 字段仍并排；流光卡字段顺序不变；流线渐变卡依次显示正文与标题。此次配置化不得改变已有两套模板的草稿键、默认值或输入体验。

## 页面与渲染边界

选择页已经由 `TEMPLATES` 驱动，只需注册表新增项即可出现第三张缩略样图。

输入页进行一次性配置化改造：

- 从 `config.js` 的模板默认值映射创建所有模板草稿。
- 从输入字段描述生成输入控件。
- 重置时按当前模板 id 从默认值映射恢复并解除身份绑定。
- 校验、出图、归档和导航继续使用当前模板 id 与当前草稿对象。

预览页不直接累加第三组页面分支，而是改为使用统一 `card-renderer` 宿主组件。微信小程序不支持 Vue `<component :is>` 动态组件，因此宿主内部使用编译期可识别的静态分支；页面只传 `templateId` 与 `fields`。以后新增模板时页面保持不变，平台限制被收敛在一个组件边界内。

`src/pages.json` 的 easycom 映射新增 `uni-wave-card`，继续使用 `@/` 前缀。

## Canvas 导出

`src/lib/card-painter.js` 新增 `paintWave`，并把当前二选一 painter 分派改成以模板 id 为键的静态映射。`paintWave` 使用与组件相同的逻辑尺寸、背景资产、内容框坐标、颜色、字号、行高和边距。

导出流程：

1. 加载 `wave-card-bg.png`。该资产是模板主体，加载失败时导出失败并走现有「生成失败」提示，不生成缺背景的错误图片。
2. 第一遍测量标题和正文换行，计算内容框及卡片逻辑高度。
3. 第二遍按 2× 物理像素绘制页面背景、卡片背景、圆角描边和文字。
4. 保留现有四周 `PAGE_PAD`；留边色取模板主题主色，避免出现非预期轮廓。
5. 物理高度超过 4096px 时沿用 `err.overflow = true`，由页面提示「内容过长，请精简后重试」。

组件和 Canvas 的换行算法都以显式换行优先，并在每段内部按可用宽度换行。默认英文示例不得发生额外换行。

## 数据流

```text
TEMPLATES.wave
  → 选择页显示 wave-thumb.png
  → 输入页加载 waveConfig 或 wave 草稿
  → 用户编辑 title/content，深监听写入 unicard_config.wave
  → 下一步调用 exportCardImage(instance, 'wave', fields)
  → paintWave 输出 2× PNG
  → 出图成功后 upsertMemo('wave', fields) 完成归档与身份绑定
  → 分享图片页按 wave.theme 展示并提供分享图片/保存到相册
```

`unicard_config`、`unicard_library`、`unicard_binding` 和 `unicard_mine` 的键名及语义不变；只是自然增加 `wave` 模板 id 对应的数据。

## 错误处理

- 标题可为空，正文为空仍沿用全局校验并提示「先写点内容吧」。
- 背景资产加载失败时中止导出，不归档素材。
- 画布超高沿用现有明确提示，不静默裁切。
- 背景图片在组件中加载异常时使用纯色 `#f66b61` 兜底，保证文字可读；该状态不视为视觉验收通过。
- 未知模板 id 仍由 `getTemplate` 回退票根卡，不改变现有兼容行为。

## 测试与验收

自动化测试遵循 TDD，先观察失败再写实现：

- 注册表包含 `ticket / glow / wave` 三项，`wave` 五字段完整且查询正确。
- `waveConfig` 含 `title` 与 `content`，默认值与参考图一致。
- 模板默认值映射和输入字段描述覆盖注册表中的每个模板 id。
- painter 分派能够选择 `wave`，并返回正确的默认逻辑宽高与非 overflow 结果。
- 现有存储、素材与其他模板测试保持全绿。

工程验收：

- `npm test` 全绿。
- `npm run build:mp-weixin` 成功。
- 编译产物中 `<svg>` 与 `@media` 命中为 0。
- 不新增网络请求、账号、隐私接口或平台外逻辑。

视觉验收使用 Product Design design QA：

1. 用参考图默认内容渲染第三套模板。
2. 截取卡片内容区域，并归一化到 `264 × 493px`。
3. 把参考图与实现截图放入同一张并排对比图。
4. 明确检查字体、布局节奏、颜色、背景资产质量和文案五个表面。
5. 发现 P0/P1/P2 差异时修正、重新截图并再次比较。
6. 在项目根生成 `design-qa.md`，只有 `final result: passed` 才允许交付。

## 不在本次范围

- 不新增模板自定义颜色、元素级编辑或背景上传。
- 不改变「两段两页」主流程。
- 不新增页面、账号、网络服务、云端字体或素材库界面。
- 不重设计票根卡、流光卡或选择页视觉。
- 不把参考图整张作为不可编辑卡片直接交付。
