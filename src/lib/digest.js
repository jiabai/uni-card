/**
 * 「深色要点卡」的正文解析
 *
 * 语法：用 `\n` 分行；**空行原样保留**，在卡片上占一整行的高度，因此它就是段落间距。
 * 非空行里，第一个冒号（「：」或「:」）之前的文字作为加粗小标题，冒号之后的其余文字为正文，
 * 两者在同一行里流式排布。
 *
 * 冒号字符本身、以及它后面紧随的空白一律原样保留（空白折叠成一个空格）：
 * 英文内容写「Label: text」时这个空格就是词间距，中文内容写「名称：内容」时本来就没有空格，两种都无需特殊处理。
 * （票根卡会把冒号统一成全角「：」，本卡不这么做，以保住英文内容里冒号后的那个空格）。
 *
 * 组件靠 CSS 自动换行、绘制器靠 canvas 手动换行，两者共用这一份解析结果，
 * 保证预览与导出图的加粗位置、段落间距完全一致。
 */

/**
 * 正文 → 行数组。
 * 返回 [{ blank: true }] 或 [{ blank: false, label, text }]；
 * 首尾的空行被裁掉，避免卡片顶部与底部多出一段空白。
 */
export function parseDigestLines(content) {
  const lines = String(content || '')
    .split('\n')
    .map((s) => s.trim())
    .map(parseLine)

  let start = 0
  let end = lines.length
  while (start < end && lines[start].blank) start++
  while (end > start && lines[end - 1].blank) end--

  return lines.slice(start, end)
}

/** 单行 → { blank } 或 { label, text }；行首就是冒号时整行按正文处理，不吞字符 */
function parseLine(line) {
  if (!line) return { blank: true }

  let idx = line.indexOf('：')
  if (idx === -1) idx = line.indexOf(':')
  if (idx <= 0) return { blank: false, label: '', text: line }

  return {
    blank: false,
    // 冒号用原文那一个（不统一成全角），前面的尾空白去掉
    label: line.slice(0, idx).trim() + line[idx],
    // 冒号后的空白折叠成一个空格；本来就没有空白时不动
    text: line.slice(idx + 1).replace(/^\s+/, ' '),
  }
}
