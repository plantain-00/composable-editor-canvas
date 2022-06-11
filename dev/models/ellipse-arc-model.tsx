import { EllipseArc, Position, getEllipseAngle, equals, normalizeAngleInRange, normalizeAngleRange, rotatePositionByCenter, getResizeCursor, getPointsBounding } from '../../src'
import { angleDelta, ellipseModel, rotatePositionByEllipseCenter } from './ellipse-model'
import { iteratePolylineLines, LineContent } from './line-model'
import { StrokeBaseContent, getLinesAndPointsFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache } from './model'

export type EllipseArcContent = StrokeBaseContent<'ellipse arc'> & EllipseArc

export const ellipseArcModel: Model<EllipseArcContent> = {
  type: 'ellipse arc',
  move: ellipseModel.move,
  rotate: ellipseModel.rotate,
  mirror: ellipseModel.mirror,
  break(content, points) {
    if (points.length === 0) {
      return
    }
    const angles = points.map((p) => normalizeAngleInRange(getEllipseAngle(p, content), content))
    angles.sort((a, b) => a - b)
    const result: EllipseArcContent[] = []
    if (!equals(angles[0], content.startAngle)) {
      result.push({
        ...content,
        type: 'ellipse arc',
        startAngle: content.startAngle,
        endAngle: angles[0],
      })
    }
    angles.forEach((a, i) => {
      if (i === angles.length - 1) {
        if (!equals(a, content.endAngle)) {
          result.push({
            ...content,
            type: 'ellipse arc',
            startAngle: a,
            endAngle: content.endAngle,
          })
        }
      } else {
        result.push({
          ...content,
          type: 'ellipse arc',
          startAngle: a,
          endAngle: angles[i + 1],
        })
      }
    })
    return result.length > 1 ? result : undefined
  },
  render({ content, color, target, strokeWidth }) {
    const { points } = getEllipseArcLines(content)
    return target.renderPolyline(points, { strokeColor: color, dashArray: content.dashArray, strokeWidth })
  },
  renderIfSelected({ content, color, target, strokeWidth, scale }) {
    const { points } = getEllipseArcLines({ ...content, startAngle: content.endAngle, endAngle: content.startAngle + 360 })
    return target.renderPolyline(points, { strokeColor: color, dashArray: [4 / scale], strokeWidth })
  },
  getOperatorRenderPosition(content) {
    const { points } = getEllipseArcLines(content)
    return points[0]
  },
  getDefaultColor(content) {
    return content.strokeColor
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => {
      const center = { x: content.cx, y: content.cy }
      const startAngle = content.startAngle / 180 * Math.PI
      const endAngle = content.endAngle / 180 * Math.PI
      const rotate = -(content.angle ?? 0)
      return {
        editPoints: [
          {
            x: content.cx,
            y: content.cy,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isEllipseArcContent(c)) {
                return
              }
              c.cx += cursor.x - start.x
              c.cy += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
            },
          },
          {
            ...rotatePositionByCenter({ x: content.cx + content.rx * Math.cos(startAngle), y: content.cy + content.ry * Math.sin(startAngle) }, center, rotate),
            cursor: getResizeCursor(content.startAngle - rotate, 'top'),
            update(c, { cursor, scale }) {
              if (!isEllipseArcContent(c)) {
                return
              }
              const p = rotatePositionByCenter(cursor, center, content.angle ?? 0)
              c.startAngle = Math.atan2((p.y - content.cy) / content.ry, (p.x - content.cx) / content.rx) * 180 / Math.PI
              normalizeAngleRange(c)
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
            },
          },
          {
            ...rotatePositionByCenter({ x: content.cx + content.rx * Math.cos(endAngle), y: content.cy + content.ry * Math.sin(endAngle) }, center, rotate),
            cursor: getResizeCursor(content.endAngle - rotate, 'top'),
            update(c, { cursor, scale }) {
              if (!isEllipseArcContent(c)) {
                return
              }
              const p = rotatePositionByCenter(cursor, center, content.angle ?? 0)
              c.endAngle = Math.atan2((p.y - content.cy) / content.ry, (p.x - content.cx) / content.rx) * 180 / Math.PI
              normalizeAngleRange(c)
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
            },
          },
        ],
        angleSnapStartPoint: center,
      }
    })
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => {
      const startAngle = content.startAngle / 180 * Math.PI
      const endAngle = content.endAngle / 180 * Math.PI
      const middleAngle = (startAngle + endAngle) / 2
      return [
        { x: content.cx, y: content.cy, type: 'center' },
        { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(startAngle), y: content.cy + content.ry * Math.sin(startAngle) }, content), type: 'endpoint' },
        { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(endAngle), y: content.cy + content.ry * Math.sin(endAngle) }, content), type: 'endpoint' },
        { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(middleAngle), y: content.cy + content.ry * Math.sin(middleAngle) }, content), type: 'midpoint' },
      ]
    })
  },
  getLines: getEllipseArcLines,
}

export function getEllipseArcLines(content: Omit<EllipseArcContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    const points: Position[] = []
    const endAngle = content.startAngle > content.endAngle ? content.endAngle + 360 : content.endAngle
    let i = content.startAngle
    for (; i <= endAngle; i += angleDelta) {
      const angle = i * Math.PI / 180
      const x = content.cx + content.rx * Math.cos(angle)
      const y = content.cy + content.ry * Math.sin(angle)
      points.push(rotatePositionByEllipseCenter({ x, y }, content))
    }
    if (i !== endAngle) {
      const angle = endAngle * Math.PI / 180
      const x = content.cx + content.rx * Math.cos(angle)
      const y = content.cy + content.ry * Math.sin(angle)
      points.push(rotatePositionByEllipseCenter({ x, y }, content))
    }
    return {
      lines: Array.from(iteratePolylineLines(points)),
      points,
      bounding: getPointsBounding(points),
    }
  })
}

export function isEllipseArcContent(content: BaseContent): content is EllipseArcContent {
  return content.type === 'ellipse arc'
}
