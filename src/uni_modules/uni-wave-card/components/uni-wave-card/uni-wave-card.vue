<template>
  <view class="wave-card">
    <image class="wave-bg" src="/static/wave-card-bg.png" mode="scaleToFill" />
    <view class="wave-frame">
      <view class="wave-copy">
        <view v-if="title" class="wave-title">{{ title }}</view>
        <view v-if="contentLines.length" class="wave-content">
          <view v-for="(line, index) in contentLines" :key="index" class="wave-line">
            {{ line }}
          </view>
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
  padding-top: 332px;
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
  min-height: 226px;
  margin: 0 45px 338px;
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

.wave-copy {
  transform: translateY(-6px);
}

.wave-title {
  font-size: 38px;
  line-height: 46px;
  font-weight: 700;
}

.wave-content {
  margin-top: 2px;
}

.wave-line {
  font-size: 31px;
  line-height: 32px;
  font-weight: 400;
}

/* #ifdef MP-WEIXIN */
.wave-card {
  width: 100%;
  min-height: 1400rpx;
  padding-top: 519rpx;
}

.wave-frame {
  min-height: 353rpx;
  margin: 0 70rpx 528rpx;
  padding: 47rpx 34rpx;
  border-width: 6rpx;
  border-radius: 28rpx;
}

.wave-copy {
  transform: translateY(-9rpx);
}

.wave-title {
  font-size: 59rpx;
  line-height: 72rpx;
}

.wave-content {
  margin-top: 3rpx;
}

.wave-line {
  font-size: 48rpx;
  line-height: 50rpx;
}
/* #endif */
</style>
