import { Arc, Circle, Ellipse, EllipseArc, ellipseToEllipseArc, getFormattedEndAngle } from "./geometry"
import { BezierCurve, QuadraticCurve } from "./intersection"
import { angleToRadian } from "./radian"

export function getCircleLength(circle: Circle) {
  return 2 * Math.PI * circle.r
}

export function getArcLength(arc: Arc) {
  const endAngle = getFormattedEndAngle(arc)
  return arc.r * angleToRadian(Math.abs(endAngle - arc.startAngle))
}

export function getEllipseLength(ellipse: Ellipse, delta?: number) {
  return getEllipseArcLength(ellipseToEllipseArc(ellipse), delta)
}

export function getEllipseArcLength(ellipse: EllipseArc, delta?: number) {
  // let d1 = Math.sin(radian), d2 = Math.cos(radian)
  // x = d2 rx cos(t) - d1 ry sin(t) + cx
  // y = d1 rx cos(t) + d2 ry sin(t) + cy
  // x' = -d2 rx sin(t) - d1 ry cos(t) = dx/dt
  // y' = -d1 rx sin(t) + d2 ry cos(t) = dy/dt
  // dz = sqrt(dx^2 + dy^2)
  // dz/dt = sqrt(cos(t) cos(t) d1 d1 ry ry + cos(t) cos(t) d2 d2 ry ry + d1 d1 rx rx sin(t) sin(t) + d2 d2 rx rx sin(t) sin(t))
  // dz/dt = sqrt(cos(t) cos(t)ry ry + rx rx sin(t) sin(t))
  const e1 = ellipse.rx ** 2, e2 = ellipse.ry ** 2
  // dz/dt = sqrt(e1 sin(t) sin(t) + e2 cos(t) cos(t))
  const radian1 = angleToRadian(ellipse.startAngle), radian2 = angleToRadian(getFormattedEndAngle(ellipse))
  return rombergIntegral(Math.min(radian1, radian2), Math.max(radian1, radian2), t => Math.sqrt(e1 * Math.sin(t) ** 2 + e2 * Math.cos(t) ** 2), delta)
}

export function getQuadraticCurveLength({ from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve, delta?: number) {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 t t + 2 c1 t + a1
  // y = c4 t t + 2 c3 t + b1
  // x' = 2 c2 t + 2 c1 = dx/dt
  // y' = 2 c4 t + 2 c3 = dy/dt
  // dz = sqrt(dx^2 + dy^2)
  // dz/dt = 2 sqrt((c2 t + c1)^2 + (c4 t + c3)^2)
  // dz/dt = 2 sqrt((c2 c2 + c4 c4) t t + (2 c1 c2 + 2 c3 c4) t + c1 c1 + c3 c3)
  const e1 = c2 * c2 + c4 * c4, e2 = 2 * c1 * c2 + 2 * c3 * c4, e3 = c1 * c1 + c3 * c3
  // dz/dt = 2 sqrt(e1 t t + e2 t + e3)
  return rombergIntegral(0, 1, t => 2 * Math.sqrt(e1 * t * t + e2 * t + e3), delta)
}

export function getBezierCurveLength({ from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const d1 = -b1 + 3 * b2 + -3 * b3 + b4, d2 = 3 * (b1 - 2 * b2 + b3), d3 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = d1 t t t + d2 t t + d3 t + b1
  // x' = 3 c1 t t + 2 c2 t + c3 = dx/dt
  // y' = 3 d1 t t + 2 d2 t + d3 = dy/dt
  // dz = sqrt(dx^2 + dy^2)
  // dz/dt = sqrt((3 c1 t t + 2 c2 t + c3)^2 + (3 d1 t t + 2 d2 t + d3)^2)
  // dz/dt = sqrt((9 c1 c1 + 9 d1 d1) t t t t + (12 c1 c2 + 12 d1 d2) t t t + (4 c2 c2 + 6 c1 c3 + 4 d2 d2 + 6 d1 d3) t t + (4 c2 c3 + 4 d2 d3) t + c3 c3 + d3 d3)
  const e1 = 9 * c1 * c1 + 9 * d1 * d1, e2 = 12 * c1 * c2 + 12 * d1 * d2, e3 = 4 * c2 * c2 + 6 * c1 * c3 + 4 * d2 * d2 + 6 * d1 * d3, e4 = 4 * c2 * c3 + 4 * d2 * d3, e5 = c3 * c3 + d3 * d3
  // dz/dt = sqrt(e1 t t t t + e2 t t t + e3 t t + e4 t + e5)
  return rombergIntegral(0, 1, t => Math.sqrt(e1 * t * t * t * t + e2 * t * t * t + e3 * t * t + e4 * t + e5))
}

export function cotesIntegral(a: number, b: number, f: (t: number) => number, count?: number): number {
  if (count && Number.isInteger(count) && count > 1) {
    let result = 0
    const d = (b - a) / count
    for (let i = 0; i < count; i++) {
      result += cotesIntegral(a + i * d, a + (i + 1) * d, f)
    }
    return result
  }
  const h = (b - a) / 4
  return (b - a) * (7 * f(a) + 32 * f(a + h) + 12 * f(a + 2 * h) + 32 * f(a + 3 * h) + 7 * f(b)) / 90
}

export function rombergIntegral(a: number, b: number, f: (t: number) => number, delta = 1e-2): number {
  let p: number | undefined
  for (let count = 1; ; count *= 2) {
    const c = cotesIntegral(a, b, f, count)
    if (p && Math.abs(p - c) < delta) {
      return c
    }
    p = c
  }
}
