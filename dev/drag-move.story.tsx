import React from "react"
import { useDragMove } from "../src"

export default () => {
  const [x, setX] = React.useState(0)
  const [y, setY] = React.useState(0)
  const [moveOffset, setMoveOffset] = React.useState({ x: 0, y: 0 })
  const { onStartMove, dragMoveMask } = useDragMove(
    setMoveOffset,
    () => {
      setX((v) => v + moveOffset.x)
      setY((v) => v + moveOffset.y)
    },
  )

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
          transform: `translate(${x + moveOffset.x}px, ${y + moveOffset.y}px)`,
          background: 'radial-gradient(50% 50% at 50% 50%, red 0%, white 100%)',
          cursor: 'grab',
        }}
        onMouseDown={(e) => onStartMove({ x: e.clientX, y: e.clientY })}
      ></div>
      {dragMoveMask}
    </div>
  )
}
