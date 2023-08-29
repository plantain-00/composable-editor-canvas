import React from "react"
import { useDragMove, useGlobalKeyDown } from "../src"

export default () => {
  const [x, setX] = React.useState(0)
  const [y, setY] = React.useState(0)
  const { offset, onStart, mask, resetDragMove } = useDragMove(() => {
    setX((v) => v + offset.x)
    setY((v) => v + offset.y)
  })
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      resetDragMove()
    }
  })

  return (
    <div
      style={{
        width: '300px',
        height: '300px',
        overflow: 'hidden',
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid green',
      }}
    >
      <div
        style={{
          width: '800px',
          height: '800px',
          position: 'absolute',
          transform: `translate(${x + offset.x}px, ${y + offset.y}px)`,
          background: 'radial-gradient(50% 50% at 50% 50%, red 0%, white 100%)',
          cursor: 'grab',
        }}
        onMouseDown={(e) => onStart({ x: e.clientX, y: e.clientY })}
      ></div>
      {mask}
    </div>
  )
}
