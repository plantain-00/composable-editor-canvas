import * as React from "react"
import { useKey } from "./use-key"

export function useSelected<T extends SelectPath = SelectPath>(options?: Partial<{
  onChange: (s: readonly T[]) => void
  maxCount: number
}>) {
  const [selected, setSelected] = React.useState<readonly T[]>([])

  React.useEffect(() => {
    options?.onChange?.(selected)
  }, [selected])

  useKey((e) => e.key === 'Escape', () => {
    setSelected([])
  }, [setSelected])

  const addSelection = (value: readonly T[], maxCount = options?.maxCount, reachMaxCount?: (selected: T[]) => void) => {
    value = value.filter((s) => !isSelected(s, selected))
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
  const filterSelection = (filter?: (value: T) => boolean, maxCount = options?.maxCount) => {
    let result = filter ? selected.filter(filter) : selected
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
      setSelected(value.filter((v): v is T => v !== undefined))
    },
  }
}

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
