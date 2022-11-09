import * as React from "react"
import { focusedOnInput } from ".."
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
    return () => {
      focusedOnInput.value = false
    }
  }, [props.value])
  const onComplete = () => {
    if (!props.readOnly && text !== props.value) {
      props.setValue(text)
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
  if (props.textarea) {
    return (
      <textarea
        value={text}
        disabled={props.readOnly}
        onChange={(e) => {
          if (props.readOnly) {
            return
          }
          setText(e.target.value)
        }}
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
        style={{ ...controlStyle, ...props.style, ...extraStyle }}
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
        disabled={props.readOnly}
        type={props.type ?? 'text'}
        onChange={(e) => {
          if (props.readOnly) {
            return
          }
          setText(e.target.value)
        }}
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
        style={{ ...controlStyle, ...props.style, ...extraStyle }}
      />
      {preview}
    </>
  )
}
