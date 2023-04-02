import produce from "immer"
import React from "react"
import { EnumEditor, reactCanvasRenderTarget, useFlowLayoutTextEditor } from "../src"

export default () => {
  const [state, setState] = React.useState(() => '1 + 2 = 3'.split(''))
  const [align, setAlign] = React.useState<'left' | 'center' | 'right'>('left')
  const [verticalAlign, setVerticalAlign] = React.useState<'top' | 'middle' | 'bottom'>('top')
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
      <EnumEditor enums={['left', 'center', 'right']} value={align} setValue={setAlign} />
      <EnumEditor enums={['top', 'middle', 'bottom']} value={verticalAlign} setValue={setVerticalAlign} />
    </>
  )
}
