import React from 'react'
import { Arc, arcToPolyline, BooleanEditor, dashedPolylineToLines, equals, getPointsBounding, getResizeCursor, getSymmetryPoint, getTwoPointsDistance, iteratePolylineLines, normalizeAngleInRange, normalizeAngleRange, NumberEditor, rotatePositionByCenter } from '../../src'
import { circleOrArcIsReferenced, getCircleOrArcIndex } from './circle-model'
import { angleDelta } from './ellipse-model'
import { LineContent } from './line-model'
import { StrokeBaseContent, getGeometriesFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache, getStrokeContentPropertyPanel } from './model'

export type ArcContent = StrokeBaseContent<'arc'> & Arc

export const arcModel: Model<ArcContent> = {
  type: 'arc',
  subTypes: ['stroke'],
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
    content.startAngle += angle
    content.endAngle += angle
  },
  mirror(content, line, angle) {
    const p = getSymmetryPoint(content, line)
    content.x = p.x
    content.y = p.y
    const startAngle = 2 * angle - content.endAngle
    const endAngle = 2 * angle - content.startAngle
    content.startAngle = startAngle
    content.endAngle = endAngle
  },
  break(content, points) {
    if (points.length === 0) {
      return
    }
    const angles = points.map((p) => normalizeAngleInRange(Math.atan2(p.y - content.y, p.x - content.x) * 180 / Math.PI, content))
    angles.sort((a, b) => a - b)
    const result: ArcContent[] = []
    if (!equals(angles[0], content.startAngle)) {
      result.push({
        ...content,
        type: 'arc',
        startAngle: content.startAngle,
        endAngle: angles[0],
      })
    }
    angles.forEach((a, i) => {
      if (i === angles.length - 1) {
        if (!equals(a, content.endAngle)) {
          result.push({
            ...content,
            type: 'arc',
            startAngle: a,
            endAngle: content.endAngle,
          })
        }
      } else {
        result.push({
          ...content,
          type: 'arc',
          startAngle: a,
          endAngle: angles[i + 1],
        })
      }
    })
    return result.length > 1 ? result : undefined
  },
  render({ content, color, target, strokeWidth }) {
    if (content.dashArray) {
      const { points } = getArcGeometries(content)
      return target.renderPolyline(points, { strokeColor: color, dashArray: content.dashArray, strokeWidth })
    }
    return target.renderArc(content.x, content.y, content.r, content.startAngle, content.endAngle, { strokeColor: color, strokeWidth, counterclockwise: content.counterclockwise })
  },
  renderIfSelected({ content, color, target, strokeWidth }) {
    const { points } = getArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle + 360 })
    return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth })
  },
  getOperatorRenderPosition(content) {
    const { points } = getArcGeometries(content)
    return points[0]
  },
  getDefaultColor(content) {
    return content.strokeColor
  },
  getDefaultStrokeWidth(content) {
    return content.strokeWidth
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => {
      const x = content.x
      const y = content.y
      const startAngle = content.startAngle / 180 * Math.PI
      const endAngle = content.endAngle / 180 * Math.PI
      const middleAngle = (startAngle + endAngle) / 2
      return {
        editPoints: [
          {
            x,
            y,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isArcContent(c)) {
                return
              }
              c.x += cursor.x - start.x
              c.y += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
            },
          },
          {
            x: x + content.r * Math.cos(startAngle),
            y: y + content.r * Math.sin(startAngle),
            cursor: getResizeCursor(content.startAngle, 'top'),
            update(c, { cursor, scale }) {
              if (!isArcContent(c)) {
                return
              }
              c.startAngle = Math.atan2(cursor.y - c.y, cursor.x - c.x) * 180 / Math.PI
              normalizeAngleRange(c)
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
            },
          },
          {
            x: x + content.r * Math.cos(endAngle),
            y: y + content.r * Math.sin(endAngle),
            cursor: getResizeCursor(content.endAngle, 'top'),
            update(c, { cursor, scale }) {
              if (!isArcContent(c)) {
                return
              }
              c.endAngle = Math.atan2(cursor.y - c.y, cursor.x - c.x) * 180 / Math.PI
              normalizeAngleRange(c)
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
            },
          },
          {
            x: x + content.r * Math.cos(middleAngle),
            y: y + content.r * Math.sin(middleAngle),
            cursor: getResizeCursor((content.startAngle + content.endAngle) / 2, 'right'),
            update(c, { cursor, scale }) {
              if (!isArcContent(c)) {
                return
              }
              c.r = getTwoPointsDistance(cursor, c)
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
            },
          },
        ],
        angleSnapStartPoint: content,
      }
    })
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => {
      const startAngle = content.startAngle / 180 * Math.PI
      const endAngle = content.endAngle / 180 * Math.PI
      const middleAngle = (startAngle + endAngle) / 2
      return [
        { x: content.x, y: content.y, type: 'center' },
        { x: content.x + content.r * Math.cos(startAngle), y: content.y + content.r * Math.sin(startAngle), type: 'endpoint' },
        { x: content.x + content.r * Math.cos(endAngle), y: content.y + content.r * Math.sin(endAngle), type: 'endpoint' },
        { x: content.x + content.r * Math.cos(middleAngle), y: content.y + content.r * Math.sin(middleAngle), type: 'midpoint' },
      ]
    })
  },
  getGeometries: getArcGeometries,
  propertyPanel(content, update) {
    return {
      x: <NumberEditor value={content.x} setValue={(v) => update(c => { if (isArcContent(c)) { c.x = v } })} />,
      y: <NumberEditor value={content.y} setValue={(v) => update(c => { if (isArcContent(c)) { c.y = v } })} />,
      r: <NumberEditor value={content.r} setValue={(v) => update(c => { if (isArcContent(c)) { c.r = v } })} />,
      startAngle: <NumberEditor value={content.startAngle} setValue={(v) => update(c => { if (isArcContent(c)) { c.startAngle = v } })} />,
      endAngle: <NumberEditor value={content.endAngle} setValue={(v) => update(c => { if (isArcContent(c)) { c.endAngle = v } })} />,
      counterclockwise: <BooleanEditor value={content.counterclockwise === true} setValue={(v) => update(c => { if (isArcContent(c)) { c.counterclockwise = v ? true : undefined } })} />,
      ...getStrokeContentPropertyPanel(content, update),
    }
  },
}

export function getArcGeometries(content: Omit<ArcContent, "type">) {
  return getGeometriesFromCache(content, () => {
    const points = arcToPolyline(content, angleDelta)
    return {
      lines: Array.from(iteratePolylineLines(points)),
      points,
      bounding: getPointsBounding(points),
      renderingLines: dashedPolylineToLines(points, content.dashArray),
    }
  })
}

export function isArcContent(content: BaseContent): content is ArcContent {
  return content.type === 'arc'
}
