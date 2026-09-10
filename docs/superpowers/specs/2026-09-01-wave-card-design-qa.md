# 流线渐变卡 Design QA

> 存档说明：本文件记录 2026-09-01「流线渐变卡」（wave）模板的设计验收过程。该模板已于 2026-09-10 整体移除，本文件仅作历史存档，不代表当前产品范围。现行模板为票根便签卡（ticket）与流光卡片（glow）。

final result: passed

## 验收基准

- source visual truth path: `C:\Users\bicho\Pictures\ScreenShot_2026-09-01_230237_398.png`
- implementation screenshot path: `D:\Code\uni-card\.worktrees\wave-card\outputs\wave-design-qa\wave-implementation-480x896.png`
- full-view comparison evidence: `D:\Code\uni-card\.worktrees\wave-card\outputs\wave-design-qa\wave-comparison-final.png`
- focused region comparison evidence: `D:\Code\uni-card\.worktrees\wave-card\outputs\wave-design-qa\wave-focused-frame-final.png`
- browser route: `http://127.0.0.1:4173/#/pages/qa-wave/qa-wave`
- state: `waveConfig` 出厂示例，默认静态状态

## 视口与归一化

- 参考图像素：264 × 493。
- 组件 CSS 尺寸：480 × 896；浏览器视口：700 × 1050；`devicePixelRatio = 1.5`。
- 浏览器全页截图为 700 × 1050；根据密度换算，卡片在截图中为 320 × 597，再用 Lanczos 归一化为 480 × 896。
- 全图比较前，最终实现继续归一化为 264 × 493，与参考图同像素尺寸并排比较。
- 局部比较使用两张 264 × 493 图上的同一裁剪框：`x=20, y=175, width=225, height=145`。

## 最终五项检查

- 字体与排版：Georgia/Times 系统衬线回退；标题 38/46、正文 31/32；标题宽度、三行正文换行和垂直节奏与参考图对齐。
- 间距与布局：卡片 480 × 896；外框 `x=45, y=332, width=390, height=226`；4px 边框、18px 圆角；局部对照无可见错位。
- 色彩：使用真实栅格背景，珊瑚红、粉红与橙色分布接近参考图；文字与边框为暖白色。
- 图像质量：背景为 ImageGen 生成并缩放到 480 × 896 的独立 PNG；组件与 Canvas 共用 `/static/wave-card-bg.png`，无 CSS 渐变、SVG 或 div 绘图替代，未见文字残影、锯齿或遮罩边缘。
- 文案：标题与三行正文逐字匹配参考图；输入页默认值与组件、Canvas 使用同一配置来源。

## 交互与运行检查

- 选择页显示 3 个模板。
- 点击第三项进入 `/pages/edit/edit?template=wave`。
- 输入页标题为“流线渐变卡”，显示正文与标题两个字段，默认值正确。
- 最终浏览器流程无 console warning/error。
- 导出布局通过 Vitest 覆盖默认 480 × 896、三行正文、长正文扩展和 painter 注册；微信小程序构建另行验证。

## 比较历史

1. 初始捕获：发现截图裁剪坐标受 1.5 密度影响而补黑边；这是归一化问题，不作为设计结论。改为从全页截图按密度裁剪并归一化。
2. 第一轮有效比较：P2——背景粉红饱和度偏低且流线数量偏少。修复：以参考图与现有干净背景共同约束 ImageGen，替换共享栅格背景。
3. 第二轮比较：背景色与构图通过；P2——外框横向窄约 3px，标题偏宽，文字组偏低。修复：外框调整为 45/332/390/226，标题调整为 38/46，正文调整为 31/32，文字组上移 6px；组件与 Canvas 同步。
4. 最终比较：无可执行的 P0/P1/P2。全图与局部证据均确认外框、文案、字体比例和垂直节奏对齐。

## Findings

- 无 P0/P1/P2。
- P3：干净可编辑背景由参考图重建，个别流线的精确数量与曲率不是逐像素复制，但主体轨迹、密度、色彩和视觉层级一致，不影响模板辨识与使用。

## Open Questions

- 无阻断问题。

## Implementation Checklist

- [x] 独立 `uni-wave-card` 组件
- [x] 选择页注册与真实缩略样图
- [x] 输入页字段、默认草稿与重置
- [x] 复用预览渲染分支
- [x] 2× Canvas 导出与长文扩展
- [x] 浏览器全图/局部对照与流程验证

## Follow-up Polish

- 若未来取得无文字、无外框的原始背景源文件，可直接替换共享 PNG，消除剩余 P3 的生成式流线差异，无需修改组件或 painter。
