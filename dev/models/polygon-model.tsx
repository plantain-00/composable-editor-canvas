import React from 'react'
import { getPointAndLineMinimumDistance, getSymmetryPoint, lineIntersectWithTwoPointsFormRegion, pointIsInRegion, PolylineEditBar, Position, rotatePositionByCenter, twoPointLineToGeneralFormLine, usePolygonClickCreate, usePolylineEdit } from '../../src'
import { iteratePolylineLines, LineContent } from './line-model'
import { BaseContent, Model } from './model'

export type PolygonContent = BaseContent<'polygon'> & {
  points: Position[]
}

export const polygonModel: Model<PolygonContent> = {
  type: 'polygon',
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
  explode(content) {
    const result: LineContent[] = []
    for (const line of iteratePolygonLines(content.points)) {
      result.push({
        type: 'line',
        points: line,
      })
    }
    return result
  },
  canSelectByPosition(content, position, delta) {
    for (const line of iteratePolygonLines(content.points)) {
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
      for (const line of iteratePolygonLines(content.points)) {
        if (lineIntersectWithTwoPointsFormRegion(...line, region)) {
          return true
        }
      }
    }
    return false
  },
  render({ content, stroke, target }) {
    return target.strokePolyline([...content.points, content.points[0]], stroke)
  },
  useEdit(onEnd) {
    const [polygonEditOffset, setPolygonEditOffset] = React.useState<Position & { pointIndexes: number[], data?: number }>()
    const { onStartEditPolyline, polylineEditMask } = usePolylineEdit<number>(setPolygonEditOffset, onEnd)
    return {
      mask: polylineEditMask,
      updatePreview(contents) {
        if (polygonEditOffset?.data !== undefined) {
          const content = contents[polygonEditOffset.data]
          for (const pointIndex of polygonEditOffset.pointIndexes) {
            content.points[pointIndex].x += polygonEditOffset.x
            content.points[pointIndex].y += polygonEditOffset.y
          }
        }
      },
      editBar({ content, index }) {
        return <PolylineEditBar points={content.points} isPolygon onClick={(e, pointIndexes) => onStartEditPolyline(e, pointIndexes, index)} />
      },
    }
  },
  useCreate(type, onEnd) {
    const [polygon, setPolygon] = React.useState<Position[]>()
    const { onPolygonClickCreateClick, onPolygonClickCreateMove, polygonClickCreateInput, startSetSides } = usePolygonClickCreate(
      type === 'polygon',
      setPolygon,
      (c) => onEnd([{ points: c, type: 'polygon' }]),
    )
    return {
      input: polygonClickCreateInput,
      subcommand: type === 'polygon' ? <button onClick={startSetSides} style={{ position: 'relative' }}>set sides</button> : undefined,
      onClick: onPolygonClickCreateClick,
      onMove: onPolygonClickCreateMove,
      updatePreview(contents) {
        if (polygon) {
          contents.push({ points: polygon, type: 'polygon' })
        }
      },
    }
  },
  *iterateSnapPoints({ points }, types) {
    if (types.includes('endpoint')) {
      yield* points.map((p) => ({ ...p, type: 'endpoint' as const }))
    }
    if (types.includes('midpoint')) {
      for (const [start, end] of iteratePolygonLines(points)) {
        yield {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
          type: 'midpoint',
        }
      }
    }
  },
}

export function* iteratePolygonLines(points: Position[]) {
  yield* iteratePolylineLines(points)
  yield [points[points.length - 1], points[0]] as [Position, Position]
}
