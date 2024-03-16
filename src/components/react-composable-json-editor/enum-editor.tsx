import * as React from "react"
import { produce, castDraft } from "immer"
import { controlStyle, JsonEditorProps } from "./common"

/**
 * @public
 */
export function EnumArrayEditor<T extends string>(props: JsonEditorProps<T[]> & {
  enums: readonly T[]
  enumTitles?: readonly string[]
}): JSX.Element {
  return (
    <div style={props.style}>
      {props.enums.map((e, i) => (
        <label key={e} style={{ marginRight: '10px' }}>
          <input
            type='checkbox'
            checked={props.value.includes(e)}
            style={{ marginRight: '5px' }}
            disabled={props.readOnly || !props.setValue}
            onChange={() => {
              if (props.readOnly || !props.setValue) {
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
export function EnumEditor<T extends string | number>(props: JsonEditorProps<T> & {
  enums: readonly T[]
  enumTitles?: readonly (string | JSX.Element)[]
  select?: boolean
}): JSX.Element {
  if (props.select) {
    return (
      <select
        style={{ ...controlStyle, ...props.style }}
        disabled={props.readOnly || !props.setValue}
        value={props.value}
        onChange={(e) => {
          if (props.readOnly || !props.setValue) {
            return
          }
          let v: number | string = e.target.value
          if (typeof props.enums[0] === 'number') {
            v = +v
          }
          // type-coverage:ignore-next-line
          props.setValue(v as T)
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
            disabled={props.readOnly || !props.setValue}
            checked={props.value === e}
            style={{ marginRight: '5px' }}
            onChange={() => {
              if (props.readOnly || !props.setValue) {
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
