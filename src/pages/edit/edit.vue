<template>
  <view class="page" :class="{ 'theme-dark': isDarkTheme }" :style="{ background: theme }">
    <!-- 统一顶栏：返回图标 + 当前模板名（自选择页带入）+ 下一步图标（跳预览） -->
    <view class="uc-topbar" :style="topbarStyle">
      <view class="uc-topbar-side" @click="onBack">
        <view class="uc-icon uc-icon-back"></view>
      </view>
      <text class="uc-topbar-title">{{ currentName }}</text>
      <!-- 与返回键同款（uc-topbar-side）：无背景圆底，图标随主题 currentColor -->
      <view class="uc-topbar-side" @click="onShareTap">
        <view class="uc-icon uc-icon-share"></view>
      </view>
    </view>

    <!-- 内容输入区（无卡片预览，纯文本心智） -->
    <view class="editor">
      <view v-for="(row, rowIndex) in editorRows" :key="rowIndex" class="field-row">
        <view
          v-for="field in row"
          :key="field.key"
          class="field"
          :class="row.length > 1 ? 'half' : 'full'"
        >
          <text class="f-label">{{ field.label }}</text>
          <textarea
            v-if="field.type === 'textarea'"
            v-model="drafts[currentId][field.key]"
            class="f-textarea"
            maxlength="100000"
            auto-height
            :placeholder="field.placeholder"
          />
          <text
            v-if="field.type === 'textarea' && capacity"
            class="f-count"
            :class="{ 'is-warn': capacityWarn, 'is-over': capacity && capacity.over }"
          >{{ capacityText }}</text>
          <input
            v-if="field.type !== 'textarea'"
            v-model="drafts[currentId][field.key]"
            class="f-input"
            maxlength="100000"
            :placeholder="field.placeholder"
          />
        </view>
      </view>

      <view class="editor-foot">
        <text class="foot-hint">修改自动保存，随时回来继续。</text>
        <view class="foot-btn" @click="resetConfig">重置为默认</view>
      </view>
    </view>

    <!-- 隐藏导出画布：按需绘制，不在可视区（canvas 2d 需在文档流内） -->
    <!-- #ifdef MP-WEIXIN -->
    <canvas id="exportCanvas" type="2d" class="export-canvas"></canvas>
    <!-- #endif -->
  </view>
</template>

<script setup>
import { ref, computed, watch, getCurrentInstance } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { TEMPLATE_EDITOR_ROWS, createDefaultDrafts, getDefaultConfig } from '../../config.js'
import { getTemplate } from '../../lib/templates.js'
import { loadDrafts as loadDraftsSaved, saveDrafts, setBoundMemoId } from '../../lib/storage.js'
import { getTopbarStyle } from '../../lib/navbar.js'
import { upsertMemo } from '../../lib/memos.js'
import { exportCardImage } from '../../lib/card-export.js'
import { getCapacity } from '../../lib/capacity.js'

// 自定义导航栏：按微信胶囊按钮几何预留右侧占位（reserveRight=true，本页右侧有出图钮）
const topbarStyle = getTopbarStyle(true)

// 出图需按 selector 取本页隐藏 canvas 节点，实例必须在 setup 作用域捕获：
// 事件回调里 getCurrentInstance() 真机返回 null，会让 uni 封装层访问 null.$scope 抛错
// （详见 lib/card-export.js 文件头）。
const instance = getCurrentInstance()

// 出图进行中：防重复点击（顶栏为图标按钮，遮挡靠 showLoading 的 mask）
const generating = ref(false)

// 进页参数：模板 id 由选择页（或二期素材库「编辑」）经 query 带入
const currentId = ref('ticket')

const currentName = computed(() => getTemplate(currentId.value).name)
const theme = computed(() => getTemplate(currentId.value).theme)
const editorRows = computed(() => TEMPLATE_EDITOR_ROWS[currentId.value] || [])

// 容量提示：只给大字卡（字号 58，一行只放得下 6 个汉字，最容易写超）。
// 其余模板返回 null，编辑页不显示计数。
const capacity = computed(() =>
  getCapacity(currentId.value, (drafts.value[currentId.value] || {}).content)
)
const capacityText = computed(() => {
  const c = capacity.value
  if (!c) return ''
  if (c.over) return `已超 ${-c.remain} 行，出图会失败`
  return `还能写 ${c.remain} 行`
})
// 剩 3 行以内转橙色：给用户一个「快到顶了」的缓冲，不要等到红了才发现
const capacityWarn = computed(
  () => !!capacity.value && !capacity.value.over && capacity.value.remain <= 3
)

// 主题明暗（按亮度阈值判定）：深色主题下顶栏文字换浅色
const isDarkTheme = computed(() => {
  const c = theme.value.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 < 128
})

// 草稿：默认来自 config.js，缓存覆盖（存储封装内含旧键一次性迁移）；按模板独立记忆
const drafts = ref(loadLocalDrafts())

onLoad((options) => {
  currentId.value = getTemplate(options && options.template).id
})

function loadLocalDrafts() {
  return createDefaultDrafts(loadDraftsSaved())
}

// 深监听：草稿变化自动持久化（草稿记忆，中断恢复无损失）
watch(
  drafts,
  (val) => {
    saveDrafts(val)
  },
  { deep: true }
)

// 重置为默认：二次确认（全应用唯一造成内容损失的常规操作）+ 确认后解绑素材
// 只重置当前模板：另一模板草稿不动、绑定保留（重置即解绑，ADR 0002）
function resetConfig() {
  const id = currentId.value
  uni.showModal({
    title: '重置为默认',
    content: `将清空${getTemplate(id).name}的内容，恢复出厂示例？`,
    confirmColor: '#b03a2e',
    success: (res) => {
      if (!res.confirm) return
      drafts.value = {
        ...drafts.value,
        [id]: getDefaultConfig(id),
      }
      setBoundMemoId(id, null)
    },
  })
}

// 返回：出栈回选择页（草稿已深监听持久化，无损）；无上一页时兜底回首页
function onBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}

/**
 * 下一步图标：校验 → 直接出图 → 跳分享图片页。
 * V3.9 起不经预览页：写完即出图，少一次跳转与一次点击。
 * 归档（upsertMemo）改在出图成功后执行——生成失败的内容不沉淀为素材。
 */
async function onShareTap() {
  if (generating.value) return
  const id = currentId.value
  const fields = drafts.value[id]
  if (!fields || !String(fields.content || '').trim()) {
    uni.showToast({ title: '先写点内容吧', icon: 'none' })
    return
  }
  // 提前拦下过长内容：省掉一次注定失败的绘制与等待
  if (capacity.value && capacity.value.over) {
    uni.showToast({ title: '内容过长，请精简后再出图', icon: 'none' })
    return
  }

  generating.value = true
  uni.showLoading({ title: '生成中…', mask: true })
  try {
    // #ifdef MP-WEIXIN
    const payload = { ...fields }
    const tempPath = await exportCardImage(instance, id, payload)
    // 分享即归档：出图成功才落素材
    upsertMemo(id, payload)
    uni.navigateTo({
      url:
        '/pages/share/share?path=' +
        encodeURIComponent(tempPath) +
        '&template=' +
        encodeURIComponent(id),
    })
    // #endif
    // #ifndef MP-WEIXIN
    uni.showToast({ title: '请在微信小程序中使用', icon: 'none' })
    // #endif
  } catch (e) {
    console.error('[edit] gen share image failed', e)
    if (e && e.overflow) {
      uni.showToast({ title: '内容过长，请精简后重试', icon: 'none' })
    } else {
      uni.showToast({
        title: '生成失败：' + String((e && (e.errMsg || e.message)) || e).slice(0, 40),
        icon: 'none',
      })
    }
  } finally {
    uni.hideLoading()
    generating.value = false
  }
}
</script>

<style>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  /* 顶部留白交由顶栏的 statusBarHeight 垫高统一处理，与预览页对齐 */
  padding: 0 24px 56px;
  box-sizing: border-box;
  transition: background 0.25s ease;
}

/* 输入区 */
.editor {
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-row {
  display: flex;
  gap: 12px;
}
.field.half,
.field.full {
  flex: 1;
}
.f-label {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}
.f-input {
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 15px;
  color: #222;
  box-sizing: border-box;
}
.f-textarea {
  width: 100%;
  min-height: 96px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 14px;
  line-height: 1.6;
  color: #222;
  box-sizing: border-box;
}
.f-count {
  font-size: 12px;
  color: #999;
  text-align: right;
}
.f-count.is-warn {
  color: #c47a1a;
}
.f-count.is-over {
  color: #c0392b;
}
.editor-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
}
.foot-hint {
  font-size: 12px;
  color: #999;
  flex: 1;
}
.foot-btn {
  padding: 8px 16px;
  border-radius: 16px;
  border: 1px solid #ccc;
  color: #666;
  font-size: 13px;
  cursor: pointer;
}

/* 隐藏导出画布：移出可视区（不能 display:none，canvas 2d 需在文档流内） */
.export-canvas {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 375px;
  height: 667px;
}

/* ---------- 小程序端：固定 px 换算 rpx ---------- */
/* #ifdef MP-WEIXIN */
.page {
  padding: 0 48rpx 112rpx;
}
.editor {
  padding: 48rpx;
  border-radius: 36rpx;
  gap: 28rpx;
}
.field {
  gap: 12rpx;
}
.field-row {
  gap: 24rpx;
}
.f-label {
  font-size: 26rpx;
}
.f-input {
  height: 80rpx;
  padding: 0 24rpx;
  border-radius: 20rpx;
  font-size: 30rpx;
}
.f-textarea {
  min-height: 192rpx;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
}
.f-count {
  font-size: 24rpx;
}
.editor-foot {
  gap: 24rpx;
}
.foot-hint {
  font-size: 24rpx;
}
.foot-btn {
  padding: 16rpx 32rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
}
/* #endif */
</style>
