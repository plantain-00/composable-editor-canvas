import * as React from "react"
import { controlStyle, JsonEditorProps } from "./common"

/**
 * @public
 */
export function NumberEditor(props: JsonEditorProps<number>) {
  return (
    <input
      value={props.value}
      onChange={(e) => props.setValue(+e.target.value)}
      style={{ ...controlStyle, ...props.style }}
    />
  )
}
