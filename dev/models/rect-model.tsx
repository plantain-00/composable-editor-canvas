import { getPointsBounding, getResizeCursor, getResizeOffset, getSymmetryPoint, getTwoPointCenter, Region, rotatePositionByCenter } from '../../src'
import { breakPolyline, LineContent } from './line-model'
import { StrokeBaseContent, getLinesAndPointsFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache } from './model'
import { iteratePolygonLines, renderPolygon } from './polygon-model'

export type RectContent = StrokeBaseContent<'rect'> & Region & {
  angle: number
  fillColor?: number
}

export const rectModel: Model<RectContent> = {
  type: 'rect',
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
    const { lines } = getRectLines(content)
    return lines.map((line) => ({ type: 'line', points: line } as LineContent))
  },
  break(content, intersectionPoints) {
    const { lines } = getRectLines(content)
    return breakPolyline(lines, intersectionPoints)
  },
  mirror(content, line, angle) {
    const p = getSymmetryPoint(content, line)
    content.x = p.x
    content.y = p.y
    content.angle = 2 * angle - content.angle
  },
  render({ content, color, target, strokeWidth, partsStyles }) {
    if (content.dashArray || partsStyles.length > 0) {
      const { points } = getRectLines(content)
      return renderPolygon(target, points, { strokeColor: color, dashArray: content.dashArray, strokeWidth, partsStyles })
    }
    return target.renderRect(content.x - content.width / 2, content.y - content.height / 2, content.width, content.height, { strokeColor: color, angle: content.angle, strokeWidth, fillColor: content.fillColor })
  },
  getOperatorRenderPosition(content) {
    const { points } = getRectLines(content)
    return points[0]
  },
  getDefaultColor(content) {
    return content.strokeColor
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => {
      const { points, lines } = getRectLines(content)
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
      const { points, lines } = getRectLines(content)
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
  getLines: getRectLines,
  canSelectPart: true,
}

function getRectLines(content: Omit<RectContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    const points = [
      { x: content.x - content.width / 2, y: content.y - content.height / 2 },
      { x: content.x + content.width / 2, y: content.y - content.height / 2 },
      { x: content.x + content.width / 2, y: content.y + content.height / 2 },
      { x: content.x - content.width / 2, y: content.y + content.height / 2 },
    ].map((p) => rotatePositionByCenter(p, content, -content.angle))
    return {
      lines: Array.from(iteratePolygonLines(points)),
      points,
      bounding: getPointsBounding(points),
    }
  })
}

export function isRectContent(content: BaseContent): content is RectContent {
  return content.type === 'rect'
}
