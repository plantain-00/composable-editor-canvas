import React from "react"
import { useWheelZoom } from "../src"

export default () => {
  const { ref, scale } = useWheelZoom<HTMLDivElement>()
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
          transform: `scale(${scale})`,
          background: 'radial-gradient(50% 50% at 50% 50%, red 0%, white 100%)',
        }}
      ></div>
    </div>
  )
}
