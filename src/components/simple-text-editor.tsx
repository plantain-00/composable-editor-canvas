import React from "react"
import { reactCanvasRenderTarget } from "./react-render-target"
import { JsonEditorProps, controlStyle } from "./react-composable-json-editor"
import { metaKeyIfMacElseCtrlKey } from "../utils/key"
import { useFlowLayoutTextEditor } from "./use-flow-layout-text-editor"
import { useUndoRedo } from "./use-undo-redo"
import { Align, VerticalAlign } from "../utils/flow-layout"
import { Position } from "../utils/position"

export function SimpleTextEditor(props: JsonEditorProps<string> & Position & {
  width: number
  height?: number
  fontSize: number
  color: number
  fontFamily: string
  align?: Align
  verticalAlign?: VerticalAlign
  borderWidth?: number
  lineHeight?: number
}) {
  const { state, setState, undo, redo } = useUndoRedo(props.value.split(''))
  const { renderEditor } = useFlowLayoutTextEditor({
    state,
    setState,
    width: props.width,
    height: props.height ?? 100,
    fontSize: props.fontSize,
    fontFamily: props.fontFamily,
    lineHeight: props.lineHeight ?? props.fontSize * 1.2,
    processInput(e) {
      if (e.key === 'Escape') {
        props.onCancel?.()
        return true
      }
      e.stopPropagation()
      if (metaKeyIfMacElseCtrlKey(e)) {
        if (e.key === 'z') {
          if (e.shiftKey) {
            redo(e)
          } else {
            undo(e)
          }
          return true
        }
      }
      return false
    },
    autoHeight: true,
    autoFocus: true,
    onBlur: () => {
      setTimeout(() => {
        if (!props.readOnly && props.setValue) {
          const value = state.join('')
          if (value !== props.value) {
            props.setValue(value)
          }
        }
      }, 0)
    },
    align: props.align,
    verticalAlign: props.verticalAlign,
    style: { border: 'unset' },
  })
  const borderWidth = props.borderWidth ?? 1
  return (
    <div style={{ position: 'absolute', zIndex: 10, ...controlStyle, padding: '0px', left: `${props.x - borderWidth}px`, top: `${props.y - borderWidth}px`, borderWidth: `${borderWidth}px` }}>
      {renderEditor({ target: reactCanvasRenderTarget, getTextColors: () => ({ color: props.color }) })}
    </div>
  )
}