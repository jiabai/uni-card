<template>
  <view class="wave-card">
    <image class="wave-bg" src="/static/wave-card-bg.png" mode="scaleToFill" />
    <view class="wave-frame">
      <view v-if="title" class="wave-title">{{ title }}</view>
      <view v-if="contentLines.length" class="wave-content">
        <view v-for="(line, index) in contentLines" :key="index" class="wave-line">
          {{ line }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  content: { type: String, default: '' },
})

const contentLines = computed(() =>
  String(props.content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
)
</script>

<style scoped>
.wave-card {
  width: 480px;
  max-width: 100%;
  min-height: 896px;
  position: relative;
  overflow: hidden;
  padding-top: 334px;
  box-sizing: border-box;
  background: #f66b61;
  color: #fffaf0;
}

.wave-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.wave-frame {
  position: relative;
  z-index: 1;
  min-height: 224px;
  margin: 0 47px 338px;
  padding: 30px 22px;
  border: 4px solid rgba(255, 250, 240, 0.96);
  border-radius: 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: Georgia, 'Times New Roman', 'Songti SC', serif;
}

.wave-title {
  font-size: 42px;
  line-height: 50px;
  font-weight: 700;
}

.wave-content {
  margin-top: 2px;
}

.wave-line {
  font-size: 29px;
  line-height: 34px;
  font-weight: 400;
}

/* #ifdef MP-WEIXIN */
.wave-card {
  width: 100%;
  min-height: 1400rpx;
  padding-top: 522rpx;
}

.wave-frame {
  min-height: 350rpx;
  margin: 0 73rpx 528rpx;
  padding: 47rpx 34rpx;
  border-width: 6rpx;
  border-radius: 28rpx;
}

.wave-title {
  font-size: 66rpx;
  line-height: 78rpx;
}

.wave-content {
  margin-top: 3rpx;
}

.wave-line {
  font-size: 45rpx;
  line-height: 53rpx;
}
/* #endif */
</style>
