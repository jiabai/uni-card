<template>
  <view class="page" :class="{ 'theme-dark': isDarkTheme }" :style="{ background: theme }">
    <!-- 统一顶栏：返回 + 居中标题（复用全局 .uc-topbar，theme-dark 令文字转浅色） -->
    <view class="uc-topbar" :style="topbarStyle">
      <view class="uc-topbar-side" @click="onBack">
        <view class="uc-icon uc-icon-back"></view>
      </view>
      <text class="uc-topbar-title">分享图片</text>
      <view class="uc-topbar-side"></view>
    </view>

    <!-- 大图展示：长按弹出系统菜单（发送给朋友 / 保存） -->
    <view class="img-wrap">
      <image
        v-if="imgPath"
        class="share-img"
        :src="imgPath"
        mode="widthFix"
        show-menu-by-longpress
      />
      <view v-else class="empty">图片未生成，请返回上一页重试</view>
    </view>

    <!-- 底部操作栏：系统级图片分享（真发图片文件）+ 保存到相册 -->
    <view class="action-bar">
      <view class="action-btn primary" @click="onShareImage">分享图片</view>
      <view class="action-btn ghost" @click="onSaveImage">保存到相册</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getTopbarStyle } from '../../lib/navbar.js'
import { getTemplate } from '../../lib/templates.js'

// 自定义导航栏：本页右侧无控件，标题保持屏幕居中
const topbarStyle = getTopbarStyle(false)

// 来源页（输入页出图 / 复用预览页重绘）生成的卡片图临时路径，经 query 传入
const imgPath = ref('')

// 来源模板 id（经 query 透传），用于让本页配色与来源页一致
const templateId = ref('ticket')

onLoad((options) => {
  const p = options && options.path ? decodeURIComponent(options.path) : ''
  if (p) imgPath.value = p
  if (options && options.template) {
    templateId.value = decodeURIComponent(options.template)
  }
})

// 配色与来源页统一：复用模板 theme，并按亮度切换顶栏文字明暗
const theme = computed(() => getTemplate(templateId.value).theme)
const isDarkTheme = computed(() => {
  const c = theme.value.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 < 128
})

function onBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}

/* ---------- 分享图片：系统级图片分享菜单（微信里真正把图片文件发出去） ---------- */
// #ifdef MP-WEIXIN
function onShareImage() {
  if (!imgPath.value) {
    uni.showToast({ title: '图片未就绪', icon: 'none' })
    return
  }
  // 基础库 2.14.3+：直接唤起「发送给朋友 / 保存到相册」系统菜单
  if (typeof wx !== 'undefined' && wx.showShareImageMenu) {
    wx.showShareImageMenu({
      path: imgPath.value,
      fail: (e) => {
        const m = (e && e.errMsg) || ''
        if (!m.includes('cancel')) {
          uni.showToast({ title: '分享失败，可长按图片转发', icon: 'none' })
        }
      },
    })
  } else {
    uni.showToast({ title: '基础库过低，请长按图片分享', icon: 'none' })
  }
}
// #endif
// #ifndef MP-WEIXIN
function onShareImage() {
  uni.showToast({ title: '请在微信小程序中使用', icon: 'none' })
}
// #endif

/* ---------- 保存到相册（含授权引导） ---------- */
function onSaveImage() {
  if (!imgPath.value) {
    uni.showToast({ title: '图片未就绪', icon: 'none' })
    return
  }
  uni.saveImageToPhotosAlbum({
    filePath: imgPath.value,
    success: () => uni.showToast({ title: '已保存到相册', icon: 'none' }),
    fail: (e) => {
      const m = (e && e.errMsg) || ''
      if (m.includes('auth deny') || m.includes('authorize')) {
        uni.showModal({
          title: '需要相册权限',
          content: '保存图片需要「添加到相册」权限，请在设置中开启',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) uni.openSetting({})
          },
        })
      } else {
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 140px;
  box-sizing: border-box;
}

.img-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.share-img {
  width: 90%;
  border-radius: 12px;
}
.empty {
  color: rgba(242, 239, 229, 0.6);
  font-size: 14px;
  padding: 120px 0;
}

/* 底部操作栏（与来源页一致：浅色磨砂条，深浅主题下均清晰） */
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12px;
  padding: 16px 24px calc(16px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  box-sizing: border-box;
}
.action-btn {
  flex: 1;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}
.action-btn.primary {
  background: #141a22;
  color: #f2efe5;
}
.action-btn.ghost {
  background: transparent;
  border: 1.5px solid rgba(31, 31, 31, 0.8);
  color: rgba(31, 31, 31, 0.9);
}

/* 浅色主题（票根卡）下，辅助文字转深色以保证可读 */
.page:not(.theme-dark) .empty {
  color: rgba(31, 31, 31, 0.6);
}

/* 小程序端 rpx 适配 */
/* #ifdef MP-WEIXIN */
.page {
  padding: 0 0 280rpx;
}
.img-wrap {
  margin-top: 40rpx;
}
.share-img {
  border-radius: 24rpx;
}
.action-bar {
  gap: 24rpx;
  padding: 32rpx 48rpx calc(32rpx + env(safe-area-inset-bottom));
}
.action-btn {
  height: 96rpx;
  border-radius: 48rpx;
  font-size: 32rpx;
}
/* #endif */
</style>
