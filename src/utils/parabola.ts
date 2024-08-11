import { getPointsBoundingUnsafe } from "./bounding"
import { calculateEquation3 } from "./equation-calculater"
import { delta2, isBetween, isZero, minimumBy } from "./math"
import { getTwoPointsDistance, Position } from "./position"
import { angleToRadian } from "./radian"
import { TwoPointsFormRegion } from "./region"
import { transformPointFromCoordinate2D } from "./transform"
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
    percent: p.u,
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
