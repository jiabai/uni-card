import { describe, it, expect } from 'vitest'
import * as configs from '../src/config.js'
import { TEMPLATES } from '../src/lib/templates.js'

describe('各模板默认内容配置（出厂示例）', () => {
  it('票根卡配置仅含正文、DATE 和 BY', () => {
    expect(configs.ticketConfig).toHaveProperty('date')
    expect(configs.ticketConfig).toHaveProperty('author')
    expect(Object.keys(configs.ticketConfig).sort()).toEqual(['author', 'content', 'date'])
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

  it('深色要点卡配置为标题 + 正文两个字段，正文用空行分段', () => {
    expect(configs.digestConfig).toHaveProperty('title')
    expect(configs.digestConfig).toHaveProperty('content')
    expect(Object.keys(configs.digestConfig).sort()).toEqual(['content', 'title'])
    // 空行是段落间距的来源，出厂示例必须带上，否则用户看不出这个写法
    expect(configs.digestConfig.content).toContain('\n\n')
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
    const drafts = configs.createDefaultDrafts({ glow: { title: '已改标题' } })
    expect(drafts.glow.title).toBe('已改标题')
    expect(drafts.glow.content).toBe(configs.glowConfig.content)
    expect(drafts.ticket).not.toBe(configs.ticketConfig)
    expect(drafts.glow).not.toBe(configs.glowConfig)
  })
})
