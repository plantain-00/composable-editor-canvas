import { getQuadraticCurvePercentAtPoint, QuadraticCurve } from "./bezier"
import { getPointsBoundingUnsafe } from "./bounding"
import { Arc, Circle, pointIsOnArc } from "./circle"
import { Ellipse, EllipseArc, pointIsOnEllipseArc } from "./ellipse"
import { calculateEquation2, calculateEquation4, newtonIterate } from "./equation-calculater"
import { rombergIntegral } from "./length"
import { getPointSideOfLine, pointAndDirectionToGeneralFormLine, pointIsOnLineSegment } from "./line"
import { deduplicate, delta2, delta3, ExtendType, getTwoNumberCenter, isBetween, isSameNumber, isValidPercent, isZero, largerThan, minimumBy } from "./math"
import { matrix } from "./matrix"
import { getParabolaXAxisRadian } from "./parabola"
import { getPointByLengthAndRadian, getTwoPointsDistance, Position } from "./position"
import { angleToRadian } from "./radian"
import { TwoPointsFormRegion } from "./region"
import { getCoordinateMatrix2D, getCoordinateVec2D, transformPointFromCoordinate2D } from "./transform"
import { Tuple3 } from "./types"
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

export function pointIsOnHyperbolaSegment(point: Position, curve: HyperbolaSegment, extend: ExtendType = { body: true }): boolean {
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

export function getLineSegmentHyperbolaSegmentIntersectionPoints(start: Position, end: Position, curve: HyperbolaSegment, extend1: ExtendType = { body: true }, extend2: ExtendType = { body: true }): Position[] {
  const result = getLineHyperbolaSegmentIntersectionPoints(start, end, curve, extend2)
  return result.filter((p) => pointIsOnLineSegment(p, start, end, extend1))
}

export function getLineHyperbolaSegmentIntersectionPoints({ x: x1, y: y1 }: Position, { x: x2, y: y2 }: Position, { angle, x: x0, y: y0, a, b, t1, t2 }: HyperbolaSegment, extend: ExtendType = { body: true }): Position[] {
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
  return ts.map(t => {
    const d = Math.sqrt(t ** 2 + 1)
    return {
      x: c1 + b1 * t + b2 * d,
      y: c2 + b3 * t + b4 * d,
    }
  })
}

export function getArcHyperbolaSegmentIntersectionPoints(arc: Arc, curve: HyperbolaSegment, extend1: ExtendType = { body: true }, extend2: ExtendType = { body: true }): Position[] {
  const result = getCircleHyperbolaSegmentIntersectionPoints(arc, curve, extend2)
  return result.filter((p) => pointIsOnArc(p, arc, extend1))
}

export function getCircleHyperbolaSegmentIntersectionPoints({ x: x1, y: y1, r: r1 }: Circle, { angle, x: x0, y: y0, a, b, t1, t2 }: HyperbolaSegment, extend: ExtendType = { body: true }): Position[] {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  const c1 = x0 - b2, c2 = y0 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5

  // (x - x1)^2 + (y - y1)^2 = r1^2
  // replace x, y: (c1 + b1 t + b2(t^2 + 1)^0.5 - x1)^2 + (c2 + b3 t + b4(t^2 + 1)^0.5 - y1)^2 - r1^2 = 0
  const f1 = c1 - x1, f2 = c2 - y1
  // (f1 + b1 t + b2(t^2 + 1)^0.5)^2 + (f2 + b3 t + b4(t^2 + 1)^0.5)^2 - r1^2 = 0
  // (b1 b1 + b3 b3) t t + (2 b1 b2 (t t + 1)^0.5 + 2 b3 b4 (t t + 1)^0.5 + 2 b1 f1 + 2 b3 f2) t + f1 f1 + b2 b2 (t t + 1)^0.5 (t t + 1)^0.5 + 2 b2 f1 (t t + 1)^0.5 + f2 f2 + b4 b4 (t t + 1)^0.5 (t t + 1)^0.5 + 2 b4 f2 (t t + 1)^0.5 - r1 r1 = 0
  // b b t t + (2 (b1 b2 + b3 b4)(t t + 1)^0.5 + 2 b1 f1 + 2 b3 f2) t + f1 f1 + b2 b2 (t t + 1) + 2 b2 f1 (t t + 1)^0.5 + f2 f2 + b4 b4 (t t + 1) + 2 b4 f2 (t t + 1)^0.5 - r1 r1 = 0
  // b b t t + (2 (-e2 b e1 a + e1 b e2 a)(t t + 1)^0.5 + 2 b1 f1 + 2 b3 f2) t + f1 f1 + (b2 b2 + b4 b4) (t t + 1) + 2 (b2 f1 + b4 f2) (t t + 1)^0.5 + f2 f2 - r1 r1 = 0
  // b b t t + (2 b1 f1 + 2 b3 f2) t + f1 f1 + a a(t t + 1) + 2 (b2 f1 + b4 f2) (t t + 1)^0.5 + f2 f2 - r1 r1 = 0
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
  return ts.map(t => {
    const d = Math.sqrt(t ** 2 + 1)
    return {
      x: c1 + b1 * t + b2 * d,
      y: c2 + b3 * t + b4 * d,
    }
  })
}

export function getEllipseArcHyperbolaSegmentIntersectionPoints(arc: EllipseArc, curve: HyperbolaSegment, extend1: ExtendType = { body: true }, extend2: ExtendType = { body: true }): Position[] {
  const result = getEllipseHyperbolaSegmentIntersectionPoints(arc, curve, extend2)
  return result.filter((p) => pointIsOnEllipseArc(p, arc, extend1))
}

export function getEllipseHyperbolaSegmentIntersectionPoints({ rx: rx1, ry: ry1, cx: cx1, cy: cy1, angle: angle1 }: Ellipse, { angle, x: x0, y: y0, a, b, t1, t2 }: HyperbolaSegment, extend: ExtendType = { body: true }): Position[] {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  const c1 = x0 - b2, c2 = y0 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5

  const radian1 = angleToRadian(angle1)
  const d1 = Math.sin(radian1), d2 = Math.cos(radian1), d3 = 1 / rx1 / rx1, d4 = 1 / ry1 / ry1
  // (d2(x - cx1) + d1(y - cy1))^2 d3 + (-d1(x - cx1) + d2(y - cy1))^2 d4 = 1
  // replace x, y: (d2(c1 + b1 t + b2(t^2 + 1)^0.5 - cx1) + d1(c2 + b3 t + b4(t^2 + 1)^0.5 - cy1))^2 d3 + (-d1(c1 + b1 t + b2(t^2 + 1)^0.5 - cx1) + d2(c2 + b3 t + b4(t^2 + 1)^0.5 - cy1))^2 d4 - 1 = 0
  const f1 = c1 - cx1, f2 = c2 - cy1
  // (d2(f1 + b1 t + b2(t^2 + 1)^0.5) + d1(f2 + b3 t + b4(t^2 + 1)^0.5))^2 d3 + (-d1(f1 + b1 t + b2(t^2 + 1)^0.5) + d2(f2 + b3 t + b4(t^2 + 1)^0.5))^2 d4 - 1 = 0
  // (d2 f1 + d2 b1 t + d2 b2(t^2 + 1)^0.5 + d1 f2 + d1 b3 t + d1 b4(t^2 + 1)^0.5)^2 d3 + (-d1 f1 - d1 b1 t - d1 b2(t^2 + 1)^0.5 + d2 f2 + d2 b3 t + d2 b4(t^2 + 1)^0.5)^2 d4 - 1 = 0
  // ((d2 f1 + d1 f2) + (d2 b1 + d1 b3) t + (d2 b2 + d1 b4)(t^2 + 1)^0.5)^2 d3 + ((d2 f2 - d1 f1) + (d2 b3 - d1 b1) t + (d2 b4 - d1 b2)(t^2 + 1)^0.5)^2 d4 - 1 = 0
  const g1 = d2 * f1 + d1 * f2, g2 = d2 * b1 + d1 * b3, g3 = d2 * b2 + d1 * b4
  const g4 = d2 * f2 - d1 * f1, g5 = d2 * b3 - d1 * b1, g6 = d2 * b4 - d1 * b2
  // (g1 + g2 t + g3(t^2 + 1)^0.5)^2 d3 + (g4 + g5 t + g6(t^2 + 1)^0.5)^2 d4 - 1 = 0
  // d3 g1 g1 + 2 d3 g1 g2 t + d3 g2 g2 t t + 2 d3 g1 g3 (t t + 1)^0.5 + 2 d3 g2 g3 t (t t + 1)^0.5 + d3 g3 g3 (t t + 1)^0.5 (t t + 1)^0.5 + d4 g4 g4 + 2 d4 g4 g5 t + d4 g5 g5 t t + 2 d4 g4 g6 (t t + 1)^0.5 + 2 d4 g5 g6 t (t t + 1)^0.5 + d4 g6 g6 (t t + 1)^0.5 (t t + 1)^0.5 + -1 = 0
  // d3 g1 g1 + 2 (d3 g1 g2 + d4 g4 g5) t + (d3 g2 g2 + d4 g5 g5) t t + 2(d3 g1 g3 + d4 g4 g6) (t t + 1)^0.5 + 2 (d3 g2 g3 + d4 g5 g6) t (t t + 1)^0.5 + d3 g3 g3 (t t + 1) + d4 g4 g4 + d4 g6 g6 (t t + 1) + -1 = 0
  // (d3 g1 g1 + d3 g3 g3 + d4 g6 g6 + d4 g4 g4 - 1) + 2 (d3 g1 g2 + d4 g4 g5) t + (d3 g2 g2 + d4 g5 g5 + d3 g3 g3 + d4 g6 g6) t t + 2(d3 g1 g3 + d4 g4 g6) (t t + 1)^0.5 + 2 (d3 g2 g3 + d4 g5 g6) t (t t + 1)^0.5 = 0
  const h1 = d3 * g1 * g1 + d3 * g3 * g3 + d4 * g6 * g6 + d4 * g4 * g4 - 1, h2 = 2 * (d3 * g1 * g2 + d4 * g4 * g5)
  const h3 = d3 * g2 * g2 + d4 * g5 * g5 + d3 * g3 * g3 + d4 * g6 * g6, h4 = 2 * (d3 * g1 * g3 + d4 * g4 * g6)
  const h5 = 2 * (d3 * g2 * g3 + d4 * g5 * g6)
  // h1 + h2 t + h3 t t + h4 (t t + 1)^0.5 + h5 t (t t + 1)^0.5 = 0
  // (h1 + h2 t + h3 t t)^2 = (h4 (t t + 1)^0.5 + h5 t (t t + 1)^0.5)^2
  // (h1 + h2 t + h3 t t)^2 - (h4 + h5 t)^2(t t + 1) = 0
  // (h3 h3 + -h5 h5) t t t t + (2 h2 h3 + -2 h4 h5) t t t + (h2 h2 + 2 h1 h3 + -h4 h4 + -h5 h5) t t + (2 h1 h2 + -2 h4 h5) t + h1 h1 + -h4 h4 = 0
  let ts = calculateEquation4(
    h3 * h3 - h5 * h5,
    2 * (h2 * h3 - h4 * h5),
    h2 * h2 + 2 * h1 * h3 - h4 * h4 - h5 * h5,
    2 * (h1 * h2 - h4 * h5),
    h1 * h1 - h4 * h4,
  )
  ts = ts.filter(t => isBetween(t, t1, t2, extend))
  return ts.map(t => {
    const d = Math.sqrt(t ** 2 + 1)
    return {
      x: c1 + b1 * t + b2 * d,
      y: c2 + b3 * t + b4 * d,
    }
  })
}

export function getQuadraticCurveHyperbolaSegmentIntersectionPoints(
  curve1: QuadraticCurve,
  { angle, x: x0, y: y0, a, b, t1, t2 }: HyperbolaSegment,
  extend1: ExtendType = { body: true },
  extend2 = extend1,
): Position[] {
  const xAxisRadian = getParabolaXAxisRadian({ angle })
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  const b1 = e2 * b, b2 = -e1 * a, b3 = e1 * b, b4 = e2 * a
  const c1 = x0 - b2, c2 = y0 - b4
  // x = c1 + b1 t + b2(t^2 + 1)^0.5
  // y = c2 + b3 t + b4(t^2 + 1)^0.5

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
    // f4(c1 + b1 t + b2(t^2 + 1)^0.5) - f2(c2 + b3 t + b4(t^2 + 1)^0.5) - g2 = 0
    // (-b3 f2 + b1 f4) t + (b2 f4 - b4 f2) (t t + 1)^0.5 + -c2 f2 + c1 f4 + -g2 = 0
    const g3 = -b3 * f2 + b1 * f4, g4 = b2 * f4 - b4 * f2, g5 = -c2 * f2 + c1 * f4 - g2
    // g3 t + g4(t t + 1)^0.5 + g5 = 0
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
    // g6(c1 + b1 t + b2(t^2 + 1)^0.5)^2 + (g7(c2 + b3 t + b4(t^2 + 1)^0.5) + g3)(c1 + b1 t + b2(t^2 + 1)^0.5) + g8(c2 + b3 t + b4(t^2 + 1)^0.5)^2 + g4(c2 + b3 t + b4(t^2 + 1)^0.5) + g5 = 0
    // c1 c1 g6 + b1 b1 g6 t t + 2 b1 b2 g6 t (t t + 1)^0.5 + b2 b2 g6 (t t + 1) + 2 b1 c1 g6 t + 2 b2 c1 g6 (t t + 1)^0.5 + b2 b3 g7 t (t t + 1)^0.5 + b1 b4 g7 t (t t + 1)^0.5 + b2 b4 g7 (t t + 1) + b3 c1 g7 t + b4 c1 g7 (t t + 1)^0.5 + c1 c2 g7 + c1 g3 + b1 b3 g7 t t + b1 c2 g7 t + b2 c2 g7 (t t + 1)^0.5 + c2 c2 g8 + b3 b3 g8 t t + 2 b3 b4 g8 t (t t + 1)^0.5 + b4 b4 g8 (t t + 1) + 2 b3 c2 g8 t + 2 b4 c2 g8 (t t + 1)^0.5 + b1 g3 t + b2 g3 (t t + 1)^0.5 + c2 g4 + b3 g4 t + b4 g4 (t t + 1)^0.5 + g5 = 0
    // (b1 b1 g6 + b2 b2 g6 + b2 b4 g7 + b1 b3 g7 + b3 b3 g8 + b4 b4 g8) t t + ((2 b1 b2 g6 + b2 b3 g7 + b1 b4 g7 + 2 b3 b4 g8)(t t + 1)^0.5 + 2 b1 c1 g6 + b3 c1 g7 + b1 c2 g7 + 2 b3 c2 g8 + b1 g3 + b3 g4) t + c1 c1 g6 + b2 b2 g6 + (2 b2 c1 g6 + b4 c1 g7 + b2 c2 g7 + 2 b4 c2 g8 + b2 g3 + b4 g4)(t t + 1)^0.5 + b2 b4 g7 + c1 c2 g7 + c1 g3 + c2 c2 g8 + b4 b4 g8 + c2 g4 + g5 = 0
    const h1 = b1 * b1 * g6 + b2 * b2 * g6 + b2 * b4 * g7 + b1 * b3 * g7 + b3 * b3 * g8 + b4 * b4 * g8, h2 = 2 * b1 * b2 * g6 + b2 * b3 * g7 + b1 * b4 * g7 + 2 * b3 * b4 * g8
    const h3 = 2 * b1 * c1 * g6 + b3 * c1 * g7 + b1 * c2 * g7 + 2 * b3 * c2 * g8 + b1 * g3 + b3 * g4, h4 = 2 * b2 * c1 * g6 + b4 * c1 * g7 + b2 * c2 * g7 + 2 * b4 * c2 * g8 + b2 * g3 + b4 * g4
    const h5 = c1 * c1 * g6 + b2 * b2 * g6 + b2 * b4 * g7 + c1 * c2 * g7 + c1 * g3 + c2 * c2 * g8 + b4 * b4 * g8 + c2 * g4 + g5
    // h1 t t + (h2(t t + 1)^0.5 + h3) t + h4(t t + 1)^0.5 + h5 = 0
    // h1 t t + h2 t(t t + 1)^0.5 + h3 t + h4(t t + 1)^0.5 + h5 = 0
    // (h2 t + h4)(t t + 1)^0.5 + h1 t t + h3 t + h5 = 0
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
  result = result.filter(p => isValidPercent(getQuadraticCurvePercentAtPoint(curve1, p), extend1))
  return result
}
