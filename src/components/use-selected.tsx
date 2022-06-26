import * as React from "react"
import { useKey } from "./use-key"

export function useSelected<T extends SelectPath = SelectPath>(options?: Partial<UseSelectedOptions<T>>) {
  const [selected, setSelected] = React.useState<readonly T[]>([])

  React.useEffect(() => {
    options?.onChange?.(selected)
  }, [selected])

  useKey((e) => e.key === 'Escape', () => {
    setSelected([])
  }, [setSelected])

  const addSelection = (
    value: readonly T[],
    maxCount = options?.maxCount,
    reachMaxCount?: (selected: T[]) => void,
    selectable?: (value: T) => boolean,
  ) => {
    value = value.filter((s) => !isSelected(s, selected) && (selectable?.(s) ?? true))
    if (value.length > 0) {
      let result = [...selected, ...value]
      if (maxCount !== undefined) {
        result = result.slice(-maxCount)
      }
      setSelected(result)
      if (maxCount !== undefined && maxCount === result.length) {
        reachMaxCount?.(result)
      }
    }
  }
  const filterSelection = (selectable?: (value: T) => boolean, maxCount = options?.maxCount, s = selected) => {
    let result = selectable ? s.filter(selectable) : s
    if (maxCount !== undefined) {
      result = result.slice(-maxCount)
    }
    setSelected(result)
    return {
      result,
      needSelect: maxCount === undefined ? result.length === 0 : result.length < maxCount,
    }
  }
  return {
    selected,
    filterSelection,
    isSelected: (value: T, s = selected) => {
      return isSelected(value, s)
    },
    addSelection,
    setSelected(...value: readonly (T | undefined)[]) {
      const s = value.filter((v): v is T => v !== undefined)
      if (s.length !== 0 || selected.length !== 0) {
        setSelected(s)
      }
    },
  }
}

export interface UseSelectedOptions<T> {
  onChange: (s: readonly T[]) => void
  maxCount: number
}

/**
 * @public
 */
export function isSelected<T extends SelectPath = SelectPath>(value: T, selected: readonly T[]) {
  return selected.some((v) => isSamePath(value, v))
}

export function isSamePath<T extends SelectPath = SelectPath>(path1: T | undefined, path2: T | undefined) {
  if (path1 && path2) {
    if (path1.length !== path2.length) {
      return false
    }
    for (let i = 0; i < path1.length; i++) {
      if (path1[i] !== path2[i]) {
        return false
      }
    }
    return true
  }
  return path1 === undefined && path2 === undefined
}

export type SelectPath = readonly (string | number)[]
