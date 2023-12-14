import { calculateEquation2, calculateEquation4 } from "./equation-calculater"
import { Position, Circle, isZero, Ellipse, getParallelLinesByDistance, twoPointLineToGeneralFormLine, Arc } from "./geometry"
import { BezierCurve, QuadraticCurve, getGeneralFormLineCircleIntersectionPoints, getTwoCircleIntersectionPoints, getTwoGeneralFormLinesIntersectionPoint } from "./intersection"
import { angleToRadian } from "./radian"

export function getCirclesTangentTo2Lines(p1Start: Position, p1End: Position, p2Start: Position, p2End: Position, radius: number) {
  const result: Position[] = []
  const lines1 = getParallelLinesByDistance(twoPointLineToGeneralFormLine(p1Start, p1End), radius)
  const lines2 = getParallelLinesByDistance(twoPointLineToGeneralFormLine(p2Start, p2End), radius)
  for (const line1 of lines1) {
    for (const line2 of lines2) {
      const point = getTwoGeneralFormLinesIntersectionPoint(line1, line2)
      if (point) {
        result.push(point)
      }
    }
  }
  return result
}

export function getCirclesTangentToLineAndCircle(p1Start: Position, p1End: Position, circle: Circle, radius: number) {
  const result: Position[] = []
  const lines = getParallelLinesByDistance(twoPointLineToGeneralFormLine(p1Start, p1End), radius)
  const circles = [circle.r + radius, Math.abs(circle.r - radius)]
  for (const line of lines) {
    for (const r of circles) {
      result.push(...getGeneralFormLineCircleIntersectionPoints(line, { ...circle, r }))
    }
  }
  return result
}

export function getCirclesTangentTo2Circles(circle1: Circle, circle2: Circle, radius: number) {
  const result: Position[] = []
  const circles1 = [circle1.r + radius, Math.abs(circle1.r - radius)]
  const circles2 = [circle2.r + radius, Math.abs(circle2.r - radius)]
  for (const r1 of circles1) {
    for (const r2 of circles2) {
      result.push(...getTwoCircleIntersectionPoints({ ...circle1, r: r1 }, { ...circle2, r: r2 }))
    }
  }
  return result
}

export function getTangencyPointToCircle({ x: x1, y: y1 }: Position, { x: x2, y: y2, r }: Circle): Position[] {
  const a3 = r ** 2
  // (x - x2)^2 + (y - y2)^2 = a3
  // (x - x1)/(y - y1) = -(y - x2)/(x - x2)
  // let u = x - x2, v = y - y2
  // F1: u^2 + v^2 - a3 = 0
  // (u + x2 - x1)/(v + y2 - y1) = -v/u
  const a1 = x2 - x1, a2 = y2 - y1
  // (u + a1)/(v + a2) + v/u = 0
  // u(u + a1) + v(v + a2) = 0
  // u^2 + a1 u + v^2 + a2 v = 0
  // -F1: a1 u + a2 v + a3 = 0
  // group v, F2: v = (-a3 - a1 u)/a2
  // F1 replace v, *a2 a2, group u: (a2 a2 + a1 a1) u u + 2 a1 a3 u + a3 a3 + -a2 a2 a3 = 0
  const a = a1 ** 2 + a2 ** 2
  // b = 2 a3 a1
  // c = a3 a3 - a2 a2 a3
  // (bb-4ac)/4/a2/a2/a3 = a1 a1 + a2 a2 + -a3 = a - a3
  const f = a - a3
  if (f < 0 && !isZero(f)) {
    return []
  }
  // -b/2/a = -2 a3 a1/2/a = -a1 a3/a
  const d = -a1 * a3 / a
  // F2 replace u with d, *a a2: v = (a1 a1 a3 + -a a3)/a/a2
  // v = (a1 a13 - a)a3/a/a2
  // v = a3(-a2 a2)/a/a2
  // v = -a2 a3/a
  const e = -a2 * a3 / a
  const d1 = x2 + d
  const d2 = y2 + e
  if (isZero(f)) {
    return [
      {
        x: d1,
        y: d2,
      }
    ]
  }
  const g = r * Math.sqrt(f) / a
  // sqrt(bb-4ac)/2/a = sqrt(4 a2 a2 a3 f)/2/a = a2 g
  const h = a2 * g
  const i = a1 * g
  // F2 replace u with d + h, replace d, replace h, *a, replace a: v, /a2 = (-a a1 g + -a2 a3)/a
  // v = -a2 a3/a - a1 g
  // v = e - i
  return [
    {
      x: d1 + h,
      y: d2 - i,
    },
    {
      x: d1 - h,
      y: d2 + i,
    }
  ]
}

export function getTangencyPointToEllipse({ x: x1, y: y1 }: Position, { cx, cy, rx, ry, angle }: Ellipse, delta = 1e-5): Position[] {
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  const h1 = cx - x1, h2 = cy - y1

  // (d2(x - cx) + d1(y - cy))^2/rx/rx + (-d1(x - cx) + d2(y - cy))^2/ry/ry = 1
  // let u = x - cx, v = y - cy
  const i1 = rx * rx, i2 = ry * ry
  // (d2 u + d1 v)^2/i1 + (-d1 u + d2 v)^2/i2 = 1
  // i2(d2 u + d1 v)^2 + i1(-d1 u + d2 v)^2 - i1 i2 = 0
  // group v, F2: (d2 d2 i1 + d1 d1 i2) v v + (-2 d1 d2 i1 u + 2 d1 d2 i2 u) v + d1 d1 i1 u u + d2 d2 i2 u u + -i1 i2 = 0
  const b1 = d2 * d2 * i1 + d1 * d1 * i2
  const b2 = (-2 * d1 * d2 * i1 + 2 * d1 * d2 * i2) / b1
  const b3 = (d1 * d1 * i1 + d2 * d2 * i2) / b1
  const b5 = -i1 * i2 / b1
  // F1: v v + b2 u v + b3 u u + b5 = 0

  // (bb - 4ac)/4/i1/i2/e1/e1 = a - f1 f1 = 0
  // replace a, f1, e1 with u + h1, e2 with v + h2, -F2, group v, u:  -h1 h1 v v + (-2 d1 d2 h1 i1 + 2 d2 d2 h2 i1 + 2 d1 d2 h1 i2 + 2 d1 d1 h2 i2 + 2 h1 h2 u) v + d1 d1 h1 h1 i1 + -2 d1 d2 h1 h2 i1 + d2 d2 h2 h2 i1 + d2 d2 h1 h1 i2 + 2 d1 d2 h1 h2 i2 + d1 d1 h2 h2 i2 + 2 d1 d1 h1 i1 u + -2 d1 d2 h2 i1 u + 2 d2 d2 h1 i2 u + 2 d1 d2 h2 i2 u + -h2 h2 u u + i1 i2 = 0
  const a1 = -h1 * h1
  let a2 = 2 * h1 * h2
  let a3 = -2 * d1 * d2 * h1 * i1 + 2 * d2 * d2 * h2 * i1 + 2 * d1 * d2 * h1 * i2 + 2 * d1 * d1 * h2 * i2
  let a4 = -h2 * h2
  let a5 = 2 * d1 * d1 * h1 * i1 + -2 * d1 * d2 * h2 * i1 + 2 * d2 * d2 * h1 * i2 + 2 * d1 * d2 * h2 * i2
  let a6 = d1 * d1 * h1 * h1 * i1 + -2 * d1 * d2 * h1 * h2 * i1 + d2 * d2 * h2 * h2 * i1 + d2 * d2 * h1 * h1 * i2 + 2 * d1 * d2 * h1 * h2 * i2 + d1 * d1 * h2 * h2 * i2 + i1 * i2
  let a: number, b: number, c: number, d: number, e: number
  let getV: (u: number) => number
  if (!isZero(h1, delta)) {
    a2 /= a1
    a3 /= a1
    a4 /= a1
    a5 /= a1
    a6 /= a1
    // v v + (a2 u + a3) v + a4 u u + a5 u + a6 = 0
    // -F1, group v: (a2 u + a3 + -b2 u) v + a4 u u + -b3 u u + a5 u + a6 + -b5 = 0
    const c1 = a2 - b2, c2 = a4 - b3, c3 = a6 - b5
    // (c1 u + a3) v + c2 u u + a5 u + c3 = 0
    // let w = c1 u + a3
    // v = -(c2 u u + a5 u + c3)/w
    // F1 replace v, *w w, replace w, group u: (b3 c1 c1 + c2 c2 + -b2 c1 c2) u u u u + (-a5 b2 c1 + 2 a3 b3 c1 + 2 a5 c2 + -a3 b2 c2) u u u + (-a3 a5 b2 + a3 a3 b3 + b5 c1 c1 + -b2 c1 c3 + a5 a5 + 2 c2 c3) u u + (2 a3 b5 c1 + -a3 b2 c3 + 2 a5 c3) u + a3 a3 b5 + c3 c3 = 0
    a = b3 * c1 * c1 + c2 * c2 + -b2 * c1 * c2
    b = -a5 * b2 * c1 + 2 * a3 * b3 * c1 + 2 * a5 * c2 + -a3 * b2 * c2
    c = -a3 * a5 * b2 + a3 * a3 * b3 + b5 * c1 * c1 + -b2 * c1 * c3 + a5 * a5 + 2 * c2 * c3
    d = 2 * a3 * b5 * c1 + -a3 * b2 * c3 + 2 * a5 * c3
    e = a3 * a3 * b5 + c3 * c3
    getV = u => {
      const w = c1 * u + a3
      if (isZero(w, delta)) {
        // v v + b2 u v + b3 u u + b5 = 0
        return calculateEquation2(1, b2 * u, b3 * u * u + b5, delta)[0]
      }
      return -(c2 * u * u + a5 * u + c3) / w
    }
  } else {
    // (a2 u + a3) v + a4 u u + a5 u + a6 = 0
    // let w = a2 u + a3
    // v = -(a4 u u + a5 u + a6)/w
    // F1 replace v, *w w, replace w, group u: (a4 a4 + -a2 a4 b2 + a2 a2 b3) u u u u + (2 a4 a5 + -a3 a4 b2 + -a2 a5 b2 + 2 a2 a3 b3) u u u + (a5 a5 + 2 a4 a6 + -a3 a5 b2 + -a2 a6 b2 + a3 a3 b3 + a2 a2 b5) u u + (2 a5 a6 + -a3 a6 b2 + 2 a2 a3 b5) u + a6 a6 + a3 a3 b5
    a = a4 * a4 + -a2 * a4 * b2 + a2 * a2 * b3
    b = 2 * a4 * a5 + -a3 * a4 * b2 + -a2 * a5 * b2 + 2 * a2 * a3 * b3
    c = a5 * a5 + 2 * a4 * a6 + -a3 * a5 * b2 + -a2 * a6 * b2 + a3 * a3 * b3 + a2 * a2 * b5
    d = 2 * a5 * a6 + -a3 * a6 * b2 + 2 * a2 * a3 * b5
    e = a6 * a6 + a3 * a3 * b5
    getV = u => {
      const w = a2 * u + a3
      if (isZero(w, delta)) {
        // v v + b2 u v + b3 u u + b5 = 0
        return calculateEquation2(1, b2 * u, b3 * u * u + b5, delta)[0]
      }
      return -(a4 * u * u + a5 * u + a6) / w
    }
  }
  const us = calculateEquation4(a, b, c, d, e, delta)
  return us.map(u => {
    const v = getV(u)
    return {
      x: u + cx,
      y: v + cy,
    }
  })
}

export function getTangencyPointToQuadraticCurve({ x: a0, y: b0 }: Position, { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve, delta = 1e-5) {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 u u + 2 c1 u + a1
  // y = c4 u u + 2 c3 u + b1

  // x' = 2 c2 u + 2 c1
  // y' = 2 c4 u + 2 c3
  // k1 = dy/dx = dy/du/(dx/du) = (2 c4 u + 2 c3)/(2 c2 u + 2 c1) = (c4 u + c3)/(c2 u + c1)
  const a4 = a1 - a0, b4 = b1 - b0
  // k2 = (y - b0)/(x - a0) = (c4 u u + 2 c3 u + b4)/(c2 u u + 2 c1 u + a4)
  // k1 = k2
  // (c4 u + c3)/(c2 u + c1) = (c4 u u + 2 c3 u + b4)/(c2 u u + 2 c1 u + a4)
  // (c4 u + c3)(c2 u u + 2 c1 u + a4) - (c2 u + c1)(c4 u u + 2 c3 u + b4) = 0
  // group u: (-c2 c3 + c1 c4) u u + (-b4 c2 + a4 c4) u + -b4 c1 + a4 c3 = 0
  const us = calculateEquation2(
    c1 * c4 - c2 * c3,
    a4 * c4 - b4 * c2,
    a4 * c3 - b4 * c1,
    delta,
  )
  return us.filter(u => u >= 0 && u <= 1).map(u => ({
    x: c2 * u * u + 2 * c1 * u + a1,
    y: c4 * u * u + 2 * c3 * u + b1,
  }))
}

export function getTangencyPointToBezierCurve({ x: a0, y: b0 }: Position, { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve, delta = 1e-5) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = c4 t t t + c5 t t + c6 t + b1

  // x' = 3 c1 t^2 + 2 c2 t + c3
  // y' = 3 c4 t^2 + 2 c5 t + c6
  // k1 = dy/dx = dy/dt/(dx/dt) = (3 c4 t^2 + 2 c5 t + c6)/(3 c1 t^2 + 2 c2 t + c3)
  const d1 = b1 - b0, d2 = a1 - a0
  // k2 = (y - b0)/(x - a0) = (c4 t t t + c5 t t + c6 t + d1)/(c1 t t t + c2 t t + c3 t + d2)
  // k1 = k2
  // (3 c4 t^2 + 2 c5 t + c6)(c1 t t t + c2 t t + c3 t + d2) - (c4 t t t + c5 t t + c6 t + d1)(3 c1 t^2 + 2 c2 t + c3) = 0
  // group t: (c2 c4 + -c1 c5) t t t t + (2 c3 c4 + -2 c1 c6) t t t + (c3 c5 + -c2 c6 + -3 c1 d1 + 3 c4 d2) t t + (-2 c2 d1 + 2 c5 d2) t + -c3 d1 + c6 d2 = 0
  const ts = calculateEquation4(
    c2 * c4 - c1 * c5,
    2 * (c3 * c4 + -c1 * c6),
    c3 * c5 + -c2 * c6 + -3 * c1 * d1 + 3 * c4 * d2,
    2 * (c5 * d2 - c2 * d1),
    c6 * d2 - c3 * d1,
    delta,
  )
  return ts.filter(t => t >= 0 && t <= 1).map(t => ({
    x: c1 * t * t * t + c2 * t * t + c3 * t + a1,
    y: c4 * t * t * t + c5 * t * t + c6 * t + b1,
  }))
}

export function getCircleTangentRadianAtRadian(circle: Circle, radian: number) {
  return radian + Math.PI / 2
}

export function getArcTangentRadianAtRadian(arc: Arc, radian: number) {
  return radian + Math.PI / 2 * (arc.counterclockwise ? -1 : 1)
}

export function getEllipseTangentRadianAtRadian(ellipse: Ellipse, t: number) {
  const { rx, ry, angle } = ellipse
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  // x = d2 rx cos(t) - d1 ry sin(t) + cx
  // y = d1 rx cos(t) + d2 ry sin(t) + cy
  // x' = -cos(t) d1 ry - d2 rx sin(t)
  // y' = cos(t) d2 ry - d1 rx sin(t)
  const d3 = Math.cos(t) * ry, d4 = Math.sin(t) * rx
  return Math.atan2(d3 * d2 - d1 * d4, -d3 * d1 - d2 * d4)
}

export function getQuadraticCurveTangentRadianAtPercent({ from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve, u: number) {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 u u + 2 c1 u + a1
  // y = c4 u u + 2 c3 u + b1
  // x' = 2 c2 u + 2 c1
  // y' = 2 c4 u + 2 c3
  return Math.atan2(c4 * u + c3, c2 * u + c1)
}

export function getBezierCurveTangentRadianAtPercent({ from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve, t: number) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = c4 t t t + c5 t t + c6 t + b1
  // x' = 3 c1 t^2 + 2 c2 t + c3
  // y' = 3 c4 t^2 + 2 c5 t + c6
  return Math.atan2(3 * c4 * t ** 2 + 2 * c5 * t + c6, 3 * c1 * t ** 2 + 2 * c2 * t + c3)
}
