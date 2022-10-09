import React from 'react'
import { isSamePoint, getSymmetryPoint, getTwoPointsDistance, pointIsOnLineSegment, Position, rotatePositionByCenter, pointIsOnLine, getPointsBounding, iteratePolylineLines, dashedPolylineToLines, ArrayEditor, getArrayEditorProps, ObjectEditor, NumberEditor } from '../../src'
import { StrokeBaseContent, getGeometriesFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache, getStrokeContentPropertyPanel } from './model'

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
    const { lines } = getPolylineGeometries(content)
    return breakPolyline(lines, intersectionPoints)
  },
  render({ content, color, target, strokeWidth }) {
    return target.renderPolyline(content.points, { strokeColor: color, dashArray: content.dashArray, strokeWidth })
  },
  getOperatorRenderPosition(content) {
    return content.points[0]
  },
  getDefaultColor(content) {
    return content.strokeColor
  },
  getDefaultStrokeWidth(content) {
    return content.strokeWidth
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
      ...getStrokeContentPropertyPanel(content, update, isLineContent),
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

export function getPolylineEditPoints(
  content: { points: Position[] },
  isPolyLineContent: (content: BaseContent<string>) => content is { type: string, points: Position[] },
  isPolygon?: boolean,
  midpointDisabled?: boolean,
) {
  const points = content.points
  const isClosed = !isPolygon &&
    points.length > 2 &&
    isSamePoint(points[0], points[points.length - 1])

  const positions: (Position & { pointIndexes: number[] })[] = []
  points.forEach((point, i) => {
    if (isPolygon || i !== points.length - 1 || !isClosed) {
      positions.push({
        pointIndexes: [i],
        x: point.x,
        y: point.y,
      })
    }
    if (!midpointDisabled && i !== points.length - 1) {
      const nextPoint = points[i + 1]
      positions.push({
        pointIndexes: [i, i + 1],
        x: (point.x + nextPoint.x) / 2,
        y: (point.y + nextPoint.y) / 2,
      })
    }
    if (isPolygon && i === points.length - 1) {
      const nextPoint = points[0]
      positions.push({
        pointIndexes: [points.length - 1, 0],
        x: (point.x + nextPoint.x) / 2,
        y: (point.y + nextPoint.y) / 2,
      })
    }
  })
  if (isClosed) {
    for (const position of positions) {
      if (position.pointIndexes.includes(0)) {
        position.pointIndexes.push(points.length - 1)
      } else if (position.pointIndexes.includes(points.length - 1)) {
        position.pointIndexes.push(0)
      }
    }
  }
  return positions.map((p) => ({
    x: p.x,
    y: p.y,
    cursor: 'move',
    update(c: BaseContent, { cursor, start, scale }: { cursor: Position, start: Position, scale: number }) {
      if (!isPolyLineContent(c)) {
        return
      }
      const offsetX = cursor.x - start.x
      const offsetY = cursor.y - start.y
      for (const pointIndex of p.pointIndexes) {
        c.points[pointIndex].x += offsetX
        c.points[pointIndex].y += offsetY
      }
      return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
    },
  }))
}
