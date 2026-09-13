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

  it('深色要点卡的 painter 注册项（卡面比页面底色亮一档，与流光卡同宽 480）', () => {
    expect(painter.getPainterSpec('digest')).toEqual({
      width: 480,
      pageBg: '#171717',
    })
  })
})

describe('正文换行的英文整词保护', () => {
  // 等宽假 ctx：每个字符 10px。这里只验断行点，不涉及真实字体度量。
  const mono = { measureText: (t) => ({ width: [...String(t)].length * 10 }) }

  it('断行点落在英文单词中间时，整个单词挪到下一行', () => {
    // 「hello world」宽 110，限宽 70 时逐字符会断成「hello w / orld」；
    // 整词保护必须给出「hello / world」（尾随空格留在上一行，续行行首由 trimLead 收拾）。
    // 组件端由 CSS 排版，浏览器对英文天然按词断行，两侧必须落在同一个断行点。
    expect(painter.wrapPlain(mono, 'hello world', 70, 70)).toEqual(['hello ', 'world'])
  })

  it('单词本身比一行还宽时只能硬断，且不丢字', () => {
    const rows = painter.wrapPlain(mono, 'abcdefghijkl', 50, 50)
    expect(rows.join('')).toBe('abcdefghijkl')
    expect(rows.every((r) => [...r].length <= 5)).toBe(true)
  })

  it('中文逐字符断行不受影响', () => {
    expect(painter.wrapPlain(mono, '一二三四五', 30, 30)).toEqual(['一二三', '四五'])
  })

  it('首行可用宽度更窄时只在首行生效，续行用满整宽', () => {
    // 60px 的文本在「首行 30 / 续行 80」下必须折成两行
    expect(painter.wrapPlain(mono, 'abcdef', 30, 80)).toEqual(['abc', 'def'])
  })
})
