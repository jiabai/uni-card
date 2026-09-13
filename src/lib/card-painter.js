/**
 * 卡片导出绘制器（canvas 2d）
 *
 * 与组件 H5 版 px 尺寸基准完全一致（ticket 520 / glow 480），整体 ×2 输出高清。
 * 绘制逻辑平台无关：canvas 2d 上下文由调用方提供（MP 节点画布 / H5 离屏画布），
 * 因此视觉一致性可在 H5 直接回归。
 *
 * 两遍绘制：先 measure 出内容高度，再设画布尺寸落笔（canvas 改尺寸会清空，无碍）。
 */
import { qrTextToDataURL } from './qr-png.js'
import { GLOW_BICYCLE_ICON } from './glow-icon.js'
import { parseHighlightLines } from './highlight.js'
import { parseDigestLines } from './digest.js'
import { DIGEST_BOOK_ICON } from './digest-icon.js'

const SCALE = 2 // 高清倍率
const PAGE_PAD = 24 // 导出图四周留边（页面背景色）

/* ---------- 装饰资产 ---------- */
const ASSETS = {
  scribble: '/static/ticket-scribble.png',
  barcode: '/static/ticket-barcode.png',
  // 流光卡片自行车图标：内联 base64，走 canvas.createImage(dataURL) 直载，
  // 规避小程序 uni.getImageInfo 本地路径在部分机型/基础库下静默失败 → 自行车消失。
  icon: GLOW_BICYCLE_ICON,
  // 深色要点卡书本图标：与流光卡同一条加载路径（内联 base64 → createImage 直载）
  book: DIGEST_BOOK_ICON,
}

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i

/**
 * 把「包内相对路径」还原成小程序根绝对路径。
 *
 * 实测（开发者工具 3.16.2）：
 *   wx.getImageInfo({ src: '/static/ticket-scribble.png' })
 *     → res.path === 'static/ticket-scribble.png'   ← 前导斜杠被去掉
 * 这个相对路径交给 canvas 2d 的 Image 会按「当前页面目录」解析：
 *   pages/edit/static/ticket-scribble.png → 请求 404/500 → 图片加载失败。
 * 真机返回的临时路径（wxfile:// 等）不含 static 段，会原样返回。
 */
export function normalizeImageInfoPath(path) {
  if (typeof path !== 'string' || !path) return path
  const staticIndex = path.indexOf('static/')
  if (staticIndex === -1) return path
  if (path.startsWith('/pages/')) return path.slice(staticIndex - 1) // /pages/x/static/y.png
  if (path.startsWith('/') || SCHEME_RE.test(path)) return path // 已是根绝对路径 / 临时文件路径
  if (staticIndex === 0) return '/' + path // static/y.png（开发者工具返回值）
  if (path[staticIndex - 1] === '/') return path.slice(staticIndex - 1) // pages/x/static/y.png
  return path
}

function createCanvasImage(canvas, src) {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e || new Error('image load failed'))
    img.src = src
  })
}

function loadImage(canvas, src) {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    // base64 / dataURL 可直接被 canvas 2d createImage 加载
    if (src && src.startsWith('data:')) {
      createCanvasImage(canvas, src).then(resolve, reject)
      return
    }
    // 先用包内根绝对路径（/static/...）直接喂 canvas 2d：
    // 开发者工具与新版基础库可直载，且不会触发上面那条被裁掉斜杠的 getImageInfo 路径。
    // 真机上包内路径直载会失败，届时再退回 getImageInfo 转换后的本地路径。
    createCanvasImage(canvas, src).then(resolve, () => {
      uni.getImageInfo({
        src,
        success: (res) => {
          createCanvasImage(canvas, normalizeImageInfoPath((res && res.path) || src)).then(
            resolve,
            reject
          )
        },
        fail: reject,
      })
    })
    // #endif
    // #ifndef MP-WEIXIN
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e || new Error('image load failed'))
    img.src = src
    // #endif
  })
}

/**
 * 纯文本换行：CJK 逐字符，ASCII 字母数字整体保护（不在单词中间断开）。
 *
 * 组件端由 CSS 排版，浏览器与小程序对英文天然按词断行、绝不切开单词；
 * 绘制器若逐字符断行，导出图就会与预览在断行点上分叉（长单词被切成两半），
 * 这是用户可见的缺陷而不是风格差异。整词回退逻辑与 wrapPunch 保持同一套。
 *
 * firstW 用于「首行比后续行窄」的场景（加粗小标题与正文同处一行）。
 */
export function wrapPlain(ctx, text, firstW, restW) {
  const chars = [...String(text)].map((ch) => ({ ch, w: ctx.measureText(ch).width }))
  const lines = []
  let cur = []
  let width = 0
  let limit = firstW
  for (const item of chars) {
    if (cur.length && width + item.w > limit) {
      let cut = cur.length
      if (ASCII_ALNUM.test(item.ch)) {
        while (cut > 0 && ASCII_ALNUM.test(cur[cut - 1].ch)) cut--
      }
      if (cut === 0) cut = cur.length // 单个超长单词：只能硬断
      lines.push(cur.slice(0, cut).map((c) => c.ch).join(''))
      cur = cur.slice(cut)
      width = cur.reduce((sum, c) => sum + c.w, 0)
      limit = restW
    }
    cur.push(item)
    width += item.w
  }
  if (cur.length) lines.push(cur.map((c) => c.ch).join(''))
  return lines.length ? lines : ['']
}

/* ---------- CJK 逐字符换行（保留空文本 → 空数组的旧语义）；返回行与 label 覆盖字符数 ---------- */
function wrapRich(ctx, text, maxWidth) {
  if (!text) return []
  return wrapPlain(ctx, text, maxWidth, maxWidth)
}

function setFont(ctx, weight, size, family) {
  ctx.font = `${weight} ${size}px ${family || '-apple-system, "Hiragino Sans", "PingFang SC", "Microsoft YaHei", sans-serif'}`
  // 复位字距：glow 卡会临时设置 letterSpacing，必须在此清零，避免泄漏到票根卡
  try {
    ctx.letterSpacing = '0px'
  } catch (e) {
    /* 旧版基础库不支持 letterSpacing，忽略 */
  }
}

/* glow 卡专用：在 setFont 基础上叠加字距（与组件 CSS 的 letter-spacing 对齐） */
function glowFont(ctx, weight, size, em) {
  ctx.font = `${weight} ${size}px -apple-system, "Hiragino Sans", "PingFang SC", "Microsoft YaHei", sans-serif`
  try {
    ctx.letterSpacing = (size * (em || 0)).toFixed(2) + 'px'
  } catch (e) {
    /* 旧版基础库不支持 letterSpacing，忽略 */
  }
}

function dashedLine(ctx, x1, y, x2, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([8, 8])
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
  ctx.restore()
}

/* ---------- 票根便签卡 ---------- */

const T = {
  w: 520, padX: 44, padTop: 56, padBottom: 44,
  bg: '#f2efe5', pageBg: '#e6e1d3',
  brandSize: 52, brandMB: 18, dividerMB: 44,
  paraSize: 24, paraLH: 42, paraGap: 38, bodyMB: 56,
  metaSize: 24, metaPad: 10, metaGap: 4, metaMB: 30,
  scribbleW: 0.94, scribbleH: 28, scribbleMB: 40,
  barcodeW: 340, barcodeH: 80, barcodeMB: 16,
  perfGap: 30, perfR: 9,
}

function ticketParas(content) {
  return String(content || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      let idx = raw.indexOf('：')
      if (idx === -1) idx = raw.indexOf(':')
      if (idx === -1) return { label: '', text: raw }
      return { label: raw.slice(0, idx).trim(), text: raw.slice(idx + 1).trim() }
    })
}

function paintTicket(ctx, fields, imgs, draw) {
  const contentW = T.w - T.padX * 2
  let y = T.padTop

  // 品牌头「· ticket ·」
  setFont(ctx, 900, T.brandSize)
  if (draw) {
    ctx.fillStyle = '#1a1a1a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('· ticket ·', T.w / 2, y + T.brandSize)
    ctx.textAlign = 'left'
  }
  y += T.brandSize + T.brandMB

  // 品牌下虚线
  if (draw) dashedLine(ctx, T.padX, y, T.w - T.padX, '#b9b2a2')
  y += T.dividerMB

  // 正文段落（label 加粗流式排布）
  const paras = ticketParas(fields.content)
  const laid = []
  for (const p of paras) {
    const full = p.label ? `${p.label}：${p.text}` : p.text
    setFont(ctx, 400, T.paraSize)
    const lines = wrapRich(ctx, full, contentW)
    laid.push({ lines, labelLen: p.label ? p.label.length + 1 : 0 })
    y += lines.length * T.paraLH + T.paraGap
  }
  y += T.bodyMB - T.paraGap

  // 元数据两行：DATE / BY
  const meta = [
    ['DATE', String(fields.date || '')],
    ['BY', String(fields.author || '')],
  ]
  const metaRows = []
  for (const [k, v] of meta) {
    setFont(ctx, 800, T.metaSize)
    const kw = ctx.measureText(k).width
    setFont(ctx, 600, T.metaSize)
    const vw = ctx.measureText(v).width
    metaRows.push({ k, v, kw, vw })
    y += T.metaSize + T.metaPad * 2 + T.metaGap
  }
  y += T.metaMB - T.metaGap

  // 涂鸦 + 条形码
  y += T.scribbleH + T.scribbleMB
  y += T.barcodeH + T.barcodeMB + T.padBottom

  const height = y
  if (!draw) return height

  // ---- 落笔 ----
  ctx.fillStyle = T.bg
  ctx.fillRect(0, 0, T.w, height)

  let cy = T.padTop
  setFont(ctx, 900, T.brandSize)
  ctx.fillStyle = '#1a1a1a'
  ctx.textAlign = 'center'
  ctx.fillText('· ticket ·', T.w / 2, cy + T.brandSize)
  ctx.textAlign = 'left'
  cy += T.brandSize + T.brandMB
  dashedLine(ctx, T.padX, cy, T.w - T.padX, '#b9b2a2')
  cy += T.dividerMB

  for (const item of laid) {
    let lineY = cy
    let done = 0
    for (const line of item.lines) {
      // 加粗只覆盖「标签：」在原文中的那一段字符；按行累计偏移，续行不再重复加粗
      // （组件侧同样只有 label 是粗体，两侧必须同口径，否则预览与导出不一致）。
      const boldN = Math.min(Math.max(item.labelLen - done, 0), line.length)
      const boldPart = boldN > 0 ? line.slice(0, boldN) : ''
      const rest = boldN > 0 ? line.slice(boldN) : line
      done += line.length
      let x = T.padX
      if (boldPart) {
        setFont(ctx, 700, T.paraSize)
        ctx.fillStyle = '#1a1a1a'
        ctx.fillText(boldPart, x, lineY + T.paraSize)
        x += ctx.measureText(boldPart).width
      }
      setFont(ctx, 400, T.paraSize)
      ctx.fillStyle = '#262626'
      ctx.fillText(rest, x, lineY + T.paraSize)
      lineY += T.paraLH
    }
    cy += item.lines.length * T.paraLH + T.paraGap
  }
  cy += T.bodyMB - T.paraGap

  for (const row of metaRows) {
    setFont(ctx, 800, T.metaSize)
    ctx.fillStyle = '#2a2a2a'
    ctx.fillText(row.k, T.padX, cy + T.metaSize)
    const vx = T.w - T.padX - row.vw
    setFont(ctx, 600, T.metaSize)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillText(row.v, vx, cy + T.metaSize)
    dashedLine(ctx, T.padX + row.kw + 10, cy + T.metaSize - 4, vx - 10, '#b9b2a2')
    cy += T.metaSize + T.metaPad * 2 + T.metaGap
  }
  cy += T.metaMB - T.metaGap

  // 涂鸦分隔线（宽 94%）
  if (imgs.scribble) {
    const sw = contentW * T.scribbleW
    ctx.drawImage(imgs.scribble, (T.w - sw) / 2, cy, sw, T.scribbleH)
  }
  cy += T.scribbleH + T.scribbleMB

  // 条形码
  if (imgs.barcode) {
    ctx.drawImage(imgs.barcode, (T.w - T.barcodeW) / 2, cy, T.barcodeW, T.barcodeH)
  }

  // 打孔毛边：页面背景色半圆覆盖卡片上下边缘
  ctx.fillStyle = T.pageBg
  const n = Math.ceil(T.w / T.perfGap)
  for (let i = 0; i <= n; i++) {
    const cx = i * T.perfGap + T.perfGap / 2
    ctx.beginPath()
    ctx.arc(cx, 0, T.perfR, 0, Math.PI) // 下半圆（顶边缺口）
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, height, T.perfR, Math.PI, Math.PI * 2) // 上半圆（底边缺口）
    ctx.fill()
  }
  return height
}

/* ---------- 流光卡片 ---------- */

const G = {
  w: 480, padX: 36, padTop: 40, padBottom: 32,
  // 导出图留边与卡片必须同色：两者仅差 9/255（#111112 vs #1a1a1c）时，
  // 预览页尚可靠 box-shadow 区分出「卡片浮起」，但导出成静态 PNG 后阴影消失，
  // 这点色差会被 OLED 暗部放大成一条明显的浅灰描边轮廓（用户可见缺陷）。
  // 统一为卡片色后，导出图是一整块干净的深色底，无任何轮廓线。
  bg: '#1a1a1c', pageBg: '#1a1a1c', radius: 18,
  iconR: 26, iconImg: 14, iconMB: 20,
  titleSize: 30, titleMB: 32, dateSize: 17, dateMT: 10, dateColor: '#9e9580',
  paraSize: 23, paraLH: 42.5, paraGap: 28,
  signSize: 19, signPT: 12,
  divMT: 28, divMB: 24,
  qrSize: 96, qrPad: 6,
  footerSize: 22, minH: 660,
}

// 标题 + 日期区块垂直高度：必须与 draw 落笔推进完全一致（titleSize + titleMB + paraGap = 90）。
// 旧实现 measure 漏算这 90px → 内容略长时画布高度少算 90 → 正文压到署名/二维码区。
const G_HEADER = G.titleSize + G.titleMB + G.paraGap

function glowBlocks(content) {
  return String(content || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((b) => ({ text: b, kind: b.includes('💡') ? 'section' : 'paragraph' }))
}

function paintGlow(ctx, fields, imgs, draw) {
  const contentW = G.w - G.padX * 2

  // 底部固定区高：署名 + 分隔线 + footer（取 qr 与文字较大者 96）
  const footerH = Math.max(G.qrSize, G.footerSize)
  const bottomH = G.signPT + G.signSize + G.divMT + 1 + G.divMB + footerH + G.padBottom

  // 内容高度 measure（与 draw 落笔推进完全一致：图标 + 标题日期区块 + 正文）
  let y = G.padTop + G.iconR * 2 + G.iconMB + G_HEADER // 图标 + 标题/日期区块
  const laid = []
  for (const b of glowBlocks(fields.content)) {
    glowFont(ctx, b.kind === 'section' ? 600 : 500, G.paraSize, 0.02)
    const lines = wrapRich(ctx, b.text, contentW)
    laid.push({ ...b, lines })
    y += lines.length * G.paraLH + G.paraGap
  }
  const contentBottom = y - G.paraGap + G.signPT + G.signSize
  const height = Math.max(contentBottom + bottomH - (G.signPT + G.signSize), G.minH)
  if (!draw) return height

  // ---- 落笔 ----
  // 页面背景 + 圆角卡片
  ctx.fillStyle = G.bg
  roundRect(ctx, 0, 0, G.w, height, G.radius)
  ctx.fill()

  let cy = G.padTop
  // 顶部圆形图标底 + 自行车 PNG
  ctx.fillStyle = '#2e2e30'
  ctx.beginPath()
  ctx.arc(G.padX + G.iconR, cy + G.iconR, G.iconR, 0, Math.PI * 2)
  ctx.fill()
  if (imgs.icon) {
    const s = G.iconImg * 2
    ctx.drawImage(imgs.icon, G.padX + G.iconR - G.iconImg, cy + G.iconR - G.iconImg, s, s)
  }
  cy += G.iconR * 2 + G.iconMB

  // 标题 + 日期（字距与组件 CSS 对齐：title 0.02em / date 0.04em）
  ctx.fillStyle = '#f5ecd7'
  glowFont(ctx, 700, G.titleSize, 0.02)
  ctx.fillText(String(fields.title || ''), G.padX, cy + G.titleSize)
  cy += G.titleSize + G.dateMT
  glowFont(ctx, 500, G.dateSize, 0.04)
  ctx.fillStyle = G.dateColor
  ctx.fillText(String(fields.date || ''), G.padX, cy + G.dateSize)
  cy += G.dateSize + G.titleMB - G.dateMT - G.dateSize + G.paraGap

  // 正文块（💡 高亮，字距 0.02em）
  ctx.fillStyle = '#f5ecd7'
  for (const item of laid) {
    glowFont(ctx, item.kind === 'section' ? 600 : 500, G.paraSize, 0.02)
    let lineY = cy
    for (const line of item.lines) {
      ctx.fillText(line, G.padX, lineY + G.paraSize)
      lineY += G.paraLH
    }
    cy += item.lines.length * G.paraLH + G.paraGap
  }

  // 署名（贴向底部区，字距 0.03em）
  const signY = height - bottomH + G.signPT
  glowFont(ctx, 500, G.signSize, 0.03)
  ctx.fillStyle = '#f5ecd7'
  ctx.fillText(String(fields.sign || ''), G.padX, signY + G.signSize)

  // 分隔线
  const divY = signY + G.signSize + G.divMT
  ctx.fillStyle = 'rgba(245, 236, 215, 0.25)'
  ctx.fillRect(G.padX, divY, contentW, 1)

  // footer：名称 + 二维码
  const footerY = divY + G.divMB
  glowFont(ctx, 600, G.footerSize, 0.05)
  ctx.fillStyle = '#f5ecd7'
  ctx.fillText(String(fields.footerLabel || '流れる光カード'), G.padX, footerY + G.footerSize)

  const qrX = G.w - G.padX - G.qrSize
  // 二维码：白底 + 预生成的 base64 PNG 直接 drawImage
  ctx.fillStyle = '#f5ecd7'
  ctx.fillRect(qrX, footerY, G.qrSize, G.qrSize)
  const qrText = String(fields.qrText || '')
  if (qrText && imgs.qr) {
    const inner = G.qrSize - G.qrPad * 2
    ctx.drawImage(imgs.qr, qrX + G.qrPad, footerY + G.qrPad, inner, inner)
  }
  return height
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/* ---------- 醒目大字卡 ---------- */

const P = {
  w: 480, padX: 39, padY: 158, radius: 34, minH: 656,
  // 橙底 → 页面背景；纯黑卡面。两者对比极大，卡边天然清晰，无需靠色差做层次。
  // 不加阴影是刻意的：导出成静态 PNG 后阴影本就不可见，预览若加阴影，
  // 「页面底色与卡片交界」的观感会与导出图不一致（同 glow 留边问题的教训）。
  bg: '#000000', pageBg: '#feab75', pagePad: 19,
  size: 58, weight: 900, lineHeight: 85, color: '#ffffff', hl: '#fe9a64',
}

const ASCII_ALNUM = /[0-9A-Za-z]/

/**
 * 富文本换行：片段数组 → 视觉行数组（每行仍是片段数组）。
 *
 * 高亮只改颜色、不改字宽，因此按纯文本量一次宽度即可，样式在断行之后再合并回来。
 * 与 ticket/glow 的 wrapRich 不同，这里对 ASCII 字母数字做了整体性保护：
 * 断行点落在英文/数字中间时，整段（连续 ASCII 单词）挪到下一行。
 */
function wrapPunch(ctx, segments, maxWidth) {
  const chars = []
  for (const seg of segments) {
    for (const ch of seg.text) chars.push({ ch, hl: seg.hl, w: ctx.measureText(ch).width })
  }

  const lines = []
  let cur = []
  let width = 0

  for (const item of chars) {
    if (cur.length && width + item.w > maxWidth) {
      let cut = cur.length
      if (ASCII_ALNUM.test(item.ch)) {
        while (cut > 0 && ASCII_ALNUM.test(cur[cut - 1].ch)) cut--
      }
      if (cut === 0) cut = cur.length // 单个超长单词：只能硬断
      lines.push(cur.slice(0, cut))
      cur = cur.slice(cut)
      width = cur.reduce((sum, c) => sum + c.w, 0)
    }
    cur.push(item)
    width += item.w
  }
  if (cur.length) lines.push(cur)

  return lines.map(mergeHighlight)
}

/** 相邻同色字符合并回片段，减少一次绘制里的 fillText 调用次数 */
function mergeHighlight(items) {
  const out = []
  for (const item of items) {
    const last = out[out.length - 1]
    if (last && last.hl === item.hl) last.text += item.ch
    else out.push({ text: item.ch, hl: item.hl })
  }
  return out
}

function paintPunch(ctx, fields, imgs, draw) {
  const contentW = P.w - P.padX * 2

  setFont(ctx, P.weight, P.size)
  // flatMap：wrapPunch 返回的是「视觉行 → 片段」两层，一个源行可能折成多个视觉行，
  // 这里必须展平成「视觉行 → 片段」，否则多嵌套一层会让 seg.text 恒为 undefined
  // （真实 canvas 会老老实实画出四个 "undefined"）。
  const laid = parseHighlightLines(fields.content).flatMap((segs) => wrapPunch(ctx, segs, contentW))
  const blockH = laid.length * P.lineHeight
  // 内容少 → 保持 480×656 的固定比例，正文垂直居中；内容多 → 卡片跟着长高
  const height = Math.max(P.minH, blockH + P.padY * 2)
  if (!draw) return height

  // 纯黑圆角卡面
  ctx.fillStyle = P.bg
  roundRect(ctx, 0, 0, P.w, height, P.radius)
  ctx.fill()

  const top = (height - blockH) / 2
  ctx.save()
  // 用 middle 基线做垂直居中：CJK 字面即 em 方框，比手算 alphabetic 偏移更稳
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  setFont(ctx, P.weight, P.size)

  for (let i = 0; i < laid.length; i++) {
    const centerY = top + i * P.lineHeight + P.lineHeight / 2
    let x = P.padX
    for (const seg of laid[i]) {
      ctx.fillStyle = seg.hl ? P.hl : P.color
      ctx.fillText(seg.text, x, centerY)
      x += ctx.measureText(seg.text).width
    }
  }
  ctx.restore()
  return height
}

/* ---------- 深色要点卡 ---------- */

const D = {
  // 全部数值按参考图折算（原图卡片 690 物理 px → 480 逻辑，比例 0.6957）
  w: 480, padX: 40, padTop: 40, padBottom: 73, radius: 21, minH: 540,
  // 卡面比页面底色亮一档（#2a2a2a / #171717，差 19/255），这是参考图的原始设计：
  // 「深灰卡片浮在近黑背景上」，边界清楚可见，不是 glow 那种色差为 0 的融合方案。
  bg: '#2a2a2a', pageBg: '#171717',
  // 图标实测 54×43 物理 px → 37.6×30.6 逻辑，取 38×31；图标底到标题墨迹顶 21 逻辑
  iconW: 38, iconH: 31, iconMB: 15,
  titleSize: 22, titleMB: 21, titleWeight: 800,
  paraSize: 20, paraLH: 26, paraWeight: 400, labelWeight: 700,
  color: '#ffffff',
}

/**
 * 折行后的续行不以空白开头：逐字符折行会把上一行末尾的空格甩到下一行行首，
 * 在卡片上就是一个多余的小缩进。首行不动（小标题后的那个空格要保留）。
 */
function trimLead(rows) {
  return rows.map((row, i) => (i === 0 ? row : row.replace(/^\s+/, '')))
}

/**
 * 首行宽度可窄于后续行：用于「加粗小标题 + 正文」同处一行的折行。
 * 小标题占了首行一截，剩下给正文的空间变小；折过一行之后又能用满整宽。
 */
function wrapFirstNarrow(ctx, text, firstW, restW) {
  // 与 wrapPlain 同一套整词保护逻辑，只是首行可用宽度更窄（小标题先占了首行一截）。
  // wrapPlain 在文本为空时返回 ['']，正好满足「只有小标题也要占一行」的需求。
  return wrapPlain(ctx, text, firstW, restW)
}

/**
 * 正文逐行排布：先折行，落笔阶段复用同一批结果，
 * 保证 measure 与 draw 的推进完全一致（折行数不同会让卡片高对不上）。
 * 小标题按加粗字宽量（真实字体的粗体比常规体宽），避免首行顶出内容宽度。
 */
function digestLayout(ctx, content) {
  const contentW = D.w - D.padX * 2
  return parseDigestLines(content).map((item) => {
    // 空行在卡片上占整整一行高，它就是段落间距
    if (item.blank) return { blank: true }

    if (!item.label) {
      setFont(ctx, D.paraWeight, D.paraSize)
      return { blank: false, label: '', rows: trimLead(wrapRich(ctx, item.text, contentW)) }
    }

    const label = item.label
    setFont(ctx, D.labelWeight, D.paraSize)
    const labelW = ctx.measureText(label).width
    setFont(ctx, D.paraWeight, D.paraSize)
    return {
      blank: false,
      label,
      rows: trimLead(wrapFirstNarrow(ctx, item.text, contentW - labelW, contentW)),
    }
  })
}

function paintDigest(ctx, fields, imgs, draw) {
  const laid = digestLayout(ctx, fields.content)

  const headerH = D.padTop + D.iconH + D.iconMB + D.titleSize + D.titleMB
  const bodyH = laid.reduce((h, it) => h + (it.blank ? D.paraLH : it.rows.length * D.paraLH), 0)
  // 内容少时保持 480x540 的最小比例，内容多时卡片跟着长高
  const height = Math.max(D.minH, headerH + bodyH + D.padBottom)
  if (!draw) return height

  ctx.fillStyle = D.bg
  roundRect(ctx, 0, 0, D.w, height, D.radius)
  ctx.fill()

  let cy = D.padTop
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // 固定图标：内联 PNG 直贴。刻意不用 emoji —— emoji 的字形与配色随系统变化
  // （iOS 是黄书、Windows 是蓝书），无法保证各机型与设计一致。
  if (imgs.book) ctx.drawImage(imgs.book, D.padX, cy, D.iconW, D.iconH)
  // 图片没加载成功也照样推进光标，保证 measure 与 draw 算出的卡片高度一致
  cy += D.iconH + D.iconMB

  setFont(ctx, D.titleWeight, D.titleSize)
  ctx.fillStyle = D.color
  ctx.fillText(String(fields.title || ''), D.padX, cy + D.titleSize)
  cy += D.titleSize + D.titleMB

  ctx.fillStyle = D.color
  for (const item of laid) {
    if (item.blank) {
      cy += D.paraLH
      continue
    }
    let lineY = cy
    for (let i = 0; i < item.rows.length; i++) {
      let x = D.padX
      // 加粗小标题只出现在该段的首行；折行后的续行不能重复加粗
      if (i === 0 && item.label) {
        setFont(ctx, D.labelWeight, D.paraSize)
        ctx.fillText(item.label, x, lineY + D.paraSize)
        x += ctx.measureText(item.label).width
      }
      const row = item.rows[i]
      if (row) {
        setFont(ctx, D.paraWeight, D.paraSize)
        ctx.fillText(row, x, lineY + D.paraSize)
      }
      lineY += D.paraLH
    }
    cy += item.rows.length * D.paraLH
  }
  return height
}

/* ---------- 对外入口 ---------- */

const PAINTERS = {
  ticket: {
    width: T.w,
    pageBg: T.pageBg,
    painter: paintTicket,
    assets: ['scribble', 'barcode'],
    requiredAssets: [],
  },
  glow: {
    width: G.w,
    pageBg: G.pageBg,
    painter: paintGlow,
    assets: ['icon'],
    requiredAssets: [],
  },
  punch: {
    width: P.w,
    pageBg: P.pageBg,
    pagePad: P.pagePad,
    painter: paintPunch,
    assets: [],
    requiredAssets: [],
  },
  digest: {
    width: D.w,
    pageBg: D.pageBg,
    painter: paintDigest,
    assets: ['book'],
    requiredAssets: [],
  },
}

function getPainterEntry(templateId) {
  return PAINTERS[templateId] || PAINTERS.ticket
}

export function getPainterSpec(templateId) {
  const entry = getPainterEntry(templateId)
  return { width: entry.width, pageBg: entry.pageBg }
}

/**
 * 绘制整卡导出图（含页面背景与四周留边）。
 * canvas：2d 上下文画布（MP 节点画布或 H5 离屏画布）。
 * 返回 { width, height }（已 ×2 的物理像素）。
 */
export async function paintCard(canvas, templateId, fields) {
  const imgs = {}
  const entry = getPainterEntry(templateId)

  // 流光卡片：预先把二维码文本转成 base64 PNG 并加载成 image 对象
  if (templateId === 'glow' && fields.qrText) {
    try {
      const inner = G.qrSize - G.qrPad * 2
      imgs.qr = await loadImage(
        canvas,
        qrTextToDataURL(String(fields.qrText), {
          width: inner,
          margin: 0,
          dark: '#2a2a2c',
          light: '#f5ecd7',
        })
      )
    } catch (e) {
      console.error('[card-painter] QR load failed', e)
    }
  }

  await Promise.all(
    entry.assets.map(async (key) => {
      try {
        imgs[key] = await loadImage(canvas, ASSETS[key])
      } catch (error) {
        if (entry.requiredAssets.includes(key)) throw error
      }
    })
  )

  const ctx = canvas.getContext('2d')
  const painter = entry.painter

  // 第一遍：measure（临时大画布尺寸）
  canvas.width = 2048
  canvas.height = 4096
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0) // 逻辑坐标系 ×SCALE 输出
  ctx.textBaseline = 'alphabetic'
  const logicalH = painter(ctx, fields, imgs, false)

  const pagePad = entry.pagePad ?? PAGE_PAD
  const outputWidth = entry.width + pagePad * 2
  const H = logicalH + pagePad * 2
  if (H * SCALE > 4096) return { overflow: true }

  // 第二遍：正式尺寸落笔（重设尺寸清空画布，重置 transform）
  canvas.width = outputWidth * SCALE
  canvas.height = H * SCALE
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  ctx.textBaseline = 'alphabetic'

  // 页面背景
  ctx.fillStyle = entry.pageBg
  ctx.fillRect(0, 0, outputWidth, H)

  // 卡片平移到留边内绘制
  ctx.translate(pagePad, pagePad)
  painter(ctx, fields, imgs, true)

  return { width: canvas.width, height: canvas.height, overflow: false }
}
