import * as React from "react"
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
  const extraStyle = props.type === 'color' ? {
    flex: 'unset',
    padding: 0,
  } : undefined
  return (
    <input
      value={text}
      type={props.type ?? 'number'}
      onChange={(e) => setText(e.target.value)}
      style={{ ...controlStyle, ...props.style, ...extraStyle }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onComplete()
        }
      }}
      onBlur={onComplete}
    />
  )
}
