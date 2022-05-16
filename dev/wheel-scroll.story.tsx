import React from "react"
import { useWheelScroll } from "../src"

export default () => {
  const { ref, x, y } = useWheelScroll<HTMLDivElement>(250, 250)
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
      ref={ref}
    >
      <div
        style={{
          width: '800px',
          height: '800px',
          position: 'absolute',
          transform: `translate(${x}px, ${y}px)`,
          background: 'radial-gradient(50% 50% at 50% 50%, red 0%, white 100%)',
        }}
      ></div>
    </div>
  )
}
