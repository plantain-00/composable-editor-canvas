import { produce } from "immer"
import React from "react"
import { EllipseArc, ellipseArcToPolyline, useEllipseArcClickCreate, useGlobalKeyDown } from "../src"
import { defaultAngleDelta } from "./cad-editor/model"

export default () => {
  const [contents, setContents] = React.useState<EllipseArc[]>([])
  const { ellipse, ellipseArc, onClick, onMove, input, reset } = useEllipseArcClickCreate('ellipse center', (c) => {
    setContents(produce(contents, (draft) => {
      draft.push(c)
    }))
  })
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      reset()
    }
  })
  const arcEllipse = ellipse || ellipseArc
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
        {arcEllipse && <ellipse
          stroke='#00ff00'
          cx={arcEllipse.cx}
          cy={arcEllipse.cy}
          rx={arcEllipse.rx}
          ry={arcEllipse.ry}
          transform={arcEllipse.angle ? `rotate(${arcEllipse.angle},${arcEllipse.cx},${arcEllipse.cy})` : undefined}
          strokeDasharray='4'
        />}
        {[...contents, ellipseArc].map((content, i) => {
          if (content) {
            const points = ellipseArcToPolyline(content, defaultAngleDelta)
            return <polyline
              key={i}
              points={points.map((p) => `${p.x},${p.y}`).join(' ')}
              stroke='#00ff00'
            />
          }
          return null
        })}
      </svg>
      {input}
    </div>
  )
}
