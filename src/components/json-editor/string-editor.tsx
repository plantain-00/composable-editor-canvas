import * as React from "react"
import { controlStyle, JsonEditorProps } from "./common"

/**
 * @public
 */
export function StringEditor(props: JsonEditorProps<string> & {
  type?: React.HTMLInputTypeAttribute
  textarea?: boolean
}) {
  const [text, setText] = React.useState(props.value)
  React.useEffect(() => {
    setText(props.value)
  }, [props.value])
  const onComplete = () => {
    if (text !== props.value) {
      props.setValue(text)
    }
  }
  if (props.textarea) {
    return (
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onComplete()
          }
        }}
        onBlur={onComplete}
        style={{ ...controlStyle, ...props.style }}
      />
    )
  }
  let preview: JSX.Element | undefined
  if (props.value.startsWith('http')) {
    preview = <img src={props.value} style={{ display: 'block', height: 'auto', margin: '6px 0px', maxWidth: '100%' }} />
  }
  return (
    <>
      <input
        value={text}
        type={props.type ?? 'text'}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onComplete()
          }
        }}
        onBlur={onComplete}
        style={{ ...controlStyle, ...props.style }}
      />
      {preview}
    </>
  )
}
