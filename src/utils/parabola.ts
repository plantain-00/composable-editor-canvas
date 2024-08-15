import { getPointsBoundingUnsafe } from "./bounding"
import { calculateEquation2, calculateEquation3, newtonIterate } from "./equation-calculater"
import { rombergIntegral } from "./length"
import { getPointSideOfLine, pointAndDirectionToGeneralFormLine } from "./line"
import { delta2, delta3, ExtendType, getTwoNumberCenter, isBetween, isSameNumber, isZero, minimumBy } from "./math"
import { getPointByLengthAndRadian, getTwoPointsDistance, Position } from "./position"
import { angleToRadian } from "./radian"
import { TwoPointsFormRegion } from "./region"
import { transformPointFromCoordinate2D } from "./transform"
import { Tuple3 } from "./types"
import { and, number } from "./validators"

export interface Parabola extends Position {
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

export function getPerpendicularParamsToParabola({ x: x0, y: y0 }: Position, { p, angle, x: x1, y: y1 }: Parabola, delta = delta2): number[] {
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

export function reverseParabola(curve: ParabolaSegment): ParabolaSegment {
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
