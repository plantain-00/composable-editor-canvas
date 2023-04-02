import produce from "immer"
import React from "react"
import { EnumEditor, metaKeyIfMacElseCtrlKey, reactCanvasRenderTarget, ReactRenderTarget, useFlowLayoutEditor } from "../src"

export default () => {
  const [state, setState] = React.useState(() => new Array(30).fill(0).map(() => ({
    radius: 5 + Math.round(Math.random() * 20),
    color: Math.round(Math.random() * 0xffffff),
  })))
  const [align, setAlign] = React.useState<'left' | 'center' | 'right'>('left')
  const [verticalAlign, setVerticalAlign] = React.useState<'top' | 'middle' | 'bottom'>('top')
  const width = 400
  const { renderEditor, layoutResult, lineHeights, isSelected, actualHeight, inputContent, getCopiedContents } = useFlowLayoutEditor({
    state,
    setState: recipe => setState(produce(state, recipe)),
    width,
    height: 200,
    lineHeight: c => c.radius * 2,
    getWidth: c => c.radius * 2,
    endContent: { radius: 0, color: 0 },
    isNewLineContent: content => content.radius === 0,
    align,
    verticalAlign,
    processInput(e) {
      if (e.key === 'Enter') {
        inputContent([{ radius: 0, color: 0 }])
        return true
      }
      if (metaKeyIfMacElseCtrlKey(e)) {
        if (e.key === 'v') {
          // eslint-disable-next-line plantain/promise-not-await
          navigator.clipboard.readText().then(v => {
            if (v) {
              inputContent(JSON.parse(v))
            }
          })
          e.preventDefault()
          return true
        }
        if (e.key === 'c' || e.key === 'x') {
          const contents = getCopiedContents(e.key === 'x')
          if (contents) {
            // eslint-disable-next-line plantain/promise-not-await
            navigator.clipboard.writeText(JSON.stringify(contents))
          }
          return true
        }
      }
      return false
    },
  })
  const target: ReactRenderTarget<unknown> = reactCanvasRenderTarget
  const children: unknown[] = []
  for (const { x, y, i, content, visible, row } of layoutResult) {
    if (!visible) continue
    if (isSelected(i)) {
      children.push(target.renderRect(x, y, content.radius * 2, lineHeights[row], { fillColor: 0xB3D6FD, strokeWidth: 0 }))
    }
    children.push(target.renderCircle(x + content.radius, y + lineHeights[row] / 2, content.radius, { fillColor: content.color, strokeWidth: 0 }))
  }
  const result = target.renderResult(children, width, actualHeight)
  return (
    <>
      {renderEditor(result)}
      <EnumEditor enums={['left', 'center', 'right']} value={align} setValue={setAlign} />
      <EnumEditor enums={['top', 'middle', 'bottom']} value={verticalAlign} setValue={setVerticalAlign} />
    </>
  )
}
