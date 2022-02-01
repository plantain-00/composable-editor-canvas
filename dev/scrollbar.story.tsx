import React from "react"
import { Scrollbar } from "../src"

export default () => {
  const [x, setX] = React.useState(0)
  const [y, setY] = React.useState(0)
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
      }}
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
      <Scrollbar
        value={x}
        type='horizontal'
        containerSize={300}
        contentSize={800}
        onChange={setX}
      />
      <Scrollbar
        value={y}
        type='vertical'
        containerSize={300}
        contentSize={800}
        onChange={setY}
      />
    </div>
  )
}
