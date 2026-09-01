/**
 * 素材自动归档（ADR 0001 / 0002）
 *
 * 分享即存稿：出图成功触发 upsert（V3.9 起；此前为进入卡片预览页时触发）——
 *   草稿无绑定素材 id   → 新建素材并回写绑定
 *   草稿有绑定且素材在 → 更新该素材（fields / updatedAt 刷新）
 *   绑定指向已删素材   → 按无绑定处理，新建
 * 删除素材时同步解绑指向它的草稿（删除行为可信，不复活）。
 *
 * 记录结构：{ id, template, fields, note, updatedAt }——note 一期恒空，结构预留。
 */
import { readStorage, writeStorage, getBoundMemoId, setBoundMemoId } from './storage.js'
import { TEMPLATES } from './templates.js'

const LIB_KEY = 'unicard_library'

function loadLib() {
  return readStorage(LIB_KEY) || []
}

function saveLib(list) {
  writeStorage(LIB_KEY, list)
}

function genId() {
  return 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 出图成功时归档：按身份绑定 upsert，返回素材 id（调用点：输入页 onShareTap） */
export function upsertMemo(templateId, fields) {
  const list = loadLib()
  const boundId = getBoundMemoId(templateId)
  const idx = boundId ? list.findIndex((m) => m.id === boundId) : -1

  // 更新：绑定存在且素材在库
  if (idx >= 0) {
    list[idx] = { ...list[idx], fields: { ...fields }, updatedAt: Date.now() }
    saveLib(list)
    return list[idx].id
  }

  // 新建：无绑定（或绑定已失效）→ 建新素材并回写绑定
  const memo = {
    id: genId(),
    template: templateId,
    fields: { ...fields },
    note: '',
    updatedAt: Date.now(),
  }
  list.unshift(memo)
  saveLib(list)
  setBoundMemoId(templateId, memo.id)
  return memo.id
}

/** 删除素材：同时解绑所有指向它的草稿（防止下次分享「复活」） */
export function deleteMemo(id) {
  const list = loadLib()
  const next = list.filter((m) => m.id !== id)
  const existed = next.length !== list.length
  saveLib(next)
  for (const t of TEMPLATES) {
    if (getBoundMemoId(t.id) === id) {
      setBoundMemoId(t.id, null)
    }
  }
  return existed
}

/** 素材列表（新的在前；二期素材库页面消费） */
export function listMemos() {
  return loadLib()
}
