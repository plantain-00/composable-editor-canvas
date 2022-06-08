import { Circle, getSymmetryPoint, getTwoPointsDistance, Position, rotatePositionByCenter } from '../../src'
import { ArcContent, getArcLines } from './arc-model'
import { LineContent } from './line-model'
import { StrokeBaseContent, getLinesAndPointsFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache } from './model'

export type CircleContent = StrokeBaseContent<'circle'> & Circle

export const circleModel: Model<CircleContent> = {
  type: 'circle',
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
    if (content.dashArray) {
      const { points } = getCircleLines(content)
      return target.renderPolyline(points, color, content.dashArray, strokeWidth)
    }
    return target.renderCircle(content.x, content.y, content.r, color, strokeWidth)
  },
  getOperatorRenderPosition(content) {
    return content
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => {
      const x = content.x
      const y = content.y
      const updateEdges = (c: BaseContent, cursor: Position) => {
        if (!isCircleContent(c)) {
          return
        }
        c.r = getTwoPointsDistance(cursor, c)
        return { assistentContents: [{ type: 'line', dashArray: [4], points: [content, cursor] } as LineContent] }
      }
      return {
        editPoints: [
          {
            x,
            y,
            cursor: 'move',
            update(c, cursor, start) {
              if (!isCircleContent(c)) {
                return
              }
              c.x += cursor.x - start.x
              c.y += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4], points: [content, cursor] } as LineContent] }
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
    return content
  },
  getLines: getCircleLines,
}

export function getCircleLines(content: Omit<CircleContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    return getArcLines({ ...content, startAngle: 0, endAngle: 360 })
  })
}

export function isCircleContent(content: BaseContent): content is CircleContent {
  return content.type === 'circle'
}
