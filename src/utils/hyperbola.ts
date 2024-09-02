import { calculateEquation4 } from "./equation-calculater"
import { deduplicate, isBetween, isSameNumber } from "./math"
import { matrix } from "./matrix"
import { getParabolaXAxisRadian } from "./parabola"
import { Position } from "./position"
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

export function reverseHyperbola<T extends HyperbolaSegment>(curve: T): T {
  return {
    ...curve,
    t1: curve.t2,
    t2: curve.t1,
  }
}
