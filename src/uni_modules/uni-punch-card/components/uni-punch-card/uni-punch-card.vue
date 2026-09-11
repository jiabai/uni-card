<template>
  <view class="punch-card">
    <view class="punch-body">
      <!-- 每个源行一个块级 view；行内片段是 inline text，靠 CSS 自然换行 -->
      <view v-for="(line, i) in lines" :key="i" class="punch-line"><text v-for="(seg, j) in line" :key="j" class="punch-seg" :class="{ 'is-hl': seg.hl }">{{ seg.text }}</text></view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { parseHighlightLines } from '../../../../lib/highlight.js'

const props = defineProps({
  /**
   * 正文内容。用 \n 分句、每句独占一行；
   * 句中的 `**文字**` 会以高亮色显示，用来强调重点。
   */
  content: {
    type: String,
    default: '',
  },
})

/** 行 → 片段（{ text, hl }），与导出绘制器共用同一解析 */
const lines = computed(() => parseHighlightLines(props.content))
</script>

<style scoped>
/* ==========================================================
   醒目大字卡：橙底 + 纯黑圆角卡 + 超大粗体字，重点词换高亮色
   尺寸基准 480px 宽（与导出绘制器 card-painter.js 的 P 常量一一对应）
   ========================================================== */
.punch-card {
  width: 480px;
  max-width: 100%;
  min-height: 656px;
  background: #000000;
  border-radius: 34px;
  padding: 158px 39px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  /* 不加 box-shadow：导出成静态 PNG 后阴影不可见，加了会让预览与导出图的观感不一致 */
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
    'Noto Sans CJK SC', 'Source Han Sans SC', 'Hiragino Sans',
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.punch-body {
  width: 100%;
}

.punch-line,
.punch-seg {
  font-size: 58px;
  line-height: 85px;
  font-weight: 900;
  color: #ffffff;
}

.punch-seg.is-hl {
  color: #fe9a64;
}

/* ---------- 小程序端：固定 px 换算 rpx（与流光卡片同口径，1px≈1.36rpx） ---------- */
/* #ifdef MP-WEIXIN */
.punch-card {
  width: 100%;
  min-height: 892rpx;
  border-radius: 48rpx;
  padding: 215rpx 54rpx;
}
.punch-line,
.punch-seg {
  font-size: 80rpx;
  line-height: 116rpx;
}
/* #endif */
</style>
