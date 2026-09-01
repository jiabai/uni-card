/**
 * 各模板默认内容配置（出厂示例）
 *
 * ─────────────────────────────────────────────
 * ticketConfig —— 给 <uni-ticket-card> 用
 *   （票根便签卡：米白纸 + 打孔毛边风格）
 *
 * glowConfig   —— 给 <uni-glow-card> 用
 *   （流光卡片：深色日系圆角卡片）
 * ─────────────────────────────────────────────
 */

/* ========== 票根便签卡配置 ========== */
export const ticketConfig = {
  date: '28 / 8, 2026',
  author: 'Aaron',
  totalMemos: '421',
  totalDays: '1841',
  content:
    '阿里期间：技术DRI，Directly Responsible Individual(直接责任人)，主要架构思维，工程标准，风险把控，性能优化，没有团队配合\n' +
    '暴风期间：配合产品负责人，DRI，同时配合产品进行对业务的洞察，对需求的取舍的考虑，成本业务助手\n',
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
  sign: '小白小新',
  qrText: 'https://example.com/glow-card',
}
