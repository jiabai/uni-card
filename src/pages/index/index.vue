<template>
  <view class="page">
    <!-- 统一顶栏：三栏骨架（左占位 + 中标题 + 右占位），与输入/预览页视觉对齐 -->
    <view class="uc-topbar" :style="topbarStyle">
      <view class="uc-topbar-side"></view>
      <text class="uc-topbar-title">选一张卡片</text>
      <view class="uc-topbar-side"></view>
    </view>

    <!-- 模板缩略图陈列：双列网格，点选即进入输入页 -->
    <view class="tpl-grid">
      <view v-for="tpl in templates" :key="tpl.id" class="tpl-item" @click="onPick(tpl.id)">
        <view class="tpl-thumb-wrap">
          <image class="tpl-thumb" :src="tpl.thumb" mode="aspectFit" />
          <view v-if="tpl.id === recentId" class="tpl-badge">最近</view>
        </view>
      </view>
    </view>

    <text class="page-hint">点选样式，写两句就能发出去</text>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { TEMPLATES, getTemplate } from '../../lib/templates.js'
import { getLastTemplateId, setLastTemplateId } from '../../lib/storage.js'
import { getTopbarStyle } from '../../lib/navbar.js'

// 自定义导航栏：统一度量（reserveRight=false，本页右侧无自定义控件，标题保持屏幕居中）
const topbarStyle = getTopbarStyle(false)

const templates = TEMPLATES

// 「最近」角标：unicard_mine 仅作标记，不驱动默认选中（ADR 0003）
const recentId = ref(getTemplate(getLastTemplateId()).id)

onShow(() => {
  // 自输入页返回时刷新角标（用户可能改选了别的模板）
  recentId.value = getTemplate(getLastTemplateId()).id
})

// 点选模板：记录最近使用并进入输入页
function onPick(id) {
  const tpl = getTemplate(id)
  setLastTemplateId(tpl.id)
  uni.navigateTo({ url: `/pages/edit/edit?template=${tpl.id}` })
}
</script>

<style>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  /* 顶部留白交由顶栏的 statusBarHeight 垫高统一处理，与输入/预览页对齐 */
  padding: 0 24px 56px;
  box-sizing: border-box;
  background: #efeadf;
}

/* 模板陈列：双列网格 */
.tpl-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.tpl-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tpl-thumb-wrap {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}
.tpl-thumb {
  width: 150px;
  height: 200px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.tpl-badge {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 3px 10px;
  border-radius: 10px;
  background: rgba(31, 31, 31, 0.85);
  color: #f2efe5;
  font-size: 11px;
}

.page-hint {
  margin-top: 28px;
  text-align: center;
  font-size: 12px;
  color: rgba(31, 31, 31, 0.45);
}

/* ---------- 小程序端：固定 px 换算 rpx ---------- */
/* #ifdef MP-WEIXIN */
.page {
  padding: 0 48rpx 112rpx;
}
.tpl-grid {
  gap: 32rpx;
}
.tpl-thumb {
  width: 300rpx;
  height: 400rpx;
  border-radius: 28rpx;
  border-width: 2rpx;
}
.tpl-badge {
  top: 16rpx;
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}
.page-hint {
  margin-top: 56rpx;
  font-size: 24rpx;
}
/* #endif */
</style>
