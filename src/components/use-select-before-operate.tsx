import * as React from "react"
import { useKey } from "./use-key"
import { SelectPath, useSelected, UseSelectedOptions } from "./use-selected"

export function useSelectBeforeOperate<TSelect extends { count?: number, selectable?: (index: TPath) => boolean }, TOperate, TPath extends SelectPath = SelectPath>(
  defaultOperation: TSelect,
  executeOperation: (operation: TOperate, selected: readonly TPath[]) => boolean,
  options?: Partial<UseSelectedOptions<TPath>>,
) {
  const { selected, isSelected, addSelection, filterSelection, setSelected } = useSelected<TPath>(options)
  const [operations, setOperations] = React.useState<{
    type: 'select'
    select: TSelect
  } | {
    type: 'operate'
    operate: TOperate
  } | {
    type: 'select then operate'
    select: TSelect
    operate: TOperate
  }>({ type: 'select', select: defaultOperation })

  const resetOperation = () => {
    setOperations({ type: 'select', select: defaultOperation })
  }

  useKey((e) => e.key === 'Escape', () => {
    setOperations({ type: 'select', select: defaultOperation })
  }, [setOperations])

  const startNextOperation = (s = selected) => {
    if (operations.type === 'select then operate') {
      if (executeOperation(operations.operate, s)) {
        resetOperation()
        return
      }
      setOperations({ type: 'operate', operate: operations.operate })
    }
  }

  useKey((e) => e.key === 'Enter', () => startNextOperation())

  let message = ''
  if (operations.type === 'select then operate') {
    if (operations.select.count !== undefined) {
      message = `${selected.length} selected, extra ${operations.select.count - selected.length} targets are needed`
    } else {
      message = selected.length ? `${selected.length} selected, press Enter to finish selection` : 'select targets'
    }
  }

  return {
    message,
    selected,
    isSelected,
    addSelection(...value: readonly TPath[]) {
      addSelection(
        value,
        operations.type !== 'operate' ? operations.select.count : undefined,
        startNextOperation,
        (v) => operations.type !== 'operate' && (operations.select.selectable?.(v) ?? true)
      )
    },
    setSelected,
    filterSelection,
    operations,
    executeOperation,
    startNextOperation,
    resetOperation,
    selectBeforeOperate(select: TSelect, operate: TOperate) {
      setOperations({ type: 'select then operate', select, operate })
    },
    operate(operate: TOperate) {
      setOperations({ type: 'operate', operate })
    },
  }
}
