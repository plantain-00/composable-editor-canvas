import React from 'react'
import { ArrayEditor, dashedPolylineToLines, getArrayEditorProps, getPointsBounding, getSymmetryPoint, iteratePolygonLines, NumberEditor, ObjectEditor, polygonToPolyline, Position, rotatePositionByCenter } from '../../src'
import { breakPolyline, getPolylineEditPoints, LineContent } from './line-model'
import { StrokeBaseContent, getGeometriesFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache, FillFields, getStrokeContentPropertyPanel, getFillContentPropertyPanel } from './model'

export type PolygonContent = StrokeBaseContent<'polygon'> & FillFields & {
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
  mirror(content, line) {
    content.points = content.points.map((p) => getSymmetryPoint(p, line))
  },
  explode(content) {
    const { lines } = getPolygonGeometries(content)
    return lines.map((line) => ({ type: 'line', points: line } as LineContent))
  },
  break(content, intersectionPoints) {
    const { lines } = getPolygonGeometries(content)
    return breakPolyline(lines, intersectionPoints)
  },
  fill(content, color) {
    content.fillColor = color
  },
  render({ content, color, target, strokeWidth }) {
    const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
    if (content.fillColor !== undefined) {
      strokeWidth = 0
    }
    return target.renderPolygon(content.points, { [colorField]: color, dashArray: content.dashArray, strokeWidth })
  },
  getOperatorRenderPosition(content) {
    return content.points[0]
  },
  getDefaultColor(content) {
    return content.fillColor !== undefined ? content.fillColor : content.strokeColor
  },
  getDefaultStrokeWidth(content) {
    return content.strokeWidth
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => ({ editPoints: getPolylineEditPoints(content, isPolygonContent, true) }))
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => {
      const { points, lines } = getPolygonGeometries(content)
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
  getGeometries: getPolygonGeometries,
  canSelectPart: true,
  propertyPanel(content, update) {
    return {
      points: <ArrayEditor
        inline
        {...getArrayEditorProps<Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isPolygonContent(c)) { v(c) } }))}
        items={content.points.map((f, i) => <ObjectEditor
          inline
          properties={{
            x: <NumberEditor value={f.x} setValue={(v) => update(c => { if (isPolygonContent(c)) { c.points[i].x = v } })} />,
            y: <NumberEditor value={f.y} setValue={(v) => update(c => { if (isPolygonContent(c)) { c.points[i].y = v } })} />,
          }}
        />)}
      />,
      ...getStrokeContentPropertyPanel(content, update, isPolygonContent),
      ...getFillContentPropertyPanel(content, update, isPolygonContent),
    }
  },
}

function getPolygonGeometries(content: Omit<PolygonContent, "type">) {
  return getGeometriesFromCache(content, () => {
    const lines = Array.from(iteratePolygonLines(content.points))
    return {
      lines,
      points: content.points,
      bounding: getPointsBounding(content.points),
      renderingLines: dashedPolylineToLines(polygonToPolyline(content.points), content.dashArray),
      regions: content.fillColor !== undefined ? [
        {
          lines,
          points: content.points,
        },
      ] : undefined,
    }
  })
}

export function isPolygonContent(content: BaseContent): content is PolygonContent {
  return content.type === 'polygon'
}
