import { describe, it, expect } from 'vitest'
import { parseHighlightLines } from '../src/lib/highlight.js'

/** 丢掉高亮标记，还原成纯文本行，用于校验「不丢字、不多字」 */
const plain = (lines) => lines.map((segs) => segs.map((s) => s.text).join(''))

describe('行内高亮解析（醒目大字卡）', () => {
  it('按换行切分并剔除空行', () => {
    expect(plain(parseHighlightLines('第一句\n\n  第二句  \n'))).toEqual(['第一句', '第二句'])
  })

  it('** 包围的片段标记为高亮', () => {
    const [line] = parseHighlightLines('你见过最**没底**线的人')
    expect(line).toEqual([
      { text: '你见过最', hl: false },
      { text: '没底', hl: true },
      { text: '线的人', hl: false },
    ])
  })

  it('一行内可有多段高亮', () => {
    const [line] = parseHighlightLines('**把**想说的话**发出去**')
    expect(line.filter((s) => s.hl).map((s) => s.text)).toEqual(['把', '发出去'])
  })

  it('区间高亮可跨自动换行点（标记内部含标点也不影响）', () => {
    const [line] = parseHighlightLines('最**没底线，也**没有之一')
    expect(line.find((s) => s.hl).text).toBe('没底线，也')
  })

  it('未闭合的 ** 原样保留、不吞字，且不产生高亮', () => {
    const [line] = parseHighlightLines('半开**的标记')
    expect(plain([line])).toEqual(['半开**的标记'])
    expect(line.every((s) => !s.hl)).toBe(true)
  })

  it('除成对标记本身外不丢字、不多字', () => {
    const src = '把想说的话\n**变成一张**\n好看的卡片\n发出去吧'
    const stripped = src.split('\n').map((s) => s.replace(/\*\*/g, ''))
    expect(plain(parseHighlightLines(src))).toEqual(stripped)
  })

  it('空内容不报错', () => {
    expect(parseHighlightLines('')).toEqual([])
    expect(parseHighlightLines(undefined)).toEqual([])
  })
})
