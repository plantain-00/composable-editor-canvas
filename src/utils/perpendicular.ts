import { getBezierCurvePointAtPercent, getQuadraticCurvePointAtPercent } from "./bezier"
import { calculateEquation3, calculateEquation4, calculateEquation5 } from "./equation-calculater"
import { minimumBy, delta2, isValidPercent, isBetween, deduplicate, isSameNumber, mirrorNumber, isZero } from "./math"
import { getPointByParamAndDirection3D, Position } from "./position"
import { getPolygonFromTwoPointsFormRegion } from "./region"
import { TwoPointsFormRegion } from "./region"
import { getTwoPointsDistance } from "./position"
import { getTwoPointsRadian } from "./radian"
import { angleInRange, normalizeRadian } from "./angle"
import { Ray, getPolygonLine, pointAndDirectionToGeneralFormLine, pointIsOnRay } from "./line"
import { GeneralFormLine } from "./line"
import { twoPointLineToGeneralFormLine } from "./line"
import { getPointSideOfLine } from "./line"
import { pointIsOnLineSegment } from "./line"
import { getEllipseArcStartAndEnd } from "./ellipse"
import { getEllipsePointAtRadian } from "./ellipse"
import { getCirclePointAtRadian, getArcStartAndEnd } from "./circle"
import { EllipseArc } from "./ellipse"
import { Circle, Arc } from "./circle"
import { Ellipse } from "./ellipse"
import { GeometryLine, pointIsOnGeometryLine } from "./geometry-line"
import { QuadraticCurve } from "./bezier"
import { BezierCurve } from "./bezier"
import { getNurbsCurvePointAtParam, getPerpendicularParamToNurbsCurve, getPointAndNurbsCurveNearestPointAndDistance } from "./nurbs"
import { angleToRadian, radianToAngle } from "./radian"
import { Vec3 } from "./types"
import { v3 } from "./matrix"
import { getPointAndHyperbolaNearestPointAndDistance } from "./hyperbola"

export function getPerpendicularLine(point: Position, line: GeneralFormLine): GeneralFormLine {
  return {
    a: -line.b,
    b: line.a,
    c: point.x * line.b - line.a * point.y,
  }
}

export function getPerpendicularLineToGeometryLine(point: Position, line: GeometryLine): GeneralFormLine | undefined {
  const p = getPerpendicularPointToGeometryLine(point, line)
  if (p) {
    return twoPointLineToGeneralFormLine(point, p)
  }
  return
}

export function getPerpendicularPointToGeometryLine(point: Position, line: GeometryLine): Position | undefined {
  if (Array.isArray(line)) {
    const generalFormLine = twoPointLineToGeneralFormLine(...line)
    if (!generalFormLine) return
    return getPerpendicularPoint(point, generalFormLine)
  }
  let p: Position | undefined
  if (line.type === 'arc') {
    p = getPerpendicularPointToCircle(point, line.curve).point
  } else if (line.type === 'ellipse arc') {
    const radian = getPerpendicularPointRadiansToEllipse(point, line.curve)[0]
    if (radian !== undefined) {
      p = getEllipsePointAtRadian(line.curve, radian)
    }
  } else if (line.type === 'quadratic curve') {
    const percent = getPerpendicularPercentToQuadraticCurve(point, line.curve)[0]
    if (percent !== undefined) {
      p = getQuadraticCurvePointAtPercent(line.curve.from, line.curve.cp, line.curve.to, percent)
    }
  } else if (line.type === 'bezier curve') {
    const percent = getPerpendicularPercentToBezierCurve(point, line.curve)[0]
    if (percent !== undefined) {
      p = getBezierCurvePointAtPercent(line.curve.from, line.curve.cp1, line.curve.cp2, line.curve.to, percent)
    }
  } else if (line.type === 'nurbs curve') {
    const param = getPerpendicularParamToNurbsCurve(point, line.curve)
    if (param !== undefined) {
      p = getNurbsCurvePointAtParam(line.curve, param)
    }
  } else if (line.type === 'ray') {
    p = getPerpendicularPoint(point, pointAndDirectionToGeneralFormLine(line.line, angleToRadian(line.line.angle)))
  }
  return p
}

export function getPerpendicularPointToGeometryLines(point: Position, lines: GeometryLine[]): { point: Position, line?: GeometryLine } {
  const notExtendedCandidates: { point: Position, distance: number }[] = []
  const extendedCandidates: { point: Position, distance: number, line: GeometryLine }[] = []
  for (const line of lines) {
    const p = getPerpendicularPointToGeometryLine(point, line)
    if (p) {
      if (pointIsOnGeometryLine(p, line)) {
        notExtendedCandidates.push({
          point: p,
          distance: getTwoPointsDistance(p, point),
        })
      } else {
        extendedCandidates.push({
          point: p,
          distance: getTwoPointsDistance(p, point),
          line,
        })
      }
    }
  }
  if (notExtendedCandidates.length > 0) {
    return minimumBy(notExtendedCandidates, n => n.distance)
  }
  return minimumBy(extendedCandidates, n => n.distance)
}

export function getPerpendicularPoint(p: Position, { a, b, c }: GeneralFormLine): Position {
  // F1: a x + b y + c = 0
  // (y - y0)/(x - x0)(-a/b) = -1
  // F2: a y - a y0 - b x + b x0 = 0
  // F1*a: a a x + a b y + a c = 0
  // F2*b: a b y - a b y0 - b b x + b bx 0 = 0
  // a a x + a c + a b y0 + b b x - b b x0 = 0
  // (a a + b b)x = b b x0 - a c - a b y0
  const d = a ** 2
  const e = b ** 2
  const f = d + e
  const g = -a * b
  // f x = e x0 - a c + g y0
  return {
    x: (e * p.x + g * p.y - a * c) / f,
    y: (g * p.x + d * p.y - b * c) / f,
  }
}

export function getPerpendicularParamToLine2D(p: Position, start: Position, directionRadian: number): number {
  // let e1 = Math.sin(directionRadian), e2 = Math.cos(directionRadian)
  // let { x: x0, y: y0 } = start
  // let { x: x1, y: y1 } = p
  // x = x0 + e2 t
  // y = y0 + e1 t
  // (y - y1)/(x - x1)(y - y0)/(x - x0) = -1
  // (y - y1)(y - y0) + (x - x1)(x - x0) = 0
  // (y0 + e1 t - y1)(y0 + e1 t - y0) + (x0 + e2 t - x1)(x0 + e2 t - x0) = 0
  // (y0 + e1 t - y1)e1 t + (x0 + e2 t - x1)e2 t = 0
  // let f1 = y1 - y0, f2 = x1 - x0
  // (e1 t - f1)e1 + (e2 t - f2)e2 = 0
  // (e1 e1 + e2 e2) t - e1 f1 - e2 f2 = 0
  // t = e1 f1 + e2 f2
  return Math.sin(directionRadian) * (p.y - start.y) + Math.cos(directionRadian) * (p.x - start.x)
}

export function getPerpendicularParamToLine(p: Vec3, start: Vec3, direction: Vec3): number {
  // let [x0, y0, z0] = p
  // let [x1, y1, z1] = start
  // let [a, b, c] = direction
  // a x + b y + c z + d = 0
  // d = -(a x0 + b y0 + c z0)
  // x = x1 + a t
  // y = y1 + b t
  // z = z1 + c t
  // a(x1 + a t) + b(y1 + b t) + c(z1 + c t) - (a x0 + b y0 + c z0) = 0
  // (a a + b b + c c) t + -a x0 + a x1 + -b y0 + b y1 + -c z0 + c z1 = 0
  // t = (a (x0 - x1) + b (y0 - y1) + c (z0 - z1)) / (a a + b b + c c)
  return v3.dot(direction, v3.substract(p, start)) / v3.lengthSquare(direction)
}

export function getPerpendicularPointToLine3D(point: Vec3, start: Vec3, direction: Vec3): Vec3 {
  const param = getPerpendicularParamToLine(point, start, direction)
  return getPointByParamAndDirection3D(start, param, direction)
}

export function getPerpendicularDistanceToLine3D(point: Vec3, start: Vec3, direction: Vec3): number {
  const p = getPerpendicularPointToLine3D(point, start, direction)
  return v3.length(v3.substract(p, point))
}

export function getPerpendicularDistance({ x, y }: Position, { a, b, c }: GeneralFormLine): number {
  // parallel line: a x + b y + c - d sqrt(a a + b b) = 0
  // a x + b y + c + d sqrt(a a + b b) = 0
  // d = abs(a x + b y + c)/sqrt(a a + b b)
  return Math.abs(a * x + b * y + c) / Math.sqrt(a ** 2 + b ** 2)
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

export function getPerpendicularPointRadiansToEllipse({ x: x1, y: y1 }: Position, ellipse: Ellipse, delta = delta2): number[] {
  const { rx, ry, angle, cx, cy } = ellipse
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  // x = d2 rx cos(t) - d1 ry sin(t) + cx
  // y = d1 rx cos(t) + d2 ry sin(t) + cy
  // f = (x - x1)^2 + (y - y1)^2
  // f = (d2 rx cos(t) - d1 ry sin(t) + cx - x1)^2 + (d1 rx cos(t) + d2 ry sin(t) + cy - y1)^2
  const a1 = cx - x1, a2 = cy - y1
  // f = (d2 rx cos(t) - d1 ry sin(t) + a1)^2 + (d1 rx cos(t) + d2 ry sin(t) + a2)^2
  // f' = 2(d2 rx cos(t) - d1 ry sin(t) + a1)(-d2 rx sin(t) - d1 ry cos(t)) + 2(d1 rx cos(t) + d2 ry sin(t) + a2)(-d1 rx sin(t) + d2 ry cos(t))
  // f' = 2 (ry ry - rx rx) sin(t) cos(t) + 2(a2 d2 - a1 d1)ry cos(t) - 2(a2 d1 + a1 d2) rx sin(t)
  const b1 = ry * ry - rx * rx, b2 = (a2 * d2 - a1 * d1) * ry, b3 = -(a2 * d1 + a1 * d2) * rx
  // f' = b1 sin(t) cos(t) + b2 cos(t) + b3 sin(t)
  // let u = sin(t)
  // b1 u cos(t) + b2 cos(t) + b3 u = 0
  // cos(t) = -b3 u/(b1 u + b2)
  // u u + cos(t)^2 = 1
  // u u - 1 + b3 b3 u u/(b1 u + b2)/(b1 u + b2) = 0
  // *(b1 u + b2)*(b1 u + b2): (u u - 1)(b1 u + b2)(b1 u + b2) + b3 b3 u u = 0
  // expand, group by u: b1 b1 u u u u + 2 b1 b2 u u u + (-b1 b1 + b2 b2 + b3 b3) u u + -2 b1 b2 u + -b2 b2 = 0
  const us = calculateEquation4(b1 * b1, 2 * b1 * b2, -b1 * b1 + b2 * b2 + b3 * b3, -2 * b1 * b2, -b2 * b2, delta)
  const result: number[] = []
  for (const u of us) {
    if (isBetween(u, -1, 1)) {
      const t1 = Math.asin(u)
      for (const t of [t1, normalizeRadian(mirrorNumber(t1, Math.PI / 2))]) {
        if (isZero(b1 * u * Math.cos(t) + b2 * Math.cos(t) + b3 * u)) {
          result.push(t)
        }
      }
    }
  }
  return deduplicate(result, isSameNumber)
}

export function getPerpendicularPointToEllipseArc(point: Position, ellipseArc: EllipseArc, delta = delta2) {
  const radians = getPerpendicularPointRadiansToEllipse(point, ellipseArc, delta)
  return radians.filter(u => angleInRange(radianToAngle(u), ellipseArc)).map(u => getEllipsePointAtRadian(ellipseArc, u))
}

export function getPerpendicularPercentToQuadraticCurve({ x: a0, y: b0 }: Position, { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve, delta = delta2) {
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
  return us
}

export function getPerpendicularPointToQuadraticCurve(point: Position, curve: QuadraticCurve, delta = delta2) {
  const us = getPerpendicularPercentToQuadraticCurve(point, curve, delta)
  return us.filter(u => isValidPercent(u)).map(u => getQuadraticCurvePointAtPercent(curve.from, curve.cp, curve.to, u))
}

export function getPerpendicularPercentToBezierCurve({ x: a0, y: b0 }: Position, { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve, delta = delta2) {
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
  return ts
}

export function getPerpendicularPointToBezierCurve(point: Position, curve: BezierCurve, delta = delta2) {
  const us = getPerpendicularPercentToBezierCurve(point, curve, delta)
  return us.filter(u => isValidPercent(u)).map(u => getBezierCurvePointAtPercent(curve.from, curve.cp1, curve.cp2, curve.to, u))
}

export function getPointAndLineSegmentNearestPointAndDistance(position: Position, point1: Position, point2: Position, extend = false): { point: Position, distance: number } {
  const line = twoPointLineToGeneralFormLine(point1, point2)
  const perpendicularPoint = line ? getPerpendicularPoint(position, line) : point1
  if (extend || pointIsOnLineSegment(perpendicularPoint, point1, point2)) {
    return {
      point: perpendicularPoint,
      distance: getTwoPointsDistance(position, perpendicularPoint),
    }
  }
  return getPointAndPointsNearestPointAndDistance(position, [point1, point2])
}

export function getPointAndPointsNearestPointAndDistance(point: Position, points: Position[]): { point: Position, distance: number } {
  return minimumBy(points.map(p => ({ point: p, distance: getTwoPointsDistance(point, p) })), v => v.distance)
}

export function getPointAndRayNearestPointAndDistance(position: Position, ray: Ray, extend = false) {
  const perpendicularPoint = getPerpendicularPoint(position, pointAndDirectionToGeneralFormLine(ray, angleToRadian(ray.angle)))
  if (extend || ray.bidirectional || pointIsOnRay(perpendicularPoint, ray)) {
    return {
      point: perpendicularPoint,
      distance: getTwoPointsDistance(position, perpendicularPoint),
    }
  }
  return { point: ray, distance: getTwoPointsDistance(position, ray) }
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
  if (line.type === 'bezier curve') {
    return getPointAndBezierCurveNearestPointAndDistance(p, line.curve)
  }
  if (line.type === 'hyperbola curve') {
    return getPointAndHyperbolaNearestPointAndDistance(p, line.curve)
  }
  if (line.type === 'ray') {
    return getPointAndRayNearestPointAndDistance(p, line.line)
  }
  return getPointAndNurbsCurveNearestPointAndDistance(p, line.curve)
}

export function getPointAndArcNearestPointAndDistance(position: Position, arc: Arc, extend = false) {
  const { point, distance, radian } = getPerpendicularPointToCircle(position, arc)
  if (extend || angleInRange(radianToAngle(radian), arc)) {
    return { point, distance }
  }
  const { start, end } = getArcStartAndEnd(arc)
  return getPointAndPointsNearestPointAndDistance(position, [start, end])
}

export function getPointAndEllipseArcNearestPointAndDistance(position: Position, ellipseArc: EllipseArc, extend = false) {
  let radians = getPerpendicularPointRadiansToEllipse(position, ellipseArc)
  if (!extend) {
    radians = radians.filter(u => angleInRange(radianToAngle(u), ellipseArc))
  }
  const points = radians.map(radian => getEllipsePointAtRadian(ellipseArc, radian))
  const { start, end } = getEllipseArcStartAndEnd(ellipseArc)
  points.push(start, end)
  return getPointAndPointsNearestPointAndDistance(position, points)
}

export function getPointAndQuadraticCurveNearestPointAndDistance(position: Position, curve: QuadraticCurve, extend = false) {
  let us = getPerpendicularPercentToQuadraticCurve(position, curve)
  if (!extend) {
    us = us.filter(u => isValidPercent(u))
  }
  const points = us.map(u => ({
    u,
    p: getQuadraticCurvePointAtPercent(curve.from, curve.cp, curve.to, u),
  }))
  points.push({ u: 0, p: curve.from }, { u: 1, p: curve.to })
  const results = points.map(p => ({
    percent: p.u,
    point: p.p,
    distance: getTwoPointsDistance(position, p.p)
  }))
  return minimumBy(results, v => v.distance)
}

export function getPointAndBezierCurveNearestPointAndDistance(position: Position, curve: BezierCurve, extend = false) {
  let us = getPerpendicularPercentToBezierCurve(position, curve)
  if (!extend) {
    us = us.filter(u => isValidPercent(u))
  }
  const points = us.map(u => ({
    u,
    p: getBezierCurvePointAtPercent(curve.from, curve.cp1, curve.cp2, curve.to, u),
  }))
  points.push({ u: 0, p: curve.from }, { u: 1, p: curve.to })
  const results = points.map(p => ({
    percent: p.u,
    point: p.p,
    distance: getTwoPointsDistance(position, p.p)
  }))
  return minimumBy(results, v => v.distance)
}

export function getPointAndGeometryLineMinimumDistance(p: Position, line: GeometryLine, extend = false) {
  if (Array.isArray(line)) {
    return getPointAndLineSegmentMinimumDistance(p, ...line, extend)
  }
  if (line.type === 'arc') {
    return getPointAndArcMinimumDistance(p, line.curve, extend)
  }
  if (line.type === 'ellipse arc') {
    return getPointAndEllipseArcNearestPointAndDistance(p, line.curve, extend).distance
  }
  if (line.type === 'quadratic curve') {
    return getPointAndQuadraticCurveNearestPointAndDistance(p, line.curve, extend).distance
  }
  if (line.type === 'bezier curve') {
    return getPointAndBezierCurveNearestPointAndDistance(p, line.curve, extend).distance
  }
  if (line.type === 'hyperbola curve') {
    return getPointAndHyperbolaNearestPointAndDistance(p, line.curve, extend).distance
  }
  if (line.type === 'ray') {
    return getPointAndRayNearestPointAndDistance(p, line.line, extend).distance
  }
  return getPointAndNurbsCurveNearestPointAndDistance(p, line.curve).distance
}

export function getPointAndLineSegmentMinimumDistance(position: Position, point1: Position, point2: Position, extend = false) {
  const { distance } = getPointAndLineSegmentNearestPointAndDistance(position, point1, point2, extend)
  return distance
}

export function getPointAndRegionMinimumDistance(position: Position, region: TwoPointsFormRegion) {
  return getPointAndPolygonMinimumDistance(position, getPolygonFromTwoPointsFormRegion(region))
}

export function getPointAndPolygonMinimumDistance(position: Position, polygon: Position[]) {
  const polygonLine = Array.from(getPolygonLine(polygon))
  return Math.min(...polygonLine.map((r) => getPointAndLineSegmentMinimumDistance(position, ...r)))
}

export function getPointAndArcMinimumDistance(position: Position, arc: Arc, extend = false) {
  const { distance } = getPointAndArcNearestPointAndDistance(position, arc, extend)
  return distance
}
