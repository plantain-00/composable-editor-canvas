import { calculateEquation3, calculateEquation5, newtonIterate } from "./equation-calculater"
import { Position, Circle, getTwoPointsRadian, getPointSideOfLine, getCirclePointAtRadian, getTwoPointsDistance, Ellipse, getEllipseRadian, Arc, pointIsOnLineSegment, twoPointLineToGeneralFormLine, EllipseArc, angleInRange, getArcPointAtAngle, getEllipseArcPointAtAngle, getEllipsePointAtRadian, TwoPointsFormRegion, getPolygonFromTwoPointsFormRegion, getPolygonLine, GeneralFormLine } from "./geometry"
import { BezierCurve, GeometryLine, QuadraticCurve } from "./intersection"
import { angleToRadian, radianToAngle } from "./radian"

export function getPerpendicular(point: Position, line: GeneralFormLine) {
  return {
    a: -line.b,
    b: line.a,
    c: point.x * line.b - line.a * point.y,
  }
}

export function getPerpendicularPoint(p: Position, { a, b, c }: GeneralFormLine): Position {
  const d = a ** 2
  const e = b ** 2
  const f = d + e
  const g = -a * b
  return {
    x: (e * p.x + g * p.y - a * c) / f,
    y: (g * p.x + d * p.y - b * c) / f,
  }
}

export function getPerpendicularPointToCircle(position: Position, circle: Circle, near = position) {
  let radian = getTwoPointsRadian(position, circle)
  if (position !== near) {
    // (y - cy)/(x - cx)(cy - y0)/(cx - x0) = -1
    const a1 = circle.x - position.x, a2 = circle.y - position.y
    // (y - cy)a2 + (x - cx)a1 = 0
    // a1 x + a2 y + -a2 cy - a1 cx = 0
    const line = { a: a1, b: a2, c: -a2 * circle.y - a1 * circle.x }
    if (Math.sign(getPointSideOfLine(position, line)) !== Math.sign(getPointSideOfLine(near, line))) {
      radian += Math.PI
    }
  }
  const point = getCirclePointAtRadian(circle, radian)
  return {
    point,
    distance: getTwoPointsDistance(position, point),
    radian,
  }
}

export function getPerpendicularPointRadianToEllipse(position: Position, ellipse: Ellipse, near = position, delta = 1e-5) {
  const { rx, ry, cx, cy, angle } = ellipse
  const r0 = getEllipseRadian(near, ellipse)
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  const a0 = position.x - cx, a1 = position.y - cy
  // x = d2 rx cos - d1 ry sin + cx
  // y = d1 rx cos + d2 ry sin + cy
  // d = (x - a0 - cx)^2 + (y - a1 - cy)^2
  // replace x, y, group sin: d = ry ry sin(x) sin(x) + 2(a0 d1 + -d2 a1) ry sin(x) + rx rx cos(x) cos(x) - 2(a0 d2 + d1 a1) rx cos(x) + a0 a0 + a1 a1
  const b1 = (a0 * d1 - d2 * a1) * ry, b2 = ry * ry - rx * rx, b3 = (a0 * d2 + d1 * a1) * rx
  // d = ry ry sin(x) sin(x) + 2 b1 sin(x) + rx rx cos(x) cos(x) - 2 b3 cos(x) + a0 a0 + a1 a1
  // d'/2 = b1 cos(x) + b2 cos(x) sin(x) + b3 sin(x)
  // (d'/2)' = -b1 sin(x) + b2 (cos(x) cos(x) - sin(x) sin(x)) + b3 cos(x)
  const f1 = (cos: number, sin: number) => b1 * cos + b2 * sin * cos + b3 * sin
  const f2 = (cos: number, sin: number) => b1 * -sin + b2 * (cos * cos - sin * sin) + b3 * cos
  return newtonIterate(r0, r => f1(Math.cos(r), Math.sin(r)), r => f2(Math.cos(r), Math.sin(r)), delta)
}

export function getPerpendicularPointToQuadraticCurve({ x: a0, y: b0 }: Position, { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve, delta = 1e-5) {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 u u + 2 c1 u + a1
  // y = c4 u u + 2 c3 u + b1

  // x' = 2 c2 u + 2 c1
  // y' = 2 c4 u + 2 c3
  // k1 = dy/dx = dy/du/(dx/du) = (2 c4 u + 2 c3)/(2 c2 u + 2 c1) = (c4 u + c3)/(c2 u + c1)
  const a4 = a1 - a0, b4 = b1 - b0
  // k2 = (y - b0)/(x - a0) = (c4 u u + 2 c3 u + b4)/(c2 u u + 2 c1 u + a4)
  // k1 k2 + 1 = 0
  // (c4 u + c3)/(c2 u + c1)(c4 u u + 2 c3 u + b4)/(c2 u u + 2 c1 u + a4) + 1 = 0
  // (c4 u + c3)(c4 u u + 2 c3 u + b4) + (c2 u + c1)(c2 u u + 2 c1 u + a4) = 0
  // group u: (c2 c2 + c4 c4) u u u + (3 c1 c2 + 3 c3 c4) u u + (2 c1 c1 + a4 c2 + 2 c3 c3 + b4 c4) u + a4 c1 + b4 c3 = 0
  const us = calculateEquation3(
    c2 * c2 + c4 * c4,
    3 * (c1 * c2 + c3 * c4),
    2 * c1 * c1 + a4 * c2 + 2 * c3 * c3 + b4 * c4,
    a4 * c1 + b4 * c3,
    delta,
  )
  return us.filter(u => u >= 0 && u <= 1).map(u => ({
    x: c2 * u * u + 2 * c1 * u + a1,
    y: c4 * u * u + 2 * c3 * u + b1,
  }))
}

export function getPerpendicularPointToBezierCurve({ x: a0, y: b0 }: Position, { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve, delta = 1e-5) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = c4 t t t + c5 t t + c6 t + b1

  // x' = 3 c1 t^2 + 2 c2 t + c3
  // y' = 3 c4 t^2 + 2 c5 t + c6
  // k1 = dy/dx = dy/dt/(dx/dt) = (3 c4 t^2 + 2 c5 t + c6)/(3 c1 t^2 + 2 c2 t + c3)
  const d1 = b1 - b0, d2 = a1 - a0
  // k2 = (y - b0)/(x - a0) = (c4 t t t + c5 t t + c6 t + d1)/(c1 t t t + c2 t t + c3 t + d2)
  // k1 k2 + 1 = 0
  // (3 c4 t^2 + 2 c5 t + c6)/(3 c1 t^2 + 2 c2 t + c3)(c4 t t t + c5 t t + c6 t + d1)/(c1 t t t + c2 t t + c3 t + d2) + 1 = 0
  // (3 c4 t^2 + 2 c5 t + c6)(c4 t t t + c5 t t + c6 t + d1) + (3 c1 t^2 + 2 c2 t + c3)(c1 t t t + c2 t t + c3 t + d2) = 0
  // group t: (3 c4 c4 + 3 c1 c1) t t t t t + (5 c4 c5 + 5 c1 c2) t t t t + (2 c2 c2 + 2 c5 c5 + 4 c4 c6 + 4 c1 c3) t t t + (3 c2 c3 + 3 c5 c6 + 3 c4 d1 + 3 c1 d2) t t + (c3 c3 + c6 c6 + 2 c5 d1 + 2 c2 d2) t + c6 d1 + c3 d2 = 0
  const ts = calculateEquation5(
    [
      3 * (c4 * c4 + c1 * c1),
      5 * (c4 * c5 + c1 * c2),
      2 * (c2 * c2 + 2 * c1 * c3 + c5 * c5 + 2 * c4 * c6),
      3 * (c2 * c3 + c5 * c6 + c4 * d1 + c1 * d2),
      c3 * c3 + c6 * c6 + 2 * c5 * d1 + 2 * c2 * d2,
      c6 * d1 + c3 * d2,
    ],
    delta,
  )
  return ts.filter(t => t >= 0 && t <= 1).map(t => ({
    x: c1 * t * t * t + c2 * t * t + c3 * t + a1,
    y: c4 * t * t * t + c5 * t * t + c6 * t + b1,
  }))
}

export function getPointAndLineSegmentNearestPointAndDistance(position: Position, point1: Position, point2: Position) {
  const perpendicularPoint = getPerpendicularPoint(position, twoPointLineToGeneralFormLine(point1, point2))
  if (pointIsOnLineSegment(perpendicularPoint, point1, point2)) {
    return {
      point: perpendicularPoint,
      distance: getTwoPointsDistance(position, perpendicularPoint),
    }
  }
  const d1 = getTwoPointsDistance(position, point1)
  const d2 = getTwoPointsDistance(position, point2)
  if (d1 < d2) {
    return {
      point: point1,
      distance: d1,
    }
  }
  return {
    point: point2,
    distance: d2,
  }
}

export function getPointAndGeometryLineNearestPointAndDistance(p: Position, line: GeometryLine) {
  if (Array.isArray(line)) {
    return getPointAndLineSegmentNearestPointAndDistance(p, ...line)
  }
  if (line.type === 'arc') {
    return getPointAndArcNearestPointAndDistance(p, line.curve)
  }
  if (line.type === 'ellipse arc') {
    return getPointAndEllipseArcNearestPointAndDistance(p, line.curve)
  }
  if (line.type === 'quadratic curve') {
    return getPointAndQuadraticCurveNearestPointAndDistance(p, line.curve)
  }
  return getPointAndBezierCurveNearestPointAndDistance(p, line.curve)
}

export function getPointAndArcNearestPointAndDistance(position: Position, arc: Arc) {
  const { point, distance, radian } = getPerpendicularPointToCircle(position, arc)
  if (angleInRange(radianToAngle(radian), arc)) {
    return { point, distance }
  }
  const point3 = getArcPointAtAngle(arc, arc.startAngle)
  const point4 = getArcPointAtAngle(arc, arc.endAngle)
  const d3 = getTwoPointsDistance(position, point3)
  const d4 = getTwoPointsDistance(position, point4)
  if (d3 < d4) {
    return {
      point: point3,
      distance: d3,
    }
  }
  return {
    point: point4,
    distance: d4,
  }
}

export function getPointAndEllipseArcNearestPointAndDistance(position: Position, ellipseArc: EllipseArc) {
  const radian = getPerpendicularPointRadianToEllipse(position, ellipseArc)
  if (radian !== undefined && angleInRange(radianToAngle(radian), ellipseArc)) {
    const point = getEllipsePointAtRadian(ellipseArc, radian)
    return {
      point,
      distance: getTwoPointsDistance(position, point),
    }
  }
  const point3 = getEllipseArcPointAtAngle(ellipseArc, ellipseArc.startAngle)
  const point4 = getEllipseArcPointAtAngle(ellipseArc, ellipseArc.endAngle)
  const d3 = getTwoPointsDistance(position, point3)
  const d4 = getTwoPointsDistance(position, point4)
  if (d3 < d4) {
    return {
      point: point3,
      distance: d3,
    }
  }
  return {
    point: point4,
    distance: d4,
  }
}

export function getPointAndQuadraticCurveNearestPointAndDistance(position: Position, curve: QuadraticCurve) {
  const points = getPerpendicularPointToQuadraticCurve(position, curve)
  points.push(curve.from, curve.to)
  let result = {
    point: points[0],
    distance: getTwoPointsDistance(position, points[0])
  }
  for (let i = 1; i < points.length; i++) {
    const point = points[i]
    const distance = getTwoPointsDistance(position, point)
    if (distance < result.distance) {
      result = {
        point,
        distance,
      }
    }
  }
  return result
}

export function getPointAndBezierCurveNearestPointAndDistance(position: Position, curve: BezierCurve) {
  const points = getPerpendicularPointToBezierCurve(position, curve)
  points.push(curve.from, curve.to)
  let result = {
    point: points[0],
    distance: getTwoPointsDistance(position, points[0])
  }
  for (let i = 1; i < points.length; i++) {
    const point = points[i]
    const distance = getTwoPointsDistance(position, point)
    if (distance < result.distance) {
      result = {
        point,
        distance,
      }
    }
  }
  return result
}

export function getPointAndGeometryLineMinimumDistance(p: Position, line: GeometryLine) {
  if (Array.isArray(line)) {
    return getPointAndLineSegmentMinimumDistance(p, ...line)
  }
  if (line.type === 'arc') {
    return getPointAndArcMinimumDistance(p, line.curve)
  }
  if (line.type === 'ellipse arc') {
    return getPointAndGeometryLineNearestPointAndDistance(p, line).distance
  }
  if (line.type === 'quadratic curve') {
    return getPointAndQuadraticCurveNearestPointAndDistance(p, line.curve).distance
  }
  return getPointAndBezierCurveNearestPointAndDistance(p, line.curve).distance
}

export function getPointAndLineSegmentMinimumDistance(position: Position, point1: Position, point2: Position) {
  const { distance } = getPointAndLineSegmentNearestPointAndDistance(position, point1, point2)
  return distance
}

export function getPointAndRegionMinimumDistance(position: Position, region: TwoPointsFormRegion) {
  return getPointAndPolygonMinimumDistance(position, getPolygonFromTwoPointsFormRegion(region))
}

export function getPointAndPolygonMinimumDistance(position: Position, polygon: Position[]) {
  const polygonLine = Array.from(getPolygonLine(polygon))
  return Math.min(...polygonLine.map((r) => getPointAndLineSegmentMinimumDistance(position, ...r)))
}

export function getPointAndArcMinimumDistance(position: Position, arc: Arc) {
  const { distance } = getPointAndArcNearestPointAndDistance(position, arc)
  return distance
}
