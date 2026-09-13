/**
 * 卡片容量估算：编辑页用来在出图**之前**告诉用户「还能写多少」。
 *
 * 为什么需要它：输入框不设字数上限（maxlength 是十万），卡片会跟着内容一路长高，
 * 但导出画布有单边 4096 物理像素的硬顶，超过就直接失败。若只在出图那一刻才弹
 * 「内容过长」，用户已经写完几百字了，等于白写。
 *
 * 口径：一律复用 card-painter.js 的常量（P / SCALE / CANVAS_MAX），
 * 不在这里重抄一份数字，否则改了字号、行高，提示会静默失准。
 */
import { P, SCALE, CANVAS_MAX } from './card-painter.js'

/**
 * CJK 与全角标点：字面即 em 方框，宽度等于字号。
 * ASCII 取 0.55 em（PingFang 粗体的实测均值，真实字宽是比例字宽，这里只需估算）。
 */
const CJK = /[\u1100-\u11FF\u2E80-\uA4CF\uA960-\uA97F\uAC00-\uD7FF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6\u3000-\u303F]/

const ASCII_EM = 0.55

function charEm(ch) {
  return CJK.test(ch) ? 1 : ASCII_EM
}

/** 一行能装多少个「字号宽」（内容宽 ÷ 字号） */
const LINE_EM = (P.w - P.padX * 2) / P.size

/**
 * 卡片逻辑高上限：画布物理高 CANVAS_MAX，绘制按 SCALE 倍输出，再减去上下留边。
 * 与 paintCard 里的 overflow 判定同源，改了那边这里跟着变。
 */
const MAX_CARD_H = CANVAS_MAX / SCALE - P.pagePad * 2

/** 大字卡能容纳的最大视觉行数（第 max+1 行就会 overflow） */
export const PUNCH_MAX_LINES = Math.floor((MAX_CARD_H - P.padY * 2) / P.lineHeight)

/**
 * 估算内容占几个视觉行：既算用户手敲的换行，也算超宽后的自动折行。
 *
 * 两处刻意与绘制器保持一致：
 * 1. 高亮标记 `**` 只改颜色不改字宽，估算前先剔除；
 * 2. 纯空行在 wrapPunch 里不产生任何行（空段返回空数组），故不计入。
 */
export function estimatePunchLines(content) {
  const src = String(content || '').replace(/\*\*/g, '')
  let total = 0
  for (const line of src.split('\n')) {
    if (!line.length) continue
    let em = 0
    let rows = 1
    for (const ch of line) {
      const w = charEm(ch)
      if (em + w > LINE_EM) {
        rows += 1
        em = w
      } else {
        em += w
      }
    }
    total += rows
  }
  return total
}

/** 大字卡容量现状：lines 已用行数、max 上限、remain 剩余（负数即超限）、over 是否超限 */
export function getPunchCapacity(content) {
  const lines = estimatePunchLines(content)
  const remain = PUNCH_MAX_LINES - lines
  return { lines, max: PUNCH_MAX_LINES, remain, over: remain < 0 }
}

/**
 * 按模板取容量。目前只有大字卡需要：它的字号最大（58），一行只放得下 6 个汉字，
 * 是最容易写超的一个。其余模板返回 null，编辑页不显示计数。
 */
export function getCapacity(templateId, content) {
  if (templateId === 'punch') return getPunchCapacity(content)
  return null
}
