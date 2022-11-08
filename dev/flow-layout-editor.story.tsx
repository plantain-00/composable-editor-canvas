import produce from "immer"
import React from "react"
import { FlowLayoutText, loadFlowLayoutText, reactCanvasRenderTarget, useFlowLayoutEditor } from "../src"

export default () => {
  const fontSize = 20
  const fontFamily = 'monospace'
  const [state, setState] = React.useState<readonly FlowLayoutText[]>(() => loadFlowLayoutText('1 + 2 = 3', fontSize, fontFamily))

  const { renderEditor, layoutResult } = useFlowLayoutEditor({
    state,
    setState: recipe => setState(produce(state, recipe)),
    width: 400,
    height: 200,
    fontSize,
    fontFamily,
    lineHeight: fontSize * 1.2,
  })
  const getTextColors = (index: number) => {
    if (['+', '-', '*', '/', '='].includes(layoutResult[index].content.text)) {
      return { color: 0x0000ff }
    }
    return
  }

  return renderEditor({ target: reactCanvasRenderTarget, getTextColors })
}
