import * as React from "react"
import { focusedOnInput } from ".."
import { colorStringToNumber, getColorString } from "../react-render-target/react-svg-render-target"
import { controlStyle, JsonEditorProps } from "./common"

/**
 * @public
 */
export function NumberEditor(props: JsonEditorProps<number> & {
  type?: React.HTMLInputTypeAttribute
}) {
  const [text, setText] = React.useState(props.type === 'color' ? getColorString(props.value) : props.value.toString())
  React.useEffect(() => {
    setText(props.type === 'color' ? getColorString(props.value) : props.value.toString())
  }, [props.value])
  const onComplete = () => {
    if (props.readOnly) {
      return
    }
    let value: number
    if (props.type === 'color') {
      value = colorStringToNumber(text)
    } else {
      value = +text
    }
    if (!isNaN(value) && value !== props.value) {
      props.setValue(value)
    }
  }
  let extraStyle: React.CSSProperties = {}
  if (props.type === 'color') {
    extraStyle = {
      flex: 'unset',
      padding: 0,
    }
  }
  if (props.readOnly) {
    extraStyle.opacity = 0.5
  }
  return (
    <input
      value={text}
      type={props.type ?? 'number'}
      disabled={props.readOnly}
      onChange={(e) => {
        if (props.readOnly) {
          return
        }
        setText(e.target.value)
      }}
      style={{ ...controlStyle, ...props.style, ...extraStyle }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onComplete()
        }
        if (e.key === 'Escape') {
          return
        }
        e.stopPropagation()
      }}
      onBlur={() => {
        focusedOnInput.value = false
        setTimeout(() => {
          onComplete()
        }, 0)
      }}
      onFocus={() => {
        focusedOnInput.value = true
      }}
    />
  )
}
