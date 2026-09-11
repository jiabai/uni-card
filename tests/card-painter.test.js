import { describe, it, expect } from 'vitest'
import * as painter from '../src/lib/card-painter.js'

describe('包内图片路径还原', () => {
  it('开发者工具返回的页面 static 路径 → 项目根绝对路径', () => {
    expect(painter.normalizeImageInfoPath).toBeTypeOf('function')
    expect(
      painter.normalizeImageInfoPath('/pages/edit/static/ticket-scribble.png')
    ).toBe('/static/ticket-scribble.png')
    expect(
      painter.normalizeImageInfoPath('pages/edit/static/ticket-scribble.png')
    ).toBe('/static/ticket-scribble.png')
  })

  // 开发者工具实测：getImageInfo 返回值会被去掉前导斜杠
  // 缺了前导斜杠会被 canvas 2d 按当前页面目录解析 → 请求 404/500 → 图片加载失败
  it('getImageInfo 去掉前导斜杠的 static 路径补回根绝对路径', () => {
    expect(painter.normalizeImageInfoPath('static/ticket-scribble.png')).toBe(
      '/static/ticket-scribble.png'
    )
  })

  it('真机临时文件路径与正常根路径保持不变', () => {
    expect(painter.normalizeImageInfoPath('/static/ticket-scribble.png')).toBe(
      '/static/ticket-scribble.png'
    )
    expect(painter.normalizeImageInfoPath('wxfile://tmp_1a2b3c.png')).toBe(
      'wxfile://tmp_1a2b3c.png'
    )
    expect(painter.normalizeImageInfoPath('')).toBe('')
  })

  it('票根卡与流光卡的 painter 注册项', () => {
    expect(painter.getPainterSpec).toBeTypeOf('function')
    expect(painter.getPainterSpec('ticket')).toEqual({
      width: 520,
      pageBg: '#e6e1d3',
    })
    expect(painter.getPainterSpec('glow')).toEqual({
      width: 480,
      pageBg: '#1a1a1c',
    })
  })

  it('醒目大字卡的 painter 注册项（橙底，与流光卡同宽 480）', () => {
    expect(painter.getPainterSpec('punch')).toEqual({
      width: 480,
      pageBg: '#feab75',
    })
  })
})
