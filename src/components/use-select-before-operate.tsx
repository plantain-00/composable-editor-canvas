import * as React from "react"
import { useKey } from "./use-key"

export function useSelectBeforeOperate<T>() {
  const [[operation, nextOperation], setOperations] = React.useState<[T?, T?]>([])
  
  useKey((e) => e.key === 'Escape', () => {
    setOperations([])
  }, [setOperations])

  return {
    operation,
    nextOperation,
    resetOperation() {
      setOperations([])
    },
    completeCurrentOperation() {
      if (nextOperation) {
        setOperations([nextOperation])
      }
    },
    selectBeforeOperate(select: T | undefined, p: T) {
      setOperations([select, p])
    },
    operate(p: T) {
      setOperations([p])
    },
  }
}
