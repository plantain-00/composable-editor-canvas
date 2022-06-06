import * as React from "react"
import { useKey } from "./use-key"

export function useSelectBeforeOperate<TSelect, TOperate>(
  defaultOperation: TSelect,
  executeOperation: (operation: TOperate, selected?: readonly number[][]) => boolean,
) {
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

  const startNextOperation = (selected?: readonly number[][]) => {
    if (operations.type === 'select then operate') {
      if (executeOperation(operations.operate, selected)) {
        resetOperation()
        return
      }
      setOperations({ type: 'operate', operate: operations.operate })
    }
  }

  useKey((e) => e.key === 'Enter', () => startNextOperation())

  return {
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
