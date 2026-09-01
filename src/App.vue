<script>
import { initPrivacyAuthorization } from './lib/privacy.js'
import privacyPopup from './components/privacy-popup.vue'

export default {
  components: {
    privacyPopup,
  },
  onLaunch: function () {
    // 注册微信隐私授权监听（合规必需，必在 App 启动处执行一次）
    initPrivacyAuthorization()
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<template>
  <privacy-popup />
</template>

<style>
/*每个页面公共css */

/* ============================================================
   统一顶栏（三页共用，单一事实来源）
   —— 顶栏与图标样式沉淀于此，页面不再各自声明，
      避免全局/scoped 作用域差异导致同一元素跨页渲染不一致。
   ============================================================ */
.uc-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 预览页 .page 为 align-items:center，需显式撑满，否则顶栏被内容宽度收缩 */
  width: 100%;
  padding: 16px 4px 16px;
  box-sizing: border-box;
  /* 图标与标题均继承此色，主题切换只需改这一处 */
  color: rgba(31, 31, 31, 0.9);
}
/* 深色主题：仅翻转颜色，骨架与尺寸不变 */
.theme-dark .uc-topbar {
  color: rgba(242, 239, 229, 0.92);
}
.uc-topbar-title {
  flex: 1;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: currentColor;
}
/* 左右槽位：等宽以保证标题在三页像素级同位置居中 */
.uc-topbar-side {
  width: 40px;
  height: 40px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============================================================
   自绘图标：用几何图形替代 Unicode 字符（←/↗）
   —— 字符字形由系统字体回退决定，跨页跨端不可控；
      CSS 绘制则 100% 一致。颜色统一取 currentColor，
      随主题自动翻转，无需为深浅色各写一套。
   ============================================================ */
.uc-icon {
  position: relative;
  display: block;
  --sz: 22px; /* 图标外框尺寸 */
  --sw: 2px; /* 线宽 */
  width: var(--sz);
  height: var(--sz);
}

/* 返回 ←：横向杆 + 左箭头头（V 形旋转 45°） */
.uc-icon-back::before,
.uc-icon-back::after {
  content: '';
  position: absolute;
}
.uc-icon-back::before {
  /* 杆 */
  left: calc(var(--sz) * 0.18);
  top: 50%;
  width: calc(var(--sz) * 0.68);
  height: var(--sw);
  margin-top: calc(var(--sw) / -2);
  background: currentColor;
  border-radius: var(--sw);
}
.uc-icon-back::after {
  /* 箭头头：L 形（左+下边）旋转 45°，交点成为朝左的尖端 */
  left: calc(var(--sz) * 0.27);
  top: 50%;
  width: calc(var(--sz) * 0.36);
  height: calc(var(--sz) * 0.36);
  margin-top: calc(var(--sz) * -0.18);
  border-left: var(--sw) solid currentColor;
  border-bottom: var(--sw) solid currentColor;
  transform: rotate(45deg);
}

/* 分享 ↗：45° 斜杆 + 右上箭头头（上+右 border 天然指向右上） */
.uc-icon-share::before,
.uc-icon-share::after {
  content: '';
  position: absolute;
}
.uc-icon-share::before {
  /* 斜杆：水平线逆时针 45°，即左下→右上 */
  left: 50%;
  top: 50%;
  width: calc(var(--sz) * 0.727);
  height: var(--sw);
  margin: calc(var(--sw) / -2) 0 0 calc(var(--sz) * -0.364);
  background: currentColor;
  border-radius: var(--sw);
  transform: translate(calc(var(--sz) * -0.068), calc(var(--sz) * 0.068)) rotate(-45deg);
}
.uc-icon-share::after {
  /* 箭头头：角点落在斜杆上端延长线上 */
  left: 50%;
  top: 50%;
  width: calc(var(--sz) * 0.318);
  height: calc(var(--sz) * 0.318);
  margin: calc(var(--sz) * -0.159) 0 0 calc(var(--sz) * -0.159);
  border-top: var(--sw) solid currentColor;
  border-right: var(--sw) solid currentColor;
  transform: translate(calc(var(--sz) * 0.182), calc(var(--sz) * -0.182));
}

/* 小程序端：px → rpx 等比换算（尺寸全由变量驱动，一处覆盖即可） */
/* #ifdef MP-WEIXIN */
.uc-topbar {
  padding: 32rpx 8rpx 32rpx;
}
.uc-topbar-title {
  font-size: 40rpx;
}
.uc-topbar-side {
  width: 80rpx;
  height: 80rpx;
}
.uc-icon {
  --sz: 44rpx;
  --sw: 4rpx;
}
/* #endif */
</style>
