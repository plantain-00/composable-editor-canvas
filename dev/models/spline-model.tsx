import bspline from 'b-spline'
import { dashedPolylineToLines, getBezierCurvePoints, getBezierSplineControlPointsOfPoints, getPointsBounding, getSymmetryPoint, iteratePolylineLines, Position, rotatePositionByCenter } from '../../src'
import { getPolylineEditPoints } from './line-model'
import { StrokeBaseContent, getGeometriesFromCache, Model, getSnapPointsFromCache, BaseContent, getEditPointsFromCache } from './model'

export type SplineContent = StrokeBaseContent<'spline'> & {
  points: Position[]
  fitting?: boolean
}

export const splineModel: Model<SplineContent> = {
  type: 'spline',
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
  render({ content, color, target, strokeWidth }) {
    const { points } = getSplineGeometries(content)
    return target.renderPolyline(points, { strokeColor: color, dashArray: content.dashArray, strokeWidth })
  },
  renderIfSelected({ content, color, target, strokeWidth }) {
    return target.renderPolyline(content.points, { strokeColor: color, dashArray: [4], strokeWidth })
  },
  getOperatorRenderPosition(content) {
    return content.points[0]
  },
  getDefaultColor(content) {
    return content.strokeColor
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => ({ editPoints: getPolylineEditPoints(content, isSplineContent, false, true) }))
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => content.points.map((p) => ({ ...p, type: 'endpoint' as const })))
  },
  getGeometries: getSplineGeometries,
}

function getSplineGeometries(content: Omit<SplineContent, "type">) {
  return getGeometriesFromCache(content, () => {
    const inputPoints = content.points.map((p) => [p.x, p.y])
    let points: Position[] = []
    if (inputPoints.length > 2) {
      if (content.fitting) {
        const controlPoints = getBezierSplineControlPointsOfPoints(content.points)
        for (let i = 0; i < controlPoints.length; i++) {
          points.push(
            content.points[i],
            ...getBezierCurvePoints(content.points[i], ...controlPoints[i], content.points[i + 1], splineSegmentCount),
          )
        }
        points.push(content.points[content.points.length - 1])
      } else {
        const degree = 2
        const knots: number[] = []
        for (let i = 0; i < inputPoints.length + degree + 1; i++) {
          if (i < degree + 1) {
            knots.push(0)
          } else if (i < inputPoints.length) {
            knots.push(i - degree)
          } else {
            knots.push(inputPoints.length - degree)
          }
        }
        for (let t = 0; t <= splineSegmentCount; t++) {
          const p = bspline(t / splineSegmentCount, degree, inputPoints, knots)
          points.push({ x: p[0], y: p[1] })
        }
      }
    } else {
      points = content.points
    }
    return {
      lines: Array.from(iteratePolylineLines(points)),
      points,
      bounding: getPointsBounding(points),
      renderingLines: content.dashArray ? dashedPolylineToLines(points, content.dashArray) : [points],
    }
  })
}

export function isSplineContent(content: BaseContent): content is SplineContent {
  return content.type === 'spline'
}

const splineSegmentCount = 100
