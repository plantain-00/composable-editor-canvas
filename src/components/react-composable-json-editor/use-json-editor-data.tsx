import { produce, Draft } from "immer"
import * as React from "react"
import { Primitive } from "../../utils/types"

/**
 * @public
 */
export function useJsonEditorData<V>(defaultValue: V) {
  const [value, setValue] = React.useState(defaultValue)
  return {
    value,
    update: <T,>(recipe: (draft: Draft<typeof value>, v: T) => void) => {
      return (v: T) => {
        setValue(produce(value, (draft) => {
          recipe(draft, v)
        }))
      }
    },
    getArrayProps: <T extends object | Primitive,>(getArray: (v: Draft<typeof value>) => T[], defaultValue: T) => {
      return getArrayEditorProps(getArray, defaultValue, update => {
        setValue(produce(value, draft => {
          update(draft)
        }))
      })
    },
  }
}

/**
 * @public
 */
export function getArrayEditorProps<T extends object | Primitive, V>(
  getArray: (v: Draft<V>) => T[],
  defaultValue: T | (() => T),
  update: (recipe: (draft: Draft<V>) => void) => void,
) {
  return {
    add: () => update(draft => {
      getArray(draft).push(typeof defaultValue === 'function' ? defaultValue() : defaultValue)
    }),
    remove: (i: number) => update(draft => {
      getArray(draft).splice(i, 1)
    }),
    copy: (i: number) => update(draft => {
      const array = getArray(draft)
      array.splice(i, 0, array[i])
    }),
    moveUp: (i: number) => update(draft => {
      const array = getArray(draft)
      array.splice(i - 1, 0, array[i])
      array.splice(i + 1, 1)
    }),
    moveDown: (i: number) => update(draft => {
      const array = getArray(draft)
      array.splice(i + 2, 0, array[i])
      array.splice(i, 1)
    }),
  }
}
