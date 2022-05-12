import * as React from "react"
import { Position } from "../../utils"
import { EditBar, EditBarPosition } from "./edit-bar"

export function PolylineEditBar(props: {
  points: Position[],
  offset?: Position & { pointIndexes: number[] }
  scale?: number
  resizeSize?: number
  isPolygon?: boolean
  midpointDisabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, pointIndexes: number[]) => void
  onMouseDown?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, pointIndexes: number[]) => void
}) {
  const points = props.points
  const isClosed = !props.isPolygon &&
    points.length > 2 &&
    points[0].x === points[points.length - 1].x &&
    points[0].y === points[points.length - 1].y

  const positions: EditBarPosition<number[]>[] = []
  points.forEach((point, i) => {
    if (props.isPolygon || i !== points.length - 1 || !isClosed) {
      positions.push({
        data: [i],
        x: point.x,
        y: point.y,
        cursor: 'move',
      })
    }
    if (!props.midpointDisabled && i !== points.length - 1) {
      const nextPoint = points[i + 1]
      positions.push({
        data: [i, i + 1],
        x: (point.x + nextPoint.x) / 2,
        y: (point.y + nextPoint.y) / 2,
        cursor: 'move',
      })
    }
    if (props.isPolygon && i === points.length - 1) {
      const nextPoint = points[0]
      positions.push({
        data: [points.length - 1, 0],
        x: (point.x + nextPoint.x) / 2,
        y: (point.y + nextPoint.y) / 2,
        cursor: 'move',
      })
    }
  })
  if (isClosed) {
    for (const position of positions) {
      if (position.data.includes(0)) {
        position.data.push(points.length - 1)
      } else if (position.data.includes(points.length - 1)) {
        position.data.push(0)
      }
    }
  }

  return (
    <EditBar
      positions={positions}
      scale={props.scale}
      resizeSize={props.resizeSize}
      onClick={props.onClick}
      onMouseDown={props.onMouseDown}
    />
  )
}
