import { getPointsBoundingUnsafe } from "./bounding"
import { calculateEquation2, calculateEquation4, newtonIterate } from "./equation-calculater"
import { rombergIntegral } from "./length"
import { deduplicate, delta2, delta3, ExtendType, getTwoNumberCenter, isBetween, isSameNumber, largerThan, minimumBy } from "./math"
import { matrix } from "./matrix"
import { getParabolaXAxisRadian } from "./parabola"
import { getTwoPointsDistance, Position } from "./position"
import { TwoPointsFormRegion } from "./region"
import { getCoordinateMatrix2D, getCoordinateVec2D, transformPointFromCoordinate2D } from "./transform"
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
  const d1 = a1 * b2 + a2 * b4, d2 = a1 * b1 + a2 * b3, d3 = b1 * b2 + b3 * b4, d4 = b1 * b1 + b2 * b2 + b4 * b4 + b3 * b3
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

export function reverseHyperbola<T extends HyperbolaSegment>(curve: T): T {
  return {
    ...curve,
    t1: curve.t2,
    t2: curve.t1,
  }
}
