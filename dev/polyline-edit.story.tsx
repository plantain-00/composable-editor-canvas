import produce from "immer"
import React from "react"
import { PolylineEditBar, Position, usePolylineEdit } from "../src"

export default () => {
  const [content, setContent] = React.useState([
    { x: 100, y: 100 },
    { x: 300, y: 200 },
    { x: 100, y: 200 },
  ])
  const [polyineEditOffset, setPolylineEditOffset] = React.useState<Position & { pointIndexes: number[] }>()
  const points = produce(content, (draft) => {
    if (polyineEditOffset) {
      for (const pointIndex of polyineEditOffset.pointIndexes) {
        draft[pointIndex].x += polyineEditOffset.x
        draft[pointIndex].y += polyineEditOffset.y
      }
    }
  })
  const { onStartEditPolyline, polylineEditMask } = usePolylineEdit(setPolylineEditOffset, () => setContent(points))
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
        <polyline stroke='#00ff00' points={points.map((p) => `${p.x},${p.y}`).join(' ')} />
      </svg>
      <PolylineEditBar
        points={points}
        onMouseDown={(e, pointIndexes) => onStartEditPolyline(e, pointIndexes)}
      />
      {polylineEditMask}
    </>
  )
}
