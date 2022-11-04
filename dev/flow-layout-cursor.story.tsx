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

  const { cursor, onMouseDown, onMouseUp, onMouseMove, isSelected, iterateContentPosition } = useFlowLayoutCursor({
    state,
    setState: recipe => setState(produce(state, recipe)),
    width,
    fontSize,
    fontFamily,
    lineHeight,
    getTextContent,
  })

  const target: ReactRenderTarget<unknown> = reactCanvasRenderTarget
  const children: unknown[] = []
  for (const { x, y, i, content } of iterateContentPosition()) {
    if (isSelected(i)) {
      children.push(target.renderRect(x, y, content.width, lineHeight, { fillColor: 0xB3D6FD, strokeWidth: 0 }))
    }
    const color = ['+', '-', '*', '/', '='].includes(content.text) ? 0x0000ff : 0x000000
    children.push(target.renderText(x + content.width / 2, y + fontSize, content.text, color, fontSize, fontFamily, { textAlign: 'center' }))
  }
  const result = target.renderResult(children, width, height, {
    attributes: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      style: {
        cursor: 'text',
      }
    }
  })
  return (
    <div
      style={{
        position: 'relative',
        width: width + 'px',
        height: height + 'px',
        border: '1px solid black',
      }}
      onMouseLeave={onMouseUp}
    >
      {cursor}
      {result}
    </div>
  )
}
