/**
 * 行内高亮片段解析（「醒目大字卡」的行内语法）
 *
 * 语法：一段话里的 `**文字**` 记为高亮片段，组件渲染与导出绘制都换成高亮色。
 * 未闭合的 `**` 按普通文字原样保留，不吞字。
 *
 * 返回：按换行切分、剔除空行后，每行一个片段数组 [{ text, hl }]。
 * 组件靠 CSS 自动换行、绘制器靠 canvas 手动换行，两者共用这一份解析结果，
 * 保证预览与导出图的高亮位置完全一致（片段样式不影响字宽，换行点因此可复用）。
 */
export function parseHighlightLines(content) {
  return String(content || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseSegments)
}

/** 单行文本 → 片段数组：`**` 成对包围的片段 hl = true */
function parseSegments(line) {
  const segments = []
  let cursor = 0

  while (cursor < line.length) {
    const open = line.indexOf('**', cursor)
    if (open === -1) {
      push(segments, line.slice(cursor), false)
      break
    }
    const close = line.indexOf('**', open + 2)
    if (close === -1) {
      // 未闭合：整段按普通文字处理，连 `**` 一起原样显示
      push(segments, line.slice(cursor), false)
      break
    }
    push(segments, line.slice(cursor, open), false)
    push(segments, line.slice(open + 2, close), true)
    cursor = close + 2
  }

  return segments
}

function push(segments, text, hl) {
  if (text) segments.push({ text, hl })
}
