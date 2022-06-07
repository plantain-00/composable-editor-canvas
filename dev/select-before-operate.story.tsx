import React from "react"
import { useSelectBeforeOperate } from "../src"

export default () => {
  const { isSelected, addSelection, filterSelection, executeOperation, selectBeforeOperate, message } = useSelectBeforeOperate<{ count?: number, selectable?: (index: number[]) => boolean }, 'alert', number[]>({}, (_, s) => {
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
          onClick={() => addSelection([i])}
        >
          {i}
        </button>
      ))}
      {message}
    </div>
  )
}
