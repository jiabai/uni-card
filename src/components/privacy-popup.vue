<template>
  <view v-if="privacyVisible" class="privacy-mask">
    <view class="privacy-box">
      <view class="privacy-title">隐私授权提示</view>
      <view class="privacy-body">
        在使用「保存图片到相册」等功能前，请阅读并同意
        <text class="privacy-link" @click="openContract">《小程序隐私保护指引》</text>
      </view>
      <view class="privacy-actions">
        <view class="privacy-btn deny" @click="onDeny">拒绝</view>
        <view class="privacy-btn agree" @click="onAgree">同意并继续</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import {
  privacyVisible,
  agreePrivacy,
  denyPrivacy,
  openPrivacyContract,
} from '../lib/privacy.js'

function onAgree() {
  agreePrivacy()
}
function onDeny() {
  denyPrivacy()
}
function openContract() {
  openPrivacyContract()
}
</script>

<style scoped>
.privacy-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.privacy-box {
  width: 80%;
  max-width: 320px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px 20px 16px;
  box-sizing: border-box;
}
.privacy-title {
  font-size: 17px;
  font-weight: 700;
  color: #1f1f1f;
  text-align: center;
  margin-bottom: 12px;
}
.privacy-body {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(31, 31, 31, 0.75);
}
.privacy-link {
  color: #2b6cff;
}
.privacy-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.privacy-btn {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  box-sizing: border-box;
}
.privacy-btn.deny {
  background: transparent;
  border: 1.5px solid rgba(31, 31, 31, 0.35);
  color: rgba(31, 31, 31, 0.7);
}
.privacy-btn.agree {
  background: #141a22;
  color: #f2efe5;
}
</style>
