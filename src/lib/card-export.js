/**
 * 卡片导出：canvas 2d 绘制 → 临时图片文件
 *
 * 抽自 pages/preview/preview.vue，供两条出图路径共用：
 *   1. 输入页「下一步」直接出图（V3.9 起为主流程，不经预览页）
 *   2. 预览页「生成分享图」
 * 避免同一套导出逻辑在两个页面各写一份。
 *
 * ⚠ 真机踩坑：调用方必须在 setup 作用域捕获组件实例并传入本模块。
 * 在点击事件回调里调用 getCurrentInstance() 会返回 null，
 * .in(null) 让 uni 封装层访问 null.$scope，抛
 * "null is not an object (evaluating 't1.$scope')"。
 */
import { paintCard } from './card-painter.js'

/**
 * 导出 canvas 2d 为临时文件。
 * 用原生 wx.canvasToTempFilePath 直传 canvas 节点，不依赖组件实例。
 */
function canvasToTempFile(canvas) {
  return new Promise((resolve, reject) => {
    const options = {
      canvas,
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      destWidth: canvas.width,
      destHeight: canvas.height,
      fileType: 'png',
      quality: 1,
      success: (r) => resolve(r.tempFilePath),
      fail: reject,
    }
    if (typeof wx !== 'undefined' && wx.canvasToTempFilePath) {
      wx.canvasToTempFilePath(options)
    } else {
      uni.canvasToTempFilePath(options)
    }
  })
}

/**
 * 取页面内隐藏的 #exportCanvas 节点。
 * canvas 2d 必须在文档流内才能取到 node，因此各页面统一用
 * position:fixed + left:-9999px 移出可视区，不能用 display:none。
 */
function getExportCanvas(instance) {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    uni
      .createSelectorQuery()
      .in(instance && instance.proxy)
      .select('#exportCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res && res[0] && res[0].node) resolve(res[0].node)
        else reject(new Error('export canvas not found'))
      })
    // #endif
    // #ifndef MP-WEIXIN
    resolve(document.createElement('canvas'))
    // #endif
  })
}

/**
 * 生成分享图并落到临时文件。
 *
 * @param {object} instance setup 作用域捕获的组件实例（见文件头踩坑说明）
 * @param {string} templateId 模板 id
 * @param {object} fields 卡片字段
 * @returns {Promise<string>} 临时文件路径
 * @throws {Error} err.overflow === true 表示内容过长（画布高度超 4096 上限）
 */
export async function exportCardImage(instance, templateId, fields) {
  const canvas = await getExportCanvas(instance)
  const result = await paintCard(canvas, templateId, fields)
  if (result.overflow) {
    const err = new Error('content overflow')
    err.overflow = true
    throw err
  }
  return canvasToTempFile(canvas)
}
