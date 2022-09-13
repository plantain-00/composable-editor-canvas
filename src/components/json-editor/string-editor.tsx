import * as React from "react"
import { controlStyle, JsonEditorProps } from "./common"

/**
 * @public
 */
export function StringEditor(props: JsonEditorProps<string> & {
  type?: React.HTMLInputTypeAttribute
  textarea?: boolean
}) {
  if (props.textarea) {
    return (
      <textarea
        value={props.value}
        onChange={(e) => props.setValue(e.target.value)}
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
        value={props.value}
        type={props.type ?? 'text'}
        onChange={(e) => props.setValue(e.target.value)}
        style={{ ...controlStyle, ...props.style }}
      />
      {preview}
    </>
  )
}
