/**
 * 本地存储封装
 *
 * 键系（V3.7 统一 unicard_* 前缀）：
 *   unicard_config —— 各模板编辑中的配置（草稿），含身份绑定素材 id
 *   unicard_mine   —— 昵称、统计开关、最近使用模板 id
 *   unicard_library —— 素材数组（04 工单启用）
 *
 * 存量迁移：旧键 uni-card-demo-config 首次读取时一次性搬入
 * unicard_config（内部键 ticket / glow 不变），此后旧键不再生效。
 * 读写统一 try/catch 静默回退。
 */

const CONFIG_KEY = 'unicard_config'
const LEGACY_CONFIG_KEY = 'uni-card-demo-config'
const MINE_KEY = 'unicard_mine'
const BINDING_KEY = 'unicard_binding'

export function readStorage(key) {
  try {
    return uni.getStorageSync(key) || null
  } catch (e) {
    return null
  }
}

export function writeStorage(key, value) {
  try {
    uni.setStorageSync(key, value)
  } catch (e) {
    /* 存储异常静默降级 */
  }
}

/* ========== 草稿配置（unicard_config） ========== */

/**
 * 读取草稿配置：旧键一次性迁移 → 新键。
 * 返回 null 表示无任何存量（调用方以 config.js 默认值为底）。
 */
export function loadDrafts() {
  let drafts = readStorage(CONFIG_KEY)
  if (drafts) return drafts

  // 旧键迁移：读到即搬入新键，旧键不再生效
  const legacy = readStorage(LEGACY_CONFIG_KEY)
  if (legacy) {
    writeStorage(CONFIG_KEY, legacy)
    return legacy
  }
  return null
}

/** 整体写入草稿配置（深监听持久化调用） */
export function saveDrafts(drafts) {
  writeStorage(CONFIG_KEY, drafts)
}

/**
 * 身份绑定（草稿持有素材 id，独立键）：
 * 不嵌在 unicard_config 里——输入页深监听会整包覆写草稿，
 * 物理隔离防止绑定被抹掉（否则每次编辑后分享都会误建新素材）。
 */

/** 读取指定模板草稿的身份绑定素材 id（无绑定返回 null） */
export function getBoundMemoId(templateId) {
  const binding = readStorage(BINDING_KEY) || {}
  return binding[templateId] || null
}

/** 写入指定模板草稿的身份绑定素材 id（memoId 传 null 即解绑） */
export function setBoundMemoId(templateId, memoId) {
  const binding = readStorage(BINDING_KEY) || {}
  if (memoId === null || memoId === undefined) {
    delete binding[templateId]
  } else {
    binding[templateId] = memoId
  }
  writeStorage(BINDING_KEY, binding)
}

/* ========== 用户设置（unicard_mine） ========== */

const DEFAULT_MINE = { nickname: '', lastTemplateId: '' }

export function loadMine() {
  const saved = readStorage(MINE_KEY)
  return { ...DEFAULT_MINE, ...(saved || {}) }
}

export function saveMine(mine) {
  writeStorage(MINE_KEY, mine)
}

/** 读取最近使用模板 id；无记录返回空串（调用方回退默认模板） */
export function getLastTemplateId() {
  return loadMine().lastTemplateId || ''
}

/** 记录最近使用模板 id */
export function setLastTemplateId(templateId) {
  const mine = loadMine()
  if (mine.lastTemplateId === templateId) return
  saveMine({ ...mine, lastTemplateId: templateId })
}
