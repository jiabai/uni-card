import { describe, it, expect } from 'vitest'
import { parseDigestLines } from '../src/lib/digest.js'
import { DIGEST_BOOK_ICON } from '../src/lib/digest-icon.js'

describe('深色要点卡的固定图标', () => {
  it('是内联的 PNG data URL，而不是 emoji 字符', () => {
    // emoji 的字形与配色随系统变化（iOS 是黄书、Windows 是蓝书），无法与设计保持一致，
    // 因此图标改为内联 base64 PNG，组件与绘制器共用同一份资产。
    expect(DIGEST_BOOK_ICON.startsWith('data:image/png;base64,')).toBe(true)
    // 校验 PNG 文件头魔数，防止 base64 被截断或改坏后静默变成一块空白
    const raw = Buffer.from(DIGEST_BOOK_ICON.split(',')[1], 'base64')
    expect([...raw.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  })
})

describe('深色要点卡的正文解析', () => {

  it('空行原样保留（它是段落间距），首尾空行裁掉', () => {
    const lines = parseDigestLines('\n甲：一\n\n乙：二\n\n\n')
    expect(lines.map((l) => l.blank)).toEqual([false, true, false])
    expect(lines.length).toBe(3)
  })

  it('冒号前的文字为加粗小标题，冒号本身照原样保留', () => {
    expect(parseDigestLines('Research and Publishing: Enrich')).toEqual([
      { blank: false, label: 'Research and Publishing:', text: ' Enrich' },
    ])
    expect(parseDigestLines('名称：内容')).toEqual([
      { blank: false, label: '名称：', text: '内容' },
    ])
  })

  it('冒号后的空白折叠成一个空格，没有空白时不动', () => {
    expect(parseDigestLines('甲:   乙')[0].text).toBe(' 乙')
    expect(parseDigestLines('甲：乙')[0].text).toBe('乙')
  })

  it('小标题后面没有正文时，正文为空串（小标题仍要画出来）', () => {
    expect(parseDigestLines('Educational Materials:')).toEqual([
      { blank: false, label: 'Educational Materials:', text: '' },
    ])
  })

  it('冒号在行首时整行按正文处理，不吞字符', () => {
    expect(parseDigestLines(': 只有正文')).toEqual([
      { blank: false, label: '', text: ': 只有正文' },
    ])
  })

  it('没有冒号的行整体是正文', () => {
    expect(parseDigestLines('一整句没有冒号的话')).toEqual([
      { blank: false, label: '', text: '一整句没有冒号的话' },
    ])
  })

  it('同时出现两种冒号时优先取全角「：」（与票根卡同一约定）', () => {
    expect(parseDigestLines('甲：乙: 丙')[0]).toEqual({
      blank: false,
      label: '甲：',
      text: '乙: 丙',
    })
    expect(parseDigestLines('甲: 乙：丙')[0]).toEqual({
      blank: false,
      label: '甲: 乙：',
      text: '丙',
    })
  })

  it('空内容与纯空白内容都得到空数组', () => {
    expect(parseDigestLines('')).toEqual([])
    expect(parseDigestLines('   \n\n  ')).toEqual([])
    expect(parseDigestLines(undefined)).toEqual([])
  })
})
