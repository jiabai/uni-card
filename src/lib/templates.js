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
]

export const DEFAULT_TEMPLATE_ID = 'ticket'

/** 按 id 取模板元数据；未知 id 回退默认模板 */
export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID)
}
