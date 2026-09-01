<template>
  <view class="ticket-card">
    <!-- ========== 顶部打孔毛边 ========== -->
    <view class="perf perf-top"></view>

    <!-- ========== ticket 品牌头 ========== -->
    <view class="brand">
      <text class="brand-dot">·</text>
      <text class="brand-text">ticket</text>
      <text class="brand-dot">·</text>
    </view>
    <view class="dashed-line brand-divider"></view>

    <!-- ========== 正文内容区 ========== -->
    <view class="body-area">
      <view
        v-for="(para, idx) in parsedParagraphs"
        :key="idx"
        class="paragraph"
      >
        <text v-if="para.label" class="para-label">{{ para.label }}：</text>
        <text class="para-text">{{ para.text }}</text>
      </view>
    </view>

    <!-- ========== 元数据区 DATE / BY / TOTAL ========== -->
    <view class="meta-area">
      <view class="meta-row">
        <text class="meta-key">DATE</text>
        <view class="meta-dashes"></view>
        <text class="meta-val">{{ date }}</text>
      </view>
      <view class="meta-row">
        <text class="meta-key">BY</text>
        <view class="meta-dashes"></view>
        <text class="meta-val">{{ author }}</text>
      </view>
      <view class="meta-row">
        <text class="meta-key">TOTAL</text>
        <view class="meta-dashes"></view>
        <text class="meta-val">{{ totalMemos }} MEMOS · {{ totalDays }} DAYS</text>
      </view>
    </view>

    <!-- ========== 手绘涂鸦分隔线 ========== -->
    <!-- 小程序不支持内联 <svg>，改用预生成的 PNG（几何与原 SVG 一致） -->
    <view class="scribble-wrap">
      <image class="scribble" src="/static/ticket-scribble.png" mode="scaleToFill" />
    </view>

    <!-- ========== 条形码 ========== -->
    <view class="barcode-wrap">
      <image class="barcode" src="/static/ticket-barcode.png" mode="scaleToFill" />
    </view>

    <!-- ========== 底部打孔毛边 ========== -->
    <view class="perf perf-bottom"></view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /**
   * 正文内容。用 \n 分隔每个段落；
   * 段落中「：」或「:」之前的文字会自动加粗显示为小标题。
   */
  content: {
    type: String,
    default: '',
  },
  /** DATE 字段值，例如 "07 / 11, 2026" */
  date: {
    type: String,
    default: '',
  },
  /** BY 字段值，例如 "你的昵称" */
  author: {
    type: String,
    default: '',
  },
  /** TOTAL MEMOS 数量 */
  totalMemos: {
    type: [String, Number],
    default: '0',
  },
  /** TOTAL DAYS 天数 */
  totalDays: {
    type: [String, Number],
    default: '0',
  },
})

/**
 * 解析正文段落：每段按第一个「：」或「:」拆成 label + text
 */
const parsedParagraphs = computed(() => {
  return props.content
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      // 优先匹配中文冒号「：」，其次英文「:」
      let idx = raw.indexOf('：')
      if (idx === -1) idx = raw.indexOf(':')
      if (idx === -1) {
        return { label: '', text: raw }
      }
      return {
        label: raw.slice(0, idx).trim(),
        text: raw.slice(idx + 1).trim(),
      }
    })
})
</script>

<style scoped>
/* ==========================================================
   ticket 票根便签卡
   ========================================================== */
.ticket-card {
  width: 520px;
  max-width: 100%;
  background: #f2efe5; /* 米白纸张底色 */
  color: #2a2a2a;
  position: relative;
  padding: 56px 44px 44px;
  box-sizing: border-box;
  /* 柔和的纸张阴影 */
  box-shadow:
    0 2px 0 rgba(0, 0, 0, 0.02),
    0 12px 36px rgba(60, 50, 30, 0.12),
    0 32px 80px rgba(60, 50, 30, 0.10);
  display: flex;
  flex-direction: column;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
    'Noto Sans CJK SC', 'Source Han Sans SC', 'Hiragino Sans',
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ---------- 打孔毛边（顶部 / 底部） ----------
   用径向渐变重复排列出半圆"打孔"效果。
   perf-top:    底部露出半圆 → 贴在卡片顶部外侧。
   perf-bottom: 顶部露出半圆 → 贴在卡片底部外侧。
*/
.perf {
  position: absolute;
  left: 0;
  right: 0;
  height: 18px;
  /* 每 30px 一个半圆 */
  background-image: radial-gradient(
    circle at 15px 18px,
    transparent 9px,
    #f2efe5 9.5px
  );
  background-size: 30px 18px;
  background-repeat: repeat-x;
}
.perf-top {
  top: -18px;
  background-position: 0 0;
}
.perf-bottom {
  bottom: -18px;
  background-image: radial-gradient(
    circle at 15px 0,
    transparent 9px,
    #f2efe5 9.5px
  );
}

/* ---------- ticket 品牌头 ---------- */
.brand {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 18px;
  user-select: none;
}
.brand-dot {
  font-size: 28px;
  color: #2a2a2a;
  margin: 0 10px;
  line-height: 1;
}
.brand-text {
  font-family: 'Hiragino Sans', 'PingFang SC', 'Microsoft YaHei',
    -apple-system, sans-serif;
  font-size: 52px;
  font-weight: 900;
  letter-spacing: -0.01em;
  line-height: 1;
  color: #1a1a1a;
  /* 让 ticket 的字重观感更接近原版 logo */
  -webkit-font-smoothing: antialiased;
}

/* ---------- 通用虚线分隔 ---------- */
.dashed-line {
  height: 0;
  border: 0;
  border-bottom: 2px dashed #b9b2a2;
  width: 100%;
}
.brand-divider {
  margin-bottom: 44px;
}

/* ---------- 正文区 ---------- */
.body-area {
  display: flex;
  flex-direction: column;
  gap: 38px;
  margin-bottom: 56px;
  flex: 1;
}
.paragraph {
  font-size: 24px;
  line-height: 1.75;
  color: #1f1f1f;
  font-weight: 400;
  letter-spacing: 0.01em;
  /* 中英文混排视觉对齐 */
  font-feature-settings: "palt";
}
.para-label {
  font-weight: 700;
  color: #1a1a1a;
}
.para-text {
  font-weight: 400;
  color: #262626;
}

/* ---------- 元数据区：DATE / BY / TOTAL ---------- */
.meta-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 30px;
}
.meta-row {
  display: flex;
  align-items: baseline;
  padding: 10px 0;
}
.meta-key {
  font-size: 24px;
  font-weight: 800;
  color: #2a2a2a;
  letter-spacing: 0.06em;
  font-family: 'Helvetica Neue', 'Arial', 'PingFang SC', sans-serif;
  flex-shrink: 0;
}
.meta-val {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.02em;
  font-family: 'Helvetica Neue', 'Arial', 'PingFang SC', sans-serif;
  flex-shrink: 0;
}
.meta-dashes {
  flex: 1;
  margin: 0 10px;
  height: 0;
  border-bottom: 2px dashed #b9b2a2;
  /* 让虚线贴向 value 侧（图片中虚线偏右贴）*/
  transform: translateY(-1px);
}

/* ---------- 手绘涂鸦分隔线 ---------- */
.scribble-wrap {
  width: 100%;
  margin-bottom: 40px;
  display: flex;
  justify-content: center;
}
.scribble {
  width: 94%;
  height: 28px;
  display: block;
}

/* ---------- 条形码 ---------- */
.barcode-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.barcode {
  width: 340px;
  max-width: 80%;
  height: 80px;
  display: block;
}

/* ---------- 响应式：小屏缩一点内边距和字号（小程序 WXSS 不支持 @media，见下方 MP 专属块） ---------- */
/* #ifndef MP-WEIXIN */
@media (max-width: 560px) {
  .ticket-card {
    padding: 44px 28px 32px;
  }
  .brand-text {
    font-size: 42px;
  }
  .paragraph {
    font-size: 20px;
  }
  .meta-key,
  .meta-val {
    font-size: 20px;
  }
  .body-area {
    gap: 28px;
    margin-bottom: 40px;
  }
}
/* #endif */

/* ---------- 小程序端：WXSS 不支持 @media，统一用 rpx（按移动端视觉 1px≈2rpx 换算） ---------- */
/* #ifdef MP-WEIXIN */
.ticket-card {
  width: 100%;
  padding: 88rpx 56rpx 64rpx;
}
.perf {
  height: 36rpx;
  background-size: 60rpx 36rpx;
}
.perf-top {
  top: -36rpx;
  background-image: radial-gradient(
    circle at 30rpx 36rpx,
    transparent 18rpx,
    #f2efe5 19rpx
  );
}
.perf-bottom {
  bottom: -36rpx;
  background-image: radial-gradient(
    circle at 30rpx 0,
    transparent 18rpx,
    #f2efe5 19rpx
  );
}
.brand {
  margin-bottom: 36rpx;
}
.brand-dot {
  font-size: 56rpx;
  margin: 0 20rpx;
}
.brand-text {
  font-size: 84rpx;
}
.brand-divider {
  margin-bottom: 88rpx;
}
.body-area {
  gap: 56rpx;
  margin-bottom: 80rpx;
}
.paragraph {
  font-size: 40rpx;
}
.meta-area {
  gap: 8rpx;
  margin-bottom: 60rpx;
}
.meta-row {
  padding: 20rpx 0;
}
.meta-key,
.meta-val {
  font-size: 40rpx;
}
.meta-dashes {
  margin: 0 20rpx;
}
.scribble-wrap {
  margin-bottom: 80rpx;
}
.scribble {
  height: 56rpx;
}
.barcode {
  width: 480rpx;
  height: 112rpx;
}
.barcode-wrap {
  margin-bottom: 32rpx;
}
/* #endif */
</style>
