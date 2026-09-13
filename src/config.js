/**
 * 各模板默认内容配置（出厂示例）
 *
 * ─────────────────────────────────────────────
 * ticketConfig —— 给 <uni-ticket-card> 用
 *   （票根便签卡：米白纸 + 打孔毛边风格）
 *
 * glowConfig   —— 给 <uni-glow-card> 用
 *   （流光卡片：深色日系圆角卡片）
 *
 * punchConfig  —— 给 <uni-punch-card> 用
 *   （醒目大字卡：橙底纯黑卡 + 超大粗体字，**文字** 为高亮重点）
 *
 * digestConfig 为「深色要点卡」<uni-digest-card> 的默认配置
 *   （近黑圆角卡 + 固定书本图标 + 标题 + 「：」前自动加粗的要点段）
 * ─────────────────────────────────────────────
 */

/* ========== 票根便签卡配置 ========== */
export const ticketConfig = {
  date: '28 / 8, 2026',
  author: '你的昵称',
  content:
    '初来乍到：个人开发者，利用业余时间做点小工具\n' +
    '产品设计：从用户视角出发，把复杂的事情变简单\n' +
    '技术实现：关注工程标准，追求性能与稳定\n' +
    '长期主义：相信积累的力量，持续打磨每一个细节\n',
}

/* ========== 流光卡片配置 ========== */
export const glowConfig = {
  title: '👋 こんにちは',
  date: '2026.8.28',
  content:
    'Formal coding starts.\n' +
    'これはソーシャルメディアであなたの情報を一瞬にして目立つ美しく仕上げるカードツールです。\n' +
    '💡 ここにテキストを入力してみてください、Markdown構文がサポートされ、リアルタイムで有効になります。\n' +
    'テキストカードツール',
  sign: '你的署名',
  qrText: 'https://example.com/glow-card',
}

/* ========== 醒目大字卡配置 ========== */
export const punchConfig = {
  content: '把想说的话\n**变成一张**\n好看的卡片\n发出去吧',
}

/* ========== 深色要点卡配置 ========== */
export const digestConfig = {
  title: 'Knowledge Dissemination',
  content:
    'Research and Publishing: Enrich the learning experience with interactive visuals that enhance understanding.\n' +
    '\n' +
    'Educational Materials:\n' +
    'Produce interactive and visually appealing study aids, infographics, and presentation slides.\n' +
    '\n' +
    'Customer Support: Deliver customer support with clear and helpful visual FAQs and support tickets that are not only clear but also visually engaging.',
}

export const TEMPLATE_DEFAULTS = {
  ticket: ticketConfig,
  glow: glowConfig,
  punch: punchConfig,
  digest: digestConfig,
}

export const TEMPLATE_EDITOR_ROWS = {
  ticket: [
    [
      {
        key: 'content',
        type: 'textarea',
        label: '正文 CONTENT（换行分段落；每段「：」前自动加粗）',
        placeholder: '每行一段',
      },
    ],
    [{ key: 'date', type: 'input', label: 'DATE', placeholder: '如 28 / 8, 2026' }],
    [{ key: 'author', type: 'input', label: 'BY / author', placeholder: '如 你的昵称' }],
  ],
  glow: [
    [
      {
        key: 'content',
        type: 'textarea',
        label: '正文 CONTENT（换行分段落；含 💡 的段落高亮为小标题）',
        placeholder: '每行一段',
      },
    ],
    [{ key: 'title', type: 'input', label: '标题 title', placeholder: '卡片标题' }],
    [{ key: 'date', type: 'input', label: '日期 date', placeholder: '如 2026.8.28' }],
    [{ key: 'sign', type: 'input', label: '署名 sign', placeholder: '署名' }],
    [
      {
        key: 'qrText',
        type: 'input',
        label: '二维码扫码内容 qrText',
        placeholder: '留空则不显示二维码',
      },
    ],
  ],
  punch: [
    [
      {
        key: 'content',
        type: 'textarea',
        label: '正文 CONTENT（换行分句；`**文字**` 圈出的部分换高亮色）',
        placeholder: '每行一句，用 ** ** 圈出重点',
      },
    ],
  ],
  digest: [
    [
      {
        key: 'content',
        type: 'textarea',
        label: '正文 CONTENT（换行分行，空行拉开段距；每行冒号前自动加粗）',
        placeholder: '每行一条要点，空一行分段',
      },
    ],
    [{ key: 'title', type: 'input', label: '标题 TITLE', placeholder: '卡片标题' }],
  ],
}

export function createDefaultDrafts(saved) {
  return Object.fromEntries(
    Object.entries(TEMPLATE_DEFAULTS).map(([id, defaults]) => [
      id,
      { ...defaults, ...((saved && saved[id]) || {}) },
    ])
  )
}

export function getDefaultConfig(id) {
  return { ...(TEMPLATE_DEFAULTS[id] || TEMPLATE_DEFAULTS.ticket) }
}
