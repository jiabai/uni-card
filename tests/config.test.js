import { describe, it, expect } from 'vitest'
import * as configs from '../src/config.js'
import { TEMPLATES } from '../src/lib/templates.js'

describe('各模板默认内容配置（出厂示例）', () => {
  it('票根卡配置含全部字段', () => {
    expect(configs.ticketConfig).toHaveProperty('date')
    expect(configs.ticketConfig).toHaveProperty('author')
    expect(configs.ticketConfig).toHaveProperty('totalMemos')
    expect(configs.ticketConfig).toHaveProperty('totalDays')
    expect(configs.ticketConfig).toHaveProperty('content')
  })

  it('流光卡配置含全部字段（含 qrText，留空不显示二维码）', () => {
    expect(configs.glowConfig).toHaveProperty('title')
    expect(configs.glowConfig).toHaveProperty('date')
    expect(configs.glowConfig).toHaveProperty('content')
    expect(configs.glowConfig).toHaveProperty('sign')
    expect(configs.glowConfig).toHaveProperty('qrText')
    expect(typeof configs.glowConfig.qrText).toBe('string')
  })

  it('流线渐变卡配置复刻参考图文案', () => {
    expect(configs.waveConfig).toEqual({
      title: 'Lorem Ipsum',
      content: 'is simply dummy text\nof the printing and\ntypesetting industry',
    })
  })

  it('默认值映射与输入字段描述覆盖全部模板', () => {
    const ids = TEMPLATES.map((template) => template.id)
    expect(Object.keys(configs.TEMPLATE_DEFAULTS)).toEqual(ids)
    expect(Object.keys(configs.TEMPLATE_EDITOR_ROWS)).toEqual(ids)

    for (const id of ids) {
      const fieldKeys = configs.TEMPLATE_EDITOR_ROWS[id]
        .flat()
        .map((field) => field.key)
        .sort()
      expect(fieldKeys).toEqual(Object.keys(configs.TEMPLATE_DEFAULTS[id]).sort())
    }
  })

  it('创建草稿时逐模板合并存量且不共享对象', () => {
    const drafts = configs.createDefaultDrafts({ wave: { title: '已改标题' } })
    expect(drafts.wave.title).toBe('已改标题')
    expect(drafts.wave.content).toBe(configs.waveConfig.content)
    expect(drafts.ticket).not.toBe(configs.ticketConfig)
    expect(drafts.glow).not.toBe(configs.glowConfig)
  })
})
