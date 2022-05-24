import * as React from "react"

export function useSelection<T extends string | number>(options?: Partial<{
  onChange: (s: readonly T[]) => void
}>) {
  const [selected, setSelected] = React.useState<readonly T[]>([])

  const isSelected = (value: T) => selected.includes(value)
  const isNotSelected = (value: T) => !isSelected(value)
  const addSelection = (value: T[]) => {
    value = value.filter(isNotSelected)
    if (value.length > 0) {
      setSelected([...selected, ...value])
    }
  }

  React.useEffect(() => {
    options?.onChange?.(selected)
  }, [selected])

  return {
    selected,
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
