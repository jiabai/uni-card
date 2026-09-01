import { describe, it, expect, beforeEach } from 'vitest'

// mock uni 存储全局（内存实现）
const store = new Map()
globalThis.uni = {
  getStorageSync: (k) => (store.has(k) ? store.get(k) : ''),
  setStorageSync: (k, v) => void store.set(k, v),
}

const { upsertMemo, deleteMemo, listMemos } = await import('../src/lib/memos.js')
const { getBoundMemoId, setBoundMemoId } = await import('../src/lib/storage.js')

beforeEach(() => {
  store.clear()
})

describe('素材自动归档：upsert 四条身份规则', () => {
  it('规则 1 —— 无绑定：新建素材并回写绑定', () => {
    const id = upsertMemo('ticket', { content: '第一条' })
    const list = listMemos()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(id)
    expect(list[0].template).toBe('ticket')
    expect(list[0].fields.content).toBe('第一条')
    expect(list[0].note).toBe('')
    expect(getBoundMemoId('ticket')).toBe(id)
  })

  it('规则 2 —— 有绑定且素材在库：更新同一条（fields / updatedAt 刷新），不新建', () => {
    const id1 = upsertMemo('ticket', { content: 'v1' })
    const before = listMemos()[0].updatedAt
    const id2 = upsertMemo('ticket', { content: 'v2' })
    expect(id2).toBe(id1)
    const list = listMemos()
    expect(list).toHaveLength(1)
    expect(list[0].fields.content).toBe('v2')
    // updatedAt 刷新：时间戳不早于更新前（同毫秒亦视为刷新，仅断言不回退）
    expect(list[0].updatedAt).toBeGreaterThanOrEqual(before)
  })

  it('同一草稿反复修改再分享，只沉淀一条素材（不产生微调版本刷屏）', () => {
    upsertMemo('glow', { title: 'a' })
    upsertMemo('glow', { title: 'b' })
    upsertMemo('glow', { title: 'c' })
    expect(listMemos()).toHaveLength(1)
    expect(listMemos()[0].fields.title).toBe('c')
  })

  it('规则 3 —— 重置解绑后再分享：新建素材（旧素材保留在库）', () => {
    const id1 = upsertMemo('ticket', { content: '旧' })
    // 重置为默认 → 解绑（输入页确认回调行为）
    setBoundMemoId('ticket', null)
    const id2 = upsertMemo('ticket', { content: '新' })
    expect(id2).not.toBe(id1)
    const list = listMemos()
    expect(list).toHaveLength(2)
    expect(getBoundMemoId('ticket')).toBe(id2)
  })

  it('规则 4 —— 删除素材时解绑草稿：下次分享干净新建，不「复活」', () => {
    const id = upsertMemo('ticket', { content: '会被删' })
    expect(deleteMemo(id)).toBe(true)
    expect(listMemos()).toHaveLength(0)
    expect(getBoundMemoId('ticket')).toBeNull()
    // 再次分享 → 新建，不指向已删素材
    const id2 = upsertMemo('ticket', { content: '复活检查' })
    expect(id2).not.toBe(id)
    expect(listMemos()).toHaveLength(1)
  })

  it('删除解绑只影响指向该素材的草稿（另一模板绑定不受波及）', () => {
    const tId = upsertMemo('ticket', { content: 't' })
    const gId = upsertMemo('glow', { content: 'g' })
    deleteMemo(tId)
    expect(getBoundMemoId('glow')).toBe(gId)
    expect(listMemos()).toHaveLength(1)
  })

  it('绑定指向已删素材（外部删除）时，upsert 按无绑定处理', async () => {
    const id = upsertMemo('ticket', { content: 'a' })
    // 模拟素材被外部清掉但绑定残留
    store.delete('unicard_library')
    const id2 = upsertMemo('ticket', { content: 'b' })
    expect(id2).not.toBe(id)
    expect(listMemos()).toHaveLength(1)
    expect(getBoundMemoId('ticket')).toBe(id2)
  })

  it('删除不存在的素材返回 false，库不变', () => {
    upsertMemo('ticket', { content: 'a' })
    expect(deleteMemo('m_nonexistent')).toBe(false)
    expect(listMemos()).toHaveLength(1)
  })

  it('新素材插在列表头部（时间倒序）', () => {
    upsertMemo('ticket', { content: '第一条' })
    setBoundMemoId('ticket', null)
    upsertMemo('ticket', { content: '第二条' })
    expect(listMemos()[0].fields.content).toBe('第二条')
  })
})
