// 自定义导航栏度量：根据微信胶囊按钮几何，统一计算顶栏占位。
//
// 背景：三页均 navigationStyle:"custom"，但原生胶囊按钮是系统浮层、固定右上角且永远置顶。
// 若不预留占位，右侧自定义控件（分享/设置）会与胶囊重叠被遮挡。
// 关键 API：uni.getMenuButtonBoundingClientRect() 给出胶囊屏幕坐标与尺寸（设备相关，必须运行时取）。
// 非微信端（H5 等）无胶囊，getMenuButtonBoundingClientRect 不存在 → 降级为不预留。

let cache = null

// 顶栏内容相对胶囊中心的额外下移量（px）。
// 需要页面整体下移时调大，上移时调小（可为负值）。三页共用，保持跨页一致。
// 注意：.uc-topbar 为 box-sizing:border-box，height 是含 padding 的总高。
// 只加大 paddingTop 会把内容向下压，但盒总高不变 → 后续内容区不动，与顶栏内容重叠。
// 因此必须同时把 EXTRA_TOP_OFFSET 加进 height（见 getTopbarStyle），让总高真实增加，
// 文档流中其后的内容区（editor / tpl-grid / card 区）才会同步下移，即“页面整体下移”。
const EXTRA_TOP_OFFSET = 48

// 顶栏与内容主体之间的额外间距（px）：只推下内容主体，顶栏内容位置不变。
// 对应 inline 的 paddingBottom；因 border-box，需同时加进 height（见 getTopbarStyle）。
const TOPBAR_BOTTOM_GAP = 16

export function getNavbarMetrics() {
  if (cache) return cache

  // 状态栏高度 + 屏宽：优先新版 getWindowInfo，回退已废弃的 getSystemInfoSync
  let statusBarHeight = 0
  let windowWidth = 0
  if (typeof uni.getWindowInfo === 'function') {
    const w = uni.getWindowInfo()
    statusBarHeight = w.statusBarHeight || 0
    windowWidth = w.windowWidth || 0
  } else {
    const s = (uni.getSystemInfoSync && uni.getSystemInfoSync()) || {}
    statusBarHeight = s.statusBarHeight || 0
    windowWidth = s.windowWidth || 0
  }

  // 页面左右留白（与 .page 的 48rpx 对应，换算为 px）：自定义控件右沿的可用边界要扣除它
  const pageHMarginPx = windowWidth ? (windowWidth * 48 / 750) : 24

  // 默认值（无胶囊时）：导航内容区 44px，右侧仅留基础内边距
  let navContentHeight = 44
  let rightReserved = 8
  let capsuleWidth = 0

  const rect =
    typeof uni.getMenuButtonBoundingClientRect === 'function'
      ? uni.getMenuButtonBoundingClientRect()
      : null

  if (rect && rect.width > 0 && rect.height > 0) {
    capsuleWidth = rect.width
    // 让自定义导航内容区与胶囊同高 → 胶囊垂直居中
    navContentHeight = (rect.top - statusBarHeight) * 2 + rect.height
    // 右侧为胶囊预留：胶囊宽 + 胶囊到右屏边间距 − 页面留白 + 与胶囊的安全间隙
    const capsuleRightMargin = windowWidth ? windowWidth - rect.right : 8
    const desiredGap = 8
    rightReserved = capsuleWidth + capsuleRightMargin - pageHMarginPx + desiredGap
    if (rightReserved < 8) rightReserved = 8 // 保底
  }

  cache = {
    statusBarHeight,
    navContentHeight,
    rightReserved,
    capsuleWidth,
    topbarHeight: statusBarHeight + navContentHeight,
  }
  return cache
}

// 返回可直接绑定到 .uc-topbar 的 inline style。
// reserveRight：是否给胶囊预留右侧占位。仅当该页右侧有自定义控件（如 edit 的分享钮）时传 true；
// 无右侧控件（index/preview）传 false，保持标题屏幕居中。
export function getTopbarStyle(reserveRight = true) {
  const m = getNavbarMetrics()
  return {
    paddingTop: m.statusBarHeight + EXTRA_TOP_OFFSET + 'px',
    // border-box：总高 = statusBar + EXTRA + navContentHeight + BOTTOM_GAP。
    // paddingTop(statusBar+EXTRA) + 内容盒(navContentHeight) + paddingBottom(BOTTOM_GAP) 恰好等于 height，
    // 内容盒容纳 40px 图标，总高真实增加 EXTRA+BOTTOM_GAP → 内容主体与顶栏内容拉开间距。
    height: m.topbarHeight + EXTRA_TOP_OFFSET + TOPBAR_BOTTOM_GAP + 'px',
    paddingBottom: TOPBAR_BOTTOM_GAP + 'px',
    paddingLeft: '8px',
    paddingRight: (reserveRight ? m.rightReserved : 8) + 'px',
  }
}
