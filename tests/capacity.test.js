import { describe, it, expect } from 'vitest'
import {
  PUNCH_MAX_LINES,
  estimatePunchLines,
  getPunchCapacity,
  getCapacity,
} from '../src/lib/capacity.js'
import { P, SCALE, CANVAS_MAX } from '../src/lib/card-painter.js'

/**
 * 这些数字不是拍脑袋定的：上限来自导出画布 4096 物理像素的硬顶，
 * 与 paintCard 里的 overflow 判定同源。改动字号 / 行高 / 留边会连带改变它，
 * 届时这几个用例会失败，提醒你重新核对真实容量。
 */
describe('大字卡容量上限', () => {
  it('上限 19 行：卡面逻辑高 2010 除以行高 85 取整', () => {
    const maxCardH = CANVAS_MAX / SCALE - P.pagePad * 2
    expect(maxCardH).toBe(2010)
    expect(PUNCH_MAX_LINES).toBe(19)
  })

  it('容量数字与绘制器常量同源（不是抄来的另一份）', () => {
    expect(P.size).toBe(58)
    expect(P.lineHeight).toBe(85)
    expect(PUNCH_MAX_LINES).toBe(Math.floor((CANVAS_MAX / SCALE - P.pagePad * 2 - P.padY * 2) / P.lineHeight))
  })
})

describe('视觉行数估算', () => {
  it('一行最多 6 个汉字，第 7 个折行', () => {
    expect(estimatePunchLines('一二三四五六')).toBe(1)
    expect(estimatePunchLines('一二三四五六七')).toBe(2)
  })

  it('高亮标记 ** 只改颜色不占宽度', () => {
    expect(estimatePunchLines('把想说的话')).toBe(estimatePunchLines('**把想说的话**'))
  })

  it('英文比汉字窄，一行放得下 12 个字母', () => {
    expect(estimatePunchLines('abcdefghijkl')).toBe(1)
    expect(estimatePunchLines('abcdefghijklm')).toBe(2)
  })

  it('手敲的换行按段计，纯空行不占行（与 wrapPunch 空段返回空数组一致）', () => {
    expect(estimatePunchLines('一\n二\n三')).toBe(3)
    expect(estimatePunchLines('一\n\n二')).toBe(2)
    expect(estimatePunchLines('')).toBe(0)
  })

  it('默认示例 4 行，离上限还远', () => {
    expect(estimatePunchLines('把想说的话\n**变成一张**\n好看的卡片\n发出去吧')).toBe(4)
  })
})

describe('容量提示', () => {
  it('19 行刚好用满，20 行开始超限', () => {
    const line = '一二三四五六'
    const at19 = getPunchCapacity(Array(19).fill(line).join('\n'))
    const at20 = getPunchCapacity(Array(20).fill(line).join('\n'))
    expect(at19.lines).toBe(19)
    expect(at19.remain).toBe(0)
    expect(at19.over).toBe(false)
    expect(at20.over).toBe(true)
    expect(at20.remain).toBe(-1)
  })

  it('114 个汉字是纯汉字口径的实际天花板', () => {
    const chars = '一'.repeat(114)
    expect(getPunchCapacity(chars).over).toBe(false)
    expect(getPunchCapacity(chars + '一').over).toBe(true)
  })

  it('只给大字卡提示，其余模板不显示计数', () => {
    expect(getCapacity('punch', '一二三四五六')).not.toBeNull()
    expect(getCapacity('ticket', '一二三四五六')).toBeNull()
    expect(getCapacity('glow', '一二三四五六')).toBeNull()
    expect(getCapacity('digest', '一二三四五六')).toBeNull()
  })
})
