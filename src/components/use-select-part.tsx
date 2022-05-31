import * as React from "react"
import { useKey } from "./use-key"

export function useSelectPart<T extends string | number>(options?: Partial<{
  onChange: (s: readonly (T | readonly [T, number])[]) => void
}>) {
  const [selected, setSelected] = React.useState<readonly ((T | readonly [T, number]))[]>([])

  const isSelected = (value: (T | readonly [T, number]), s = selected) => {
    if (typeof value === 'number' || typeof value === 'string') {
      if (s.includes(value)) {
        return true
      }
      const result: number[] = []
      for (const h of s) {
        if (typeof h !== 'number' && typeof h !== 'string' && h[0] === value) {
          result.push(h[1])
        }
      }
      return result.length > 0 ? result : false
    }
    return s.some((v) => typeof v !== 'number' && typeof v !== 'string' && v[0] === value[0] && v[1] === value[1])
  }
  const addSelection = (value: readonly ((T | readonly [T, number]))[], max?: number) => {
    value = value.filter((s) => isSelected(s) !== true)
    if (value.length > 0) {
      let result = [...selected, ...value]
      if (max !== undefined) {
        result = result.slice(-max)
      }
      setSelected(result)
      return result
    }
    return selected
  }
  const filterSelection = (filter: (value: (T | readonly [T, number])) => boolean, max?: number) => {
    let result = selected.filter(filter)
    if (max !== undefined) {
      result = result.slice(-max)
    }
    setSelected(result)
    return {
      selected: result,
      isSelected: (value: (T | readonly [T, number])) => result.includes(value)
    }
  }

  React.useEffect(() => {
    options?.onChange?.(selected)
  }, [selected])

  useKey((e) => e.key === 'Escape', () => {
    setSelected([])
  }, [setSelected])

  return {
    selected,
    filterSelection,
    clearSelection() {
      setSelected([])
    },
    isSelected,
    addSelection,
    setSelection: setSelected,
    selectedCount: selected.length,
  }
}
