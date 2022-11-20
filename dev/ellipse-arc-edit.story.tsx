import produce from "immer"
import React from "react"
import { EllipseArc, EllipseArcEditBar, ellipseArcToPolyline, normalizeAngleRange, useEllipseArcEdit } from "../src"
import { defaultAngleDelta } from "./cad-editor/model"

export default () => {
  const [content, setContent] = React.useState<EllipseArc>({ cx: 200, cy: 200, rx: 100, ry: 150, angle: 45, startAngle: -30, endAngle: 120 })
  const { offset, onStart, mask } = useEllipseArcEdit(() => setContent(ellipseArc))
  const ellipseArc = produce(content, (draft) => {
    if (offset) {
      draft.cx += offset.cx
      draft.cy += offset.cy
      draft.rx += offset.rx
      draft.ry += offset.ry
      draft.startAngle += offset.startAngle
      draft.endAngle += offset.endAngle
      normalizeAngleRange(draft)
    }
  })
  const points = ellipseArcToPolyline(ellipseArc, defaultAngleDelta)
  return (
    <>
      <svg
        viewBox="0 0 800 600"
        width={800}
        height={600}
        xmlns="http://www.w3.org/2000/svg"
        fill='none'
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          stroke='#00ff00'
        />
      </svg>
      <EllipseArcEditBar
        {...ellipseArc}
        onMouseDown={(e, type, cursor) => onStart(e, { ...ellipseArc, type, cursor })}
      />
      {mask}
    </>
  )
}
