<template>
  <view class="page">
    <!-- 统一顶栏：三栏骨架（左占位 + 中标题 + 右占位），与输入/预览页视觉对齐 -->
    <view class="uc-topbar" :style="topbarStyle">
      <view class="uc-topbar-side"></view>
      <text class="uc-topbar-title">选一张卡片</text>
      <view class="uc-topbar-side"></view>
    </view>

    <!-- 模板缩略图陈列：单列大图，最近使用置顶，点选即进入输入页 -->
    <view class="tpl-grid">
      <view v-for="tpl in templates" :key="tpl.id" class="tpl-item" @click="onPick(tpl.id)">
        <view class="tpl-thumb-wrap">
          <image class="tpl-thumb" :src="tpl.thumb" mode="widthFix" />
          <view v-if="tpl.id === recentId" class="tpl-badge">最近</view>
        </view>
      </view>
    </view>

    <text class="page-hint">点选样式，写两句就能发出去</text>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getTemplate, orderByRecent } from '../../lib/templates.js'
import { getLastTemplateId, setLastTemplateId } from '../../lib/storage.js'
import { getTopbarStyle } from '../../lib/navbar.js'

// 自定义导航栏：统一度量（reserveRight=false，本页右侧无自定义控件，标题保持屏幕居中）
const topbarStyle = getTopbarStyle(false)

// 「最近」角标：unicard_mine 仅作标记，不驱动默认选中（ADR 0003 决策 5）
const recentId = ref(getTemplate(getLastTemplateId()).id)

// 最近使用的模板置顶陈列：只重排展示顺序，不改变选中态，也不预设默认模板
// （ADR 0005 修订 0003 决策 5 中「仅作角标」的表述）
const templates = computed(() => orderByRecent(recentId.value))

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
  /* 暖灰底：比票根卡面 #f2efe5 深一档，浅色卡得以浮出；
     与票根卡编辑页 theme 同色，点进去背景无缝衔接 */
  background: #e6e1d3;
}

/* 模板陈列：单列大图，等宽陈列。
   四张卡的宽高比跨度很大（票根 0.54 至 要点 0.90），若统一装进 3:4 框等比缩放，
   显示尺寸会明显不齐（最窄 470rpx 对最宽 654rpx，差 39%）。改为每张铺满内容区
   宽度、高度随卡片自身比例，四张左右边缘严格对齐；一个像素都不裁。 */
.tpl-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
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
  width: 100%;
  height: auto;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.tpl-badge {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(31, 31, 31, 0.85);
  color: #f2efe5;
  font-size: 12px;
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
  gap: 48rpx;
}
.tpl-thumb {
  width: 100%;
  height: auto;
  border-radius: 40rpx;
  border-width: 2rpx;
}
.tpl-badge {
  top: 24rpx;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
}
.page-hint {
  margin-top: 56rpx;
  font-size: 24rpx;
}
/* #endif */
</style>
