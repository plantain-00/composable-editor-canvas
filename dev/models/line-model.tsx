import React from 'react'
import { isSamePoint, getSymmetryPoint, getTwoPointsDistance, pointIsOnLineSegment, PolylineEditBar, Position, rotatePositionByCenter, usePolylineEdit, pointIsOnLine } from '../../src'
import { StrokeBaseContent, defaultStrokeColor, getLinesAndPointsFromCache, Model, getSnapPointsFromCache, BaseContent } from './model'

export type LineContent = StrokeBaseContent<'line' | 'polyline'> & {
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
  mirror(content, line) {
    content.points = content.points.map((p) => getSymmetryPoint(p, line))
  },
  break(content, intersectionPoints) {
    const { lines } = getPolylineLines(content)
    return breakPolyline(lines, intersectionPoints)
  },
  render({ content, color, target, strokeWidth }) {
    return target.strokePolyline(content.points, color ?? defaultStrokeColor, content.dashArray, strokeWidth)
  },
  getOperatorRenderPosition(content) {
    return content.points[0]
  },
  useEdit(onEnd, transform, getAngleSnap, scale) {
    const { offset, onStart, mask, cursorPosition, dragStartPosition } = usePolylineEdit<number>(onEnd, {
      transform,
      getAngleSnap,
    })
    return {
      mask,
      updatePreview(contents) {
        if (offset?.data !== undefined) {
          const content = contents[offset.data]
          const assistentContents = dragStartPosition ? [{ type: 'line', dashArray: [4], points: [{ x: dragStartPosition.x, y: dragStartPosition.y }, cursorPosition] }] : undefined
          for (const pointIndex of offset.pointIndexes) {
            content.points[pointIndex].x += offset.x
            content.points[pointIndex].y += offset.y
          }
          return { assistentContents }
        }
        return {}
      },
      editBar({ content, index }) {
        return <PolylineEditBar scale={scale} points={content.points} onClick={(e, pointIndexes) => onStart(e, pointIndexes, index)} />
      },
    }
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => {
      const { points, lines } = getPolylineLines(content)
      return [
        ...points.map((p) => ({ ...p, type: 'endpoint' as const })),
        ...lines.map(([start, end]) => ({
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
          type: 'midpoint' as const,
        })),
      ]
    })
  },
  getLines: getPolylineLines,
}

export function getPolylineLines(content: Omit<LineContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    return {
      lines: Array.from(iteratePolylineLines(content.points)),
      points: content.points,
    }
  })
}

export function* iteratePolylineLines(points: Position[]) {
  for (let i = 1; i < points.length; i++) {
    yield [points[i - 1], points[i]] as [Position, Position]
  }
}

export function breakPolyline(
  lines: [Position, Position][],
  intersectionPoints: Position[],
) {
  const result: LineContent[] = []
  let lastPoints: Position[] = [lines[0][0]]
  const addAsResult = () => {
    if (lastPoints.length === 2) {
      result.push({ type: 'line', points: lastPoints })
    } else if (lastPoints.length > 2) {
      result.push({ type: 'polyline', points: lastPoints })
    }
  }
  lines.forEach((line) => {
    const current: Position[] = []
    const remain: Position[] = []
    intersectionPoints.forEach((p) => {
      if (pointIsOnLine(p, ...line) && pointIsOnLineSegment(p, ...line)) {
        current.push(p)
      } else {
        remain.push(p)
      }
    })
    if (current.length === 0) {
      lastPoints.push(line[1])
    } else {
      intersectionPoints = remain
      current.sort((a, b) => getTwoPointsDistance(a, line[0]) - getTwoPointsDistance(b, line[0]))
      current.forEach((p) => {
        if (!isSamePoint(lastPoints[lastPoints.length - 1], p)) {
          lastPoints.push(p)
        }
        addAsResult()
        lastPoints = [p]
      })
      if (!isSamePoint(lastPoints[lastPoints.length - 1], line[1])) {
        lastPoints.push(line[1])
      }
    }
  })
  addAsResult()
  if (result.length > 1) {
    const startPoint = result[0].points[0]
    const lastResult = result[result.length - 1].points
    if (isSamePoint(startPoint, lastResult[lastResult.length - 1]) && intersectionPoints.every((p) => !isSamePoint(startPoint, p))) {
      result[0].points.unshift(...lastResult.slice(0, lastResult.length - 1))
      return result.slice(0, result.length - 1)
    }
    return result
  }
  return undefined
}

export function isLineContent(content: BaseContent): content is LineContent {
  return content.type === 'line'
}
