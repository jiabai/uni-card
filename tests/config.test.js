import { describe, it, expect } from 'vitest'
import { ticketConfig, glowConfig } from '../src/config.js'

describe('各模板默认内容配置（出厂示例）', () => {
  it('票根卡配置含全部字段', () => {
    expect(ticketConfig).toHaveProperty('date')
    expect(ticketConfig).toHaveProperty('author')
    expect(ticketConfig).toHaveProperty('totalMemos')
    expect(ticketConfig).toHaveProperty('totalDays')
    expect(ticketConfig).toHaveProperty('content')
  })

  it('流光卡配置含全部字段（含 qrText，留空不显示二维码）', () => {
    expect(glowConfig).toHaveProperty('title')
    expect(glowConfig).toHaveProperty('date')
    expect(glowConfig).toHaveProperty('content')
    expect(glowConfig).toHaveProperty('sign')
    expect(glowConfig).toHaveProperty('qrText')
    expect(typeof glowConfig.qrText).toBe('string')
  })
})
