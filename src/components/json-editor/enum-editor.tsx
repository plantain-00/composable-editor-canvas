import * as React from "react"
import produce, { castDraft } from "immer"
import { controlStyle, JsonEditorProps } from "./common"

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
            disabled={props.readOnly}
            onChange={() => {
              if (props.readOnly) {
                return
              }
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
  select?: boolean
}) {
  if (props.select) {
    return (
      <select
        style={{ ...controlStyle, ...props.style }}
        disabled={props.readOnly}
        value={props.value}
        onChange={(e) => {
          if (props.readOnly) {
            return
          }
          // type-coverage:ignore-next-line
          props.setValue(e.target.value as T)
        }}
      >
        {props.enums.map((e, i) => <option key={e} value={e}>{props.enumTitles?.[i] ?? e}</option>)}
      </select>
    )
  }
  return (
    <div style={props.style}>
      {props.enums.map((e, i) => (
        <label key={e} style={{ marginRight: '10px' }}>
          <input
            type='radio'
            disabled={props.readOnly}
            checked={props.value === e}
            style={{ marginRight: '5px' }}
            onChange={() => {
              if (props.readOnly) {
                return
              }
              props.setValue(e)
            }}
          />
          {props.enumTitles?.[i] ?? e}
        </label>
      ))}
    </div>
  )
}
