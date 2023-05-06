import { produce } from "immer"
import React from "react"
import { Align, EnumEditor, VerticalAlign, aligns, reactCanvasRenderTarget, useFlowLayoutTextEditor, verticalAligns } from "../src"

export default () => {
  const [state, setState] = React.useState(() => '1 + 2 = 3'.split(''))
  const [align, setAlign] = React.useState<Align>('left')
  const [verticalAlign, setVerticalAlign] = React.useState<VerticalAlign>('top')
  const { renderEditor, layoutResult } = useFlowLayoutTextEditor({
    state,
    setState: recipe => setState(produce(state, recipe)),
    width: 400,
    height: 200,
    fontSize: 20,
    fontFamily: 'monospace',
    lineHeight: 20 * 1.2,
    align,
    verticalAlign,
  })
  const getTextColors = (index: number) => {
    if (['+', '-', '*', '/', '='].includes(layoutResult[index].content)) {
      return { color: 0x0000ff }
    }
    return
  }

  return (
    <>
      {renderEditor({ target: reactCanvasRenderTarget, getTextColors })}
      <EnumEditor enums={aligns} value={align} setValue={setAlign} />
      <EnumEditor enums={verticalAligns} value={verticalAlign} setValue={setVerticalAlign} />
    </>
  )
}
