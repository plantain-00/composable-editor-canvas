import React from "react"
import { useSelectBeforeOperate, useSelected } from "../src"

export default () => {
  type Operation = { type: 'select', count: number } | { type: 'command', selectable?: (index: number[]) => boolean }
  const { selected, isSelected, addSelection, filterSelection } = useSelected<number[]>()
  const { operation, nextOperation, executeOperation, startNextOperation, selectBeforeOperate } = useSelectBeforeOperate<Operation>((p, s = selected) => {
    if (p?.type === 'command') {
      alert(s.map(([i]) => i).join(','))
      return true
    }
    return false
  })

  const contentSelectable = (index: number[]) => {
    if (isSelected(index)) {
      return false
    }
    if (nextOperation?.type === 'command') {
      return nextOperation.selectable?.(index) ?? true
    }
    return true
  }

  const startOperation = (maxCount?: number, selectable?: (index: number[]) => boolean) => {
    const { result, needSelect } = filterSelection((v) => selectable?.(v) ?? true, maxCount)
    if (needSelect) {
      selectBeforeOperate(
        maxCount !== undefined ? { type: 'select', count: maxCount } : undefined,
        { type: 'command', selectable },
      )
      return
    }
    if (executeOperation({ type: 'command', selectable }, result)) {
      return
    }
  }

  let message = ''
  if ((operation === undefined || operation.type === 'select') && nextOperation) {
    if (operation?.type === 'select') {
      message = `${selected.length} selected, extra ${operation.count - selected.length} targets are needed`
    } else {
      message = selected.length ? `${selected.length} selected, press Enter to finish selection` : 'select targets'
    }
  }

  return (
    <div>
      <button onClick={() => startOperation()}>select count {">"} 0</button>
      <button onClick={() => startOperation(3)}>select count = 3</button>
      <button onClick={() => startOperation(undefined, ([i]) => i % 2 === 1)}>select count {">"} 0 && i % 2 === 1</button>
      <button onClick={() => startOperation(3, ([i]) => i % 2 === 1)}>select count = 3 && i % 2 === 1</button>
      {new Array(10).fill(1).map((_, i) => (
        <button
          key={i}
          style={{ backgroundColor: isSelected([i]) ? 'green' : undefined, width: '50px', height: '50px' }}
          onClick={() => {
            if (contentSelectable([i])) {
              addSelection([[i]], operation?.type === 'select' ? operation.count : undefined, startNextOperation)
            }
          }}
        >
          {i}
        </button>
      ))}
      {message}
    </div>
  )
}
