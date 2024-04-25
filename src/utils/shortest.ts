import { BezierCurve, QuadraticCurve, getBezierCurvePointAtPercent, getQuadraticCurvePointAtPercent } from "./bezier"
import { Circle, getCirclePointAtRadian } from "./circle"
import { Ellipse, getEllipsePointAtRadian } from "./ellipse"
import { calculateEquation2 } from "./equation-calculater"
import { GeometryLine, getGeometryLineStartAndEnd, getLineSegmentOrRayPoint, lineSegmentOrRayToGeneralFormLine, pointIsOnGeometryLine } from "./geometry-line"
import { getTwoGeometryLinesIntersectionPoint } from "./intersection"
import { iterateItemOrArray } from "./iterator"
import { GeneralFormLine, getGeneralFormLineRadian } from "./line"
import { isZero, minimumBy } from "./math"
import { getPerpendicularPoint, getPointAndGeometryLineNearestPointAndDistance } from "./perpendicular"
import { Position, getPointByLengthAndDirection, getPointByLengthAndRadian, getTwoPointsDistance, isSamePoint } from "./position"
import { angleToRadian } from "./radian"
import { reverseRadian } from "./reverse"
import { Tuple2 } from "./types"

export function getShortestDistanceOfTwoGeometryLine(line1: GeometryLine, line2: GeometryLine): { points: Tuple2<Position>, distance: number } {
  const point = getTwoGeometryLinesIntersectionPoint(line1, line2)[0]
  if (point) {
    return { points: [point, point], distance: 0 }
  }
  return getShortestDistanceOfTwoDisjointGeometryLine(line1, line2)
}

export function getShortestDistanceOfTwoDisjointGeometryLine(line1: GeometryLine, line2: GeometryLine): { points: Tuple2<Position>, distance: number } {
  let results: { points: Tuple2<Position>, distance: number }[] = []
  if (Array.isArray(line1) || line1.type === 'ray') {
    const line = lineSegmentOrRayToGeneralFormLine(line1)
    if (!line) {
      const p1 = getLineSegmentOrRayPoint(line1)
      const nearest = getPointAndGeometryLineNearestPointAndDistance(p1, line2)
      results = [{ points: [p1, nearest.point], distance: nearest.distance }]
    } else if (Array.isArray(line2) || line2.type === 'ray') {
      results = []
    } else if (line2.type === 'arc') {
      results = getLineAndCircleExtremumPoints(line, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'ellipse arc') {
      results = getLineAndEllipseExtremumPoints(line, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'quadratic curve') {
      const p = getLineAndQuadraticCurveExtremumPoint(line, line2.curve)
      results = [{ points: p, distance: getTwoPointsDistance(...p) }]
    } else if (line2.type === 'bezier curve') {
      results = getLineAndBezierCurveExtremumPoints(line, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    }
  } else if (Array.isArray(line2) || line2.type === 'ray') {
    return getShortestDistanceOfTwoDisjointGeometryLine(line2, line1)
  } else if (line1.type === 'arc') {
    if (line2.type === 'arc') {
      results = getTwoCircleExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    }
  } else if (line2.type === 'arc') {
    return getShortestDistanceOfTwoDisjointGeometryLine(line2, line1)
  }
  results = results.filter(r => pointIsOnGeometryLine(r.points[0], line1) && pointIsOnGeometryLine(r.points[1], line2))
  const { start: start1, end: end1 } = getGeometryLineStartAndEnd(line1)
  results.push(...Array.from(iterateItemOrArray([start1, end1])).map(p => {
    const r = getPointAndGeometryLineNearestPointAndDistance(p, line2)
    return { points: [p, r.point] as Tuple2<Position>, distance: r.distance }
  }))

  const { start: start2, end: end2 } = getGeometryLineStartAndEnd(line2)
  results.push(...Array.from(iterateItemOrArray([start2, end2])).map(p => {
    const r = getPointAndGeometryLineNearestPointAndDistance(p, line1)
    return { points: [p, r.point] as Tuple2<Position>, distance: r.distance }
  }))
  return minimumBy(results, n => n.distance)
}

export function getShortestDistanceOfTwoGeometryLines(lines1: GeometryLine[], lines2: GeometryLine[]): { points: [Position, Position], distance: number } {
  return minimumBy(lines1.map(n1 => minimumBy(lines2.map(n2 => getShortestDistanceOfTwoGeometryLine(n1, n2)), n => n.distance, isZero)), n => n.distance, isZero)
}

export function getLineAndCircleExtremumPoints(line: GeneralFormLine, circle: Circle): Tuple2<Position>[] {
  const p1 = getPerpendicularPoint(circle, line)
  if (isSamePoint(p1, circle)) {
    const radian = getGeneralFormLineRadian(line)
    const p21 = getPointByLengthAndRadian(circle, circle.r, radian + Math.PI / 2)
    const p22 = getPointByLengthAndRadian(circle, -circle.r, radian - Math.PI / 2)
    return [[p1, p21], [p1, p22]]
  }
  const p21 = getPointByLengthAndDirection(circle, circle.r, p1)
  const p22 = getPointByLengthAndDirection(circle, -circle.r, p1)
  return [[p1, p21], [p1, p22]]
}

export function getLineAndEllipseExtremumPoints(line: GeneralFormLine, ellipse: Ellipse): Tuple2<Position>[] {
  const { a, b } = line
  const { rx, ry, angle } = ellipse
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  // x = d2 rx cos(t) - d1 ry sin(t) + cx
  // y = d1 rx cos(t) + d2 ry sin(t) + cy
  // dx/dt = (-(d2 rx sin(t))) - d1 ry cos(t)
  // dy/dt = (-(d1 rx sin(t))) + d2 ry cos(t)
  // a x + b y + c = 0
  // dy / dx = -a/ b
  // a dx + b dy = 0
  // a((-(d2 rx sin(t))) - d1 ry cos(t)) + b((-(d1 rx sin(t))) + d2 ry cos(t)) = 0
  // /cos(t): a((-(d2 rx tan(t))) - d1 ry) + b((-(d1 rx tan(t))) + d2 ry) = 0
  // let u = tan(t)
  // a((-(d2 rx u)) - d1 ry) + b((-(d1 rx u)) + d2 ry) = 0
  // (-b d1 rx + -a d2 rx) u + -a d1 ry + b d2 ry = 0
  // u = (a d1 - b d2) ry / (-b d1 - a d2) / rx
  const t1 = Math.atan2((a * d1 - b * d2) * ry, (-b * d1 - a * d2) * rx)
  const t2 = reverseRadian(t1)
  return ([t1, t2]).map(t => {
    const p2 = getEllipsePointAtRadian(ellipse, t)
    const p1 = getPerpendicularPoint(p2, line)
    return [p1, p2]
  })
}

export function getLineAndQuadraticCurveExtremumPoint(line: GeneralFormLine, curve: QuadraticCurve): Tuple2<Position> {
  const { a, b } = line
  const { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } } = curve
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 t t + 2 c1 t + a1
  // y = c4 t t + 2 c3 t + b1
  // dx/dt = 2 c2 t + 2 c1
  // dy/dt = 2 c4 t + 2 c3
  // a x + b y + c = 0
  // dy / dx = -a/ b
  // a dx + b dy = 0
  // a(2 c2 t + 2 c1) + b(2 c4 t + 2 c3) = 0
  // /2: a(c2 t + c1) + b(c4 t + c3) = 0
  // (a c2 + b c4) t + a c1 + b c3 = 0
  // t = -(a c1 + b c3)/(a c2 + b c4)
  const t = -(a * c1 + b * c3) / (a * c2 + b * c4)
  const p2 = getQuadraticCurvePointAtPercent(curve.from, curve.cp, curve.to, t)
  const p1 = getPerpendicularPoint(p2, line)
  return [p1, p2]
}

export function getLineAndBezierCurveExtremumPoints(line: GeneralFormLine, curve: BezierCurve): Tuple2<Position>[] {
  const { a, b } = line
  const { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } } = curve
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = c4 t t t + c5 t t + c6 t + b1
  // dx/dt = 3 c1 t^2 + 2 c2 t + c3
  // dy/dt = 3 c4 t^2 + 2 c5 t + c6
  // a x + b y + c = 0
  // dy / dx = -a/ b
  // a dx + b dy = 0
  // a(3 c1 t^2 + 2 c2 t + c3) + b(3 c4 t^2 + 2 c5 t + c6) = 0
  // (3 a c1 + 3 b c4) t t + (2 a c2 + 2 b c5) t + a c3 + b c6 = 0
  const ts = calculateEquation2(3 * a * c1 + 3 * b * c4, 2 * a * c2 + 2 * b * c5, a * c3 + b * c6)
  return ts.map(t => {
    const p2 = getBezierCurvePointAtPercent(curve.from, curve.cp1, curve.cp2, curve.to, t)
    const p1 = getPerpendicularPoint(p2, line)
    return [p1, p2]
  })
}

export function getTwoCircleExtremumPoints(circle1: Circle, circle2: Circle): Tuple2<Position>[] {
  if (isSamePoint(circle1, circle2)) return []
  const t1 = Math.atan2(circle1.y - circle2.y, circle1.x - circle2.x)
  const t2 = reverseRadian(t1)
  const p11 = getCirclePointAtRadian(circle1, t1)
  const p12 = getCirclePointAtRadian(circle1, t2)
  const p21 = getCirclePointAtRadian(circle2, t1)
  const p22 = getCirclePointAtRadian(circle2, t2)
  return [[p11, p21], [p12, p21], [p11, p22], [p12, p22]]
}
