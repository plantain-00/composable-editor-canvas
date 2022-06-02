import * as React from "react"
import { useKey } from "./use-key"

export function useSelectBeforeOperate<T>(
  executeOperation: (operation?: T, selected?: readonly number[][]) => boolean,
) {
  const [[operation, nextOperation], setOperations] = React.useState<[T?, T?]>([])
  
  useKey((e) => e.key === 'Escape', () => {
    setOperations([])
  }, [setOperations])

  const startNextOperation = (selected?: readonly number[][]) => {
    if (executeOperation(nextOperation, selected)) {
      setOperations([])
      return
    }
    if (nextOperation) {
      setOperations([nextOperation])
    }
  }

  useKey((e) => e.key === 'Enter', () => startNextOperation())

  return {
    operation,
    nextOperation,
    startNextOperation,
    resetOperation() {
      setOperations([])
    },
    selectBeforeOperate(select: T | undefined, p: T) {
      setOperations([select, p])
    },
    operate(p: T) {
      setOperations([p])
    },
  }
}
