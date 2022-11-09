import produce from "immer"
import React from "react"
import { reactCanvasRenderTarget, useFlowLayoutTextEditor } from "../src"

export default () => {
  const [state, setState] = React.useState(() => '1 + 2 = 3'.split(''))
  const { renderEditor, layoutResult } = useFlowLayoutTextEditor({
    state,
    setState: recipe => setState(produce(state, recipe)),
    width: 400,
    height: 200,
    fontSize: 20,
    fontFamily: 'monospace',
    lineHeight: 20 * 1.2,
  })
  const getTextColors = (index: number) => {
    if (['+', '-', '*', '/', '='].includes(layoutResult[index].content)) {
      return { color: 0x0000ff }
    }
    return
  }

  return renderEditor({ target: reactCanvasRenderTarget, getTextColors })
}
