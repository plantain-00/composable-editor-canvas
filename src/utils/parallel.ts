import { getBezierCurvePercentAtPoint, getPartOfBezierCurve, getPartOfQuadraticCurve, getQuadraticCurvePercentAtPoint } from "./bezier"
import { getGeometryLineParamAtPoint, getGeometryLineTangentRadianAtParam, getNearestGeometryLines, pointIsOnGeometryLine } from "./geometry-line"
import { isGeometryLinesClosed, getGeometryLineStartAndEnd } from "./geometry-line"
import { findFrom, findIndexFrom, isSameNumber, isZero, minimumBy } from "./math"
import { Position } from "./position"
import { getTwoPointsDistance } from "./position"
import { isSamePoint } from "./position"
import { getTwoPointsRadian } from "./radian"
import { normalizeRadian, twoRadiansSameDirection } from "./angle"
import { getParallelRaysByDistance, iteratePolylineLines } from "./line"
import { getParallelLineSegmentsByDistance } from "./line"
import { pointAndDirectionToGeneralFormLine, twoPointLineToGeneralFormLine } from "./line"
import { getPointSideOfLine } from "./line"
import { getEllipseAngle } from "./ellipse"
import { EllipseArc } from "./ellipse"
import { Arc, Circle } from "./circle"
import { Ellipse } from "./ellipse"
import { getTwoGeometryLinesIntersectionPoint, getTwoLinesIntersectionPoint } from "./intersection"
import { GeometryLine } from "./geometry-line"
import { QuadraticCurve } from "./bezier"
import { BezierCurve } from "./bezier"
import { getNurbsCurveParamAtPoint, getParallelNurbsCurvesByDistance, getPartOfNurbsCurve, getPointSideOfNurbsCurve } from "./nurbs"
import { getPointAndBezierCurveNearestPointAndDistance, getPointAndGeometryLineMinimumDistance, getPointAndQuadraticCurveNearestPointAndDistance } from "./perpendicular"
import { angleToRadian, radianToAngle } from "./radian"
import { getBezierCurveTangentRadianAtPercent, getQuadraticCurveTangentRadianAtPercent } from "./tangency"
import { LineJoin, defaultLineJoin } from "./triangles"
import { getHyperbolaParamAtPoint, getParallelHyperbolaSegmentsByDistance, getPointSideOfHyperbolaSegment } from "./hyperbola"

export function getParallelCirclesByDistance<T extends Circle>(circle: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [circle, circle]
  }
  return [
    {
      ...circle,
      r: circle.r - distance, // on right side of circle
    },
    {
      ...circle,
      r: circle.r + distance, // on left side of circle
    },
  ]
}

export function getParallelArcsByDistance<T extends Arc>(arc: T, distance: number): [T, T] {
  const arcs = getParallelCirclesByDistance(arc, distance)
  if (arc.counterclockwise) {
    return [arcs[1], arcs[0]]
  }
  return arcs
}

export function getParallelEllipsesByDistance<T extends Ellipse>(ellipse: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [ellipse, ellipse]
  }
  return [
    {
      ...ellipse,
      rx: ellipse.rx - distance, // on right side of ellipse
      ry: ellipse.ry - distance,
    },
    {
      ...ellipse,
      rx: ellipse.rx + distance, // on left side of ellipse
      ry: ellipse.ry + distance,
    },
  ]
}

export function getParallelEllipseArcsByDistance<T extends EllipseArc>(ellipseArc: T, distance: number): [T, T] {
  const ellipseArcs = getParallelEllipsesByDistance(ellipseArc, distance)
  if (ellipseArc.counterclockwise) {
    return [ellipseArcs[1], ellipseArcs[0]]
  }
  return ellipseArcs
}

export function getParallelQuadraticCurvesByDistance<T extends QuadraticCurve>(curve: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [curve, curve]
  }
  const [p0, p1] = getParallelPolylinesByDistance([curve.from, curve.cp, curve.to], distance, false)
  return [
    { ...curve, from: p0[0], cp: p0[1], to: p0[2] },
    { ...curve, from: p1[0], cp: p1[1], to: p1[2] },
  ]
}

export function getParallelBezierCurvesByDistance<T extends BezierCurve>(curve: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [curve, curve]
  }
  const [p0, p1] = getParallelPolylinesByDistance([curve.from, curve.cp1, curve.cp2, curve.to], distance, false)
  return [
    { ...curve, from: p0[0], cp1: p0[1], cp2: p0[2], to: p0[3] },
    { ...curve, from: p1[0], cp1: p1[1], cp2: p1[2], to: p1[3] },
  ]
}

/**
 * 0: point on circle
 * 1: point on left side of circle
 * -1: point on right side of circle
 */
export function getPointSideOfCircle(point: Position, circle: Circle): number {
  const distance = getTwoPointsDistance(point, circle)
  if (isSameNumber(distance, circle.r)) return 0
  return distance > circle.r ? 1 : -1
}

/**
 * 0: point on arc
 * 1: point on left side of arc
 * -1: point on right side of arc
 */
export function getPointSideOfArc(point: Position, arc: Arc): number {
  return getPointSideOfCircle(point, arc) * (arc.counterclockwise ? -1 : 1)
}

/**
 * 0: point on ellipse
 * 1: point on left side of ellipse
 * -1: point on right side of ellipse
 */
export function getPointSideOfEllipse(point: Position, { rx, ry, cx, cy, angle }: Ellipse): number {
  const radian = angleToRadian(angle)
  const a1 = Math.sin(radian), a2 = Math.cos(radian)
  // (a2(x - cx) + a1(y - cy))^2/rx/rx + (-a1(x - cx) + a2(y - cy))^2/ry/ry = 1
  const d = (a2 * (point.x - cx) + a1 * (point.y - cy)) ** 2 / rx / rx + (-a1 * (point.x - cx) + a2 * (point.y - cy)) ** 2 / ry / ry
  if (isSameNumber(d, 1)) return 0
  return d > 1 ? 1 : -1
}

/**
 * 0: point on ellipse arc
 * 1: point on left side of ellipse arc
 * -1: point on right side of ellipse arc
 */
export function getPointSideOfEllipseArc(point: Position, arc: EllipseArc): number {
  return getPointSideOfEllipse(point, arc) * (arc.counterclockwise ? -1 : 1)
}

/**
 * 0: point on quadratic curve
 * 1: point on left side of quadratic curve
 * -1: point on right side of quadratic curve
 */
export function getPointSideOfQuadraticCurve(point: Position, curve: QuadraticCurve): number {
  const p = getPointAndQuadraticCurveNearestPointAndDistance(point, curve, true)
  const radian = getQuadraticCurveTangentRadianAtPercent(curve, p.percent)
  const line = pointAndDirectionToGeneralFormLine(p.point, radian)
  return getPointSideOfLine(point, line)
}

/**
 * 0: point on bezier curve
 * 1: point on left side of bezier curve
 * -1: point on right side of bezier curve
 */
export function getPointSideOfBezierCurve(point: Position, curve: BezierCurve): number {
  const p = getPointAndBezierCurveNearestPointAndDistance(point, curve, true)
  const radian = getBezierCurveTangentRadianAtPercent(curve, p.percent)
  const line = pointAndDirectionToGeneralFormLine(p.point, radian)
  return getPointSideOfLine(point, line)
}

export function getPointSideOfGeometryLine(point: Position, line: GeometryLine): number {
  if (Array.isArray(line)) {
    const generalFormLine = twoPointLineToGeneralFormLine(...line)
    if (!generalFormLine) return 0
    return getPointSideOfLine(point, generalFormLine)
  }
  if (line.type === 'arc') {
    return getPointSideOfArc(point, line.curve)
  }
  if (line.type === 'ellipse arc') {
    return getPointSideOfEllipseArc(point, line.curve)
  }
  if (line.type === 'quadratic curve') {
    return getPointSideOfQuadraticCurve(point, line.curve)
  }
  if (line.type === 'bezier curve') {
    return getPointSideOfBezierCurve(point, line.curve)
  }
  if (line.type === 'ray') {
    return getPointSideOfLine(point, pointAndDirectionToGeneralFormLine(line.line, angleToRadian(line.line.angle)))
  }
  if (line.type === 'hyperbola curve') {
    return getPointSideOfHyperbolaSegment(point, line.curve)
  }
  return getPointSideOfNurbsCurve(point, line.curve)
}

/**
 * 0: same direction
 * 1: left side
 * -1: right side
 */
export function getRadianSideOfRadian(from: number, to: number) {
  let radian = to - from
  radian = normalizeRadian(radian)
  return isZero(radian) ? 0 : radian > 0 ? -1 : 1
}

export function getLinesOffsetDirection(point: Position, lines: GeometryLine[]) {
  const line = getNearestGeometryLines(point, lines)[0]
  return pointSideToIndex(getPointSideOfGeometryLine(point, line))
}

export function pointSideToIndex(side: number) {
  return side > 0 ? 1 : 0
}

export function getParallelGeometryLinesByDistance(line: GeometryLine, distance: number): [GeometryLine, GeometryLine] | undefined {
  if (Array.isArray(line)) {
    return getParallelLineSegmentsByDistance(line, distance)
  }
  if (line.type === 'arc') {
    const curves = getParallelArcsByDistance(line.curve, distance)
    return [{ type: 'arc', curve: curves[0] }, { type: 'arc', curve: curves[1] }]
  }
  if (line.type === 'ellipse arc') {
    const curves = getParallelEllipseArcsByDistance(line.curve, distance)
    return [{ type: 'ellipse arc', curve: curves[0] }, { type: 'ellipse arc', curve: curves[1] }]
  }
  if (line.type === 'quadratic curve') {
    const curves = getParallelQuadraticCurvesByDistance(line.curve, distance)
    return [{ type: 'quadratic curve', curve: curves[0] }, { type: 'quadratic curve', curve: curves[1] }]
  }
  if (line.type === 'bezier curve') {
    const curves = getParallelBezierCurvesByDistance(line.curve, distance)
    return [{ type: 'bezier curve', curve: curves[0] }, { type: 'bezier curve', curve: curves[1] }]
  }
  if (line.type === 'ray') {
    const curves = getParallelRaysByDistance(line.line, distance)
    return [{ type: 'ray', line: curves[0] }, { type: 'ray', line: curves[1] }]
  }
  if (line.type === 'hyperbola curve') {
    const curves = getParallelHyperbolaSegmentsByDistance(line.curve, distance)
    return [{ type: 'hyperbola curve', curve: curves[0] }, { type: 'hyperbola curve', curve: curves[1] }]
  }
  const curves = getParallelNurbsCurvesByDistance(line.curve, distance)
  return [{ type: 'nurbs curve', curve: curves[0] }, { type: 'nurbs curve', curve: curves[1] }]
}

export function getParallelGeometryLinesByDistancePoint(point: Position, lines: GeometryLine[], distance: number, lineJoin?: LineJoin): GeometryLine[] {
  if (!distance) {
    distance = Math.min(...lines.map(line => getPointAndGeometryLineMinimumDistance(point, line)))
  }
  const index = getLinesOffsetDirection(point, lines)
  return getParallelGeometryLinesByDistanceDirectionIndex(lines, distance, index, lineJoin)
}

export function getParallelGeometryLinesByDistanceDirectionIndex(
  lines: GeometryLine[],
  distance: number,
  index: 0 | 1,
  lineJoin: LineJoin = defaultLineJoin,
): GeometryLine[] {
  if (isZero(distance)) {
    return lines
  }
  const closed = isGeometryLinesClosed(lines) && lines.length > 1
  const parallels = lines.map(line => getParallelGeometryLinesByDistance(line, distance)?.[index])
  if (parallels.length === 1) {
    const parallel = parallels[0]
    return parallel ? [parallel] : []
  }
  const result: GeometryLine[] = []
  let previous: Position | undefined
  for (let i = 0; i < parallels.length + 1; i++) {
    const previousParallelIndex = findIndexFrom(parallels, i - 1, p => p !== undefined, { closed, reverse: true })
    const previousParallel = previousParallelIndex !== undefined ? parallels[previousParallelIndex] : undefined
    const parallel = findFrom(parallels, i, p => p !== undefined, { closed })
    let current: Position | undefined
    let newItem: { line: GeometryLine, current: Position } | undefined
    if (previousParallel) {
      if (parallel) {
        current = getTwoGeometryLinesNearestIntersectionPoint(previousParallel, parallel)
      } else {
        current = getGeometryLineStartAndEnd(previousParallel).end
      }
    } else if (parallel) {
      current = getGeometryLineStartAndEnd(parallel).start
    }
    if (previousParallel && parallel) {
      if (lineJoin !== 'miter' && current && (!pointIsOnGeometryLine(current, previousParallel) || !pointIsOnGeometryLine(current, parallel))) {
        current = undefined
      }
      if (!current) {
        if (!Array.isArray(parallel) && parallel.type === 'arc' && parallel.curve.r <= 0) {
          lines = lines.toSpliced(i, 1)
          parallels.splice(i, 1)
          i--
          continue
        }
        if (lineJoin === 'miter' && Array.isArray(previousParallel) && Array.isArray(parallel)) {
          current = parallel[0]
        } else if (lineJoin === 'bevel') {
          current = getGeometryLineStartAndEnd(previousParallel).end
          const next = getGeometryLineStartAndEnd(parallel).start
          if (current && next) {
            newItem = {
              current: next,
              line: [current, next],
            }
          }
        } else if (previousParallelIndex !== undefined) {
          const previousLine = lines[previousParallelIndex]
          const center = getGeometryLineStartAndEnd(previousLine).end
          current = getGeometryLineStartAndEnd(previousParallel).end
          const next = getGeometryLineStartAndEnd(parallel).start
          if (center && current && next) {
            const arc: Arc = {
              x: center.x,
              y: center.y,
              r: distance,
              startAngle: radianToAngle(getTwoPointsRadian(current, center)),
              endAngle: radianToAngle(getTwoPointsRadian(next, center)),
            }
            newItem = {
              current: next,
              line: {
                type: 'arc',
                curve: {
                  ...arc,
                  counterclockwise: twoRadiansSameDirection(getGeometryLineTangentRadianAtParam(0, { type: 'arc', curve: arc }), getGeometryLineTangentRadianAtParam(1, previousLine)) ? undefined : true,
                },
              },
            }
          }
        }
      }
    }
    if (current && previous && previousParallel) {
      const line = previousParallel
      if (Array.isArray(line)) {
        result.push([previous, current])
      } else if (line.type === 'arc') {
        result.push({
          type: 'arc',
          curve: {
            ...line.curve,
            startAngle: radianToAngle(getTwoPointsRadian(previous, line.curve)),
            endAngle: radianToAngle(getTwoPointsRadian(current, line.curve)),
          },
        })
      } else if (line.type === 'ellipse arc') {
        result.push({
          type: 'ellipse arc',
          curve: {
            ...line.curve,
            startAngle: getEllipseAngle(previous, line.curve),
            endAngle: getEllipseAngle(current, line.curve),
          },
        })
      } else if (line.type === 'quadratic curve') {
        result.push({
          type: 'quadratic curve',
          curve: getPartOfQuadraticCurve(line.curve, getQuadraticCurvePercentAtPoint(line.curve, previous), getQuadraticCurvePercentAtPoint(line.curve, current)),
        })
      } else if (line.type === 'bezier curve') {
        result.push({
          type: 'bezier curve',
          curve: getPartOfBezierCurve(line.curve, getBezierCurvePercentAtPoint(line.curve, previous), getBezierCurvePercentAtPoint(line.curve, current)),
        })
      } else if (line.type === 'hyperbola curve') {
        result.push({
          type: 'hyperbola curve',
          curve: {
            ...line.curve,
            t1: getHyperbolaParamAtPoint(line.curve, previous),
            t2: getHyperbolaParamAtPoint(line.curve, current),
          },
        })
      } else if (line.type === 'nurbs curve') {
        result.push({
          type: 'nurbs curve',
          curve: getPartOfNurbsCurve(line.curve, getNurbsCurveParamAtPoint(line.curve, previous), getNurbsCurveParamAtPoint(line.curve, current)),
        })
      }
    }
    previous = current
    if (newItem) {
      result.push(newItem.line)
      previous = newItem.current
    }
  }
  return result
}

function getTwoGeometryLinesNearestIntersectionPoint(line1: GeometryLine, line2: GeometryLine) {
  const intersections = getTwoGeometryLinesIntersectionPoint(line1, line2, true)
  if (intersections.length > 1) {
    const params = intersections.map(p => ({ point: p, param: getGeometryLineParamAtPoint(p, line1) })).filter(p => p.param >= 0)
    if (params.length > 1) {
      return minimumBy(params, p => p.param).point
    }
    return params[0]?.point
  }
  return intersections[0]
}

export function getParallelPolylineByDistance(lines: [Position, Position][], distance: number, index: 0 | 1): Position[] {
  const closed = isSamePoint(lines[0][0], lines[lines.length - 1][1]) && lines.length > 1
  const parallels = lines.map(line => getParallelLineSegmentsByDistance(line, distance)?.[index])
  return getParallelLineSegmentsPoints(parallels, closed)
}

export function getParallelPolylinesByDistance(points: Position[], distance: number, closed: boolean): [Position[], Position[]] {
  const parallels = Array.from(iteratePolylineLines(points)).map(line => getParallelLineSegmentsByDistance(line, distance))
  return [
    getParallelLineSegmentsPoints(parallels.map(p => p?.[0]), closed),
    getParallelLineSegmentsPoints(parallels.map(p => p?.[1]), closed),
  ]
}

export function getParallelLineSegmentsPoints(parallels: ([Position, Position] | undefined)[], closed: boolean) {
  const result: Position[] = []
  for (let i = 0; i < parallels.length + 1; i++) {
    const previousParallel = findFrom(parallels, i - 1, p => p !== undefined, { closed, reverse: true })
    const parallel = findFrom(parallels, i, p => p !== undefined, { closed })
    let current: Position | undefined
    if (previousParallel) {
      if (parallel) {
        current = getTwoLinesIntersectionPoint(...previousParallel, ...parallel)
      } else {
        current = previousParallel[1]
      }
    } else if (parallel) {
      current = parallel[0]
    }
    if (current) {
      result.push(current)
    }
  }
  return result
}
