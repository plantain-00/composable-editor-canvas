import * as React from "react"
import { colorStringToNumber, getColorString } from "../../utils/color"
import { controlStyle, JsonEditorProps } from "./common"

/**
 * @public
 */
export function NumberEditor(props: JsonEditorProps<number> & {
  type?: React.HTMLInputTypeAttribute
}): JSX.Element {
  const [text, setText] = React.useState(props.type === 'color' ? getColorString(props.value) : props.value.toString())
  React.useEffect(() => {
    setText(props.type === 'color' ? getColorString(props.value) : props.value.toString())
  }, [props.value])
  const onComplete = () => {
    if (props.readOnly || !props.setValue) {
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
  if (props.readOnly|| !props.setValue) {
    extraStyle.opacity = 0.5
  }
  return (
    <input
      value={text}
      type={props.type ?? 'number'}
      disabled={props.readOnly|| !props.setValue}
      onChange={(e) => {
        if (props.readOnly|| !props.setValue) {
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
          props.onCancel?.()
          return
        }
        e.stopPropagation()
      }}
      onBlur={() => {
        setTimeout(() => {
          onComplete()
        }, 0)
      }}
    />
  )
}
