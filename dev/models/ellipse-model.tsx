import { dashedPolylineToLines, Ellipse, ellipseToPolygon, getEllipseAngle, getPointsBounding, getResizeCursor, getSymmetryPoint, getTwoPointsDistance, iteratePolygonLines, Position, rotatePositionByCenter } from '../../src'
import { EllipseArcContent } from './ellipse-arc-model'
import { LineContent } from './line-model'
import { StrokeBaseContent, getGeometriesFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache, FillFields } from './model'

export type EllipseContent = StrokeBaseContent<'ellipse'> & FillFields & Ellipse

export const ellipseModel: Model<EllipseContent> = {
  type: 'ellipse',
  move(content, offset) {
    content.cx += offset.x
    content.cy += offset.y
  },
  rotate(content, center, angle) {
    const p = rotatePositionByCenter({ x: content.cx, y: content.cy }, center, -angle)
    content.cx = p.x
    content.cy = p.y
    content.angle = (content.angle ?? 0) + angle
  },
  mirror(content, line, angle) {
    const p = getSymmetryPoint({ x: content.cx, y: content.cy }, line)
    content.cx = p.x
    content.cy = p.y
    content.angle = 2 * angle - (content.angle ?? 0)
  },
  fill(content, color) {
    content.fillColor = color
  },
  break(content, points) {
    if (points.length < 2) {
      return
    }
    const angles = points.map((p) => getEllipseAngle(p, content))
    angles.sort((a, b) => a - b)
    return angles.map((a, i) => ({
      ...content,
      type: 'ellipse arc',
      startAngle: a,
      endAngle: i === angles.length - 1 ? angles[0] + 360 : angles[i + 1],
    }) as EllipseArcContent)
  },
  render({ content, color, target, strokeWidth }) {
    const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
    if (content.fillColor !== undefined) {
      strokeWidth = 0
    }
    if (content.dashArray) {
      const { points } = getEllipseGeometries(content)
      return target.renderPolygon(points, { [colorField]: color, dashArray: content.dashArray, strokeWidth })
    }
    return target.renderEllipse(content.cx, content.cy, content.rx, content.ry, { [colorField]: color, angle: content.angle, strokeWidth })
  },
  getOperatorRenderPosition(content) {
    return { x: content.cx, y: content.cy }
  },
  getDefaultColor(content) {
    return content.fillColor !== undefined ? content.fillColor : content.strokeColor
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => {
      const center = { x: content.cx, y: content.cy }
      const rotate = -(content.angle ?? 0)
      const left = rotatePositionByCenter({ x: content.cx - content.rx, y: content.cy }, center, rotate)
      const right = rotatePositionByCenter({ x: content.cx + content.rx, y: content.cy }, center, rotate)
      const top = rotatePositionByCenter({ x: content.cx, y: content.cy - content.ry }, center, rotate)
      const bottom = rotatePositionByCenter({ x: content.cx, y: content.cy + content.ry }, center, rotate)
      return {
        editPoints: [
          {
            x: content.cx,
            y: content.cy,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isEllipseContent(c)) {
                return
              }
              c.cx += cursor.x - start.x
              c.cy += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
            },
          },
          {
            x: left.x,
            y: left.y,
            cursor: getResizeCursor(-rotate, 'left'),
            update(c, { cursor, scale }) {
              if (!isEllipseContent(c)) {
                return
              }
              c.rx = getTwoPointsDistance(cursor, center)
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
            },
          },
          {
            x: right.x,
            y: right.y,
            cursor: getResizeCursor(-rotate, 'right'),
            update(c, { cursor, scale }) {
              if (!isEllipseContent(c)) {
                return
              }
              c.rx = getTwoPointsDistance(cursor, center)
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
            },
          },
          {
            x: top.x,
            y: top.y,
            cursor: getResizeCursor(-rotate, 'top'),
            update(c, { cursor, scale }) {
              if (!isEllipseContent(c)) {
                return
              }
              c.ry = getTwoPointsDistance(cursor, center)
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
            },
          },
          {
            x: bottom.x,
            y: bottom.y,
            cursor: getResizeCursor(-rotate, 'bottom'),
            update(c, { cursor, scale }) {
              if (!isEllipseContent(c)) {
                return
              }
              c.ry = getTwoPointsDistance(cursor, center)
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
            },
          },
        ],
        angleSnapStartPoint: { x: content.cx, y: content.cy },
      }
    })
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => [
      { x: content.cx, y: content.cy, type: 'center' },
      { ...rotatePositionByEllipseCenter({ x: content.cx - content.rx, y: content.cy }, content), type: 'endpoint' },
      { ...rotatePositionByEllipseCenter({ x: content.cx + content.rx, y: content.cy }, content), type: 'endpoint' },
      { ...rotatePositionByEllipseCenter({ x: content.cx, y: content.cy - content.ry }, content), type: 'endpoint' },
      { ...rotatePositionByEllipseCenter({ x: content.cx, y: content.cy + content.ry }, content), type: 'endpoint' },
    ])
  },
  getGeometries: getEllipseGeometries,
}

export function getEllipseGeometries(content: Omit<EllipseContent, "type">) {
  return getGeometriesFromCache(content, () => {
    const points = ellipseToPolygon(content, angleDelta)
    const lines = Array.from(iteratePolygonLines(points))
    return {
      lines,
      points,
      bounding: getPointsBounding(points),
      renderingLines: content.dashArray ? dashedPolylineToLines(points, content.dashArray) : [points],
      regions: content.fillColor !== undefined ? [
        {
          lines,
          points,
        },
      ] : undefined,
    }
  })
}

export function rotatePositionByEllipseCenter(p: Position, content: Omit<EllipseContent, "type">) {
  return rotatePositionByCenter(p, { x: content.cx, y: content.cy }, -(content.angle ?? 0))
}

export const angleDelta = 5

export function isEllipseContent(content: BaseContent): content is EllipseContent {
  return content.type === 'ellipse'
}
