# AGENTS.md — 面向 AI 代理的项目操作指引

> 本文件是给在这个仓库里干活的 AI 代理看的。动任何产品逻辑或代码前，先读这里。

## 这是什么

uni-card：微信小程序「无压私域分享配图卡片工具」——把一段话变成一张卡片发进私域。纯本地、无网络、无账号。

**必读文档（按优先级）：**

1. `CONTEXT.md` —— 领域术语表。**改动产品逻辑前必读**，「模板 / 两段两页 / 草稿 / 素材 / 归档 / 身份绑定」等词有严格定义，写代码和文档必须用这套词。
2. `docs/adr/` —— 架构决策记录，硬性决策以 ADR 为准，不要凭直觉推翻。
3. `docs/spec/phase-1.md` —— 一期 spec，含用户故事、实现决策、测试决策、Out of Scope。
4. `docs/privacy-guidance.md` —— 提审隐私填报文案（新增隐私接口前必读）。

## 命令

```bash
npm run build:mp-weixin   # 构建，产物 dist/build/mp-weixin/
npm test                  # vitest 单测（必须全绿）
```

## 架构约束（硬性，不可违反）

- **术语红线**：用 CONTEXT.md 的词。写「素材 / 归档 / 身份绑定」，不写「笔记 / 保存 / 收藏 / 入库」；写「模板」，不写「主题 / 皮肤」。
- **核心流程是「两段两页」**（V3.9）：选择页 → 输入页 → 「下一步」直接出图 → 分享图片页。**预览页（`pages/preview`）已不在主流程**，仅供二期素材库「用这条分享」复用。
- **模板注册表是唯一驱动**：`src/lib/templates.js` 的 `TEMPLATES` 统一驱动缩略图选择区、渲染分支、主题联动。新增模板 = 注册表加一项 + 组件 + 样图 + 默认配置（`config.js`），页面零改动。
- **默认内容唯一来源**：各模板出厂示例只在 `src/config.js`，不进注册表。
- `uni_modules` 必须在 `src/` 内；easycom 用 `@/` 前缀（见 `pages.json`）。
- 平台专属逻辑收敛在 `#ifdef MP-WEIXIN` 内；rpx 为主，二维码 canvas 用 px。
- 二维码只引入纯 JS 矩阵核心（`qrcode/lib/core`），不引 canvas 渲染链。

## 存储键系（`src/lib/storage.js`）

- `unicard_config` —— 各模板编辑中的草稿配置
- `unicard_mine` —— 昵称、统计开关、最近使用模板 id
- `unicard_library` —— 素材数组
- `unicard_binding` —— 身份绑定（草稿 ↔ 素材 id，**独立键**，勿嵌回 `unicard_config`）

旧键 `uni-card-demo-config` 首次读取一次性迁移，读写统一 try/catch 静默回退。

## 真机高频坑（改到就踩）

1. **`getCurrentInstance()` 必须在 setup 作用域捕获**后传给导出模块；在事件回调里调用真机返回 `null`，`.in(null)` 会抛 `"null is not an object (evaluating 't1.$scope')"`。
2. **隐藏 canvas 不能用 `display:none`**（canvas 2d 需在文档流内才能取到 node），统一 `position:fixed; left:-9999px`。
3. **iOS 微信 JSCore 无全局 `TextEncoder` / `btoa`**，qrcode 会抛 `Can't find variable: TextEncoder`——`qr-png.js` 已自行做 UTF-8 编码与 base64，勿再引回依赖这二者的路径。
4. **`src/static/` 下所有文件会被无条件拷进产物**（占主包体积）。不想进包的素材放项目根 `backups/`，别放 `src/static/`。
5. **深色卡片导出图留边与卡片同色**（glow：`pageBg` 与 `bg` 均为 `#1a1a1c`）。若留边与卡片色差只有几个色阶，静态 PNG 上会显形为「描边」。排查疑似边框用 Pillow 对导出 PNG 做 run-length 像素分段，别靠肉眼。此取舍已定案，勿改回「卡片浮起」方案。

## 上线前置（易忘）

1. 必须先完成小程序 **ICP 备案**，未备案无法提审（报 `errcode: 86369`）。
2. 《用户隐私保护指引》首次只能在**代码提审页面底部**填报。本项目仅声明「相册（仅写入）」，用途写「保存生成的分享卡片图片到用户相册」。
3. 无网络请求 → 无需配置 request 合法域名。
