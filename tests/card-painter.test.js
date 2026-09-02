import { describe, it, expect } from 'vitest'
import * as painter from '../src/lib/card-painter.js'
import { waveConfig } from '../src/config.js'

const measureCtx = {
  measureText(text) {
    // 29px Georgia 的默认英文样例平均字宽约 14px；测试桩需保持该量级，
    // 才能验证参考图中的显式三行，而不是制造不存在的额外换行。
    return { width: String(text).length * 14 }
  },
}

describe('流线渐变卡 painter', () => {
  it('背景图直接加载成功后完成绘制，不让出图 Promise 悬空', async () => {
    const originalImage = globalThis.Image
    globalThis.Image = class {
      set src(_value) {
        // Vitest 未做 uni-app 条件编译时也会执行 H5 分支；保持静默，
        // 让断言只观察上面的 MP-WEIXIN canvas 图片加载结果。
      }
    }
    const ctx = {
      measureText: measureCtx.measureText,
      setTransform() {},
      fillRect() {},
      translate() {},
      drawImage() {},
      save() {},
      restore() {},
      beginPath() {},
      moveTo() {},
      arcTo() {},
      closePath() {},
      stroke() {},
      fillText() {},
    }
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ctx,
      createImage() {
        return {
          onload: null,
          onerror: null,
          set src(_value) {
            queueMicrotask(() => this.onload && this.onload())
          },
        }
      },
    }

    try {
      const outcome = await Promise.race([
        painter.paintCard(canvas, 'wave', waveConfig).then((result) => ({
          status: 'resolved',
          result,
        })),
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 50)),
      ])

      expect(outcome).toMatchObject({
        status: 'resolved',
        result: { width: 960, height: 1792, overflow: false },
      })
    } finally {
      if (originalImage === undefined) delete globalThis.Image
      else globalThis.Image = originalImage
    }
  })

  it('将开发者工具返回的页面 static 路径恢复为项目根路径', () => {
    expect(painter.normalizeImageInfoPath).toBeTypeOf('function')
    expect(
      painter.normalizeImageInfoPath('/pages/edit/static/wave-card-bg.png')
    ).toBe('/static/wave-card-bg.png')
    expect(
      painter.normalizeImageInfoPath('pages/edit/static/wave-card-bg.png')
    ).toBe('/static/wave-card-bg.png')
  })

  // 开发者工具 3.16.2 实测：getImageInfo('/static/x.png') → res.path === 'static/x.png'
  // 缺了前导斜杠会被 canvas 2d 按当前页面目录解析 → pages/edit/static/x.png → 加载失败
  it('给 getImageInfo 去掉前导斜杠的 static 路径补回根绝对路径', () => {
    expect(painter.normalizeImageInfoPath('static/wave-card-bg.png')).toBe(
      '/static/wave-card-bg.png'
    )
  })

  it('真机临时文件路径与正常根路径保持不变', () => {
    expect(painter.normalizeImageInfoPath('/static/wave-card-bg.png')).toBe(
      '/static/wave-card-bg.png'
    )
    expect(painter.normalizeImageInfoPath('wxfile://tmp_1a2b3c.png')).toBe(
      'wxfile://tmp_1a2b3c.png'
    )
    expect(painter.normalizeImageInfoPath('')).toBe('')
  })

  it('注册 wave painter 的逻辑宽度与页面底色', () => {
    expect(painter.getPainterSpec).toBeTypeOf('function')
    expect(painter.getPainterSpec('wave')).toEqual({
      width: 480,
      pageBg: '#f66b61',
    })
  })

  it('默认文案保持 480×896 构图和三行正文', () => {
    expect(painter.measureWaveLayout).toBeTypeOf('function')
    expect(painter.measureWaveLayout(measureCtx, waveConfig)).toMatchObject({
      width: 480,
      height: 896,
      frameX: 45,
      frameY: 332,
      frameWidth: 390,
      frameHeight: 226,
      blockHeight: 144,
      titleLines: ['Lorem Ipsum'],
      contentLines: [
        'is simply dummy text',
        'of the printing and',
        'typesetting industry',
      ],
    })
  })

  it('长正文扩展内容框和卡片高度而不裁切', () => {
    const fields = {
      title: 'Lorem Ipsum',
      content: Array.from({ length: 16 }, (_, index) => `line ${index + 1}`).join('\n'),
    }
    const layout = painter.measureWaveLayout(measureCtx, fields)
    expect(layout.contentLines).toHaveLength(16)
    expect(layout.frameHeight).toBeGreaterThan(224)
    expect(layout.height).toBeGreaterThan(896)
  })
})
