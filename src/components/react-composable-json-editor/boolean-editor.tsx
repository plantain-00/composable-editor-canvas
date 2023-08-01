import * as React from "react"
import { JsonEditorProps } from "./common"

/**
 * @public
 */
export function BooleanEditor(props: JsonEditorProps<boolean>): JSX.Element {
  return (
    <div style={props.style}>
      <input
        type='checkbox'
        disabled={props.readOnly || !props.setValue}
        checked={props.value}
        onChange={(e) => {
          if (!props.readOnly && props.setValue) {
            props.setValue(e.target.checked)
          }
        }}
      />
    </div>
  )
}
