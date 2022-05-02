import React from 'react'
import { getPointAndLineMinimumDistance, getSymmetryPoint, lineIntersectWithTwoPointsFormRegion, pointIsInRegion, PolylineEditBar, Position, twoPointLineToGeneralFormLine, useLineClickCreate, usePolylineEdit } from '../../src'
import { rotatePositionByCenter } from '../util'
import { BaseContent, Model } from './model'

export type LineContent = BaseContent<'line' | 'polyline'> & {
  points: Position[]
}

export const lineModel: Model<LineContent> = {
  type: 'line',
  move(content, offset) {
    for (const point of content.points) {
      point.x += offset.x
      point.y += offset.y
    }
  },
  rotate(content, center, angle) {
    content.points = content.points.map((p) => rotatePositionByCenter(p, center, -angle))
  },
  mirror(content, p1, p2) {
    const line = twoPointLineToGeneralFormLine(p1, p2)
    content.points = content.points.map((p) => getSymmetryPoint(p, line))
  },
  canSelectByPosition(content, position, delta) {
    for (const line of iteratePolylineLines(content.points)) {
      const minDistance = getPointAndLineMinimumDistance(position, ...line)
      if (minDistance <= delta) {
        return true
      }
    }
    return false
  },
  canSelectByTwoPositions(content, region, partial) {
    if (content.points.every((p) => pointIsInRegion(p, region))) {
      return true
    }
    if (partial) {
      for (const line of iteratePolylineLines(content.points)) {
        if (lineIntersectWithTwoPointsFormRegion(...line, region)) {
          return true
        }
      }
    }
    return false
  },
  render({ content, stroke, target }) {
    return target.strokePolyline(content.points, stroke)
  },
  useEdit(onEnd) {
    const [polylineEditOffset, setPolylineEditOffset] = React.useState<Position & { pointIndexes: number[], data?: number }>()
    const { onStartEditPolyline, polylineEditMask } = usePolylineEdit<number>(setPolylineEditOffset, onEnd)
    return {
      mask: polylineEditMask,
      updatePreview(contents) {
        if (polylineEditOffset?.data !== undefined) {
          const content = contents[polylineEditOffset.data]
          for (const pointIndex of polylineEditOffset.pointIndexes) {
            content.points[pointIndex].x += polylineEditOffset.x
            content.points[pointIndex].y += polylineEditOffset.y
          }
        }
      },
      editBar({ content, index }) {
        return <PolylineEditBar points={content.points} onClick={(e, pointIndexes) => onStartEditPolyline(e, pointIndexes, index)} />
      },
    }
  },
  useCreate(type, onEnd) {
    const [lineCreate, setLineCreate] = React.useState<{ points: Position[] }>()
    const { onLineClickCreateClick, onLineClickCreateMove, lineClickCreateInput } = useLineClickCreate(
      type === 'line',
      (c) => setLineCreate(c ? { points: c } : undefined),
      (c) => {
        const lines: LineContent[] = []
        for (const line of iteratePolylineLines(c)) {
          lines.push({ points: line, type: 'line' })
        }
        onEnd(lines)
      },
    )
    return {
      input: lineClickCreateInput,
      onClick: onLineClickCreateClick,
      onMove: onLineClickCreateMove,
      updatePreview(contents) {
        if (lineCreate) {
          for (const line of iteratePolylineLines(lineCreate.points)) {
            contents.push({ points: line, type: 'line' })
          }
        }
      },
    }
  },
  *iterateSnapPoints({ points }, types) {
    if (types.includes('endpoint')) {
      yield* points.map((p) => ({ ...p, type: 'endpoint' as const }))
    }
    if (types.includes('midpoint')) {
      for (const [start, end] of iteratePolylineLines(points)) {
        yield {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
          type: 'midpoint',
        }
      }
    }
  },
}

export function* iteratePolylineLines(points: Position[]) {
  for (let i = 1; i < points.length; i++) {
    yield [points[i - 1], points[i]] as [Position, Position]
  }
}
