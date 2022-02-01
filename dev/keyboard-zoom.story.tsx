import React from "react"
import { useKey } from 'react-use'
import { useZoom } from "../src"

export default () => {
  const [scale, setScale] = React.useState(1)
  const { zoomIn, zoomOut } = useZoom(scale, setScale)
  useKey((k) => k.code === 'Minus' && k.metaKey, zoomOut)
  useKey((k) => k.code === 'Equal' && k.metaKey, zoomIn)
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
          transform: `scale(${scale})`,
          background: 'radial-gradient(50% 50% at 50% 50%, red 0%, white 100%)',
        }}
      ></div>
    </div>
  )
}
