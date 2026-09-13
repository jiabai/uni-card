<template>
  <view class="digest-card">
    <!-- 固定图标：模板的识别符号，不承载用户内容，因此不做成字段。
         用内联 PNG 而非 emoji：emoji 的字形与配色随系统变化，无法与设计保持一致 -->
    <image class="digest-icon" :src="icon" mode="aspectFit" />

    <!-- 标题 -->
    <view class="digest-title">{{ title }}</view>

    <!-- 正文：逐行渲染，空行即段落间距 -->
    <view class="digest-body">
      <view v-for="(line, i) in lines" :key="i" :class="line.blank ? 'digest-blank' : 'digest-line'">
        <template v-if="!line.blank">
          <text v-if="line.label" class="digest-label">{{ line.label }}</text>
          <text class="digest-text">{{ line.text }}</text>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { parseDigestLines } from '../../../../lib/digest.js'
import { DIGEST_BOOK_ICON } from '../../../../lib/digest-icon.js'

const props = defineProps({
  /** 卡片标题 */
  title: {
    type: String,
    default: '',
  },
  /**
   * 正文内容。用 \n 分行，**空行代表段落间距**；
   * 每行里冒号（「：」或「:」）之前的文字会自动加粗为小标题，
   * 冒号与它后面紧随的空格原样保留。
   */
  content: {
    type: String,
    default: '',
  },
})

const icon = DIGEST_BOOK_ICON

/** 行数组（{ blank } 或 { label, text }），与导出绘制器共用同一解析 */
const lines = computed(() => parseDigestLines(props.content))
</script>

<style scoped>
/* ==========================================================
   深色要点卡：近黑圆角卡面 + 顶部图标 + 标题 + 加粗小标题要点
   尺寸基准 480px 宽（与导出绘制器 card-painter.js 的 D 常量一一对应）
   ========================================================== */
.digest-card {
  width: 480px;
  max-width: 100%;
  min-height: 540px;
  background: #2a2a2a;
  border-radius: 21px;
  padding: 40px 40px 73px;
  box-sizing: border-box;
  color: #ffffff;
  /* 卡面比页面底色亮一档（#2a2a2a / #171717），边界本来就看得见，因此刻意不加阴影：
     导出成静态 PNG 后阴影不可见，预览若加了会与导出图的交界观感不一致（同 punch 卡的取舍） */
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
    'Noto Sans CJK SC', 'Source Han Sans SC', 'Hiragino Sans',
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.digest-icon {
  display: block;
  width: 38px;
  height: 31px;
  margin-bottom: 15px;
}

/* line-height 26 + margin 17 = 43，与绘制器的 titleSize + titleMB 同口径 */
.digest-title {
  font-size: 22px;
  font-weight: 800;
  line-height: 26px;
  margin-bottom: 17px;
}

.digest-blank {
  height: 26px;
}

.digest-line {
  font-size: 20px;
  line-height: 26px;
}

.digest-label {
  font-weight: 700;
  color: #ffffff;
}

.digest-text {
  font-weight: 400;
  color: #ffffff;
}

/* ---------- 小程序端：WXSS 不支持 @media，统一用 rpx（与流光卡片同口径，1px≈1.36rpx） ---------- */
/* #ifdef MP-WEIXIN */
.digest-card {
  width: 100%;
  min-height: 734rpx;
  border-radius: 29rpx;
  padding: 54rpx 54rpx 99rpx;
}
.digest-icon {
  width: 52rpx;
  height: 42rpx;
  margin-bottom: 20rpx;
}
.digest-title {
  font-size: 30rpx;
  line-height: 35rpx;
  margin-bottom: 23rpx;
}
.digest-blank {
  height: 35rpx;
}
.digest-line {
  font-size: 27rpx;
  line-height: 35rpx;
}
/* #endif */
</style>
