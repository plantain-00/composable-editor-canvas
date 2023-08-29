import * as React from "react"
import { SelectPath, useSelected, UseSelectedOptions } from "./use-selected"

/**
 * @public
 */
export function useSelectBeforeOperate<TSelect extends { count?: number, selectable?: (index: TPath) => boolean }, TOperate, TPath extends SelectPath = SelectPath>(
  defaultOperation: TSelect,
  executeOperation: (operation: TOperate, selected: readonly TPath[]) => boolean,
  options?: Partial<UseSelectedOptions<TPath>>,
) {
  const { selected, isSelected, addSelection, removeSelection, filterSelection, setSelected, onSelectedKeyDown } = useSelected<TPath>(options)
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

  const startNextOperation = (s = selected) => {
    if (operations.type === 'select then operate') {
      if (executeOperation(operations.operate, s)) {
        resetOperation()
        return
      }
      setOperations({ type: 'operate', operate: operations.operate })
    }
  }

  let message = ''
  if (operations.type === 'select then operate') {
    if (operations.select.count !== undefined) {
      message = `${selected.length} selected, extra ${operations.select.count - selected.length} targets are needed`
    } else {
      message = selected.length ? `${selected.length} selected, press Enter to finish selection` : 'select targets'
    }
  }

  const isSelectable = (path: TPath) => {
    return !isSelected(path) && operations.type !== 'operate' && (operations.select.selectable?.(path) ?? true)
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
        isSelectable
      )
    },
    removeSelection(...value: readonly TPath[]) {
      removeSelection(value)
    },
    setSelected,
    filterSelection,
    isSelectable,
    operations,
    executeOperation,
    startNextOperation,
    resetOperation,
    onSelectBeforeOperateKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        resetOperation()
      } else if (e.key === 'Enter') {
        startNextOperation()
      }
      onSelectedKeyDown(e)
    },
    selectBeforeOperate(select: TSelect, operate: TOperate) {
      setOperations({ type: 'select then operate', select, operate })
    },
    operate(operate: TOperate) {
      setOperations({ type: 'operate', operate })
    },
  }
}
