import React from 'react'
import { Circle, getSymmetryPoint, getTwoPointsDistance, Nullable, NumberEditor, Position, rotatePositionByCenter } from '../../src'
import { ArcContent, getArcGeometries, isArcContent } from './arc-model'
import { iterateAllContents } from './block-model'
import { LineContent } from './line-model'
import { StrokeBaseContent, getGeometriesFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache, FillFields, getStrokeContentPropertyPanel, getFillContentPropertyPanel } from './model'
import { isRadialDimensionReferenceContent } from './radial-dimension-reference-model'

export type CircleContent = StrokeBaseContent<'circle'> & FillFields & Circle

export const circleModel: Model<CircleContent> = {
  type: 'circle',
  subTypes: ['fill', 'stroke'],
  deletable(content, contents) {
    return !circleOrArcIsReferenced(getCircleOrArcIndex(content, contents), contents)
  },
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  rotate(content, center, angle) {
    const p = rotatePositionByCenter(content, center, -angle)
    content.x = p.x
    content.y = p.y
  },
  mirror(content, line) {
    const p = getSymmetryPoint(content, line)
    content.x = p.x
    content.y = p.y
  },
  break(content, points) {
    if (points.length < 2) {
      return
    }
    const angles = points.map((p) => Math.atan2(p.y - content.y, p.x - content.x) * 180 / Math.PI)
    angles.sort((a, b) => a - b)
    return angles.map((a, i) => ({
      ...content,
      type: 'arc',
      startAngle: a,
      endAngle: i === angles.length - 1 ? angles[0] + 360 : angles[i + 1],
    }) as ArcContent)
  },
  render({ content, color, target, strokeWidth }) {
    const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
    if (content.fillColor !== undefined) {
      strokeWidth = 0
    }
    if (content.dashArray) {
      const { points } = getCircleGeometries(content)
      return target.renderPolyline(points, { [colorField]: color, dashArray: content.dashArray, strokeWidth })
    }
    return target.renderCircle(content.x, content.y, content.r, { [colorField]: color, strokeWidth })
  },
  getOperatorRenderPosition(content) {
    return content
  },
  getDefaultColor(content) {
    return content.fillColor !== undefined ? content.fillColor : content.strokeColor
  },
  getDefaultStrokeWidth(content) {
    return content.strokeWidth
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => {
      const x = content.x
      const y = content.y
      const updateEdges = (c: BaseContent, { cursor, scale }: { cursor: Position, scale: number }) => {
        if (!isCircleContent(c)) {
          return
        }
        c.r = getTwoPointsDistance(cursor, c)
        return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
      }
      return {
        editPoints: [
          {
            x,
            y,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isCircleContent(c)) {
                return
              }
              c.x += cursor.x - start.x
              c.y += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
            },
          },
          {
            x: x - content.r,
            y,
            cursor: 'ew-resize',
            update: updateEdges,
          },
          {
            x,
            y: y - content.r,
            cursor: 'ns-resize',
            update: updateEdges,
          },
          {
            x: x + content.r,
            y,
            cursor: 'ew-resize',
            update: updateEdges,
          },
          {
            x,
            y: y + content.r,
            cursor: 'ns-resize',
            update: updateEdges,
          },
        ],
        angleSnapStartPoint: content,
      }
    })
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => [
      { x: content.x, y: content.y, type: 'center' },
      { x: content.x - content.r, y: content.y, type: 'endpoint' },
      { x: content.x + content.r, y: content.y, type: 'endpoint' },
      { x: content.x, y: content.y - content.r, type: 'endpoint' },
      { x: content.x, y: content.y + content.r, type: 'endpoint' },
    ])
  },
  getCircle(content) {
    return {
      circle: content,
      fill: content.fillColor !== undefined,
      bounding: {
        start: { x: content.x - content.r, y: content.y - content.r },
        end: { x: content.x + content.r, y: content.y + content.r },
      }
    }
  },
  getGeometries: getCircleGeometries,
  propertyPanel(content, update) {
    return {
      x: <NumberEditor value={content.x} setValue={(v) => update(c => { if (isCircleContent(c)) { c.x = v } })} />,
      y: <NumberEditor value={content.y} setValue={(v) => update(c => { if (isCircleContent(c)) { c.y = v } })} />,
      r: <NumberEditor value={content.r} setValue={(v) => update(c => { if (isCircleContent(c)) { c.r = v } })} />,
      ...getStrokeContentPropertyPanel(content, update),
      ...getFillContentPropertyPanel(content, update),
    }
  },
}

export function getCircleGeometries(content: Omit<CircleContent, "type">) {
  return getGeometriesFromCache(content, () => {
    const geometries = getArcGeometries({ ...content, startAngle: 0, endAngle: 360 })
    if (content.fillColor !== undefined) {
      return {
        lines: [],
        points: geometries.points,
        bounding: geometries.bounding,
        regions: [{
          lines: geometries.lines,
          points: geometries.points,
        }],
        renderingLines: [],
      }
    }
    return geometries
  })
}

export function isCircleContent(content: BaseContent): content is CircleContent {
  return content.type === 'circle'
}

export function getCircleOrArcIndex(content: Omit<CircleContent | ArcContent, "type">, contents: readonly Nullable<BaseContent>[]) {
  return contents.findIndex(c => c && (isCircleContent(c) || isArcContent(c)) && content === c)
}

export function circleOrArcIsReferenced(id: number, contents: readonly Nullable<BaseContent>[]): boolean {
  for (const content of iterateAllContents(contents)) {
    if (isRadialDimensionReferenceContent(content) && content.refId === id) {
      return true
    }
  }
  return false
}
