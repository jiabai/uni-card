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

const SCALE = 2 // 高清倍率
const PAGE_PAD = 24 // 导出图四周留边（页面背景色）

/* ---------- 装饰资产 ---------- */
const ASSETS = {
  scribble: '/static/ticket-scribble.png',
  barcode: '/static/ticket-barcode.png',
  waveBg: '/static/wave-card-bg.png',
  // 流光卡片自行车图标：内联 base64，走 canvas.createImage(dataURL) 直载，
  // 规避小程序 uni.getImageInfo 本地路径在部分机型/基础库下静默失败 → 自行车消失。
  icon: GLOW_BICYCLE_ICON,
}

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i

/**
 * 把「包内相对路径」还原成小程序根绝对路径。
 *
 * 实测（开发者工具 3.16.2）：
 *   wx.getImageInfo({ src: '/static/wave-card-bg.png' })
 *     → res.path === 'static/wave-card-bg.png'   ← 前导斜杠被去掉
 * 这个相对路径交给 canvas 2d 的 Image 会按「当前页面目录」解析：
 *   pages/edit/static/wave-card-bg.png → 请求 404/500 → 图片加载失败。
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

/* ---------- CJK 逐字符换行；返回行与 label 覆盖字符数 ---------- */
function wrapRich(ctx, text, maxWidth) {
  const lines = []
  let line = ''
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line += ch
    }
  }
  if (line) lines.push(line)
  return lines
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

  // 元数据三行
  const meta = [
    ['DATE', String(fields.date || '')],
    ['BY', String(fields.author || '')],
    ['TOTAL', `${fields.totalMemos} MEMOS · ${fields.totalDays} DAYS`],
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
    for (const line of item.lines) {
      const boldPart = item.labelLen > 0 ? line.slice(0, item.labelLen) : ''
      const rest = item.labelLen > 0 ? line.slice(item.labelLen) : line
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

/* ---------- 流线渐变卡 ---------- */

const WAVE = {
  w: 480,
  minH: 896,
  bg: '#f66b61',
  pageBg: '#f66b61',
  frameX: 45,
  frameY: 332,
  frameW: 390,
  frameMinH: 226,
  frameBottom: 338,
  framePadX: 22,
  framePadY: 30,
  frameRadius: 18,
  frameLine: 4,
  titleSize: 38,
  titleLH: 46,
  bodySize: 31,
  bodyLH: 32,
  titleBodyGap: 2,
  textOffsetY: -6,
}

const WAVE_FONT = 'Georgia, "Times New Roman", "Songti SC", serif'

function waveTextLines(ctx, text, maxWidth) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => wrapRich(ctx, line, maxWidth))
}

export function measureWaveLayout(ctx, fields) {
  const textWidth = WAVE.frameW - WAVE.framePadX * 2
  setFont(ctx, 700, WAVE.titleSize, WAVE_FONT)
  const titleLines = waveTextLines(ctx, fields.title, textWidth)
  setFont(ctx, 400, WAVE.bodySize, WAVE_FONT)
  const contentLines = waveTextLines(ctx, fields.content, textWidth)
  const blockHeight =
    titleLines.length * WAVE.titleLH +
    (titleLines.length && contentLines.length ? WAVE.titleBodyGap : 0) +
    contentLines.length * WAVE.bodyLH
  const frameHeight = Math.max(WAVE.frameMinH, blockHeight + WAVE.framePadY * 2)
  const height = Math.max(WAVE.minH, WAVE.frameY + frameHeight + WAVE.frameBottom)
  return {
    width: WAVE.w,
    height,
    frameX: WAVE.frameX,
    frameY: WAVE.frameY,
    frameWidth: WAVE.frameW,
    frameHeight,
    blockHeight,
    titleLines,
    contentLines,
  }
}

function paintWave(ctx, fields, imgs, draw) {
  const layout = measureWaveLayout(ctx, fields)
  if (!draw) return layout.height

  ctx.fillStyle = WAVE.bg
  ctx.fillRect(0, 0, WAVE.w, layout.height)
  if (imgs.waveBg) {
    ctx.drawImage(imgs.waveBg, 0, 0, WAVE.w, layout.height)
  }

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 250, 240, 0.96)'
  ctx.lineWidth = WAVE.frameLine
  roundRect(
    ctx,
    layout.frameX,
    layout.frameY,
    layout.frameWidth,
    layout.frameHeight,
    WAVE.frameRadius
  )
  ctx.stroke()
  ctx.restore()

  const blockTop =
    layout.frameY + (layout.frameHeight - layout.blockHeight) / 2 + WAVE.textOffsetY
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#fffaf0'

  setFont(ctx, 700, WAVE.titleSize, WAVE_FONT)
  let y = blockTop
  for (const line of layout.titleLines) {
    ctx.fillText(line, WAVE.w / 2, y + WAVE.titleSize)
    y += WAVE.titleLH
  }

  if (layout.titleLines.length && layout.contentLines.length) y += WAVE.titleBodyGap
  setFont(ctx, 400, WAVE.bodySize, WAVE_FONT)
  for (const line of layout.contentLines) {
    ctx.fillText(line, WAVE.w / 2, y + WAVE.bodySize)
    y += WAVE.bodyLH
  }
  ctx.textAlign = 'left'
  return layout.height
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
  wave: {
    width: WAVE.w,
    pageBg: WAVE.pageBg,
    // 流线背景是满版渐变；纯色留边会在静态 PNG 上形成矩形边框。
    pagePad: 0,
    painter: paintWave,
    assets: ['waveBg'],
    requiredAssets: ['waveBg'],
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
