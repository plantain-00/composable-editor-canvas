import { produce } from "immer"
import React from "react"
import { Ellipse, useEllipseClickCreate } from "../src"

export default () => {
  const [contents, setContents] = React.useState<Ellipse[]>([])
  const { ellipse, onClick, onMove, input } = useEllipseClickCreate('ellipse center', (c) => {
    setContents(produce(contents, (draft) => {
      draft.push(c)
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
        {[...contents, ellipse].map((content, i) => content && <ellipse
          key={i}
          stroke='#00ff00'
          cx={content.cx}
          cy={content.cy}
          rx={content.rx}
          ry={content.ry}
          transform={content.angle ? `rotate(${content.angle},${content.cx},${content.cy})` : undefined}
        />)}
      </svg>
      {input}
    </div>
  )
}
