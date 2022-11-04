import produce from "immer"
import React from "react"
import { loadFlowLayoutText, reactCanvasRenderTarget, ReactRenderTarget, useFlowLayoutCursor } from "../src"

export default () => {
  const fontSize = 20
  const fontFamily = 'monospace'
  const width = 400
  const height = 200
  const lineHeight = fontSize * 1.2
  const getTextContent = (text: string, width: number) => ({ text, width })
  const [state, setState] = React.useState<readonly { text: string, width: number }[]>(loadFlowLayoutText('1 + 2 = 3', fontSize, fontFamily, getTextContent))

  const { container, isSelected, layoutResult } = useFlowLayoutCursor({
    state,
    setState: recipe => setState(produce(state, recipe)),
    width,
    height,
    fontSize,
    fontFamily,
    lineHeight,
    getTextContent,
  })

  const target: ReactRenderTarget<unknown> = reactCanvasRenderTarget
  const children: unknown[] = []
  for (const { x, y, i, content } of layoutResult) {
    if (isSelected(i)) {
      children.push(target.renderRect(x, y, content.width, lineHeight, { fillColor: 0xB3D6FD, strokeWidth: 0 }))
    }
    const color = ['+', '-', '*', '/', '='].includes(content.text) ? 0x0000ff : 0x000000
    children.push(target.renderText(x + content.width / 2, y + fontSize, content.text, color, fontSize, fontFamily, { textAlign: 'center' }))
  }
  const result = target.renderResult(children, width, height)
  return container(result)
}
