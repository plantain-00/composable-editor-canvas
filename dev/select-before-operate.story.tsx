import React from "react"
import { useSelectBeforeOperate, useSelected } from "../src"

export default () => {
  const { selected, isSelected, addSelection, filterSelection } = useSelected<number[]>()
  const { operations, executeOperation, startNextOperation, selectBeforeOperate } = useSelectBeforeOperate<{ count?: number, selectable?: (index: number[]) => boolean }, 'alert'>({}, (_, s = selected) => {
    alert(s.map(([i]) => i).join(','))
    return true
  })

  const startOperation = (maxCount?: number, selectable?: (index: number[]) => boolean) => {
    const { result, needSelect } = filterSelection(selectable, maxCount)
    if (needSelect) {
      selectBeforeOperate({ count: maxCount, selectable }, 'alert')
    } else {
      executeOperation('alert', result)
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
            if (isSelected([i]) || operations.type === 'operate') {
              return
            }
            if (operations.select.selectable?.([i]) ?? true) {
              addSelection([[i]], operations.select.count, startNextOperation)
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
