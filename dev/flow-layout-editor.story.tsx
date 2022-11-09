import produce from "immer"
import React from "react"
import { metaKeyIfMacElseCtrlKey, reactCanvasRenderTarget, ReactRenderTarget, useFlowLayoutEditor } from "../src"

export default () => {
  const [state, setState] = React.useState(() => new Array(80).fill(0).map(() => ({
    radius: 10 + Math.round(Math.random() * 15),
    color: Math.round(Math.random() * 0xffffff),
  })))
  const width = 400
  const lineHeight = 50
  const { renderEditor, layoutResult, isSelected, actualHeight, inputContent, getCopiedContents } = useFlowLayoutEditor({
    state,
    setState: recipe => setState(produce(state, recipe)),
    width,
    height: 200,
    lineHeight,
    getWidth: c => c.radius * 2,
    endContent: { radius: 0, color: 0 },
    isNewLineContent: content => content.radius === 0,
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
  for (const { x, y, i, content, visible } of layoutResult) {
    if (!visible) continue
    if (isSelected(i)) {
      children.push(target.renderRect(x, y, content.radius * 2, lineHeight, { fillColor: 0xB3D6FD, strokeWidth: 0 }))
    }
    children.push(target.renderCircle(x + content.radius, y + lineHeight / 2, content.radius, { fillColor: content.color, strokeWidth: 0 }))
  }
  if (children) {
    children.push(...children)
  }
  const result = target.renderResult(children, width, actualHeight)
  return renderEditor(result, lineHeight)
}
