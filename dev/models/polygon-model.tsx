import { dashedPolylineToLines, getPointsBounding, getSymmetryPoint, iteratePolygonLines, polygonToPolyline, Position, rotatePositionByCenter } from '../../src'
import { breakPolyline, getPolylineEditPoints, LineContent } from './line-model'
import { StrokeBaseContent, getGeometriesFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache, FillFields } from './model'

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
}

function getPolygonGeometries(content: Omit<PolygonContent, "type">) {
  return getGeometriesFromCache(content, () => {
    const lines = Array.from(iteratePolygonLines(content.points))
    return {
      lines,
      points: content.points,
      bounding: getPointsBounding(content.points),
      renderingLines: content.dashArray ? dashedPolylineToLines(polygonToPolyline(content.points), content.dashArray) : [polygonToPolyline(content.points)],
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
