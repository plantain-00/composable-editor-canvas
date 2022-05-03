import * as React from "react"
import { Position } from "../utils"

export function PolylineEditBar(props: {
  points: Position[],
  offset?: Position & { pointIndexes: number[] }
  scale?: number
  resizeSize?: number
  isPolygon?: boolean
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, pointIndexes: number[]) => void
  onMouseDown?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, pointIndexes: number[]) => void
}) {
  const scale = props.scale ?? 1
  const width = (props.resizeSize ?? 5) / scale
  const border = 1 / scale
  const points = props.points
  const isClosed = !props.isPolygon &&
    points.length > 2 &&
    points[0].x === points[points.length - 1].x &&
    points[0].y === points[points.length - 1].y

  const bars: { style: React.CSSProperties, pointIndexes: number[] }[] = []
  points.forEach((point, i) => {
    if (props.isPolygon || i !== points.length - 1 || !isClosed) {
      bars.push({
        pointIndexes: [i],
        style: {
          left: (point.x - width / 2) + 'px',
          top: (point.y - width / 2) + 'px',
        },
      })
    }
    if (i !== points.length - 1) {
      const nextPoint = points[i + 1]
      bars.push({
        pointIndexes: [i, i + 1],
        style: {
          left: (point.x + nextPoint.x - width / 2) / 2 + 'px',
          top: (point.y + nextPoint.y - width / 2) / 2 + 'px',
        },
      })
    }
    if (props.isPolygon && i === points.length - 1) {
      const nextPoint = points[0]
      bars.push({
        pointIndexes: [points.length - 1, 0],
        style: {
          left: (point.x + nextPoint.x - width / 2) / 2 + 'px',
          top: (point.y + nextPoint.y - width / 2) / 2 + 'px',
        },
      })
    }
  })
  if (isClosed) {
    for (const bar of bars) {
      if (bar.pointIndexes.includes(0)) {
        bar.pointIndexes.push(points.length - 1)
      } else if (bar.pointIndexes.includes(points.length - 1)) {
        bar.pointIndexes.push(0)
      }
    }
  }

  return (
    <>
      {bars.map((s, i) => (
        <div
          key={i}
          style={{
            width: width + 'px',
            height: width + 'px',
            border: `${border}px solid green`,
            position: 'absolute',
            backgroundColor: 'white',
            boxSizing: 'border-box',
            pointerEvents: 'auto',
            cursor: 'move',
            ...s.style,
          }}
          onMouseDown={(e) => props.onMouseDown?.(e, s.pointIndexes)}
          onClick={(e) => props.onClick?.(e, s.pointIndexes)}
        />
      ))}
    </>
  )
}
