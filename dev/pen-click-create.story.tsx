import { produce } from "immer"
import React from "react"
import { Position, usePenClickCreate } from "../src"

export default () => {
  const [contents, setContents] = React.useState<Position[][]>([])
  const { points, onClick, onMove } = usePenClickCreate(true, () => {
    setContents(produce(contents, (draft) => {
      draft.push(points)
    }))
  })


  return (
    <div style={{ height: '100%' }}>
      <svg
        viewBox="0 0 800 600"
        width={800}
        height={600}
        xmlns="http://www.w3.org/2000/svg"
        fill='none'
        style={{ position: 'absolute', left: 0, top: 0 }}
        onClick={(e) => onClick({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => onMove({ x: e.clientX, y: e.clientY })}
      >
        {[...contents, points].map((content, i) => content && <polyline
          key={i}
          stroke='#00ff00'
          points={content.map((p) => `${p.x},${p.y}`).join(' ')}
        />)}
      </svg>
    </div>
  )
}
