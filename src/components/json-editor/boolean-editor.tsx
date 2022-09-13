import * as React from "react"
import { JsonEditorProps } from "./common"

/**
 * @public
 */
export function BooleanEditor(props: JsonEditorProps<boolean>) {
  return (
    <input
      type='checkbox'
      checked={props.value}
      onChange={(e) => props.setValue(e.target.checked)}
      style={props.style}
    />
  )
}
