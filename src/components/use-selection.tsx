import * as React from "react"

export function useSelection<T extends string | number>(options?: Partial<{
  onChange: (s: readonly T[]) => void
}>) {
  const [selected, setSelected] = React.useState<readonly T[]>([])

  const isSelected = (value: T) => selected.includes(value)
  const isNotSelected = (value: T) => !isSelected(value)
  const addSelection = (value: T[], max?: number) => {
    value = value.filter(isNotSelected)
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
    isNotSelected,
    addSelection,
    setSelection: setSelected,
    selectedCount: selected.length,
  }
}
