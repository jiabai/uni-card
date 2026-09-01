import { describe, it, expect } from 'vitest'
import * as painter from '../src/lib/card-painter.js'
import { waveConfig } from '../src/config.js'

const measureCtx = {
  measureText(text) {
    // 29px Georgia 的默认英文样例平均字宽约 14px；测试桩需保持该量级，
    // 才能验证参考图中的显式三行，而不是制造不存在的额外换行。
    return { width: String(text).length * 14 }
  },
}

describe('流线渐变卡 painter', () => {
  it('注册 wave painter 的逻辑宽度与页面底色', () => {
    expect(painter.getPainterSpec).toBeTypeOf('function')
    expect(painter.getPainterSpec('wave')).toEqual({
      width: 480,
      pageBg: '#f66b61',
    })
  })

  it('默认文案保持 480×896 构图和三行正文', () => {
    expect(painter.measureWaveLayout).toBeTypeOf('function')
    expect(painter.measureWaveLayout(measureCtx, waveConfig)).toMatchObject({
      width: 480,
      height: 896,
      frameX: 47,
      frameY: 334,
      frameWidth: 386,
      frameHeight: 224,
      titleLines: ['Lorem Ipsum'],
      contentLines: [
        'is simply dummy text',
        'of the printing and',
        'typesetting industry',
      ],
    })
  })

  it('长正文扩展内容框和卡片高度而不裁切', () => {
    const fields = {
      title: 'Lorem Ipsum',
      content: Array.from({ length: 16 }, (_, index) => `line ${index + 1}`).join('\n'),
    }
    const layout = painter.measureWaveLayout(measureCtx, fields)
    expect(layout.contentLines).toHaveLength(16)
    expect(layout.frameHeight).toBeGreaterThan(224)
    expect(layout.height).toBeGreaterThan(896)
  })
})
