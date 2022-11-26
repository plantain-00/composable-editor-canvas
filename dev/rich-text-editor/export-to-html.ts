import { getColorString, Merger } from '../../src'
import { isText, RichText, RichTextBlock, RichTextInline, RichTextStyle } from './model'

export function blocksToHtml(blocks: readonly RichTextBlock[], exportToHtmls: ((richText: RichTextInline) => string | undefined)[]) {
  return blocks.map((b, blockIndex) => {
    let children = ''
    const merger = new Merger<RichText, string>(
      last => {
        const tag = last.type.type ?? 'span'
        return children += `<${tag} style="${richTextStyleToHtmlStyle(last.type)}">${new Option(last.target.join('')).innerHTML}</${tag}>`
      },
      (a, b) => a.backgroundColor === b.backgroundColor &&
        a.bold === b.bold &&
        a.color === b.color &&
        a.fontFamily === b.fontFamily &&
        a.fontSize === b.fontSize &&
        a.italic === b.italic &&
        a.passThrough === b.passThrough &&
        a.underline === b.underline &&
        a.type === b.type,
      a => a.text,
    )
    b.children.forEach(c => {
      for (const exportToHtml of exportToHtmls) {
        const r = exportToHtml(c)
        if (r) {
          merger.flushLast()
          children += r
          return
        }
      }
      if (isText(c)) {
        merger.push(c)
      }
    })
    merger.flushLast()
    let style = richTextStyleToHtmlStyle(b)
    if (b.blockStart) style += `margin-block-start: ${b.blockStart}px;`
    if (b.blockEnd) style += `margin-block-end: ${b.blockEnd}px;`
    if (b.inlineStart) style += `padding-inline-start: ${b.inlineStart}px;`
    if (b.void) return `<${b.type} style="${style}">`
    if (b.type === 'ul' || b.type === 'ol') {
      children = `<li>${children}</li>`
      if (blocks[blockIndex - 1]?.type !== b.type) {
        children = `<${b.type} style="${style}">${children}`
      }
      if (blocks[blockIndex + 1]?.type !== b.type) {
        children = `${children}</${b.type}>`
      }
      return children
    }
    children = children || '<br>'
    return `<${b.type} style="${style}">${children}</${b.type}>`
  }).join('')
}

export function richTextStyleToHtmlStyle(c: Partial<RichTextStyle>) {
  let style = ''
  if (c.backgroundColor !== undefined) style += `background-color: ${getColorString(c.backgroundColor)};`
  if (c.bold) style += 'font-weight: bold;'
  if (c.color !== undefined) style += `color: ${getColorString(c.color)};`
  if (c.fontFamily) style += `font-family: ${c.fontFamily};`
  if (c.fontSize) style += `font-size: ${c.fontSize}px;`
  if (c.italic) style += `font-style: italic;`
  const textDecorations: string[] = []
  if (c.passThrough) textDecorations.push('line-through')
  if (c.underline) textDecorations.push('underline')
  if (textDecorations.length > 0) style += `text-decoration: ${textDecorations.join(' ')};`
  return style
}
