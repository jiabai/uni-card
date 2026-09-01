# uni-card · 无压私域分享配图卡片工具

把一段想说的话变成一张好看的卡片，发给好友、群聊或朋友圈的轻量微信小程序。**不是笔记应用**——「分享」是唯一目标。

## 核心流程（两段两页）

```
选模板（选择页 pages/index）
  → 填内容（输入页 pages/edit）
  → 点「下一步」直接出图
  → 分享图片页（pages/share）
```

写完即出图，中间不经卡片预览页（V3.9 起）。术语口径（模板 / 两段两页 / 草稿 / 素材 / 归档 / 身份绑定）一律以 `CONTEXT.md` 为准。

## 技术栈

- **uni-app（Vue 3）+ Vite**，编译目标为微信小程序（`mp-weixin`）
- **纯本地运行**，无任何服务端网络请求、无账号体系
- **Vitest** 单测覆盖服务层纯 JS 模块
- 卡片组件以 `uni_modules` 形式内聚（`uni-glow-card` / `uni-ticket-card`）

## 快速开始

```bash
npm install
npm run build:mp-weixin   # 产物输出到 dist/build/mp-weixin/
npm test                  # vitest 单测
```

## 目录结构

```
src/
  pages/            # 页面：index 选择页 · edit 输入页 · preview 预览页 · share 分享图片页
  lib/              # 服务层纯 JS 模块（唯一自动化测试接缝）
    templates.js    #   模板注册表（驱动选择区 / 渲染分支 / 主题联动）
    storage.js      #   本地存储封装（unicard_* 键系 + 旧键迁移 + 身份绑定）
    memos.js        #   素材自动归档（upsert / 删除解绑）
    config.js       #   各模板默认内容（出厂示例，唯一来源）
    card-painter.js #   canvas 2d 导出绘制器（与组件同尺寸基准，×2 高清）
    card-export.js  #   导出编排（取隐藏画布 → 绘制 → 落临时文件）
    privacy.js      #   微信隐私授权流（onNeedPrivacyAuthorization）
    navbar.js       #   自定义导航栏度量（胶囊按钮占位）
    qr-png.js       #   纯 JS 二维码 PNG 生成（绕开 TextEncoder/btoa 缺失）
    glow-icon.js    #   流光卡内置图标（内联 base64）
  uni_modules/      # 卡片组件：uni-glow-card · uni-ticket-card
  static/templates/ # 模板缩略图样图（进包，勿放多余文件）
  App.vue / main.js / pages.json / manifest.json / uni.scss
docs/
  adr/              # 架构决策记录
  spec/phase-1.md   # 一期 · 核心分享闭环
  privacy-guidance.md # 提审《用户隐私保护指引》填报文案
CONTEXT.md          # 领域术语表（改动产品逻辑前必读）
backups/            # 历史备份图（不进包）
outputs/            # 设计文档与排查对比图等产物
```

## 文档索引

| 文档 | 内容 |
|---|---|
| `CONTEXT.md` | 领域术语表，产品逻辑的单一事实来源 |
| `docs/adr/` | 架构决策记录（0001 归档 / 0002 身份绑定 / 0003 分页 / 0004 直接出图） |
| `docs/spec/phase-1.md` | 一期核心分享闭环 spec（用户故事 / 决策 / 测试） |
| `docs/privacy-guidance.md` | 提审隐私保护指引填报文案（相册「仅写入」） |
| `outputs/小程序设计文档：无压私域分享配图卡片工具.md` | 设计文档 V3.7 |

## 上线

- **正式 AppID**：`wxc3b9ed4b6afa9d78`
- 上线硬性前置：完成小程序 **ICP 备案**；并在**代码提审页面底部**填报《用户隐私保护指引》（本项目仅声明「相册（仅写入）」一项）。详见 `docs/privacy-guidance.md`。
- 主包上限 2 MB，当前产物约 520 KB。
