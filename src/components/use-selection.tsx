import * as React from "react"

export function useSelection<T extends string | number | readonly [number, number]>(options?: Partial<{
  onChange: (s: readonly T[]) => void
}>) {
  const [selected, setSelected] = React.useState<readonly T[]>([])

  const isSelected = (value: T, s = selected) => {
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
  const addSelection = (value: readonly T[], max?: number) => {
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
  const filterSelection = (filter: (value: T) => boolean, max?: number) => {
    let result = selected.filter(filter)
    if (max !== undefined) {
      result = result.slice(-max)
    }
    setSelected(result)
    return {
      selected: result,
      isSelected: (value: T) => result.includes(value)
    }
  }

  React.useEffect(() => {
    options?.onChange?.(selected)
  }, [selected])

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
