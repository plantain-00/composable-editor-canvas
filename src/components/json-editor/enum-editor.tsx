import * as React from "react"
import produce, { castDraft } from "immer"
import { JsonEditorProps } from "./common"

/**
 * @public
 */
export function EnumArrayEditor<T extends string>(props: JsonEditorProps<T[]> & {
  enums: readonly T[]
  enumTitles?: readonly string[]
}) {
  return (
    <div style={props.style}>
      {props.enums.map((e, i) => (
        <label key={e} style={{ marginRight: '10px' }}>
          <input
            type='checkbox'
            checked={props.value.includes(e)}
            style={{ marginRight: '5px' }}
            onChange={() => {
              const index = props.value.indexOf(e)
              props.setValue(produce(props.value, draft => {
                if (index >= 0) {
                  draft.splice(index, 1)
                } else {
                  draft.push(castDraft(e))
                }
              }))
            }}
          />
          {props.enumTitles?.[i] ?? e}
        </label>
      ))}
    </div>
  )
}

/**
 * @public
 */
export function EnumEditor<T extends string>(props: JsonEditorProps<T> & {
  enums: readonly T[]
  enumTitles?: readonly string[]
}) {
  return (
    <div style={props.style}>
      {props.enums.map((e, i) => (
        <label key={e} style={{ marginRight: '10px' }}>
          <input
            type='radio'
            checked={props.value === e}
            style={{ marginRight: '5px' }}
            onChange={() => props.setValue(e)}
          />
          {props.enumTitles?.[i] ?? e}
        </label>
      ))}
    </div>
  )
}
