<template>
  <view class="page" :class="{ 'theme-dark': isDarkTheme }" :style="{ background: theme }">
    <!-- 统一顶栏：返回图标 + 居中标题 + 右占位（骨架与前两页完全一致） -->
    <view class="uc-topbar" :style="topbarStyle">
      <view class="uc-topbar-side" @click="onBack">
        <view class="uc-icon uc-icon-back"></view>
      </view>
      <text class="uc-topbar-title">分享卡片</text>
      <view class="uc-topbar-side"></view>
    </view>

    <view class="card-scale" :style="{ transform: `scale(${scale})` }">
      <!-- 票根便签卡 -->
      <uni-ticket-card
        v-if="templateId === 'ticket'"
        :date="fields.date"
        :author="fields.author"
        :total-memos="fields.totalMemos"
        :total-days="fields.totalDays"
        :content="fields.content"
      />
      <!-- 流光卡片 -->
      <uni-glow-card
        v-else
        :title="fields.title"
        :date="fields.date"
        :content="fields.content"
        :sign="fields.sign"
        :qr-text="fields.qrText"
      />
    </view>

    <!-- 底部操作栏：生成分享图（canvas 重绘 → 跳展示页长按转发/保存） -->
    <view class="action-bar">
      <view class="action-btn ghost" :class="{ busy: saving }" @click="onShareTap">
        {{ saving ? '生成中…' : '生成分享图' }}
      </view>
    </view>

    <!-- 隐藏导出画布：按需绘制，不在可视区 -->
    <!-- #ifdef MP-WEIXIN -->
    <canvas id="exportCanvas" type="2d" class="export-canvas"></canvas>
    <!-- #endif -->
  </view>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { getTemplate } from '../../lib/templates.js'
import { upsertMemo } from '../../lib/memos.js'
import { exportCardImage } from '../../lib/card-export.js'
import { getTopbarStyle } from '../../lib/navbar.js'

// 自定义导航栏：统一度量（reserveRight=false，本页右侧无自定义控件，标题保持屏幕居中）
const topbarStyle = getTopbarStyle(false)

// 进页参数：template id 经 query；fields 经 eventChannel 传入（与素材库→预览页同机制）
const templateId = ref('ticket')
const fields = ref({})
const scale = ref(1)
const saving = ref(false)

// 关键：组件实例必须在 setup 作用域捕获。
// 真机踩坑：在点击事件回调（onShareTap）里调用 getCurrentInstance() 返回 null，
// .in(null) 会让 uni 封装层访问 null.$scope，抛
// "null is not an object (evaluating 't1.$scope')"（t1 即 .in 的压缩参数名）。
const instance = getCurrentInstance()

const theme = computed(() => getTemplate(templateId.value).theme)

// 主题明暗（按亮度阈值判定）：深色主题下顶栏文字转浅色
const isDarkTheme = computed(() => {
  const c = theme.value.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 < 128
})

// 返回：出栈回上一页；无上一页时兜底回首页
function onBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}

onLoad((options) => {
  templateId.value = options.template || 'ticket'

  // eventChannel：由来源页（输入页/素材库）传入完整 fields
  const opener = instance && instance.proxy ? instance.proxy : null
  const eventChannel =
    opener && typeof opener.getOpenerEventChannel === 'function' ? opener.getOpenerEventChannel() : null
  if (eventChannel && typeof eventChannel.on === 'function') {
    eventChannel.on('cardFields', (data) => {
      if (data) {
        fields.value = data
        // 分享即存稿：进预览页自动归档（upsert，同草稿只沉淀一条素材）
        upsertMemo(templateId.value, data)
      }
    })
  }

  // 等比缩放：卡片布局宽 750rpx（通栏全宽）→ 屏宽 90%
  scale.value = 0.9
})

/* ---------- 生成分享图：canvas 2d 重绘导出临时文件 ---------- */
// 导出实现已抽到 lib/card-export.js，与输入页「下一步直接出图」共用同一份逻辑，
// 避免两个页面各维护一套「取 canvas 节点 + 落临时文件」的代码。

async function onShareTap() {
  if (saving.value) return
  saving.value = true
  try {
    // #ifdef MP-WEIXIN
    const tempPath = await exportCardImage(instance, templateId.value, fields.value)
    // 临时文件路径较短，可直接放 query（长度安全）；展示页据此渲染大图。
    // 透传 template，让分享图片页配色与来源页（预览页）一致。
    uni.navigateTo({
      url:
        '/pages/share/share?path=' +
        encodeURIComponent(tempPath) +
        '&template=' +
        encodeURIComponent(templateId.value),
    })
    // #endif
    // #ifndef MP-WEIXIN
    uni.showToast({ title: '请在微信小程序中使用', icon: 'none' })
    // #endif
  } catch (e) {
    console.error('[preview] gen share image failed', e)
    if (e && e.overflow) {
      uni.showToast({ title: '内容过长，请精简后重试', icon: 'none' })
    } else {
      uni.showToast({
        title: '生成失败：' + String((e && (e.errMsg || e.message)) || e).slice(0, 40),
        icon: 'none',
      })
    }
  } finally {
    saving.value = false
  }
}

/* ---------- 微信菜单转发：右上角「···」转发的兜底（底部按钮已改为生成分享图） ---------- */
// 一期不做内容透传与 msgSecCheck（V3.7 4.5.6）；好友点开落地首页见本地状态
onShareAppMessage(() => ({
  title: '用卡片把想法变好看｜即刻写一张',
  path: '/pages/index/index',
  imageUrl: '/static/templates/ticket-thumb.png',
}))
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px 140px;
  box-sizing: border-box;
}

.card-scale {
  width: 750rpx;
  margin-top: 16px; /* 卡片与顶栏拉开距离（顶栏内容位置不受影响） */
  transform-origin: center top;
}

/* 底部操作栏 */
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
.action-btn.busy {
  opacity: 0.6;
}
.action-btn.ghost {
  background: transparent;
  border: 1.5px solid rgba(31, 31, 31, 0.8);
  color: rgba(31, 31, 31, 0.9);
}

/* 隐藏导出画布：移出可视区（不能 display:none，canvas 2d 需在文档流内） */
.export-canvas {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 375px;
  height: 667px;
}

/* 小程序端 rpx 适配 */
/* #ifdef MP-WEIXIN */
.page {
  padding: 0 48rpx 280rpx;
}
.card-scale {
  margin-top: 32rpx; /* 与 px 版 16px 对应（375 屏宽下 32rpx ≈ 16px） */
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
