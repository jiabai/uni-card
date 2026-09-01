/**
 * 纯 JS 二维码 PNG 生成器（不依赖 canvas / document / Buffer / TextEncoder）。
 *
 * 输出 data:image/png;base64,...，可直接用于 <image src="..." />，
 * 也能被 canvas 2d createImage() 加载后 drawImage，彻底规避小程序
 * canvas 2d 在 transform 容器、真机导出、临时文件等场景下的不稳定问题。
 *
 * 依赖：
 * - qrcode/lib/core/qrcode.js   生成 QR 矩阵
 * - qrcode/lib/renderer/utils.js 把矩阵转成 RGBA 像素数据
 *
 * 兼容性要点（真机踩坑）：
 * - iOS 微信真机的 JSCore **不提供全局 TextEncoder**，而 qrcode 的
 *   byte-data.js 会 `new TextEncoder().encode(str)` 且无兜底，直接抛
 *   "Can't find variable: TextEncoder"，导致二维码空白。
 *   因此这里自行做 UTF-8 编码，并以字节数组 + Mode.BYTE 的 segment 形式
 *   调用 create()，让 ByteData 走 `new Uint8Array(data)` 分支绕开该依赖。
 * - 同理，JSCore 也不保证提供 btoa()，base64 编码自行实现。
 */
import qrcodeCore from 'qrcode/lib/core/qrcode.js'
import QrMode from 'qrcode/lib/core/mode.js'
import qrUtils from 'qrcode/lib/renderer/utils.js'
import pako from 'pako'

/* ---------- UTF-8 编码（纯 JS，不依赖 TextEncoder） ---------- */
function utf8Encode(str) {
  const out = []
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code < 0x80) {
      out.push(code)
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      // 代理对：合成补充平面码点（emoji、部分生僻字）
      const next = str.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        const cp = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00)
        i++
        out.push(
          0xf0 | (cp >> 18),
          0x80 | ((cp >> 12) & 0x3f),
          0x80 | ((cp >> 6) & 0x3f),
          0x80 | (cp & 0x3f)
        )
        continue
      }
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    } else {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
  }
  return new Uint8Array(out)
}

/* ---------- CRC32（PNG chunk 校验） ---------- */
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return c >>> 0
})

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

/* ---------- PNG chunk ---------- */
function writeChunk(type, data) {
  const typeBytes = stringToBytes(type)
  const len = data.length
  const buf = new Uint8Array(4 + 4 + len + 4)
  const dv = new DataView(buf.buffer)
  dv.setUint32(0, len, false)
  buf.set(typeBytes, 4)
  buf.set(data, 8)
  const crc = crc32(concatBytes(typeBytes, data))
  dv.setUint32(8 + len, crc, false)
  return buf
}

/* ---------- 最小 deflate：真机用 pako 压缩；fallback 用未压缩块 ---------- */
function encodeDeflate(data) {
  try {
    return pako.deflate(data, { level: 6 })
  } catch (e) {
    // 压缩失败时回退到未压缩块
    const len = data.length
    const nlen = len ^ 0xffff
    const out = new Uint8Array(1 + 4 + len)
    out[0] = 0x01 // BFINAL=1, BTYPE=00
    out[1] = len & 0xff
    out[2] = (len >>> 8) & 0xff
    out[3] = nlen & 0xff
    out[4] = (nlen >>> 8) & 0xff
    out.set(data, 5)
    return out
  }
}

/* ---------- PNG 编码 ---------- */
function encodePng(width, height, rgba) {
  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = new Uint8Array(13)
  const dv = new DataView(ihdr.buffer)
  dv.setUint32(0, width, false)
  dv.setUint32(4, height, false)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0 // compression method
  ihdr[11] = 0 // filter method
  ihdr[12] = 0 // no interlace

  const rowSize = width * 4
  const raw = new Uint8Array((rowSize + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (rowSize + 1)] = 0 // filter: None
    raw.set(rgba.subarray(y * rowSize, (y + 1) * rowSize), y * (rowSize + 1) + 1)
  }
  const idat = encodeDeflate(raw)

  const parts = [
    signature,
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', idat),
    writeChunk('IEND', new Uint8Array(0)),
  ]

  let total = 0
  for (const p of parts) total += p.length
  const out = new Uint8Array(total)
  let pos = 0
  for (const p of parts) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}

/* ---------- 字节 / base64 工具 ---------- */
function stringToBytes(str) {
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xff
  return bytes
}

function concatBytes(a, b) {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

/* ---------- base64 编码（纯 JS，不依赖 btoa / Buffer） ---------- */
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function bytesToBase64(bytes) {
  let out = ''
  const len = bytes.length
  let i = 0
  for (; i + 2 < len; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out +=
      B64_CHARS[(n >>> 18) & 0x3f] +
      B64_CHARS[(n >>> 12) & 0x3f] +
      B64_CHARS[(n >>> 6) & 0x3f] +
      B64_CHARS[n & 0x3f]
  }
  const rest = len - i
  if (rest === 1) {
    const n = bytes[i] << 16
    out += B64_CHARS[(n >>> 18) & 0x3f] + B64_CHARS[(n >>> 12) & 0x3f] + '=='
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8)
    out +=
      B64_CHARS[(n >>> 18) & 0x3f] +
      B64_CHARS[(n >>> 12) & 0x3f] +
      B64_CHARS[(n >>> 6) & 0x3f] +
      '='
  }
  return out
}

/* ---------- 对外 API ---------- */
export function qrTextToDataURL(text, opts = {}) {
  if (!text) return ''
  // 自行 UTF-8 编码后以字节数组传入，绕开 TextEncoder（iOS 真机 JSCore 缺失）
  const bytes = utf8Encode(String(text))
  const symbol = qrcodeCore.create(
    [{ data: bytes, mode: QrMode.BYTE }],
    { errorCorrectionLevel: opts.errorCorrectionLevel || 'M' }
  )
  const options = qrUtils.getOptions({
    width: opts.width || 168,
    margin: opts.margin ?? 1,
    color: {
      dark: opts.dark || '#2a2a2c',
      light: opts.light || '#f5ecd7',
    },
  })
  const imageWidth = qrUtils.getImageWidth(symbol.modules.size, options)
  const rgba = new Uint8ClampedArray(imageWidth * imageWidth * 4)
  qrUtils.qrToImageData(rgba, symbol, options)
  const png = encodePng(imageWidth, imageWidth, rgba)
  return 'data:image/png;base64,' + bytesToBase64(png)
}
