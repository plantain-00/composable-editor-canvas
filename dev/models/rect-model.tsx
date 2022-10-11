import React from 'react'
import { dashedPolylineToLines, getPointsBounding, getResizeCursor, getResizeOffset, getSymmetryPoint, getTwoPointCenter, iteratePolygonLines, NumberEditor, polygonToPolyline, Region, rotatePositionByCenter } from '../../src'
import { breakPolyline, LineContent } from './line-model'
import { StrokeFields, getGeometriesFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache, FillFields, getFillContentPropertyPanel, getStrokeContentPropertyPanel, strokeModel, fillModel } from './model'

export type RectContent = BaseContent<'rect'> & StrokeFields & FillFields & Region & {
  angle: number
}

export const rectModel: Model<RectContent> = {
  type: 'rect',
  ...strokeModel,
  ...fillModel,
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  rotate(content, center, angle) {
    const p = rotatePositionByCenter(content, center, -angle)
    content.x = p.x
    content.y = p.y
    content.angle += angle
  },
  explode(content) {
    const { lines } = getRectGeometries(content)
    return lines.map((line) => ({ type: 'line', points: line } as LineContent))
  },
  break(content, intersectionPoints) {
    const { lines } = getRectGeometries(content)
    return breakPolyline(lines, intersectionPoints)
  },
  mirror(content, line, angle) {
    const p = getSymmetryPoint(content, line)
    content.x = p.x
    content.y = p.y
    content.angle = 2 * angle - content.angle
  },
  render({ content, color, target, strokeWidth }) {
    const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
    if (content.fillColor !== undefined) {
      strokeWidth = 0
    }
    if (content.dashArray) {
      const { points } = getRectGeometries(content)
      return target.renderPolygon(points, { [colorField]: color, dashArray: content.dashArray, strokeWidth })
    }
    return target.renderRect(content.x - content.width / 2, content.y - content.height / 2, content.width, content.height, { [colorField]: color, angle: content.angle, strokeWidth })
  },
  getOperatorRenderPosition(content) {
    const { points } = getRectGeometries(content)
    return points[0]
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => {
      const { points, lines } = getRectGeometries(content)
      return {
        editPoints: [
          { x: content.x, y: content.y, direction: 'center' as const },
          { ...points[0], direction: 'left-top' as const },
          { ...points[1], direction: 'right-top' as const },
          { ...points[2], direction: 'right-bottom' as const },
          { ...points[3], direction: 'left-bottom' as const },
          { ...getTwoPointCenter(...lines[0]), direction: 'top' as const },
          { ...getTwoPointCenter(...lines[1]), direction: 'right' as const },
          { ...getTwoPointCenter(...lines[2]), direction: 'bottom' as const },
          { ...getTwoPointCenter(...lines[3]), direction: 'left' as const },
        ].map((p) => ({
          x: p.x,
          y: p.y,
          cursor: getResizeCursor(content.angle, p.direction),
          update(c, { cursor, start, scale }) {
            if (!isRectContent(c)) {
              return
            }
            const offset = getResizeOffset(start, cursor, p.direction, -content.angle * Math.PI / 180)
            if (!offset) {
              return
            }
            c.x += offset.x + offset.width / 2
            c.y += offset.y + offset.height / 2
            c.width += offset.width
            c.height += offset.height
            return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
          },
        }))
      }
    })
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => {
      const { points, lines } = getRectGeometries(content)
      return [
        { x: content.x, y: content.y, type: 'center' },
        ...points.map((p) => ({ ...p, type: 'endpoint' as const })),
        ...lines.map(([start, end]) => ({
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
          type: 'midpoint' as const,
        })),
      ]
    })
  },
  getGeometries: getRectGeometries,
  canSelectPart: true,
  propertyPanel(content, update) {
    return {
      x: <NumberEditor value={content.x} setValue={(v) => update(c => { if (isRectContent(c)) { c.x = v } })} />,
      y: <NumberEditor value={content.y} setValue={(v) => update(c => { if (isRectContent(c)) { c.y = v } })} />,
      width: <NumberEditor value={content.width} setValue={(v) => update(c => { if (isRectContent(c)) { c.width = v } })} />,
      height: <NumberEditor value={content.height} setValue={(v) => update(c => { if (isRectContent(c)) { c.height = v } })} />,
      angle: <NumberEditor value={content.angle} setValue={(v) => update(c => { if (isRectContent(c)) { c.angle = v } })} />,
      ...getStrokeContentPropertyPanel(content, update),
      ...getFillContentPropertyPanel(content, update),
    }
  },
}

export function getRectGeometries(content: Omit<RectContent, "type">) {
  return getGeometriesFromCache(content, () => {
    const points = [
      { x: content.x - content.width / 2, y: content.y - content.height / 2 },
      { x: content.x + content.width / 2, y: content.y - content.height / 2 },
      { x: content.x + content.width / 2, y: content.y + content.height / 2 },
      { x: content.x - content.width / 2, y: content.y + content.height / 2 },
    ].map((p) => rotatePositionByCenter(p, content, -content.angle))
    const lines = Array.from(iteratePolygonLines(points))
    return {
      lines,
      points,
      bounding: getPointsBounding(points),
      renderingLines: dashedPolylineToLines(polygonToPolyline(points), content.dashArray),
      regions: content.fillColor !== undefined ? [
        {
          lines,
          points,
        },
      ] : undefined,
    }
  })
}

export function isRectContent(content: BaseContent): content is RectContent {
  return content.type === 'rect'
}
