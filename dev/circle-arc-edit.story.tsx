import { produce } from "immer"
import React from "react"
import { Arc, CircleArcEditBar, normalizeAngleRange, polarToCartesian, useCircleArcEdit, useGlobalKeyDown } from "../src"

export default () => {
  const [content, setContent] = React.useState<Arc>({ x: 200, y: 200, r: 100, startAngle: -30, endAngle: 120 })
  const { offset, onStart, mask, reset } = useCircleArcEdit(() => setContent(circleArc))
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      reset()
    }
  })
  const circleArc = produce(content, (draft) => {
    if (offset) {
      draft.x += offset.x
      draft.y += offset.y
      draft.r += offset.r
      draft.startAngle += offset.startAngle
      draft.endAngle += offset.endAngle
      normalizeAngleRange(draft)
    }
  })
  const start = polarToCartesian(circleArc.x, circleArc.y, circleArc.r, circleArc.endAngle)
  const end = polarToCartesian(circleArc.x, circleArc.y, circleArc.r, circleArc.startAngle)
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
        <path
          d={`M ${start.x} ${start.y} A ${circleArc.r} ${circleArc.r} 0 ${circleArc.endAngle - circleArc.startAngle <= 180 ? "0" : "1"} 0 ${end.x} ${end.y}`}
          stroke='#00ff00'
        />
      </svg>
      <CircleArcEditBar
        {...circleArc}
        onMouseDown={(e, type, cursor) => onStart(e, { ...circleArc, type, cursor })}
      />
      {mask}
    </>
  )
}
