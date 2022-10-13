import React from 'react'
import { ArrayEditor, dashedPolylineToLines, getArrayEditorProps, getPointsBounding, getSymmetryPoint, iteratePolygonLines, NumberEditor, ObjectEditor, polygonToPolyline, Position, rotatePositionByCenter } from '../../src'
import { breakPolyline, LineContent } from './line-model'
import { StrokeFields, getGeometriesFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache, FillFields, getStrokeContentPropertyPanel, getFillContentPropertyPanel, strokeModel, fillModel, getPolylineEditPoints } from './model'

export type PolygonContent = BaseContent<'polygon'> & StrokeFields & FillFields & {
  points: Position[]
}

export const polygonModel: Model<PolygonContent> = {
  type: 'polygon',
  ...strokeModel,
  ...fillModel,
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
      ...getStrokeContentPropertyPanel(content, update),
      ...getFillContentPropertyPanel(content, update),
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
