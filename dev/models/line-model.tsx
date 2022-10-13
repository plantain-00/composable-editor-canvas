import React from 'react'
import { isSamePoint, getSymmetryPoint, getTwoPointsDistance, pointIsOnLineSegment, Position, rotatePositionByCenter, pointIsOnLine, getPointsBounding, iteratePolylineLines, dashedPolylineToLines, ArrayEditor, getArrayEditorProps, ObjectEditor, NumberEditor } from '../../src'
import { StrokeFields, getGeometriesFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache, getStrokeContentPropertyPanel, strokeModel, getPolylineEditPoints } from './model'

export type LineContent = BaseContent<'line' | 'polyline'> & StrokeFields & {
  points: Position[]
}

export const lineModel: Model<LineContent> = {
  type: 'line',
  ...strokeModel,
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
    const { lines } = getPolylineGeometries(content)
    return breakPolyline(lines, intersectionPoints)
  },
  render({ content, color, target, strokeWidth }) {
    return target.renderPolyline(content.points, { strokeColor: color, dashArray: content.dashArray, strokeWidth })
  },
  getOperatorRenderPosition(content) {
    return content.points[0]
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => ({ editPoints: getPolylineEditPoints(content, isLineContent) }))
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => {
      const { points, lines } = getPolylineGeometries(content)
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
  getGeometries: getPolylineGeometries,
  propertyPanel(content, update) {
    return {
      points: <ArrayEditor
        inline
        {...getArrayEditorProps<Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isLineContent(c)) { v(c) } }))}
        items={content.points.map((f, i) => <ObjectEditor
          inline
          properties={{
            x: <NumberEditor value={f.x} setValue={(v) => update(c => { if (isLineContent(c)) { c.points[i].x = v } })} />,
            y: <NumberEditor value={f.y} setValue={(v) => update(c => { if (isLineContent(c)) { c.points[i].y = v } })} />,
          }}
        />)}
      />,
      ...getStrokeContentPropertyPanel(content, update),
    }
  },
}

export function getPolylineGeometries(content: Omit<LineContent, "type">) {
  return getGeometriesFromCache(content, () => {
    return {
      lines: Array.from(iteratePolylineLines(content.points)),
      points: content.points,
      bounding: getPointsBounding(content.points),
      renderingLines: dashedPolylineToLines(content.points, content.dashArray),
    }
  })
}

export function breakPolyline(
  lines: [Position, Position][],
  intersectionPoints: Position[],
) {
  const result: LineContent[] = []
  let lastPoints: Position[] = [lines[0][0]]
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
        result.push({ type: 'polyline', points: lastPoints })
        lastPoints = [p]
      })
      if (!isSamePoint(lastPoints[lastPoints.length - 1], line[1])) {
        lastPoints.push(line[1])
      }
    }
  })
  result.push({ type: 'polyline', points: lastPoints })
  if (result.length > 1) {
    const startPoint = result[0].points[0]
    const lastResult = result[result.length - 1].points
    if (isSamePoint(startPoint, lastResult[lastResult.length - 1]) && intersectionPoints.every((p) => !isSamePoint(startPoint, p))) {
      result[0].points.unshift(...lastResult.slice(0, lastResult.length - 1))
      return result.slice(0, result.length - 1)
    }
    return result
  }
  for (const r of result) {
    if (r.points.length === 2) {
      r.type === 'line'
    }
  }
  return undefined
}

export function isLineContent(content: BaseContent): content is LineContent {
  return content.type === 'line'
}
