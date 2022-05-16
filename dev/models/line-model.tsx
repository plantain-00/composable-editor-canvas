import React from 'react'
import { getSymmetryPoint, PolylineEditBar, Position, rotatePositionByCenter, twoPointLineToGeneralFormLine, useLineClickCreate, usePolylineEdit } from '../../src'
import { BaseContent, getLinesAndPointsFromCache, Model } from './model'

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
  render({ content, stroke, target }) {
    return target.strokePolyline(content.points, stroke, content.dashArray)
  },
  renderOperator({ content, stroke, target, text, fontSize }) {
    return target.fillText(content.points[0].x, content.points[0].y, text, stroke, fontSize)
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
  useCreate(type, onEnd, getAngleSnap) {
    const { line, onClick, onMove, input } = useLineClickCreate(
      type === 'line',
      (c) => onEnd(Array.from(iteratePolylineLines(c)).map((line) => ({ points: line, type: 'line' }))),
      {
        getAngleSnap,
      },
    )
    return {
      input,
      onClick,
      onMove,
      updatePreview(contents) {
        if (line) {
          for (const lineSegment of iteratePolylineLines(line)) {
            contents.push({ points: lineSegment, type: 'line' })
          }
        }
      },
    }
  },
  getSnapPoints(content) {
    const { points, lines } = getPolylineLines(content)
    return [
      ...points.map((p) => ({ ...p, type: 'endpoint' as const })),
      ...lines.map(([start, end]) => ({
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        type: 'midpoint' as const,
      })),
    ]
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
