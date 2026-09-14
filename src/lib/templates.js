/**
 * 模板注册表
 *
 * 统一驱动：输入页缩略图选择区、卡片渲染分支、页面主题联动。
 * 字段固定五项；各模板默认内容不进注册表（config.js 为唯一来源）。
 * 新增模板 = 注册表加一项 + 组件 + 样图 + 默认配置，页面零改动。
 */
export const TEMPLATES = [
  {
    id: 'ticket',
    name: '票根便签卡',
    comp: 'uni-ticket-card',
    thumb: '/static/templates/ticket-thumb.png',
    theme: '#e6e1d3',
  },
  {
    id: 'glow',
    name: '流光卡片',
    comp: 'uni-glow-card',
    thumb: '/static/templates/glow-thumb.png',
    theme: '#111112',
  },
  {
    id: 'punch',
    name: '醒目大字卡',
    comp: 'uni-punch-card',
    thumb: '/static/templates/punch-thumb.png',
    theme: '#feab75',
  },
  {
    id: 'digest',
    name: '深色要点卡',
    comp: 'uni-digest-card',
    thumb: '/static/templates/digest-thumb.png',
    theme: '#1a1a1c',
  },
]

export const DEFAULT_TEMPLATE_ID = 'ticket'

/** 按 id 取模板元数据；未知 id 回退默认模板 */
export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID)
}

/**
 * 按最近使用的模板 id 重排陈列顺序：命中项置顶，其余保持注册表原顺序。
 *
 * 只返回新数组，不改动 TEMPLATES 常量，故注册表顺序在任何时刻都是稳定的默认顺序。
 * 命中项已居首或未命中时原样返回，避免无谓的数组重建（选择页每次 onShow 都会重算）。
 */
export function orderByRecent(templateId) {
  const idx = TEMPLATES.findIndex((t) => t.id === templateId)
  if (idx <= 0) return TEMPLATES
  return [TEMPLATES[idx], ...TEMPLATES.filter((t) => t.id !== templateId)]
}
