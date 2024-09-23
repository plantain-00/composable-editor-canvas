import { QuadraticCurve } from "./bezier"
import { getPointsBoundingUnsafe } from "./bounding"
import { Arc, Circle, pointIsOnArc } from "./circle"
import { Ellipse, EllipseArc, pointIsOnEllipseArc } from "./ellipse"
import { calculateEquation2, calculateEquation3, calculateEquation4, newtonIterate } from "./equation-calculater"
import { rombergIntegral } from "./length"
import { getPointSideOfLine, pointAndDirectionToGeneralFormLine, pointIsOnLineSegment } from "./line"
import { delta2, delta3, ExtendType, getTwoNumberCenter, isBetween, isSameNumber, isZero, minimumBy } from "./math"
import { getPointByLengthAndRadian, getTwoPointsDistance, Position } from "./position"
import { angleToRadian, radianToAngle } from "./radian"
import { TwoPointsFormRegion } from "./region"
import { transformPointFromCoordinate2D } from "./transform"
import { Tuple3 } from "./types"
import { and, number } from "./validators"

export interface Parabola extends Position {
  // y = 2 p x^2
  p: number
  angle: number
}

export const Parabola = /* @__PURE__ */ and(Position, {
  p: number,
  angle: number,
})

export interface ParabolaSegment extends Parabola {
  t1: number
  t2: number
}

export const ParabolaSegment = /* @__PURE__ */ and(Parabola, {
  t1: number,
  t2: number,
})

export function getParabolaFocusParameter(p: number) {
  return 1 / 4 / p
}

export function getPerpendicularParamsToParabola({ x: x0, y: y0 }: Position, { p, angle, x: x1, y: y1 }: Parabola, delta?: number): number[] {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x1 + e2 t - 2 e1 p t^2
  // y = y1 + e1 t + 2 e2 p t^2
  // x' = e2 - 4 e1 p t
  // y' = 4 e2 p t + e1
  // y'/x'*(y - y0)/(x - x0) = -1
  // y'(y - y0) = -x'(x - x0)
  // x'(x - x0) + y'(y - y0) = 0
  // (e2 - 4 e1 p t)(x1 + e2 t - 2 e1 p t^2 - x0) + (4 e2 p t + e1)(y1 + e1 t + 2 e2 p t^2 - y0) = 0
  const a1 = x1 - x0, a2 = y1 - y0
  // (e2 - 4 e1 p t)(a1 + e2 t - 2 e1 p t^2) + (4 e2 p t + e1)(a2 + e1 t + 2 e2 p t^2) = 0
  // (8 e1 e1 p p + 8 e2 e2 p p) t t t + (-4 a1 e1 p + e1 e1 + e2 e2 + 4 a2 e2 p) t + a1 e2 + a2 e1 = 0
  // 8 p p t t t + (4 p (a2 e2 - a1 e1) + 1) t + a1 e2 + a2 e1 = 0
  return calculateEquation3(
    8 * p * p,
    0,
    4 * p * (a2 * e2 - a1 * e1) + 1,
    a1 * e2 + a2 * e1,
    delta,
  )
}

export function getParabolaPointAtParam(parabola: Parabola, param: number): Position {
  return transformPointFromCoordinate2D(getParabolaCoordinatePointAtParam(parabola, param), parabola, getParabolaXAxisRadian(parabola))
}

export function getParabolaParamAtPoint({ angle, x: x1, y: y1 }: Parabola, point: Position): number {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x1 + e2 t - 2 e1 p t^2
  // y = y1 + e1 t + 2 e2 p t^2
  // e2 x = e2 x1 + e2 e2 t - 2 e1 e2 p t^2
  // e1 y = e1 y1 + e1 e1 t + 2 e1 e2 p t^2
  // e2 x + e1 y = e2 x1 + e1 y1 + t
  // t = e2(x - x1) + e1(y - y1)
  return e2 * (point.x - x1) + e1 * (point.y - y1)
}

export function getParabolaCoordinatePointAtParam(parabola: Parabola, param: number): Position {
  return { x: param, y: 2 * parabola.p * param ** 2 }
}

export function getParabolaXAxisRadian(parabola: Pick<Parabola, 'angle'>): number {
  return angleToRadian(parabola.angle - 90)
}

export function getPointAndParabolaNearestPointAndDistance(position: Position, curve: ParabolaSegment, extend = false) {
  let us = getPerpendicularParamsToParabola(position, curve)
  if (!extend) {
    us = us.filter(u => isBetween(u, curve.t1, curve.t2))
    us.push(curve.t1, curve.t2)
  }
  const points = us.map(u => ({
    u,
    p: getParabolaPointAtParam(curve, u),
  }))
  const results = points.map(p => ({
    param: p.u,
    point: p.p,
    distance: getTwoPointsDistance(position, p.p)
  }))
  return minimumBy(results, v => v.distance)
}

export function getParabolaBounding(curve: ParabolaSegment): TwoPointsFormRegion {
  const { p, angle } = curve
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x1 + e2 t - 2 e1 p t^2
  // y = y1 + e1 t + 2 e2 p t^2
  // x' = e2 - 4 e1 p t = 0
  // y' = 4 e2 p t + e1 = 0
  const points = [
    getParabolaPointAtParam(curve, curve.t1),
    getParabolaPointAtParam(curve, curve.t2),
  ]
  if (!isZero(e1)) {
    const t = e2 / 4 / e1 / p
    if (isBetween(t, curve.t1, curve.t2)) {
      points.push(getParabolaPointAtParam(curve, t))
    }
  }
  if (!isZero(e2)) {
    const t = - e1 / 4 / e2 / p
    if (isBetween(t, curve.t1, curve.t2)) {
      points.push(getParabolaPointAtParam(curve, t))
    }
  }
  return getPointsBoundingUnsafe(points)
}

export function getParabolaLength(curve: ParabolaSegment, delta?: number): number {
  const { p, t1, t2 } = curve
  // let xAxisRadian = getParabolaXAxisRadian({ curve.angle })
  // let e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x1 + e2 t - 2 e1 p t^2
  // y = y1 + e1 t + 2 e2 p t^2
  // x' = e2 - 4 e1 p t = dx/dt
  // y' = 4 e2 p t + e1 = dy/dt
  // dz = sqrt(dx^2 + dy^2)
  // dz/dt = sqrt((e2 - 4 e1 p t)^2 + (4 e2 p t + e1)^2)
  // dz/dt = sqrt((16 e1 e1 p p + 16 e2 e2 p p) t t + e2 e2 + e1 e1)
  // dz/dt = sqrt(16 p p t t + 1)
  const a = 16 * p * p
  return rombergIntegral(t1, t2, t => Math.sqrt(a * t * t + 1), delta)
}

export function getParabolaParamByLength(curve: ParabolaSegment, length: number, delta = delta2): number | undefined {
  const f1 = (t: number) => getParabolaLength({ ...curve, t2: t }) - length
  // dz/dt = sqrt(16 p p t t + 1)
  const a = 16 * curve.p * curve.p
  const f2 = (t: number) => Math.sqrt(a * t * t + 1)
  return newtonIterate(getTwoNumberCenter(curve.t1, curve.t2), f1, f2, delta)
}

export function getParabolaSegmentStartAndEnd(curve: ParabolaSegment) {
  return {
    start: getParabolaPointAtParam(curve, curve.t1),
    end: getParabolaPointAtParam(curve, curve.t2),
  }
}

export function pointIsOnParabola(point: Position, { angle, p, x: x1, y: y1 }: Parabola): boolean {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x1 + e2 t - 2 e1 p t^2
  // y = y1 + e1 t + 2 e2 p t^2
  return calculateEquation2(- 2 * e1 * p, e2, x1 - point.x)
    .filter(t => isSameNumber(2 * e2 * p * t * t + e1 * t + y1, point.y, delta3)).length > 0
}

export function pointIsOnParabolaSegment(point: Position, curve: ParabolaSegment, extend: ExtendType = { body: true }): boolean {
  if (extend.head && extend.body && extend.tail) return true
  if (!extend.head && !extend.body && !extend.tail) return false
  const t = getParabolaParamAtPoint(curve, point)
  return isBetween(t, curve.t1, curve.t2, extend)
}

export function getParabolaTangentRadianAtParam({ angle, p }: Parabola, t: number): number {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x1 + e2 t - 2 e1 p t^2
  // y = y1 + e1 t + 2 e2 p t^2
  // x' = e2 - 4 e1 p t
  // y' = 4 e2 p t + e1
  return Math.atan2(4 * e2 * p * t + e1, e2 - 4 * e1 * p * t)
}

export function getParabolaDerivatives({ angle, p, x: x1, y: y1 }: Parabola): Tuple3<(t: number) => Position> {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x1 + e2 t - 2 e1 p t^2
  // y = y1 + e1 t + 2 e2 p t^2
  const a = -2 * e1 * p, b = 2 * e2 * p
  return [
    t => ({
      x: x1 + e2 * t + a * t ** 2,
      y: y1 + e1 * t + b * t ** 2,
    }),
    t => ({
      x: e2 + 2 * a * t,
      y: e1 + 2 * b * t,
    }),
    () => ({
      x: 2 * a,
      y: 2 * b,
    }),
  ]
}

export function getParabolaCurvatureAtParam(curve: Parabola, param: number): number {
  const derivatives = getParabolaDerivatives(curve)
  const { x: x1, y: y1 } = derivatives[1](param)
  const { x: x2, y: y2 } = derivatives[2](param)
  // (x1 y2 - y1 x2)/(x1 ** 2 + y1 ** 2)**1.5
  return (x1 * y2 - y1 * x2) / (x1 ** 2 + y1 ** 2) ** 1.5
}

export function reverseParabola<T extends ParabolaSegment>(curve: T): T {
  return {
    ...curve,
    t1: curve.t2,
    t2: curve.t1,
  }
}

export function getParallelParabolaSegmentsByDistance<T extends ParabolaSegment>(curve: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [curve, curve]
  }
  if (curve.t1 > curve.t2) {
    distance = -distance
  }
  const p1 = getPointByLengthAndRadian(curve, distance, angleToRadian(curve.angle))
  const p2 = getPointByLengthAndRadian(curve, -distance, angleToRadian(curve.angle))
  return [
    { ...curve, x: p1.x, y: p1.y }, // on right side of parabola segment
    { ...curve, x: p2.x, y: p2.y }, // on left side of parabola segment
  ]
}

/**
 * 0: point on parabola
 * 1: point on left side of parabola
 * -1: point on right side of parabola
 */
export function getPointSideOfParabolaSegment(point: Position, curve: ParabolaSegment): number {
  const p = getPointAndParabolaNearestPointAndDistance(point, curve, true)
  const radian = getParabolaTangentRadianAtParam(curve, p.param)
  const line = pointAndDirectionToGeneralFormLine(p.point, radian)
  return getPointSideOfLine(point, line) * (curve.t1 > curve.t2 ? -1 : 1)
}

export function getLineSegmentParabolaSegmentIntersectionPoints(start: Position, end: Position, curve: ParabolaSegment, extend1: ExtendType = { body: true }, extend2: ExtendType = { body: true }): Position[] {
  const result = getLineParabolaSegmentIntersectionPoints(start, end, curve, extend2)
  return result.filter((p) => pointIsOnLineSegment(p, start, end, extend1))
}

export function getLineParabolaSegmentIntersectionPoints({ x: x1, y: y1 }: Position, { x: x2, y: y2 }: Position, { angle, x: x0, y: y0, p, t1, t2 }: ParabolaSegment, extend: ExtendType = { body: true }): Position[] {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x0 + e2 t - 2 e1 p t^2
  // y = y0 + e1 t + 2 e2 p t^2

  // (x - x1) / (x2 - x1) = (y - y1) / (y2 - y1)
  const d1 = x2 - x1, d2 = y2 - y1
  // (x - x1) d2 - (y - y1) d1 = 0
  // replace x, y: (x0 + e2 t - 2 e1 p t^2 - x1) d2 - (y0 + e1 t + 2 e2 p t^2 - y1) d1 = 0
  const f1 = x0 - x1, f2 = y0 - y1
  // (f1 + e2 t - 2 e1 p t^2) d2 - (f2 + e1 t + 2 e2 p t^2) d1 = 0
  // (-2 d2 e1 p + -2 d1 e2 p) t t + (-d1 e1 + d2 e2) t + d2 f1 + -d1 f2 = 0
  let ts = calculateEquation2(
    -2 * d2 * e1 * p + -2 * d1 * e2 * p,
    -d1 * e1 + d2 * e2,
    d2 * f1 + -d1 * f2,
  )
  ts = ts.filter(t => isBetween(t, t1, t2, extend))
  return ts.map(t => ({
    x: x0 + e2 * t - 2 * e1 * p * t ** 2,
    y: y0 + e1 * t + 2 * e2 * p * t ** 2,
  }))
}

export function getArcParabolaSegmentIntersectionPoints(arc: Arc, curve: ParabolaSegment, extend1: ExtendType = { body: true }, extend2: ExtendType = { body: true }): Position[] {
  const result = getCircleParabolaSegmentIntersectionPoints(arc, curve, extend2)
  return result.filter((p) => pointIsOnArc(p, arc, extend1))
}

export function getCircleParabolaSegmentIntersectionPoints({ x: x1, y: y1, r: r1 }: Circle, { angle, x: x0, y: y0, p, t1, t2 }: ParabolaSegment, extend: ExtendType = { body: true }): Position[] {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x0 + e2 t - 2 e1 p t^2
  // y = y0 + e1 t + 2 e2 p t^2

  // (x - x1)^2 + (y - y1)^2 = r1^2
  // replace x, y: (x0 + e2 t - 2 e1 p t^2 - x1)^2 + (y0 + e1 t + 2 e2 p t^2 - y1)^2 - r1^2 = 0
  const f1 = x0 - x1, f2 = y0 - y1
  // (f1 + e2 t - 2 e1 p t^2)^2 + (f2 + e1 t + 2 e2 p t^2)^2 - r1^2 = 0
  // group by t: (4 e1 e1 p p + 4 e2 e2 p p) t t t t + (-4 e1 f1 p + 4 e2 f2 p + e1 e1 + e2 e2) t t + (2 e2 f1 + 2 e1 f2) t + f1 f1 + f2 f2 + -r1 r1 = 0
  // 4 p p t t t t + (1 - 4 (e1 f1 - e2 f2)p) t t + 2(e2 f1 + e1 f2) t + f1 f1 + f2 f2 - r1 r1 = 0
  let ts = calculateEquation4(
    4 * p * p,
    0,
    1 - 4 * (e1 * f1 - e2 * f2) * p,
    2 * (e2 * f1 + e1 * f2),
    f1 * f1 + f2 * f2 - r1 * r1,
  )
  ts = ts.filter(t => isBetween(t, t1, t2, extend))
  return ts.map(t => ({
    x: x0 + e2 * t - 2 * e1 * p * t ** 2,
    y: y0 + e1 * t + 2 * e2 * p * t ** 2,
  }))
}

export function getEllipseArcParabolaSegmentIntersectionPoints(arc: EllipseArc, curve: ParabolaSegment, extend1: ExtendType = { body: true }, extend2: ExtendType = { body: true }): Position[] {
  const result = getEllipseParabolaSegmentIntersectionPoints(arc, curve, extend2)
  return result.filter((p) => pointIsOnEllipseArc(p, arc, extend1))
}

export function getEllipseParabolaSegmentIntersectionPoints({ rx: rx1, ry: ry1, cx: cx1, cy: cy1, angle: angle1 }: Ellipse, { angle, x: x0, y: y0, p, t1, t2 }: ParabolaSegment, extend: ExtendType = { body: true }): Position[] {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x0 + e2 t - 2 e1 p t^2
  // y = y0 + e1 t + 2 e2 p t^2

  const radian1 = angleToRadian(angle1)
  const d1 = Math.sin(radian1), d2 = Math.cos(radian1), d3 = 1 / rx1 / rx1, d4 = 1 / ry1 / ry1
  // (d2(x - cx1) + d1(y - cy1))^2 d3 + (-d1(x - cx1) + d2(y - cy1))^2 d4 = 1
  // replace x, y: (d2(x0 + e2 t - 2 e1 p t^2 - cx1) + d1(y0 + e1 t + 2 e2 p t^2 - cy1))^2 d3 + (-d1(x0 + e2 t - 2 e1 p t^2 - cx1) + d2(y0 + e1 t + 2 e2 p t^2 - cy1))^2 d4 - 1 = 0
  const f1 = x0 - cx1, f2 = y0 - cy1
  // (d2(f1 + e2 t - 2 e1 p t^2) + d1(f2 + e1 t + 2 e2 p t^2))^2 d3 + (-d1(f1 + e2 t - 2 e1 p t^2) + d2(f2 + e1 t + 2 e2 p t^2))^2 d4 - 1 = 0
  // ((-2 d2 e1 p + 2 d1 e2 p) t t + (d1 e1 + d2 e2) t + d2 f1 + d1 f2)^2 d3 + ((2 d1 e1 p + 2 d2 e2 p) t t + (d2 e1 + -d1 e2) t + -d1 f1 + d2 f2)^2 d4 - 1 = 0
  const g1 = -d2 * e1 + d1 * e2, g2 = d1 * e1 + d2 * e2, g3 = d2 * f1 + d1 * f2, g4 = -d1 * f1 + d2 * f2
  // (2 p g1 t t + g2 t + g3)^2 d3 + (2 p g2 t t - g1 t + g4)^2 d4 - 1 = 0
  // group by t: (4 d3 g1 g1 p p + 4 d4 g2 g2 p p) t t t t + (4 d3 g1 g2 p + -4 d4 g1 g2 p) t t t + (4 d3 g1 g3 p + 4 d4 g2 g4 p + d4 g1 g1 + d3 g2 g2) t t + (2 d3 g2 g3 + -2 d4 g1 g4) t + d3 g3 g3 + d4 g4 g4 + -1 = 0
  let ts = calculateEquation4(
    4 * (d3 * g1 * g1 + d4 * g2 * g2) * p * p,
    4 * (d3 - d4) * g1 * g2 * p,
    4 * (d3 * g1 * g3 + d4 * g2 * g4) * p + d4 * g1 * g1 + d3 * g2 * g2,
    2 * (d3 * g2 * g3 - d4 * g1 * g4),
    d3 * g3 * g3 + d4 * g4 * g4 - 1,
  )
  ts = ts.filter(t => isBetween(t, t1, t2, extend))
  return ts.map(t => ({
    x: x0 + e2 * t - 2 * e1 * p * t ** 2,
    y: y0 + e1 * t + 2 * e2 * p * t ** 2,
  }))
}

export function parabolaSegmentToQuadraticCurve({ angle, x: x0, y: y0, p, t1, t2 }: ParabolaSegment): QuadraticCurve {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x0 + e2 t - 2 e1 p t^2
  // y = y0 + e1 t + 2 e2 p t^2
  const d1 = t2 - t1
  // let t = t1 + u(t2 - t1) =  d1 u + t1
  // x = x0 + e2(d1 u + t1) - 2 e1 p (d1 u + t1)^2 = -2 d1 d1 e1 p u u + (d1 e2 + -4 d1 e1 p t1) u + x0 + e2 t1 + -2 e1 p t1 t1
  // y = y0 + e1(d1 u + t1) + 2 e2 p (d1 u + t1)^2 = 2 d1 d1 e2 p u u + (d1 e1 + 4 d1 e2 p t1) u + y0 + e1 t1 + 2 e2 p t1 t1

  // x = (a1 + a3 - 2 a2) t t + 2 (a2 - a1) t + a1
  // y = (b1 + b3 - 2 b2) t t + 2 (b2 - b1) t + b1

  const a1 = x0 + e2 * t1 - 2 * e1 * p * t1 * t1
  // 2 (a2 - a1) = d1 e2 + -4 d1 e1 p t1
  const a2 = a1 + (d1 * e2 - 4 * d1 * e1 * p * t1) / 2
  // a1 + a3 - 2 a2 = -2 d1 d1 e1 p
  const a3 = 2 * a2 - 2 * d1 * d1 * e1 * p - a1

  const b1 = y0 + e1 * t1 + 2 * e2 * p * t1 * t1
  // 2 (b2 - b1) = d1 e1 + 4 d1 e2 p t1
  const b2 = b1 + (d1 * e1 + 4 * d1 * e2 * p * t1) / 2
  // b1 + b3 - 2 b2 = 2 d1 d1 e2 p
  const b3 = 2 * b2 + 2 * d1 * d1 * e2 * p - b1
  return { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }
}

export function quadraticCurveToParabolaSegment({ from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve): ParabolaSegment {
  const f1 = a1 + a3 - 2 * a2, f2 = b1 + b3 - 2 * b2
  // f1 = -2 d1 d1 e1 p
  // f2 = 2 d1 d1 e2 p
  // tan(xAxisRadian) = e1/e2 = -f1/f2
  const xAxisRadian = Math.atan2(-f1, f2)
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const angle = radianToAngle(xAxisRadian) + 90
  const f5 = !isZero(e1) ? -f1 / 2 / e1 : f2 / 2 / e2
  // d1 d1 p = f5

  const f3 = 2 * (a2 - a1), f4 = 2 * (b2 - b1)
  // f3 = d1 e2 + -4 d1 e1 p t1
  // f4 = d1 e1 + 4 d1 e2 p t1
  // f3 e2 = d1 e2 e2 + -4 d1 e1 e2 p t1
  // f4 e1 = d1 e1 e1 + 4 d1 e1 e2 p t1
  // f3 e2 + f4 e1 = d1
  const d1 = f3 * e2 + f4 * e1
  const p = f5 / d1 / d1
  const t1 = !isZero(e1) ? (d1 * e2 - f3) / (4 * d1 * e1 * p) : (f4 - d1 * e1) / (4 * d1 * e2 * p)

  // a1 = x0 + e2 t1 + -2 e1 p t1 t1
  // b1 = y0 + e1 t1 + 2 e2 p t1 t1
  const x0 = a1 - e2 * t1 + 2 * e1 * p * t1 * t1
  const y0 = b1 - e1 * t1 - 2 * e2 * p * t1 * t1
  const t2 = d1 + t1

  return { angle, x: x0, y: y0, p, t1, t2 }
}
