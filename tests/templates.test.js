import { describe, it, expect } from 'vitest'
import { TEMPLATES, DEFAULT_TEMPLATE_ID, orderByRecent } from '../src/lib/templates.js'

describe('选择页陈列顺序（orderByRecent）', () => {
  it('未使用过任何模板时保持注册表原顺序', () => {
    expect(orderByRecent('')).toEqual(TEMPLATES)
  })

  it('最近使用的模板置顶，其余保持注册表原顺序', () => {
    const last = TEMPLATES[TEMPLATES.length - 1].id
    const ordered = orderByRecent(last)
    expect(ordered[0].id).toBe(last)
    expect(ordered.map((t) => t.id)).toEqual([
      last,
      ...TEMPLATES.filter((t) => t.id !== last).map((t) => t.id),
    ])
  })

  it('命中项已居首时原样返回，不重建数组', () => {
    const head = TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID).id
    expect(orderByRecent(head)).toBe(TEMPLATES)
  })

  it('未知 id 原样返回，不产生空位或重复项', () => {
    expect(orderByRecent('not-a-template')).toBe(TEMPLATES)
  })

  it('重排结果不改变模板总数，也不改动 TEMPLATES 常量本身', () => {
    const before = TEMPLATES.map((t) => t.id)
    const ordered = orderByRecent('punch')
    expect(ordered).toHaveLength(TEMPLATES.length)
    expect(new Set(ordered.map((t) => t.id)).size).toBe(TEMPLATES.length)
    expect(TEMPLATES.map((t) => t.id)).toEqual(before)
  })
})
