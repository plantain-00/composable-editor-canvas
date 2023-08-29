import React from "react"
import { useGlobalKeyDown, useSelected } from "../src"

export default () => {
  const { isSelected, addSelection, onSelectedKeyDown } = useSelected({ maxCount: 3 })
  useGlobalKeyDown(e => {
    onSelectedKeyDown(e)
  })

  return (
    <div>
      {new Array<unknown>(10).fill(1).map((_, i) => (
        <button
          key={i}
          style={{ backgroundColor: isSelected([i]) ? 'green' : undefined, width: '50px', height: '50px' }}
          onClick={() => addSelection([[i]])}
        >
          {i}
        </button>
      ))}
    </div>
  )
}
