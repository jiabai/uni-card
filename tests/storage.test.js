import { describe, it, expect, beforeEach, vi } from 'vitest'

// mock uni 存储全局（小程序 storage API 的内存实现）
const store = new Map()
globalThis.uni = {
  getStorageSync: (k) => (store.has(k) ? store.get(k) : ''),
  setStorageSync: (k, v) => void store.set(k, v),
}

// 动态导入：每个测试前重置模块级状态不必，但存储须清空
const storage = await import('../src/lib/storage.js')
const { TEMPLATES, getTemplate, DEFAULT_TEMPLATE_ID } = await import('../src/lib/templates.js')

beforeEach(() => {
  store.clear()
})

describe('模板注册表', () => {
  it('含 ticket / glow / punch 三项，五字段完整', () => {
    expect(TEMPLATES).toHaveLength(3)
    for (const t of TEMPLATES) {
      expect(t).toHaveProperty('id')
      expect(t).toHaveProperty('name')
      expect(t).toHaveProperty('comp')
      expect(t).toHaveProperty('thumb')
      expect(t).toHaveProperty('theme')
    }
    expect(TEMPLATES.map((t) => t.id)).toEqual(['ticket', 'glow', 'punch'])
  })

  it('按 id 查询；未知 id 回退默认模板（票根卡）', () => {
    expect(getTemplate('glow').comp).toBe('uni-glow-card')
    expect(getTemplate('ticket').comp).toBe('uni-ticket-card')
    expect(getTemplate('punch').comp).toBe('uni-punch-card')
    expect(getTemplate('nope').id).toBe(DEFAULT_TEMPLATE_ID)
    expect(DEFAULT_TEMPLATE_ID).toBe('ticket')
  })
})

describe('草稿配置（unicard_config）', () => {
  it('无存量时返回 null', () => {
    expect(storage.loadDrafts()).toBeNull()
  })

  it('读写往返', () => {
    storage.saveDrafts({ ticket: { content: 'a' }, glow: { title: 'b' } })
    expect(storage.loadDrafts()).toEqual({ ticket: { content: 'a' }, glow: { title: 'b' } })
  })

  it('旧键 uni-card-demo-config 首次读取一次性迁移到新键', () => {
    store.set('uni-card-demo-config', { ticket: { content: '旧数据' }, glow: {} })
    const drafts = storage.loadDrafts()
    expect(drafts.ticket.content).toBe('旧数据')
    // 已搬入新键
    expect(store.get('unicard_config')).toEqual({ ticket: { content: '旧数据' }, glow: {} })
  })

  it('迁移后旧键不再生效：改写旧键不影响新键读取', () => {
    store.set('uni-card-demo-config', { ticket: { content: '旧数据' }, glow: {} })
    storage.loadDrafts() // 触发迁移
    store.set('uni-card-demo-config', { ticket: { content: '被篡改' }, glow: {} })
    expect(storage.loadDrafts().ticket.content).toBe('旧数据')
  })

  it('新键已存在时忽略旧键', () => {
    store.set('unicard_config', { ticket: { content: '新数据' }, glow: {} })
    store.set('uni-card-demo-config', { ticket: { content: '旧数据' }, glow: {} })
    expect(storage.loadDrafts().ticket.content).toBe('新数据')
  })

  it('存储异常静默回退（读返回 null、写不抛错）', () => {
    const orig = globalThis.uni.getStorageSync
    globalThis.uni.getStorageSync = () => {
      throw new Error('boom')
    }
    expect(storage.loadDrafts()).toBeNull()
    globalThis.uni.getStorageSync = orig

    const origSet = globalThis.uni.setStorageSync
    globalThis.uni.setStorageSync = () => {
      throw new Error('boom')
    }
    expect(() => storage.saveDrafts({ ticket: {} })).not.toThrow()
    globalThis.uni.setStorageSync = origSet
  })
})

describe('身份绑定（独立键 unicard_binding，按模板各一份）', () => {
  it('无绑定返回 null；绑定后可读取', () => {
    expect(storage.getBoundMemoId('ticket')).toBeNull()
    storage.setBoundMemoId('ticket', 'c_001')
    expect(storage.getBoundMemoId('ticket')).toBe('c_001')
  })

  it('两套模板绑定互不影响', () => {
    storage.setBoundMemoId('ticket', 'c_001')
    storage.setBoundMemoId('glow', 'c_002')
    expect(storage.getBoundMemoId('ticket')).toBe('c_001')
    expect(storage.getBoundMemoId('glow')).toBe('c_002')
  })

  it('memoId 传 null 即解绑', () => {
    storage.setBoundMemoId('ticket', 'c_001')
    storage.setBoundMemoId('ticket', null)
    expect(storage.getBoundMemoId('ticket')).toBeNull()
    // 解绑不残留键
    const binding = store.get('unicard_binding')
    expect(binding).not.toHaveProperty('ticket')
  })

  it('绑定写入不触碰草稿（草稿深监听覆写不会抹掉绑定）', () => {
    storage.saveDrafts({ ticket: { content: '正文' }, glow: { title: 't' } })
    storage.setBoundMemoId('ticket', 'c_002')
    // 输入页 watch 整包覆写草稿（不含 memoId）
    storage.saveDrafts({ ticket: { content: '改后' }, glow: { title: 't' } })
    expect(storage.loadDrafts().ticket).not.toHaveProperty('memoId')
    expect(storage.getBoundMemoId('ticket')).toBe('c_002')
  })
})

describe('用户设置（unicard_mine）', () => {
  it('最近模板 id：无记录返回空串、写入后可读、重复写入幂等', () => {
    expect(storage.getLastTemplateId()).toBe('')
    storage.setLastTemplateId('glow')
    expect(storage.getLastTemplateId()).toBe('glow')
    const before = store.get('unicard_mine')
    storage.setLastTemplateId('glow')
    expect(store.get('unicard_mine')).toEqual(before)
  })

  it('mine 其余字段在模板 id 写入时保留', () => {
    store.set('unicard_mine', { nickname: '测试昵称', lastTemplateId: 'ticket', statsOn: true })
    storage.setLastTemplateId('glow')
    const mine = store.get('unicard_mine')
    expect(mine.nickname).toBe('测试昵称')
    expect(mine.statsOn).toBe(true)
    expect(mine.lastTemplateId).toBe('glow')
  })
})
