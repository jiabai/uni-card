<template>
  <view class="flomo-card">
    <!-- 顶部图标 -->
    <view class="top-icon" v-if="showIcon">
      <image class="top-icon-img" :src="icon || builtinIcon" mode="aspectFit" />
    </view>

    <!-- 标题 + 日期 -->
    <view class="header">
      <view class="title" :class="titleLang">{{ title }}</view>
      <view class="date">{{ date }}</view>
    </view>

    <!-- 正文 -->
    <view class="body">
      <template v-for="(b, i) in bodyBlocks" :key="i">
        <view v-if="b.kind === 'section'" class="section" :class="b.lang">
          <view class="section-title">{{ b.text }}</view>
        </view>
        <view v-else class="paragraph" :class="b.lang">{{ b.text }}</view>
      </template>
    </view>

    <!-- 署名 -->
    <view class="signature">
      <view class="signature-line" :class="signLang">{{ sign }}</view>
    </view>

    <!-- 分隔线 -->
    <view class="divider"></view>

    <!-- 底部：名称 + 二维码 -->
    <view class="footer">
      <view class="footer-label">{{ footerLabel }}</view>
      <view class="qr-wrap">
        <image v-if="qrSrc" class="qr-img" :src="qrSrc" mode="widthFix" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
// H5 端使用 qrcode 生成 dataURL（与历史实现一致）
// #ifdef H5
import QRCode from 'qrcode'
// #endif
// 小程序端：纯 JS 生成 PNG base64，不依赖 canvas / document
// #ifdef MP-WEIXIN
import { qrTextToDataURL } from '../../../../lib/qr-png.js'
// #endif

const props = defineProps({
  // 标题
  title: { type: String, default: '' },
  // 日期
  date: { type: String, default: '' },
  // 正文，用 \n 表示换行，含 💡 的段落会高亮显示为小标题
  content: { type: String, default: '' },
  // 署名
  sign: { type: String, default: '' },
  // 二维码内容；H5 端传入 qrText 会自动生成二维码
  qrText: { type: String, default: '' },
  // 二维码图片地址；传了 qrSrc 就不再自动生成
  qrSrc: { type: String, default: '' },
  // 底部名称
  footerLabel: { type: String, default: '流れる光カード' },
  // 是否显示顶部图标
  showIcon: { type: Boolean, default: true },
  // 自定义图标图片地址；不传则使用内置自行车图标
  icon: { type: String, default: '' },
})

/* ---------- 语言检测：含假名 => ja；无假名但含汉字 => zh；否则兜底 ja ---------- */
function detectLang(text) {
  let hasKana = false
  let hasCjk = false
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp >= 0x3040 && cp <= 0x30ff) hasKana = true
    else if (cp >= 0x4e00 && cp <= 0x9fff) hasCjk = true
  }
  return hasKana ? 'lang-ja' : hasCjk ? 'lang-zh' : 'lang-ja'
}

/* ---------- 内置自行车图标（PNG，跨端可用；小程序 <image> 不支持 SVG） ---------- */
const builtinIcon = '/static/glow-bicycle-icon.png'

/* ---------- 正文按换行拆块，💡 块视为高亮小标题，每块独立判定语言 ---------- */
const bodyBlocks = computed(() =>
  props.content
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((b) => ({
      text: b,
      kind: b.includes('💡') ? 'section' : 'paragraph',
      lang: detectLang(b),
    }))
)

const titleLang = computed(() => detectLang(props.title))
const signLang = computed(() => detectLang(props.sign))

/* ---------- 二维码：优先用传入的 qrSrc；否则 H5 用 qrcode，小程序用纯 JS PNG ---------- */
const qrSrc = ref(props.qrSrc)

/* 生成二维码：
   - H5 走 qrcode.toDataURL（浏览器环境完整，性能更好）
   - 小程序走纯 JS PNG 生成器（规避 canvas 原生组件与 TextEncoder 缺失问题） */
async function generateQr() {
  if (props.qrSrc) return
  if (!props.qrText) {
    qrSrc.value = ''
    return
  }
  try {
    // #ifdef H5
    qrSrc.value = await QRCode.toDataURL(props.qrText, {
      width: 168,
      margin: 1,
      color: { dark: '#2a2a2c', light: '#f5ecd7' },
    })
    // #endif
    // #ifdef MP-WEIXIN
    qrSrc.value = qrTextToDataURL(props.qrText, {
      width: 168,
      margin: 1,
      dark: '#2a2a2c',
      light: '#f5ecd7',
    })
    // #endif
  } catch (e) {
    console.error('[uni-glow-card] QR generate failed', e)
  }
}

onMounted(generateQr)

// 编辑面板实时修改 qrText / 外部切换 qrSrc 时重绘
watch(() => [props.qrText, props.qrSrc], generateQr)
</script>

<style scoped>
.flomo-card {
  width: 480px;
  max-width: 100%;
  min-height: 660px;
  background: #1a1a1c;
  border-radius: 18px;
  padding: 40px 36px 32px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
  color: #f5ecd7;
}

/* 日文 / 中文内容字体 */
.lang-ja {
  font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic UI',
    'Meiryo', 'Segoe UI', Roboto, sans-serif;
}
.lang-zh {
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
    'Noto Sans CJK SC', 'Source Han Sans SC', 'Hiragino Sans', 'Meiryo',
    'Segoe UI', Roboto, sans-serif;
}

.top-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #2e2e30;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.top-icon-img {
  width: 28px;
  height: 28px;
}

.header {
  margin-bottom: 32px;
}
.title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.4;
}
.date {
  margin-top: 10px;
  font-size: 17px;
  color: #9e9580;
  letter-spacing: 0.04em;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.paragraph {
  font-size: 23px;
  line-height: 1.85;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.section-title {
  font-size: 23px;
  font-weight: 600;
  line-height: 1.85;
  letter-spacing: 0.02em;
}

.signature {
  margin-top: auto;
  padding-top: 12px;
}
.signature-line {
  font-size: 19px;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.divider {
  margin: 28px 0 24px;
  height: 1px;
  background: rgba(245, 236, 215, 0.25);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-label {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.qr-wrap {
  width: 96px;
  height: 96px;
  background: #f5ecd7;
  border-radius: 3px;
  padding: 6px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qr-img {
  width: 84px;
  height: 84px;
}
.qr-canvas {
  width: 84px;
  height: 84px;
}
</style>

<!-- 小程序端：卡片固定 480px 在手机上会溢出，按 1px≈1.36rpx 换算为 rpx -->
<style scoped>
/* #ifdef MP-WEIXIN */
.flomo-card {
  width: 100%;
  min-height: 900rpx;
  border-radius: 24rpx;
  padding: 56rpx 48rpx 44rpx;
}
.top-icon {
  width: 70rpx;
  height: 70rpx;
  margin-bottom: 28rpx;
}
.top-icon-img {
  width: 38rpx;
  height: 38rpx;
}
.header {
  margin-bottom: 44rpx;
}
.title {
  font-size: 40rpx;
}
.date {
  margin-top: 14rpx;
  font-size: 24rpx;
}
.body {
  gap: 38rpx;
}
.paragraph,
.section-title {
  font-size: 32rpx;
}
.signature {
  padding-top: 16rpx;
}
.signature-line {
  font-size: 26rpx;
}
.divider {
  margin: 38rpx 0 32rpx;
}
.footer-label {
  font-size: 30rpx;
}
/* 注意：二维码区域保持 px 尺寸 —— 旧版 canvas 绘制坐标系与 CSS 像素绑定，rpx 缩放会裁切画面 */
/* #endif */
</style>
