import produce from "immer"
import React from "react"
import { Arc, polarToCartesian, useCircleArcClickCreate } from "../src"

export default () => {
  const [contents, setContents] = React.useState<Arc[]>([])
  const { circle, arc, onClick, onMove, input } = useCircleArcClickCreate('center radius', (c) => {
    setContents(produce(contents, (draft) => {
      draft.push(c)
    }))
  })
  const arcCircle = circle || arc
  return (
    <div
      onClick={(e) => onClick({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => onMove({ x: e.clientX, y: e.clientY })}
      style={{ height: '100%' }}
    >
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
        {arcCircle && <circle
          cx={arcCircle.x}
          cy={arcCircle.y}
          r={arcCircle.r}
          stroke='#00ff00'
          strokeDasharray='4'
        />}
        {[...contents, arc].map((content, i) => {
          if (content) {
            const start = polarToCartesian(content.x, content.y, content.r, content.endAngle)
            const end = polarToCartesian(content.x, content.y, content.r, content.startAngle)
            return (
              <path
                key={i}
                d={`M ${start.x} ${start.y} A ${content.r} ${content.r} 0 ${content.endAngle - content.startAngle <= 180 ? "0" : "1"} 0 ${end.x} ${end.y}`}
                stroke='#00ff00'
              />
            )
          }
          return null
        })}
      </svg>
      {input}
    </div>
  )
}
