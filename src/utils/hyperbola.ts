import { BezierCurve, getBezierCurvePercentAtPoint, getQuadraticCurveDerivatives, getQuadraticCurvePercentAtPoint, pointIsOnBezierCurve, pointIsOnQuadraticCurve, QuadraticCurve } from "./bezier"
import { getPointsBoundingUnsafe } from "./bounding"
import { Arc, Circle, getCirclePointAtRadian, getCircleRadian, pointIsOnArc, pointIsOnCircle } from "./circle"
import { Ellipse, EllipseArc, getEllipseDerivatives, pointIsOnEllipse, pointIsOnEllipseArc } from "./ellipse"
import { calculateEquation2, calculateEquation4, calculateEquation5, newtonIterate, newtonIterate2 } from "./equation-calculater"
import { rombergIntegral } from "./length"
import { GeneralFormLine, getPointSideOfLine, pointAndDirectionToGeneralFormLine, pointIsOnLine, pointIsOnLineSegment } from "./line"
import { deduplicate, deepEquals, delta2, delta3, getTwoNumberCenter, isBetween, isSameNumber, isValidPercent, isZero, largerThan, mergeNumberRange, minimumBy, NOT_EXTENDED } from "./math"
import { matrix, Matrix2 } from "./matrix"
import { getParabolaXAxisRadian } from "./parabola"
import { getPerpendicularPoint } from "./perpendicular"
import { getPointByLengthAndRadian, getTwoPointsDistance, isSamePoint, Position } from "./position"
import { angleToRadian } from "./radian"
import { TwoPointsFormRegion } from "./region"
import { reverseRadian } from "./reverse"
import { getCoordinateMatrix2D, getCoordinateVec2D, transformPointFromCoordinate2D } from "./transform"
import { Tuple2, Tuple3, Vec2 } from "./types"
import { and, number } from "./validators"

export interface Hyperbola extends Position {
  // (y/a + 1)^2 = (x/b)^2 + 1
  a: number
  b: number
  angle: number
}

export const Hyperbola = /* @__PURE__ */ and(Position, {
  a: number,
  b: number,
  angle: number,
})

export interface HyperbolaSegment extends Hyperbola {
  t1: number
  t2: number
}

export const HyperbolaSegment = /* @__PURE__ */ and(Hyperbola, {
  t1: number,
  t2: number,
})

export function getPerpendicularParamsToHyperbola({ x: x0, y: y0 }: Position, { a, b, angle, x: x1, y: y1 }: Hyperbola, delta?: number): number[] {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = b t
  // y = a((t^2 + 1)^0.5 - 1)
  // x = x1 + e2 b t - e1 a((t^2 + 1)^0.5 - 1)
  // y = y1 + e1 b t + e2 a((t^2 + 1)^0.5 - 1)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  // x = x1 + b1 t + b2((t^2 + 1)^0.5 - 1)
  // y = y1 + b3 t + b4((t^2 + 1)^0.5 - 1)
  const c1 = x1 - b2, c2 = y1 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5
  // x' = b2 t (t^2 + 1)^-0.5 + b1
  // y' = b4 t (t^2 + 1)^-0.5 + b3
  // y'/x'*(y - y0)/(x - x0) = -1
  // y'(y - y0) = -x'(x - x0)
  // x'(x - x0) + y'(y - y0) = 0
  // (b2 t (t^2 + 1)^-0.5 + b1)(c1 + b1 t + b2(t^2 + 1)^0.5 - x0) + (b4 t (t^2 + 1)^-0.5 + b3)(c2 + b3 t + b4(t^2 + 1)^0.5 - y0) = 0
  const a1 = c1 - x0, a2 = c2 - y0
  // (b2 t (t^2 + 1)^-0.5 + b1)(a1 + b1 t + b2(t^2 + 1)^0.5) + (b4 t (t^2 + 1)^-0.5 + b3)(a2 + b3 t + b4(t^2 + 1)^0.5) = 0
  // (b2 t + b1(t^2 + 1)^0.5)(a1 + b1 t + b2(t^2 + 1)^0.5) + (b4 t + b3(t^2 + 1)^0.5)(a2 + b3 t + b4(t^2 + 1)^0.5) = 0
  // t = tan(u), (t^2 + 1)^0.5 = 1/cos(u)
  // (b2 tan(u) + b1/cos(u))(a1 + b1 tan(u) + b2/cos(u)) + (b4 tan(u) + b3/cos(u))(a2 + b3 tan(u) + b4/cos(u)) = 0
  // (b2 sin(u) + b1)(a1 cos(u) + b1 sin(u) + b2) + (b4 sin(u) + b3)(a2 cos(u) + b3 sin(u) + b4) = 0
  // v = sin(u), w = cos(u)
  // (b2 v + b1)(a1 w + b1 v + b2) + (b4 v + b3)(a2 w + b3 v + b4) = 0
  // ((a1 b2 + a2 b4) v + a1 b1 + a2 b3) w + (b1 b2 + b3 b4) v v + (b1 b1 + b2 b2 + b4 b4 + b3 b3) v + b3 b4 + b1 b2 = 0
  // ((a1 b2 + a2 b4) v + a1 b1 + a2 b3) w + (b1 b2 + b3 b4) v v + (a a + b b) v + b3 b4 + b1 b2 = 0
  const d1 = a1 * b2 + a2 * b4, d2 = a1 * b1 + a2 * b3, d3 = b1 * b2 + b3 * b4, d4 = a * a + b * b
  // (d1 v + d2) w + d3 v v + d4 v + d3 = 0
  // v^2 + w^2 = 1
  // (d1 v + d2)^2 v^2 + (d1 v + d2)^2 w^2 = (d1 v + d2)^2
  // (d1 v + d2)^2 v^2 + (d3 v v + d4 v + d3)^2 - (d1 v + d2)^2 = 0
  // (d1 d1 + d3 d3) v v v v + (2 d1 d2 + 2 d3 d4) v v v + (-d1 d1 + d2 d2 + 2 d3 d3 + d4 d4) v v + (-2 d1 d2 + 2 d3 d4) v + -d2 d2 + d3 d3 = 0
  let vs = calculateEquation4(
    d1 * d1 + d3 * d3,
    2 * (d1 * d2 + d3 * d4),
    -d1 * d1 + d2 * d2 + 2 * d3 * d3 + d4 * d4,
    2 * (d3 * d4 - d1 * d2),
    d3 * d3 - d2 * d2,
    delta,
  )
  vs = vs.filter(v => isBetween(v, -1, 1))
  const ts = vs.map(v => Math.tan(Math.asin(v)))
  return deduplicate(ts, isSameNumber)
}

export function getHyperbolaPointAtParam(hyperbola: Hyperbola, param: number): Position {
  return transformPointFromCoordinate2D(getHyperbolaCoordinatePointAtParam(hyperbola, param), hyperbola, getParabolaXAxisRadian(hyperbola))
}

export function getHyperbolaParamAtPoint({ angle, x: x1, y: y1, a, b }: Hyperbola, point: Position): number {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = b t
  // y = a((t^2 + 1)^0.5 - 1)
  // x = x1 + e2 b t - e1 a((t^2 + 1)^0.5 - 1)
  // y = y1 + e1 b t + e2 a((t^2 + 1)^0.5 - 1)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  // x = x1 + b1 t + b2((t^2 + 1)^0.5 - 1)
  // y = y1 + b3 t + b4((t^2 + 1)^0.5 - 1)
  const c1 = x1 - b2, c2 = y1 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5

  // b4 x = b4 c1 + b4 b1 t + b2 b4(t^2 + 1)^0.5
  // b2 y = b2 c2 + b2 b3 t + b2 b4(t^2 + 1)^0.5
  // b4 x - b2 y = b4 c1 + b4 b1 t - b2 c2 - b2 b3 t
  // t = (b4 x - b2 y - b4 c1 + b2 c2)/(b4 b1 - b2 b3)
  return (b4 * point.x - b2 * point.y - b4 * c1 + b2 * c2) / (b4 * b1 - b2 * b3)
}

export function getHyperbolaCoordinatePointAtParam({ a, b }: Hyperbola, param: number): Position {
  // x = b t
  // y = a((t^2 + 1)^0.5 - 1)
  return {
    x: b * param,
    y: a * (Math.sqrt(param ** 2 + 1) - 1),
  }
}

export function getHyperbolaPoints(hyperbola: HyperbolaSegment, segmentCount: number): Position[] {
  const rate = (hyperbola.t2 - hyperbola.t1) / segmentCount
  const points: Position[] = []
  const m = getCoordinateMatrix2D(hyperbola, getParabolaXAxisRadian(hyperbola))
  for (let i = 0; i <= segmentCount; i++) {
    const vec = getCoordinateVec2D(getHyperbolaCoordinatePointAtParam(hyperbola, hyperbola.t1 + i * rate))
    const p = matrix.multiplyVec(m, vec)
    points.push({ x: p[0], y: p[1] })
  }
  return points
}

export function getPointAndHyperbolaNearestPointAndDistance(position: Position, curve: HyperbolaSegment, extend = false) {
  let us = getPerpendicularParamsToHyperbola(position, curve)
  if (!extend) {
    us = us.filter(u => isBetween(u, curve.t1, curve.t2))
    us.push(curve.t1, curve.t2)
  }
  const points = us.map(u => ({
    u,
    p: getHyperbolaPointAtParam(curve, u),
  }))
  const results = points.map(p => ({
    param: p.u,
    point: p.p,
    distance: getTwoPointsDistance(position, p.p)
  }))
  return minimumBy(results, v => v.distance)
}

export function getHyperbolaBounding(curve: HyperbolaSegment): TwoPointsFormRegion {
  const { a, b, angle } = curve
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = b t
  // y = a((t^2 + 1)^0.5 - 1)
  // x = x1 + e2 b t - e1 a((t^2 + 1)^0.5 - 1)
  // y = y1 + e1 b t + e2 a((t^2 + 1)^0.5 - 1)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  // x = x1 + b1 t + b2((t^2 + 1)^0.5 - 1)
  // y = y1 + b3 t + b4((t^2 + 1)^0.5 - 1)
  // let c1 = x1 - b2, c2 = y1 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5
  // x' = b2 t (t^2 + 1)^-0.5 + b1 = 0
  // y' = b4 t (t^2 + 1)^-0.5 + b3 = 0

  // b2 t (t^2 + 1)^-0.5 = -b1
  // b4 t (t^2 + 1)^-0.5 = -b3

  // b2 t = -b1(t^2 + 1)^0.5
  // b4 t = -b3(t^2 + 1)^0.5

  // b2 b2 t t = b1 b1(t^2 + 1)
  // b4 b4 t t = b3 b3(t^2 + 1)

  // (b2 b2 - b1 b1) t t = b1 b1
  // (b4 b4 - b3 b3) t t = b3 b3
  const points = [
    getHyperbolaPointAtParam(curve, curve.t1),
    getHyperbolaPointAtParam(curve, curve.t2),
  ]
  const d1 = b2 * b2 - b1 * b1
  if (largerThan(d1, 0)) {
    const t = Math.abs(b1) / Math.sqrt(d1) * Math.sign(-b1 * b2)
    if (isBetween(t, curve.t1, curve.t2)) {
      points.push(getHyperbolaPointAtParam(curve, t))
    }
  }
  const d2 = b4 * b4 - b3 * b3
  if (largerThan(d2, 0)) {
    const t = Math.abs(b3) / Math.sqrt(d2) * Math.sign(-b3 * b4)
    if (isBetween(t, curve.t1, curve.t2)) {
      points.push(getHyperbolaPointAtParam(curve, t))
    }
  }
  return getPointsBoundingUnsafe(points)
}

export function getHyperbolaLength(curve: HyperbolaSegment, delta?: number): number {
  const { a, b, t1, t2 } = curve
  // x = b t
  // y = a((t^2 + 1)^0.5 - 1)
  // x' = b
  // y' = a t (t^2 + 1)^-0.5
  // dz = sqrt(dx^2 + dy^2)
  // dz/dt = sqrt(b^2 + (a t (t^2 + 1)^-0.5)^2)
  // dz/dt = sqrt(b^2 + a^2 t^2/(t^2 + 1))
  const a2 = a ** 2, b2 = b ** 2
  return rombergIntegral(t1, t2, t => {
    const c = t ** 2
    return Math.sqrt(b2 + a2 * c / (c + 1))
  }, delta)
}

export function getHyperbolaParamByLength(curve: HyperbolaSegment, length: number, delta = delta2): number | undefined {
  const f1 = (t: number) => getHyperbolaLength({ ...curve, t2: t }) - length
  // dz/dt = sqrt(b^2 + a^2 t^2/(t^2 + 1))
  const a2 = curve.a ** 2, b2 = curve.b ** 2
  const f2 = (t: number) => {
    const c = t ** 2
    return Math.sqrt(b2 + a2 * c / (c + 1))
  }
  return newtonIterate(getTwoNumberCenter(curve.t1, curve.t2), f1, f2, delta)
}

export function getHyperbolaSegmentStartAndEnd(curve: HyperbolaSegment) {
  return {
    start: getHyperbolaPointAtParam(curve, curve.t1),
    end: getHyperbolaPointAtParam(curve, curve.t2),
  }
}

export function pointIsOnHyperbola(point: Position, { angle, a, b, x: x1, y: y1 }: Hyperbola): boolean {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  const c1 = x1 - b2, c2 = y1 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5

  // c1 + b1 t + b2(t^2 + 1)^0.5 = x
  // b2(t^2 + 1)^0.5 = x - c1 - b1 t
  // b2 b2(t^2 + 1) = (x - c1 - b1 t)^2
  const d1 = point.x - c1
  // b2 b2(t^2 + 1) - (d1 - b1 t)^2 = 0
  // (b2 b2 - b1 b1) t t + 2 b1 d1 t + b2 b2 - d1 d1 = 0
  return calculateEquation2(b2 * b2 - b1 * b1, 2 * b1 * d1, b2 * b2 - d1 * d1)
    .filter(t => isSameNumber(c2 + b3 * t + b4 * Math.sqrt(t ** 2 + 1), point.y, delta3)).length > 0
}

export function pointIsOnHyperbolaSegment(point: Position, curve: HyperbolaSegment, extend = NOT_EXTENDED): boolean {
  if (extend.head && extend.body && extend.tail) return true
  if (!extend.head && !extend.body && !extend.tail) return false
  const t = getHyperbolaParamAtPoint(curve, point)
  return isBetween(t, curve.t1, curve.t2, extend)
}

export function getHyperbolaTangentRadianAtParam({ angle, a, b }: Hyperbola, t: number): number {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  // const c1 = x1 - b2, c2 = y1 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5
  // x' = b2 t (t^2 + 1)^-0.5 + b1
  // y' = b4 t (t^2 + 1)^-0.5 + b3
  const d1 = Math.sqrt(t ** 2 + 1)
  return Math.atan2(b4 * t / d1 + b3, b2 * t / d1 + b1)
}

export function getHyperbolaDerivatives({ angle, a, b, x: x1, y: y1 }: Hyperbola): Tuple3<(t: number) => Position> {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  const c1 = x1 - b2, c2 = y1 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5
  // x' = b2 t (t^2 + 1)^-0.5 + b1
  // y' = b4 t (t^2 + 1)^-0.5 + b3
  // x' = b2 (t^2 + 1)^-0.5 - b2 t t (t^2 + 1)^-1.5
  // y' = b4 (t^2 + 1)^-0.5 - b4 t t (t^2 + 1)^-1.5
  return [
    t => {
      const d = Math.sqrt(t ** 2 + 1)
      return {
        x: c1 + b1 * t + b2 * d,
        y: c2 + b3 * t + b4 * d,
      }
    },
    t => {
      const d = t / Math.sqrt(t ** 2 + 1)
      return {
        x: b2 * d + b1,
        y: b4 * d + b3,
      }
    },
    (t) => {
      const d0 = t ** 2, d1 = d0 + 1, d2 = Math.sqrt(d1)
      const d = 1 / d2 - d0 / d1 / d2
      return {
        x: b2 * d,
        y: b4 * d,
      }
    },
  ]
}

export function getHyperbolaCurvatureAtParam(curve: Hyperbola, param: number): number {
  const derivatives = getHyperbolaDerivatives(curve)
  const { x: x1, y: y1 } = derivatives[1](param)
  const { x: x2, y: y2 } = derivatives[2](param)
  // (x1 y2 - y1 x2)/(x1 ** 2 + y1 ** 2)**1.5
  return (x1 * y2 - y1 * x2) / (x1 ** 2 + y1 ** 2) ** 1.5
}

export function reverseHyperbola<T extends HyperbolaSegment>(curve: T): T {
  return {
    ...curve,
    t1: curve.t2,
    t2: curve.t1,
  }
}

export function getParallelHyperbolaSegmentsByDistance<T extends HyperbolaSegment>(curve: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [curve, curve]
  }
  if (curve.t1 > curve.t2) {
    distance = -distance
  }
  const p1 = getPointByLengthAndRadian(curve, distance, angleToRadian(curve.angle))
  const p2 = getPointByLengthAndRadian(curve, -distance, angleToRadian(curve.angle))
  return [
    { ...curve, x: p1.x, y: p1.y }, // on right side of hyperbola segment
    { ...curve, x: p2.x, y: p2.y }, // on left side of hyperbola segment
  ]
}

/**
 * 0: point on hyperbola
 * 1: point on left side of hyperbola
 * -1: point on right side of hyperbola
 */
export function getPointSideOfHyperbolaSegment(point: Position, curve: HyperbolaSegment): number {
  const p = getPointAndHyperbolaNearestPointAndDistance(point, curve, true)
  const radian = getHyperbolaTangentRadianAtParam(curve, p.param)
  const line = pointAndDirectionToGeneralFormLine(p.point, radian)
  return getPointSideOfLine(point, line) * (curve.t1 > curve.t2 ? -1 : 1)
}

export function getLineSegmentHyperbolaSegmentIntersectionPoints(start: Position, end: Position, curve: HyperbolaSegment, extend1 = NOT_EXTENDED, extend2 = NOT_EXTENDED): Position[] {
  const result = getLineHyperbolaSegmentIntersectionPoints(start, end, curve, extend2)
  return result.filter((p) => pointIsOnLineSegment(p, start, end, extend1))
}

export function getLineHyperbolaSegmentIntersectionPoints(start: Position, end: Position, { angle, x: x0, y: y0, a, b, t1, t2 }: HyperbolaSegment, extend = NOT_EXTENDED): Position[] {
  const { x: x1, y: y1 } = start
  const { x: x2, y: y2 } = end
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  const c1 = x0 - b2, c2 = y0 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5

  // (x - x1) / (x2 - x1) = (y - y1) / (y2 - y1)
  const d1 = x2 - x1, d2 = y2 - y1
  // (x - x1) d2 - (y - y1) d1 = 0
  // replace x, y: (c1 + b1 t + b2(t^2 + 1)^0.5 - x1) d2 - (c2 + b3 t + b4(t^2 + 1)^0.5 - y1) d1 = 0
  const f1 = c1 - x1, f2 = c2 - y1
  // (f1 + b1 t + b2(t^2 + 1)^0.5) d2 - (f2 + b3 t + b4(t^2 + 1)^0.5) d1 = 0
  // (f1 d2 - f2 d1) + (b1 d2 - b3 d1) t + (b2 d2 - b4 d1)(t^2 + 1)^0.5 = 0
  const g1 = f1 * d2 - f2 * d1, g2 = b1 * d2 - b3 * d1, g3 = b2 * d2 - b4 * d1
  // g1 + g2 t + g3(t^2 + 1)^0.5 = 0
  // (g1 + g2 t)^2 = g3 g3(t^2 + 1)
  // (g2 g2 - g3 g3) t t + 2 g1 g2 t + g1 g1 - g3 g3 = 0
  let ts = calculateEquation2(
    g2 * g2 - g3 * g3,
    2 * g1 * g2,
    g1 * g1 - g3 * g3,
  )
  ts = ts.filter(t => isBetween(t, t1, t2, extend))
  let result = ts.map(t => {
    const d = Math.sqrt(t ** 2 + 1)
    return {
      x: c1 + b1 * t + b2 * d,
      y: c2 + b3 * t + b4 * d,
    }
  })
  result = result.filter(p => pointIsOnLine(p, start, end))
  return result
}

export function getArcHyperbolaSegmentIntersectionPoints(arc: Arc, curve: HyperbolaSegment, extend1 = NOT_EXTENDED, extend2 = NOT_EXTENDED): Position[] {
  const result = getCircleHyperbolaSegmentIntersectionPoints(arc, curve, extend2)
  return result.filter((p) => pointIsOnArc(p, arc, extend1))
}

export function getCircleHyperbolaSegmentIntersectionPoints(circle: Circle, { angle, x: x0, y: y0, a, b, t1, t2 }: HyperbolaSegment, extend = NOT_EXTENDED): Position[] {
  const { x: x1, y: y1, r: r1 } = circle
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  const c1 = x0 - b2, c2 = y0 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5
  // let w = (t^2 + 1)^0.5
  // x = c1 + b1 t + b2 w
  // y = c2 + b3 t + b4 w

  // (x - x1)^2 + (y - y1)^2 = r1^2
  // replace x, y: (c1 + b1 t + b2 w - x1)^2 + (c2 + b3 t + b4 w - y1)^2 - r1^2 = 0
  const f1 = c1 - x1, f2 = c2 - y1
  // (f1 + b1 t + b2 w)^2 + (f2 + b3 t + b4 w)^2 - r1^2 = 0
  // (b2 b2 + b4 b4) w w + ((2 b1 b2 + 2 b3 b4) t + 2 b2 f1 + 2 b4 f2) w + (b1 b1 + b3 b3) t t + (2 b1 f1 + 2 b3 f2) t + f1 f1 + f2 f2 + -r1 r1 = 0
  // replace w w with t^2 + 1: (b2 b2 + b4 b4)(t^2 + 1) + ((2 b1 b2 + 2 b3 b4) t + 2 b2 f1 + 2 b4 f2) w + (b1 b1 + b3 b3) t t + (2 b1 f1 + 2 b3 f2) t + f1 f1 + f2 f2 + -r1 r1 = 0
  // (b2 b2 + b1 b1 + b4 b4 + b3 b3) t t + ((2 b1 b2 + 2 b3 b4) w + 2 b1 f1 + 2 b3 f2) t + (2 b2 f1 + 2 b4 f2) w + b2 b2 + b4 b4 + f1 f1 + f2 f2 + -r1 r1 = 0
  // (a a + b b) t t + 2 (b1 f1 + b3 f2) t + 2 (b2 f1 + b4 f2) (t t + 1)^0.5 + a a + f1 f1 + f2 f2 - r1 r1 = 0
  const d1 = a * a + b * b, d2 = 2 * (b1 * f1 + b3 * f2), d3 = 2 * (b2 * f1 + b4 * f2), d4 = a * a + f1 * f1 + f2 * f2 - r1 * r1
  // d1 t t + d2 t + d3(t t + 1)^0.5 + d4 = 0
  // (d1 t t + d2 t + d4)^2 = d3 d3(t t + 1)
  // d1 d1 t t t t + 2 d1 d2 t t t + (d2 d2 + 2 d1 d4 - d3 d3) t t + 2 d2 d4 t + d4 d4 - d3 d3 = 0
  let ts = calculateEquation4(
    d1 * d1,
    2 * d1 * d2,
    d2 * d2 + 2 * d1 * d4 - d3 * d3,
    2 * d2 * d4,
    d4 * d4 - d3 * d3,
  )
  ts = ts.filter(t => isBetween(t, t1, t2, extend))
  let result = ts.map(t => {
    const d = Math.sqrt(t ** 2 + 1)
    return {
      x: c1 + b1 * t + b2 * d,
      y: c2 + b3 * t + b4 * d,
    }
  })
  result = result.filter(p => pointIsOnCircle(p, circle))
  return result
}

export function getEllipseArcHyperbolaSegmentIntersectionPoints(arc: EllipseArc, curve: HyperbolaSegment, extend1 = NOT_EXTENDED, extend2 = NOT_EXTENDED): Position[] {
  const result = getEllipseHyperbolaSegmentIntersectionPoints(arc, curve, extend2)
  return result.filter((p) => pointIsOnEllipseArc(p, arc, extend1))
}

export function getEllipseHyperbolaSegmentIntersectionPoints(ellipse: Ellipse, { angle, x: x0, y: y0, a, b, t1, t2 }: HyperbolaSegment, extend = NOT_EXTENDED): Position[] {
  const { rx: rx1, ry: ry1, cx: cx1, cy: cy1, angle: angle1 } = ellipse
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  const c1 = x0 - b2, c2 = y0 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5
  // let w = (t^2 + 1)^0.5
  // x = c1 + b1 t + b2 w
  // y = c2 + b3 t + b4 w

  const radian1 = angleToRadian(angle1)
  const d1 = Math.sin(radian1), d2 = Math.cos(radian1), d3 = 1 / rx1 / rx1, d4 = 1 / ry1 / ry1
  // (d2(x - cx1) + d1(y - cy1))^2 d3 + (-d1(x - cx1) + d2(y - cy1))^2 d4 = 1
  // replace x, y: (d2(c1 + b1 t + b2 w - cx1) + d1(c2 + b3 t + b4 w - cy1))^2 d3 + (-d1(c1 + b1 t + b2 w - cx1) + d2(c2 + b3 t + b4 w - cy1))^2 d4 - 1 = 0
  const f1 = c1 - cx1, f2 = c2 - cy1
  // (d2(f1 + b1 t + b2 w) + d1(f2 + b3 t + b4 w))^2 d3 + (-d1(f1 + b1 t + b2 w) + d2(f2 + b3 t + b4 w))^2 d4 - 1 = 0
  // ((b4 d1 + b2 d2) w + (b3 d1 + b1 d2) t + d2 f1 + d1 f2)^2 d3 + ((-b2 d1 + b4 d2) w + (-b1 d1 + b3 d2) t + -d1 f1 + d2 f2)^2 d4 - 1 = 0
  const g1 = d2 * f1 + d1 * f2, g2 = d2 * b1 + d1 * b3, g3 = d2 * b2 + d1 * b4
  const g4 = d2 * f2 - d1 * f1, g5 = d2 * b3 - d1 * b1, g6 = d2 * b4 - d1 * b2
  // (g1 + g2 t + g3 w)^2 d3 + (g4 + g5 t + g6 w)^2 d4 - 1 = 0
  // (d3 g3 g3 + d4 g6 g6) w w + ((2 d3 g2 g3 + 2 d4 g5 g6) t + 2 d3 g1 g3 + 2 d4 g4 g6) w + (d3 g2 g2 + d4 g5 g5) t t + (2 d3 g1 g2 + 2 d4 g4 g5) t + d3 g1 g1 + d4 g4 g4 + -1 = 0
  // replace w w with t^2 + 1: (d3 g3 g3 + d4 g6 g6)(t^2 + 1) + ((2 d3 g2 g3 + 2 d4 g5 g6) t + 2 d3 g1 g3 + 2 d4 g4 g6) w + (d3 g2 g2 + d4 g5 g5) t t + (2 d3 g1 g2 + 2 d4 g4 g5) t + d3 g1 g1 + d4 g4 g4 + -1 = 0
  // ((2 d3 g2 g3 + 2 d4 g5 g6) t + 2 d3 g1 g3 + 2 d4 g4 g6) w + (d3 g2 g2 + d3 g3 g3 + d4 g5 g5 + d4 g6 g6) t t + (2 d3 g1 g2 + 2 d4 g4 g5) t + d3 g1 g1 + d3 g3 g3 + d4 g4 g4 + d4 g6 g6 + -1 = 0
  const h1 = d3 * g1 * g1 + d3 * g3 * g3 + d4 * g6 * g6 + d4 * g4 * g4 - 1, h2 = 2 * (d3 * g1 * g2 + d4 * g4 * g5)
  const h3 = d3 * g2 * g2 + d4 * g5 * g5 + d3 * g3 * g3 + d4 * g6 * g6, h4 = 2 * (d3 * g1 * g3 + d4 * g4 * g6)
  const h5 = 2 * (d3 * g2 * g3 + d4 * g5 * g6)
  // h1 + h2 t + h3 t t + (h4 + h5 t) w = 0
  // (h1 + h2 t + h3 t t)^2 = (h4 + h5 t)^2 w^2
  // (h1 + h2 t + h3 t t)^2 - (h4 + h5 t)^2 (t^2 + 1) = 0
  // (h3 h3 + -h5 h5) t t t t + (2 h2 h3 + -2 h4 h5) t t t + (h2 h2 + 2 h1 h3 + -h4 h4 + -h5 h5) t t + (2 h1 h2 + -2 h4 h5) t + h1 h1 + -h4 h4 = 0
  let ts = calculateEquation4(
    h3 * h3 - h5 * h5,
    2 * (h2 * h3 - h4 * h5),
    h2 * h2 + 2 * h1 * h3 - h4 * h4 - h5 * h5,
    2 * (h1 * h2 - h4 * h5),
    h1 * h1 - h4 * h4,
  )
  ts = ts.filter(t => isBetween(t, t1, t2, extend))
  let result = ts.map(t => {
    const d = Math.sqrt(t ** 2 + 1)
    return {
      x: c1 + b1 * t + b2 * d,
      y: c2 + b3 * t + b4 * d,
    }
  })
  result = result.filter(p => pointIsOnEllipse(p, ellipse))
  return result
}

export function getQuadraticCurveHyperbolaSegmentIntersectionPoints(
  curve1: QuadraticCurve,
  { angle, x: x0, y: y0, a, b, t1, t2 }: HyperbolaSegment,
  extend1 = NOT_EXTENDED,
  extend2 = extend1,
): Position[] {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  const c1 = x0 - b2, c2 = y0 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5
  // let w = (t^2 + 1)^0.5
  // x = c1 + b1 t + b2 w
  // y = c2 + b3 t + b4 w

  const { from: { x: d1, y: d2 }, cp: { x: d3, y: d4 }, to: { x: d5, y: d6 } } = curve1
  const f1 = d3 - d1, f2 = d5 - d3 - f1, f3 = d4 - d2, f4 = d6 - d4 - f3
  // x = f2 u u + 2 f1 u + d1
  // y = f4 u u + 2 f3 u + d2
  // f4 x = f2 f4 u u + 2 f1 f4 u + d1 f4
  // f2 y = f2 f4 u u + 2 f2 f3 u + d2 f2
  // f4 x - f2 y = 2(f1 f4 - f2 f3)u + d1 f4 - d2 f2
  const g1 = 2 * (f1 * f4 - f2 * f3), g2 = d1 * f4 - d2 * f2
  // f4 x - f2 y = g1 u + g2
  let ts: number[]
  if (isZero(g1)) {
    // f4 x - f2 y - g2 = 0
    // f4(c1 + b1 t + b2 w) - f2(c2 + b3 t + b4 w) - g2 = 0
    // (-b3 f2 + b1 f4) t + (b2 f4 - b4 f2) w + -c2 f2 + c1 f4 + -g2 = 0
    const g3 = -b3 * f2 + b1 * f4, g4 = b2 * f4 - b4 * f2, g5 = -c2 * f2 + c1 * f4 - g2
    // g3 t + g4 w + g5 = 0
    // g4 g4(t t + 1) = (g3 t + g5)^2
    // (g4 g4 + -g3 g3) t t + -2 g3 g5 t + g4 g4 + -g5 g5 = 0
    ts = calculateEquation2(
      g4 * g4 - g3 * g3,
      -2 * g3 * g5,
      g4 * g4 - g5 * g5,
    )
  } else {
    // f4 x - f2 y - g2 = g1 u
    // g1 g1 x = f2 g1 g1 u u + 2 f1 g1 g1 u + d1 g1 g1
    // g1 g1 x = f2(f4 x - f2 y - g2)^2 + 2 f1 g1(f4 x - f2 y - g2) + d1 g1 g1
    // f2 f4 f4 x x + (-2 f2 f2 f4 y + 2 f1 f4 g1 + -2 f2 f4 g2 + -g1 g1) x + f2 f2 f2 y y + (-2 f1 f2 g1 + 2 f2 f2 g2) y + d1 g1 g1 + -2 f1 g1 g2 + f2 g2 g2 = 0
    const g3 = 2 * f1 * f4 * g1 - 2 * f2 * f4 * g2 - g1 * g1, g4 = -2 * f1 * f2 * g1 + 2 * f2 * f2 * g2, g5 = d1 * g1 * g1 + -2 * f1 * g1 * g2 + f2 * g2 * g2
    const g6 = f2 * f4 * f4, g7 = -2 * f2 * f2 * f4, g8 = f2 * f2 * f2
    // g6 x x + (g7 y + g3) x + g8 y y + g4 y + g5 = 0
    // g6(c1 + b1 t + b2 w)^2 + (g7(c2 + b3 t + b4 w) + g3)(c1 + b1 t + b2 w) + g8(c2 + b3 t + b4 w)^2 + g4(c2 + b3 t + b4 w) + g5 = 0
    // (b2 b2 g6 + b2 b4 g7 + b4 b4 g8) w w + ((2 b1 b2 g6 + b2 b3 g7 + b1 b4 g7 + 2 b3 b4 g8) t + 2 b2 c1 g6 + b4 c1 g7 + b2 c2 g7 + 2 b4 c2 g8 + b2 g3 + b4 g4) w + (b1 b1 g6 + b1 b3 g7 + b3 b3 g8) t t + (2 b1 c1 g6 + b3 c1 g7 + b1 c2 g7 + 2 b3 c2 g8 + b1 g3 + b3 g4) t + c1 c1 g6 + c1 c2 g7 + c1 g3 + c2 c2 g8 + c2 g4 + g5 = 0
    // replace w w with t^2 + 1: (b2 b2 g6 + b2 b4 g7 + b4 b4 g8)(t^2 + 1) + ((2 b1 b2 g6 + b2 b3 g7 + b1 b4 g7 + 2 b3 b4 g8) t + 2 b2 c1 g6 + b4 c1 g7 + b2 c2 g7 + 2 b4 c2 g8 + b2 g3 + b4 g4) w + (b1 b1 g6 + b1 b3 g7 + b3 b3 g8) t t + (2 b1 c1 g6 + b3 c1 g7 + b1 c2 g7 + 2 b3 c2 g8 + b1 g3 + b3 g4) t + c1 c1 g6 + c1 c2 g7 + c1 g3 + c2 c2 g8 + c2 g4 + g5 = 0
    // ((2 b1 b2 g6 + b2 b3 g7 + b1 b4 g7 + 2 b3 b4 g8) t + 2 b2 c1 g6 + b2 c2 g7 + b4 c1 g7 + 2 b4 c2 g8 + b2 g3 + b4 g4) w + (b2 b2 g6 + b1 b1 g6 + b1 b3 g7 + b2 b4 g7 + b3 b3 g8 + b4 b4 g8) t t + (2 b1 c1 g6 + b3 c1 g7 + b1 c2 g7 + 2 b3 c2 g8 + b1 g3 + b3 g4) t + b2 b2 g6 + c1 c1 g6 + b2 b4 g7 + b4 b4 g8 + c1 c2 g7 + c2 c2 g8 + c1 g3 + c2 g4 + g5 = 0
    const h1 = b1 * b1 * g6 + b2 * b2 * g6 + b2 * b4 * g7 + b1 * b3 * g7 + b3 * b3 * g8 + b4 * b4 * g8, h2 = 2 * b1 * b2 * g6 + b2 * b3 * g7 + b1 * b4 * g7 + 2 * b3 * b4 * g8
    const h3 = 2 * b1 * c1 * g6 + b3 * c1 * g7 + b1 * c2 * g7 + 2 * b3 * c2 * g8 + b1 * g3 + b3 * g4, h4 = 2 * b2 * c1 * g6 + b4 * c1 * g7 + b2 * c2 * g7 + 2 * b4 * c2 * g8 + b2 * g3 + b4 * g4
    const h5 = c1 * c1 * g6 + b2 * b2 * g6 + b2 * b4 * g7 + c1 * c2 * g7 + c1 * g3 + c2 * c2 * g8 + b4 * b4 * g8 + c2 * g4 + g5
    // (h2 t + h4) w + h1 t t + h3 t + h5 = 0
    // (h2 t + h4)^2(t t + 1) = (h1 t t + h3 t + h5)^2
    // (h2 h2 + -h1 h1) t t t t + (2 h2 h4 + -2 h1 h3) t t t + (h2 h2 + -h3 h3 + h4 h4 + -2 h1 h5) t t + (2 h2 h4 + -2 h3 h5) t + h4 h4 + -h5 h5 = 0
    ts = calculateEquation4(
      h2 * h2 - h1 * h1,
      2 * (h2 * h4 - h1 * h3),
      h2 * h2 - h3 * h3 + h4 * h4 - 2 * h1 * h5,
      2 * (h2 * h4 - h3 * h5),
      h4 * h4 - h5 * h5,
    )
  }
  ts = ts.filter(t => isBetween(t, t1, t2, extend2))
  let result = ts.map(t => {
    const d = Math.sqrt(t ** 2 + 1)
    return {
      x: c1 + b1 * t + b2 * d,
      y: c2 + b3 * t + b4 * d,
    }
  })
  result = result.filter(p => pointIsOnQuadraticCurve(p, curve1) && isValidPercent(getQuadraticCurvePercentAtPoint(curve1, p), extend1))
  return result
}

export function getBezierCurveHyperbolaSegmentIntersectionPoints(
  curve1: BezierCurve,
  { angle, x: x0, y: y0, a, b, t1, t2 }: HyperbolaSegment,
  extend1 = NOT_EXTENDED,
  extend2 = extend1,
): Position[] {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  const c1 = x0 - b2, c2 = y0 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5
  // let w = (t^2 + 1)^0.5
  // x = c1 + b1 t + b2 w
  // y = c2 + b3 t + b4 w

  const { from: { x: d1, y: d2 }, cp1: { x: d3, y: d4 }, cp2: { x: d5, y: d6 }, to: { x: d7, y: d8 } } = curve1
  const f1 = -d1 + 3 * d3 + -3 * d5 + d7, f2 = 3 * (d1 - 2 * d3 + d5), f3 = 3 * (d3 - d1)
  const f4 = -d2 + 3 * d4 + -3 * d6 + d8, f5 = 3 * (d2 - 2 * d4 + d6), f6 = 3 * (d4 - d2)
  // x = f1 u u u + f2 u u + f3 u + d1
  // y = f4 u u u + f5 u u + f6 u + d2
  // f4 x = f1 f4 u u u + f2 f4 u u + f3 f4 u + d1 f4
  // f1 y = f1 f4 u u u + f1 f5 u u + f1 f6 u + d2 f1
  // f4 x - f1 y = (f2 f4 - f1 f5) u u + (f3 f4 - f1 f6) u + d1 f4 - d2 f1
  const g1 = f2 * f4 - f1 * f5, g2 = f3 * f4 - f1 * f6
  // f4 x - f1 y = g1 u u + g2 u + d1 f4 - d2 f1
  let ts: number[]
  if (isZero(g1)) {
    const g3 = d1 * f4 - d2 * f1
    // f4 x - f1 y = g2 u + g3
    if (isZero(g2)) {
      // f4 x - f1 y = g3
      // replace x,y: (-b4 f1 + b2 f4) w + (-b3 f1 + b1 f4) t + -c2 f1 + c1 f4 + -g3 = 0
      const g4 = -b4 * f1 + b2 * f4, g5 = -b3 * f1 + b1 * f4, g6 = c2 * f1 + c1 * f4 + -g3
      // g4 w + g5 t + g6 = 0
      // w^2 - t^2 - 1 = 0
      // g4 g4 w^2 - g4 g4 t^2 - g4 g4 = 0
      // (g5 t + g6)^2 - g4 g4 t^2 - g4 g4 = 0
      // (g5 g5 + -g4 g4) t t + 2 g5 g6 t + g6 g6 + -g4 g4 = 0
      ts = calculateEquation2(
        g5 * g5 + -g4 * g4,
        2 * g5 * g6,
        g6 * g6 + -g4 * g4,
      )
    } else {
      // g2 u = f4 x - f1 y - g3
      // g2 g2 g2 x = f1 g2 g2 g2 u u u + f2 g2 g2 g2 u u + f3 g2 g2 g2 u + d1 g2 g2 g2
      // g2 g2 g2 x = f1 (f4 x - f1 y - g3)^3 + f2 g2 (f4 x - f1 y - g3)^2 + f3 g2 g2 (f4 x - f1 y - g3) + d1 g2 g2 g2
      // f1 f4 f4 f4 x x x + (-3 f1 f1 f4 f4 y + f2 f4 f4 g2 + -3 f1 f4 f4 g3) x x + (3 f1 f1 f1 f4 y y + (-2 f1 f2 f4 g2 + 6 f1 f1 f4 g3) y + f3 f4 g2 g2 + -2 f2 f4 g2 g3 + 3 f1 f4 g3 g3 + -g2 g2 g2) x + -f1 f1 f1 f1 y y y + (f1 f1 f2 g2 + -3 f1 f1 f1 g3) y y + (-f1 f3 g2 g2 + 2 f1 f2 g2 g3 + -3 f1 f1 g3 g3) y + d1 g2 g2 g2 + -f3 g2 g2 g3 + f2 g2 g3 g3 + -f1 g3 g3 g3 = 0
      const g4 = f1 * f4 * f4 * f4, g5 = -3 * f1 * f1 * f4 * f4, g6 = f2 * f4 * f4 * g2 + -3 * f1 * f4 * f4 * g3
      const g7 = 3 * f1 * f1 * f1 * f4, g8 = -2 * f1 * f2 * f4 * g2 + 6 * f1 * f1 * f4 * g3, g9 = f3 * f4 * g2 * g2 + -2 * f2 * f4 * g2 * g3 + 3 * f1 * f4 * g3 * g3 + -g2 * g2 * g2
      const h1 = -f1 * f1 * f1 * f1, h2 = f1 * f1 * f2 * g2 + -3 * f1 * f1 * f1 * g3, h3 = -f1 * f3 * g2 * g2 + 2 * f1 * f2 * g2 * g3 + -3 * f1 * f1 * g3 * g3
      const h4 = d1 * g2 * g2 * g2 + -f3 * g2 * g2 * g3 + f2 * g2 * g3 * g3 + -f1 * g3 * g3 * g3
      // g4 x x x + (g5 y + g6) x x + (g7 y y + g8 y + g9) x + h1 y y y + h2 y y + h3 y + h4 = 0
      // replace x,y: (b2 b2 b2 g4 + b2 b2 b4 g5 + b2 b4 b4 g7 + b4 b4 b4 h1) w w w + ((3 b1 b2 b2 g4 + b2 b2 b3 g5 + 2 b1 b2 b4 g5 + 2 b2 b3 b4 g7 + b1 b4 b4 g7 + 3 b3 b4 b4 h1) t + 3 b2 b2 c1 g4 + 2 b2 b4 c1 g5 + b2 b2 c2 g5 + b4 b4 c1 g7 + 2 b2 b4 c2 g7 + 3 b4 b4 c2 h1 + b2 b2 g6 + b2 b4 g8 + b4 b4 h2) w w + ((3 b1 b1 b2 g4 + 2 b1 b2 b3 g5 + b1 b1 b4 g5 + b2 b3 b3 g7 + 2 b1 b3 b4 g7 + 3 b3 b3 b4 h1) t t + (6 b1 b2 c1 g4 + 2 b2 b3 c1 g5 + 2 b1 b4 c1 g5 + 2 b1 b2 c2 g5 + 2 b3 b4 c1 g7 + 2 b2 b3 c2 g7 + 2 b1 b4 c2 g7 + 6 b3 b4 c2 h1 + 2 b1 b2 g6 + b2 b3 g8 + b1 b4 g8 + 2 b3 b4 h2) t + 3 b2 c1 c1 g4 + b4 c1 c1 g5 + 2 b2 c1 c2 g5 + 2 b4 c1 c2 g7 + b2 c2 c2 g7 + 3 b4 c2 c2 h1 + 2 b2 c1 g6 + b4 c1 g8 + 2 b4 c2 h2 + b2 c2 g8 + b2 g9 + b4 h3) w + (b1 b1 b1 g4 + b1 b1 b3 g5 + b1 b3 b3 g7 + b3 b3 b3 h1) t t t + (3 b1 b1 c1 g4 + 2 b1 b3 c1 g5 + b1 b1 c2 g5 + b3 b3 c1 g7 + 2 b1 b3 c2 g7 + 3 b3 b3 c2 h1 + b1 b1 g6 + b1 b3 g8 + b3 b3 h2) t t + (3 b1 c1 c1 g4 + b3 c1 c1 g5 + 2 b1 c1 c2 g5 + 2 b3 c1 c2 g7 + b1 c2 c2 g7 + 3 b3 c2 c2 h1 + 2 b1 c1 g6 + b3 c1 g8 + b1 c2 g8 + 2 b3 c2 h2 + b1 g9 + b3 h3) t + c1 c1 c1 g4 + c1 c1 c2 g5 + c1 c2 c2 g7 + c2 c2 c2 h1 + c1 c1 g6 + c1 c2 g8 + c2 c2 h2 + c1 g9 + c2 h3 + h4 = 0
      const h5 = b2 * b2 * b2 * g4 + b2 * b2 * b4 * g5 + b2 * b4 * b4 * g7 + b4 * b4 * b4 * h1
      const h6 = 3 * b1 * b2 * b2 * g4 + b2 * b2 * b3 * g5 + 2 * b1 * b2 * b4 * g5 + 2 * b2 * b3 * b4 * g7 + b1 * b4 * b4 * g7 + 3 * b3 * b4 * b4 * h1
      const h7 = 3 * b2 * b2 * c1 * g4 + 2 * b2 * b4 * c1 * g5 + b2 * b2 * c2 * g5 + b4 * b4 * c1 * g7 + 2 * b2 * b4 * c2 * g7 + 3 * b4 * b4 * c2 * h1 + b2 * b2 * g6 + b2 * b4 * g8 + b4 * b4 * h2
      const h8 = 3 * b1 * b1 * b2 * g4 + 2 * b1 * b2 * b3 * g5 + b1 * b1 * b4 * g5 + b2 * b3 * b3 * g7 + 2 * b1 * b3 * b4 * g7 + 3 * b3 * b3 * b4 * h1
      const h9 = 6 * b1 * b2 * c1 * g4 + 2 * b2 * b3 * c1 * g5 + 2 * b1 * b4 * c1 * g5 + 2 * b1 * b2 * c2 * g5 + 2 * b3 * b4 * c1 * g7 + 2 * b2 * b3 * c2 * g7 + 2 * b1 * b4 * c2 * g7 + 6 * b3 * b4 * c2 * h1 + 2 * b1 * b2 * g6 + b2 * b3 * g8 + b1 * b4 * g8 + 2 * b3 * b4 * h2
      const j1 = 3 * b2 * c1 * c1 * g4 + b4 * c1 * c1 * g5 + 2 * b2 * c1 * c2 * g5 + 2 * b4 * c1 * c2 * g7 + b2 * c2 * c2 * g7 + 3 * b4 * c2 * c2 * h1 + 2 * b2 * c1 * g6 + b4 * c1 * g8 + 2 * b4 * c2 * h2 + b2 * c2 * g8 + b2 * g9 + b4 * h3
      const j2 = b1 * b1 * b1 * g4 + b1 * b1 * b3 * g5 + b1 * b3 * b3 * g7 + b3 * b3 * b3 * h1
      const j3 = 3 * b1 * b1 * c1 * g4 + 2 * b1 * b3 * c1 * g5 + b1 * b1 * c2 * g5 + b3 * b3 * c1 * g7 + 2 * b1 * b3 * c2 * g7 + 3 * b3 * b3 * c2 * h1 + b1 * b1 * g6 + b1 * b3 * g8 + b3 * b3 * h2
      const j4 = 3 * b1 * c1 * c1 * g4 + b3 * c1 * c1 * g5 + 2 * b1 * c1 * c2 * g5 + 2 * b3 * c1 * c2 * g7 + b1 * c2 * c2 * g7 + 3 * b3 * c2 * c2 * h1 + 2 * b1 * c1 * g6 + b3 * c1 * g8 + b1 * c2 * g8 + 2 * b3 * c2 * h2 + b1 * g9 + b3 * h3
      const j5 = c1 * c1 * c1 * g4 + c1 * c1 * c2 * g5 + c1 * c2 * c2 * g7 + c2 * c2 * c2 * h1 + c1 * c1 * g6 + c1 * c2 * g8 + c2 * c2 * h2 + c1 * g9 + c2 * h3 + h4
      // h5 w w w + (h6 t + h7) w w + (h8 t t + h9 t + j1) w + j2 t t t + j3 t t + j4 t + j5 = 0
      // replace w w with t^2 + 1: h5 w (t^2 + 1) + (h6 t + h7) (t^2 + 1) + (h8 t t + h9 t + j1) w + j2 t t t + j3 t t + j4 t + j5 = 0
      // ((h5 + h8) t t + h9 t + h5 + j1) w + (h6 + j2) t t t + (h7 + j3) t t + (h6 + j4) t + h7 + j5 = 0
      const j6 = h5 + h8, j7 = h5 + j1, j8 = h6 + j2, j9 = h7 + j3, k1 = h6 + j4, k2 = h7 + j5
      // (j6 t t + h9 t + j7) w + j8 t t t + j9 t t + k1 t + k2 = 0
      // w^2 - t^2 - 1 = 0
      // (j6 t t + h9 t + j7)^2 w^2 - (j6 t t + h9 t + j7)^2 t^2 - (j6 t t + h9 t + j7)^2 = 0
      // (j8 t t t + j9 t t + k1 t + k2)^2 - (j6 t t + h9 t + j7)^2 t^2 - (j6 t t + h9 t + j7)^2 = 0
      // (j8 j8 + -j6 j6) t t t t t t + (2 j8 j9 + -2 h9 j6) t t t t t + (-h9 h9 + j9 j9 + 2 j8 k1 + -j6 j6 + -2 j6 j7) t t t t + (-2 h9 j6 + -2 h9 j7 + 2 j9 k1 + 2 j8 k2) t t t + (-h9 h9 + -2 j6 j7 + -j7 j7 + k1 k1 + 2 j9 k2) t t + (-2 h9 j7 + 2 k1 k2) t + -j7 j7 + k2 k2 = 0
      ts = calculateEquation5([
        j8 * j8 + -j6 * j6,
        2 * j8 * j9 + -2 * h9 * j6,
        -h9 * h9 + j9 * j9 + 2 * j8 * k1 + -j6 * j6 + -2 * j6 * j7,
        -2 * h9 * j6 + -2 * h9 * j7 + 2 * j9 * k1 + 2 * j8 * k2,
        -h9 * h9 + -2 * j6 * j7 + -j7 * j7 + k1 * k1 + 2 * j9 * k2,
        -2 * h9 * j7 + 2 * k1 * k2,
        -j7 * j7 + k2 * k2,
      ], 0)
    }
  } else {
    const g3 = g2 / g1 / 2
    // f4 x - f1 y = g1 u u + 2 g1 g3 u + d1 f4 - d2 f1
    // f4 x - f1 y = g1 u u + 2 g1 g3 u + g1 g3 g3 + d1 f4 - d2 f1 - g1 g3 g3
    // f4 x - f1 y = g1 (u + g3)^2 + d1 f4 - d2 f1 - g2 g3 / 2
    const g4 = (d1 * f4 - d2 * f1 - g2 * g3 / 2) / g1, g5 = f4 / g1, g6 = f1 / g1
    // g5 x - g6 y = (u + g3)^2 + g4
    // let v = u + g3
    // v^2 = g5 x - g6 y - g4
    // replace u with v - g3: f1 v v v + (-3 f1 g3 + f2) v v + (3 f1 g3 g3 + -2 f2 g3 + f3) v + d1 + -f1 g3 g3 g3 + f2 g3 g3 + -f3 g3 + -x = 0
    // replace v^2: f1 (g5 x - g6 y - g4) v + (-3 f1 g3 + f2)(g5 x - g6 y - g4) + (3 f1 g3 g3 + -2 f2 g3 + f3) v + d1 + -f1 g3 g3 g3 + f2 g3 g3 + -f3 g3 + -x = 0
    // (3 f1 g3 g3 + -f1 g4 + f1 g5 x + -2 f2 g3 + -f1 g6 y + f3) v + d1 + -f1 g3 g3 g3 + f2 g3 g3 + 3 f1 g3 g4 + -3 f1 g3 g5 x + -f3 g3 + 3 f1 g3 g6 y + -f2 g4 + f2 g5 x + -f2 g6 y + -x = 0
    const h1 = 3 * f1 * g3 * g3 - f1 * g4 - 2 * f2 * g3 + f3, h2 = d1 - f1 * g3 * g3 * g3 + f2 * g3 * g3 + 3 * f1 * g3 * g4 - f3 * g3 - f2 * g4
    // (f1 g5 x + -f1 g6 y + h1) v + h2 + (3 f1 g3 g6 - f2 g6) y + (f2 g5 - 3 f1 g3 g5 - 1) x = 0
    const h3 = 3 * f1 * g3 * g6 - f2 * g6, h4 = f2 * g5 - 3 * f1 * g3 * g5 - 1, h5 = f1 * g5, h6 = f1 * g6
    // (h5 x - h6 y + h1) v + h2 + h3 y + h4 x = 0
    // (h5 x - h6 y + h1)^2 v^2 = (h2 + h3 y + h4 x)^2
    // (h5 x - h6 y + h1)^2(g5 x - g6 y - g4) - (h2 + h3 y + h4 x)^2 = 0
    // g5 h5 h5 x x x + ((-g6 h5 h5 + -2 g5 h5 h6) y + 2 g5 h1 h5 + -g4 h5 h5 + -h4 h4) x x + ((2 g6 h5 h6 + g5 h6 h6) y y + (-2 g6 h1 h5 + -2 g5 h1 h6 + 2 g4 h5 h6 + -2 h3 h4) y + g5 h1 h1 + -2 g4 h1 h5 + -2 h2 h4) x + -g6 h6 h6 y y y + (2 g6 h1 h6 + -g4 h6 h6 + -h3 h3) y y + (-g6 h1 h1 + 2 g4 h1 h6 + -2 h2 h3) y + -g4 h1 h1 + -h2 h2 = 0
    const j1 = -g6 * h5 * h5 + -2 * g5 * h5 * h6, j2 = 2 * g5 * h1 * h5 - g4 * h5 * h5 - h4 * h4, j3 = 2 * g6 * h5 * h6 + g5 * h6 * h6
    const j4 = -2 * g6 * h1 * h5 - 2 * g5 * h1 * h6 + 2 * g4 * h5 * h6 - 2 * h3 * h4, j7 = g5 * h1 * h1 - 2 * g4 * h1 * h5 - 2 * h2 * h4
    const j8 = 2 * g6 * h1 * h6 - g4 * h6 * h6 - h3 * h3, j9 = -g6 * h1 * h1 + 2 * g4 * h1 * h6 - 2 * h2 * h3, j0 = -g4 * h1 * h1 - h2 * h2
    const h7 = g5 * h5 * h5, h8 = -g6 * h6 * h6
    // h7 x x x + (j1 y + j2) x x + (j3 y y + j4 y + j7) x + h8 y y y + j8 y y + j9 y + j0 = 0
    // replace x,y: (b2 b2 b2 h7 + b2 b2 b4 j1 + b4 b4 b4 h8 + b2 b4 b4 j3) w w w + ((3 b1 b2 b2 h7 + b2 b2 b3 j1 + 2 b1 b2 b4 j1 + 3 b3 b4 b4 h8 + 2 b2 b3 b4 j3 + b1 b4 b4 j3) t + 3 b2 b2 c1 h7 + 2 b2 b4 c1 j1 + b2 b2 c2 j1 + b4 b4 c1 j3 + b2 b2 j2 + 3 b4 b4 c2 h8 + 2 b2 b4 c2 j3 + b2 b4 j4 + b4 b4 j8) w w + ((3 b1 b1 b2 h7 + 2 b1 b2 b3 j1 + b1 b1 b4 j1 + 3 b3 b3 b4 h8 + b2 b3 b3 j3 + 2 b1 b3 b4 j3) t t + (6 b1 b2 c1 h7 + 2 b2 b3 c1 j1 + 2 b1 b4 c1 j1 + 2 b1 b2 c2 j1 + 2 b3 b4 c1 j3 + 2 b1 b2 j2 + 6 b3 b4 c2 h8 + 2 b2 b3 c2 j3 + 2 b1 b4 c2 j3 + b2 b3 j4 + b1 b4 j4 + 2 b3 b4 j8) t + 3 b2 c1 c1 h7 + b4 c1 c1 j1 + 2 b2 c1 c2 j1 + 2 b4 c1 c2 j3 + 2 b2 c1 j2 + b4 c1 j4 + 3 b4 c2 c2 h8 + b2 c2 c2 j3 + b2 c2 j4 + 2 b4 c2 j8 + b2 j7 + b4 j9) w + (b1 b1 b1 h7 + b1 b1 b3 j1 + b3 b3 b3 h8 + b1 b3 b3 j3) t t t + (3 b1 b1 c1 h7 + 2 b1 b3 c1 j1 + b1 b1 c2 j1 + b3 b3 c1 j3 + b1 b1 j2 + 3 b3 b3 c2 h8 + 2 b1 b3 c2 j3 + b1 b3 j4 + b3 b3 j8) t t + (3 b1 c1 c1 h7 + b3 c1 c1 j1 + 2 b1 c1 c2 j1 + 2 b3 c1 c2 j3 + 2 b1 c1 j2 + b3 c1 j4 + 3 b3 c2 c2 h8 + b1 c2 c2 j3 + b1 c2 j4 + 2 b3 c2 j8 + b1 j7 + b3 j9) t + c1 c1 c1 h7 + c1 c1 c2 j1 + c1 c2 c2 j3 + c1 c1 j2 + c1 j7 + c2 c2 c2 h8 + c1 c2 j4 + c2 c2 j8 + c2 j9 + j0 = 0
    const k1 = b2 * b2 * b2 * h7 + b2 * b2 * b4 * j1 + b4 * b4 * b4 * h8 + b2 * b4 * b4 * j3
    const k2 = 3 * b1 * b2 * b2 * h7 + b2 * b2 * b3 * j1 + 2 * b1 * b2 * b4 * j1 + 3 * b3 * b4 * b4 * h8 + 2 * b2 * b3 * b4 * j3 + b1 * b4 * b4 * j3
    const k3 = 3 * b2 * b2 * c1 * h7 + 2 * b2 * b4 * c1 * j1 + b2 * b2 * c2 * j1 + b4 * b4 * c1 * j3 + b2 * b2 * j2 + 3 * b4 * b4 * c2 * h8 + 2 * b2 * b4 * c2 * j3 + b2 * b4 * j4 + b4 * b4 * j8
    const k4 = 3 * b1 * b1 * b2 * h7 + 2 * b1 * b2 * b3 * j1 + b1 * b1 * b4 * j1 + 3 * b3 * b3 * b4 * h8 + b2 * b3 * b3 * j3 + 2 * b1 * b3 * b4 * j3
    const k5 = 6 * b1 * b2 * c1 * h7 + 2 * b2 * b3 * c1 * j1 + 2 * b1 * b4 * c1 * j1 + 2 * b1 * b2 * c2 * j1 + 2 * b3 * b4 * c1 * j3 + 2 * b1 * b2 * j2 + 6 * b3 * b4 * c2 * h8 + 2 * b2 * b3 * c2 * j3 + 2 * b1 * b4 * c2 * j3 + b2 * b3 * j4 + b1 * b4 * j4 + 2 * b3 * b4 * j8
    const k6 = 3 * b2 * c1 * c1 * h7 + b4 * c1 * c1 * j1 + 2 * b2 * c1 * c2 * j1 + 2 * b4 * c1 * c2 * j3 + 2 * b2 * c1 * j2 + b4 * c1 * j4 + 3 * b4 * c2 * c2 * h8 + b2 * c2 * c2 * j3 + b2 * c2 * j4 + 2 * b4 * c2 * j8 + b2 * j7 + b4 * j9
    const k7 = b1 * b1 * b1 * h7 + b1 * b1 * b3 * j1 + b3 * b3 * b3 * h8 + b1 * b3 * b3 * j3
    const k8 = 3 * b1 * b1 * c1 * h7 + 2 * b1 * b3 * c1 * j1 + b1 * b1 * c2 * j1 + b3 * b3 * c1 * j3 + b1 * b1 * j2 + 3 * b3 * b3 * c2 * h8 + 2 * b1 * b3 * c2 * j3 + b1 * b3 * j4 + b3 * b3 * j8
    const k9 = 3 * b1 * c1 * c1 * h7 + b3 * c1 * c1 * j1 + 2 * b1 * c1 * c2 * j1 + 2 * b3 * c1 * c2 * j3 + 2 * b1 * c1 * j2 + b3 * c1 * j4 + 3 * b3 * c2 * c2 * h8 + b1 * c2 * c2 * j3 + b1 * c2 * j4 + 2 * b3 * c2 * j8 + b1 * j7 + b3 * j9
    const k0 = c1 * c1 * c1 * h7 + c1 * c1 * c2 * j1 + c1 * c2 * c2 * j3 + c1 * c1 * j2 + c1 * j7 + c2 * c2 * c2 * h8 + c1 * c2 * j4 + c2 * c2 * j8 + c2 * j9 + j0
    // k1 w w w + (k2 t + k3) w w + (k4 t t + k5 t + k6) w + k7 t t t + k8 t t + k9 t + k0 = 0
    // replace w w with t^2 + 1: k1 w (t^2 + 1) + (k2 t + k3)(t^2 + 1) + (k4 t t + k5 t + k6) w + k7 t t t + k8 t t + k9 t + k0 = 0
    // ((k1 + k4) t t + k5 t + k1 + k6) w + (k2 + k7) t t t + (k3 + k8) t t + (k2 + k9) t + k0 + k3 = 0
    const m1 = k1 + k4, m2 = k1 + k6, m3 = k2 + k7, m4 = k3 + k8, m5 = k2 + k9, m6 = k0 + k3
    // (m1 t t + k5 t + m2) w + m3 t t t + m4 t t + m5 t + m6 = 0
    // w^2 - t^2 - 1 = 0
    // ((m1 t t + k5 t + m2)w)^2 - (m1 t t + k5 t + m2)^2 t^2 - (m1 t t + k5 t + m2)^2 = 0
    // (m3 t t t + m4 t t + m5 t + m6)^2 - (m1 t t + k5 t + m2)^2 t^2 - (m1 t t + k5 t + m2)^2 = 0
    // (m3 m3 + -m1 m1) t t t t t t + (2 m3 m4 + -2 k5 m1) t t t t t + (-k5 k5 + m4 m4 + 2 m3 m5 + -m1 m1 + -2 m1 m2) t t t t + (-2 k5 m1 + -2 k5 m2 + 2 m4 m5 + 2 m3 m6) t t t + (-k5 k5 + -2 m1 m2 + -m2 m2 + m5 m5 + 2 m4 m6) t t + (-2 k5 m2 + 2 m5 m6) t + -m2 m2 + m6 m6 = 0
    ts = calculateEquation5([
      m3 * m3 - m1 * m1,
      2 * (m3 * m4 - k5 * m1),
      -k5 * k5 + m4 * m4 + 2 * m3 * m5 - m1 * m1 - 2 * m1 * m2,
      -2 * k5 * m1 - 2 * k5 * m2 + 2 * m4 * m5 + 2 * m3 * m6,
      -k5 * k5 - 2 * m1 * m2 - m2 * m2 + m5 * m5 + 2 * m4 * m6,
      -2 * k5 * m2 + 2 * m5 * m6,
      -m2 * m2 + m6 * m6,
    ], 0)
  }
  ts = ts.filter(t => isBetween(t, t1, t2, extend2))
  let result = ts.map(t => {
    const d = Math.sqrt(t ** 2 + 1)
    return {
      x: c1 + b1 * t + b2 * d,
      y: c2 + b3 * t + b4 * d,
    }
  })
  result = result.filter(p => pointIsOnBezierCurve(p, curve1) && isValidPercent(getBezierCurvePercentAtPoint(curve1, p), extend1))
  return result
}

export function getTangencyPointToHyperbola({ x: a0, y: b0 }: Position, { a, b, angle, x: x1, y: y1 }: Hyperbola, delta = delta2) {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x1 + e2 b t - e1 a((t^2 + 1)^0.5 - 1)
  // y = y1 + e1 b t + e2 a((t^2 + 1)^0.5 - 1)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  const c1 = x1 - b2, c2 = y1 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5
  // x' = b2 t (t^2 + 1)^-0.5 + b1
  // y' = b4 t (t^2 + 1)^-0.5 + b3

  // let w = (t^2 + 1)^0.5
  // x = c1 + b1 t + b2 w
  // y = c2 + b3 t + b4 w
  // x' = b2 t / w + b1
  // y' = b4 t / w + b3

  // k1 = dy/dx = dy/dt/(dx/dt) = (b4 t / w + b3)/(b2 t / w + b1)
  // k2 = (y - b0)/(x - a0) = (c2 + b3 t + b4 w - b0)/(c1 + b1 t + b2 w - a0)
  // k1 = k2
  const d1 = c2 - b0, d2 = c1 - a0
  // (d1 + b3 t + b4 w)/(d2 + b1 t + b2 w) = (b4 t / w + b3)/(b2 t / w + b1)
  // (d1 + b3 t + b4 w)(b2 t / w + b1) = (b4 t / w + b3)(d2 + b1 t + b2 w)
  // (d1 + b3 t + b4 w)(b2 t + b1 w) - (b4 t + b3 w)(d2 + b1 t + b2 w) = 0
  // (-b2 b3 + b1 b4) w w + (b1 d1 + -b3 d2) w + (b2 b3 + -b1 b4) t t + (b2 d1 + -b4 d2) t = 0
  const f1 = -b2 * b3 + b1 * b4, f2 = b1 * d1 - b3 * d2, f3 = b2 * d1 - b4 * d2
  // f1 w w + f2 w - f1 t t + f3 t = 0
  // replace w w with t^2 + 1: f1(t^2 + 1) + f2 w - f1 t t + f3 t = 0
  // f3 t + f1 + f2 w = 0
  // f2^2 w w = (f3 t + f1)^2
  // f2^2(t^2 + 1) - (f3 t + f1)^2 = 0
  // (f2 f2 + -f3 f3) t t + -2 f1 f3 t + -f1 f1 + f2 f2 = 0
  const ts = calculateEquation2(
    f2 * f2 - f3 * f3,
    -2 * f1 * f3,
    -f1 * f1 + f2 * f2,
    delta,
  )
  return ts.map(t => {
    const d = Math.sqrt(t ** 2 + 1)
    return {
      x: c1 + b1 * t + b2 * d,
      y: c2 + b3 * t + b4 * d,
    }
  })
}

export function isSameHyperbola(hyperbola1: Hyperbola, hyperbola2: Hyperbola): boolean {
  return isSamePoint(hyperbola1, hyperbola2) &&
    isSameNumber(hyperbola1.a, hyperbola1.a) &&
    isSameNumber(hyperbola1.b, hyperbola1.b) &&
    isSameNumber(hyperbola1.angle, hyperbola1.angle)
}

export function mergeHyperbolaSegments(curve1: HyperbolaSegment, curve2: HyperbolaSegment): HyperbolaSegment | undefined {
  if (!isSameHyperbola(curve1, curve2)) return
  const range = mergeNumberRange([curve1.t1, curve1.t2], [curve2.t1, curve2.t2])
  if (!range) return
  return {
    ...curve1,
    t1: range[0],
    t2: range[1],
  }
}

export function getLineAndHyperbolaExtremumPoint(line: GeneralFormLine, curve: Hyperbola): Tuple2<Position>[] {
  const { a, b, angle } = curve
  const { a: a0, b: b0 } = line
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // x = x1 + e2 b t - e1 a((t^2 + 1)^0.5 - 1)
  // y = y1 + e1 b t + e2 a((t^2 + 1)^0.5 - 1)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  // const c1 = x1 - b2, c2 = y1 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5
  // x' = b2 t (t^2 + 1)^-0.5 + b1
  // y' = b4 t (t^2 + 1)^-0.5 + b3

  // let w = (t^2 + 1)^0.5
  // x = c1 + b1 t + b2 w
  // y = c2 + b3 t + b4 w
  // x' = b2 t / w + b1
  // y' = b4 t / w + b3

  // a0 x + b0 y + c0 = 0
  // dy / dx = -a0 / b0
  // a0 dx + b0 dy = 0
  // a0(b2 t / w + b1) + b0(b4 t / w + b3) = 0
  // a0(b2 t + b1 w) + b0(b4 t + b3 w) = 0
  // (a0 b1 + b0 b3) w + (a0 b2 + b0 b4) t = 0
  const d1 = a0 * b1 + b0 * b3, d2 = a0 * b2 + b0 * b4
  // d1 w + d2 t = 0
  // d1 d1 w w = d2 d2 t t
  // replace w w with t^2 + 1: d1 d1(t^2 + 1) = d2 d2 t t
  // (d1 d1 - d2 d2) t^2 + d1 d1 = 0
  const d3 = d1 * d1 - d2 * d2
  if (isZero(d3)) return []
  const tSquare = -d1 * d1 / d3
  if (tSquare < 0) return []
  const t = Math.sqrt(tSquare) * Math.sign(d1) * Math.sign(d2) * -1
  const p2 = getHyperbolaPointAtParam(curve, t)
  const p1 = getPerpendicularPoint(p2, line)
  return [[p1, p2]]
}

export function getCircleAndHyperbolaExtremumPoints(circle: Circle, curve: Hyperbola): Tuple2<Position>[] {
  const ts = getPerpendicularParamsToHyperbola(circle, curve)
  return ts.map(t => {
    const p = getHyperbolaPointAtParam(curve, t)
    const t1 = getCircleRadian(p, circle)
    return [[getCirclePointAtRadian(circle, t1), p], [getCirclePointAtRadian(circle, reverseRadian(t1)), p]] as Tuple2<Position>[]
  }).flat()
}

export function getEllipseAndHyperbolaExtremumPoints(curve1: Ellipse, curve2: HyperbolaSegment): Tuple2<Position>[] {
  const [p1, d1, d2] = getEllipseDerivatives(curve1)
  const [p2, e1, e2] = getHyperbolaDerivatives(curve2)
  const f1 = (t: Vec2): Vec2 => {
    // z = (x1 - x2)^2 + (y1 - y2)^2
    // dz/dt1/2: z1 = (x1 - x2)x1' + (y1 - y2)y1'
    // dz/dt2/2: z2 = (x2 - x1)x2' + (y2 - y1)y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    return [(x1 - x2) * x11 + (y1 - y2) * y11, (x2 - x1) * x21 + (y2 - y1) * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    const { x: x22, y: y22 } = e2(t[1])
    // dz1/dt1 = x1'x1' + (x1 - x2)x1'' + y1'y1' + (y1 - y2)y1''
    // dz1/dt2 = -x2' x1' - y2' y1'
    // dz2/dt1 = -x1' x2' - y1' y2'
    // dz2/dt2 = x2'x2' + (x2 - x1)x2'' + y2'y2' + (y2 - y1)y2''
    return [
      x11 * x11 + (x1 - x2) * x12 + y11 * y11 + (y1 - y2) * y12,
      -x21 * x11 - y21 * y11,
      -x11 * x21 - y11 * y21,
      x21 * x21 + (x2 - x1) * x22 + y21 * y21 + (y2 - y1) * y22,
    ]
  }
  let ts: Vec2[] = []
  for (const t1 of [-Math.PI / 2, Math.PI / 2]) {
    const t = newtonIterate2([t1, 0.5], f1, f2, delta2)
    if (t !== undefined) {
      ts.push(t)
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isBetween(v[1], curve2.t1, curve2.t2)).map(t => {
    return [p1(t[0]), p2(t[1])]
  })
}

export function getQuadraticCurveAndHyperbolaExtremumPoints(curve1: QuadraticCurve, curve2: HyperbolaSegment): Tuple2<Position>[] {
  const [p1, d1, d2] = getQuadraticCurveDerivatives(curve1)
  const [p2, e1, e2] = getHyperbolaDerivatives(curve2)
  const f1 = (t: Vec2): Vec2 => {
    // z = (x1 - x2)^2 + (y1 - y2)^2
    // dz/dt1/2: z1 = (x1 - x2)x1' + (y1 - y2)y1'
    // dz/dt2/2: z2 = (x2 - x1)x2' + (y2 - y1)y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    return [(x1 - x2) * x11 + (y1 - y2) * y11, (x2 - x1) * x21 + (y2 - y1) * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    const { x: x22, y: y22 } = e2(t[1])
    // dz1/dt1 = x1'x1' + (x1 - x2)x1'' + y1'y1' + (y1 - y2)y1''
    // dz1/dt2 = -x2' x1' - y2' y1'
    // dz2/dt1 = -x1' x2' - y1' y2'
    // dz2/dt2 = x2'x2' + (x2 - x1)x2'' + y2'y2' + (y2 - y1)y2''
    return [
      x11 * x11 + (x1 - x2) * x12 + y11 * y11 + (y1 - y2) * y12,
      -x21 * x11 - y21 * y11,
      -x11 * x21 - y11 * y21,
      x21 * x21 + (x2 - x1) * x22 + y21 * y21 + (y2 - y1) * y22,
    ]
  }
  const ts: Vec2[] = []
  const t = newtonIterate2([0.5, 0.5], f1, f2, delta2)
  if (t !== undefined) {
    ts.push(t)
  }
  return ts.filter(v => isValidPercent(v[0]) && isBetween(v[1], curve2.t1, curve2.t2)).map(t => {
    return [p1(t[0]), p2(t[1])]
  })
}
