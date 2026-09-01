// 微信小程序隐私授权处理（合规必需）
//
// 当小程序调用「隐私受保护接口」（如 wx.saveImageToPhotosAlbum / wx.showShareImageMenu）
// 且用户尚未授权时，wx.onNeedPrivacyAuthorization 会被触发。此时必须展示授权弹窗，
// 并在用户做出选择后调用 resolve({ event }) 解锁或拒绝原接口，否则原接口会一直挂起。
//
// 微信隐私新规（2023-09 起）：未接入该流程的小程序，隐私受保护接口在真机将被直接拒绝，
// 且无法通过审核。本模块为全局单一事实来源，在 App onLaunch 注册一次即可。
import { ref } from 'vue'

// 弹窗可见状态（全局响应式，供弹窗组件订阅渲染）
export const privacyVisible = ref(false)

let resolvers = []
let inited = false

// 在 App onLaunch 调用一次：注册全局隐私授权监听
export function initPrivacyAuthorization() {
  // #ifdef MP-WEIXIN
  if (inited) return
  inited = true
  if (typeof wx !== 'undefined' && typeof wx.onNeedPrivacyAuthorization === 'function') {
    wx.onNeedPrivacyAuthorization((resolve) => {
      // 累计本次等待中的 resolver，弹窗统一处理（可能多个隐私接口先后触发）
      resolvers.push(resolve)
      privacyVisible.value = true
    })
  }
  // #endif
}

// 用户同意：解锁所有等待中的隐私接口（原接口会继续执行）
export function agreePrivacy() {
  privacyVisible.value = false
  const list = resolvers
  resolvers = []
  list.forEach((r) => {
    try {
      r({ event: 'agree' })
    } catch (e) {
      /* 忽略单个 resolve 异常，避免阻断其余 */
    }
  })
}

// 用户拒绝：原接口将以 fail 结束（调用方已处理 fail 分支）
export function denyPrivacy() {
  privacyVisible.value = false
  const list = resolvers
  resolvers = []
  list.forEach((r) => {
    try {
      r({ event: 'disagree' })
    } catch (e) {
      /* 同上 */
    }
  })
}

// 打开微信官方《小程序隐私保护指引》全文页
export function openPrivacyContract() {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && typeof wx.openPrivacyContract === 'function') {
    wx.openPrivacyContract({ fail: () => {} })
  }
  // #endif
}
