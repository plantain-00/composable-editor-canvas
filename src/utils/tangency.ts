import { calculateEquation2, calculateEquation4 } from "./equation-calculater"
import { isZero, lessThan, delta2, isValidPercent, getTwoNumberCenter, largerThan } from "./math"
import { Position } from "./position"
import { getTwoPointCenter } from "./position"
import { getTwoPointsDistance } from "./position"
import { getTwoPointsRadian } from "./radian"
import { normalizeRadian } from "./angle"
import { GeneralFormLine } from "./line"
import { getGeneralFormLineRadian } from "./line"
import { getParallelLinesByDistance } from "./line"
import { pointAndDirectionToGeneralFormLine, generalFormLineToTwoPointLine } from "./line"
import { getCirclePointAtRadian } from "./circle"
import { EllipseArc } from "./ellipse"
import { Circle, Arc } from "./circle"
import { Ellipse } from "./ellipse"
import { getGeneralFormLineCircleIntersectionPoints, getTwoCircleIntersectionPoints, getTwoGeneralFormLinesIntersectionPoint } from "./intersection"
import { QuadraticCurve } from "./bezier"
import { BezierCurve } from "./bezier"
import { getPerpendicularDistance } from "./perpendicular"
import { angleToRadian } from "./radian"

export function getCirclesTangentTo2Lines(line1: GeneralFormLine, line2: GeneralFormLine, radius: number) {
  const result: Position[] = []
  const lines1 = getParallelLinesByDistance(line1, radius)
  const lines2 = getParallelLinesByDistance(line2, radius)
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

export function getCirclesTangentToLineAndCircle(line: GeneralFormLine, circle: Circle, radius: number) {
  const result: Position[] = []
  const lines = getParallelLinesByDistance(line, radius)
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

export function getLinesTangentTo2Circles(circle1: Circle, circle2: Circle) {
  const result: [Position, Position][] = []
  const d1 = circle2.r - circle1.r
  const d3 = getTwoPointsDistance(circle1, circle2)
  if (lessThan(Math.abs(d1), d3)) {
    const radian = getTwoPointsRadian(circle2, circle1)
    const a1 = Math.asin(d1 / d3) + Math.PI / 2
    const a2 = radian - a1
    const a3 = radian + a1
    result.push(
      [getCirclePointAtRadian(circle1, a2), getCirclePointAtRadian(circle2, a2)],
      [getCirclePointAtRadian(circle1, a3), getCirclePointAtRadian(circle2, a3)],
    )
    const d2 = circle1.r + circle2.r
    if (lessThan(d2, d3)) {
      const a4 = Math.asin(d2 / d3)
      result.push(
        [getCirclePointAtRadian(circle1, radian + a4 - Math.PI / 2), getCirclePointAtRadian(circle2, radian + a4 + Math.PI / 2)],
        [getCirclePointAtRadian(circle1, radian - a4 + Math.PI / 2), getCirclePointAtRadian(circle2, radian - a4 - Math.PI / 2)],
      )
    }
  }
  return result
}

export function getTwoLinesCenterLines(line1: GeneralFormLine, line2: GeneralFormLine): GeneralFormLine[] {
  const radian1 = getGeneralFormLineRadian(line1)
  const radian2 = getGeneralFormLineRadian(line2)
  const p = getTwoGeneralFormLinesIntersectionPoint(line1, line2)
  if (!p) {
    const p1 = generalFormLineToTwoPointLine(line1)[0]
    const p2 = generalFormLineToTwoPointLine(line2)[0]
    return [pointAndDirectionToGeneralFormLine(getTwoPointCenter(p1, p2), radian1)]
  }
  const radian = getTwoNumberCenter(radian1, radian2)
  return [radian, radian + Math.PI / 2].map(r => pointAndDirectionToGeneralFormLine(p, r))
}

export function getCirclesTangentTo3Lines(line1: GeneralFormLine, line2: GeneralFormLine, line3: GeneralFormLine): Circle[] {
  const result: Circle[] = []
  const lines1 = getTwoLinesCenterLines(line1, line2)
  const lines2 = getTwoLinesCenterLines(line1, line3)
  for (const a of lines1) {
    for (const b of lines2) {
      const p = getTwoGeneralFormLinesIntersectionPoint(a, b)
      if (p) {
        result.push({
          ...p,
          r: getPerpendicularDistance(p, line1),
        })
      }
    }
  }
  return result
}

export function getCirclesTangentToLineLineCircle(line1: GeneralFormLine, line2: GeneralFormLine, { x: x1, y: y1, r }: Circle): Circle[] {
  const result: Circle[] = []
  const lines = getTwoLinesCenterLines(line1, line2)
  const { a: a1, b: b1, c: c1 } = line1
  const d = a1 ** 2 + b1 ** 2, d2 = Math.sqrt(d)
  // perpendicular distance: d1 = abs(a1 x + b1 y + c1)/d
  // ^2: d1 d1 = (a1/d2 x + b1/d2 y + c1/d2)^2
  const a3 = a1 / d2, b3 = b1 / d2, c3 = c1 / d2
  // d1 d1 = (a3 x + b3 y + c3)^2
  // let u = x - x1, v = y - y1
  // replace x with u + x1, y with v + y1: d1 d1 = (a3(u + x1) + b3(v + y1) + c3)^2
  // d1 d1 = (a3 u + b3 v + a3 x1 + b3 y1 + c3)^2
  const d3 = a3 * x1 + b3 * y1 + c3
  // d1 d1 = (a3 u + b3 v + d3)^2
  // d1 d2 = a3 a3 u u + 2 a3 b3 u v + 2 a3 d3 u + b3 b3 v v + 2 b3 d3 v + d3 d3
  const e1 = a3 * a3, e2 = b3 * b3, e3 = 2 * a3 * b3, e4 = 2 * a3 * d3, e5 = 2 * b3 * d3, e6 = d3 * d3
  // d1 d2 = e1 u u + e3 u v + e4 u + e2 v v + e5 v + e6
  const f1 = 1 - e1, f2 = 1 - e2
  // (x - x1)^2 + (y - y1)^2 = (d1 + r)^2
  // replace x with u + x1, y with v + y1: u^2 + v^2 = r r + 2 r d1 + d1 d1
  // replace d1 d1: u^2 + v^2 = r r + 2 r d1 + (e1 u u + e3 u v + e4 u + e2 v v + e5 v + e6)
  // u^2 + v^2 - r r - (e1 u u + e3 u v + e4 u + e2 v v + e5 v + e6) = 2 r d1
  // (1 - e1) u u - e3 u v - e4 u + (1 - e2) v v - e5 v - r r - e6 = 2 r d1
  // f1 u u - e3 u v - e4 u + f2 v v - e5 v - f3 = 2 r d1
  //^2: (f1 u u - e3 u v - e4 u + f2 v v - e5 v - f3)^2 = 4 r r d1 d1
  // replace d1 d1, r r: (f1 u u - e3 u v - e4 u + f2 v v - e5 v - f3)^2 - 4 f4 (e1 u u + e3 u v + e4 u + e2 v v + e5 v + e6) = 0
  const f4 = r * r, f3 = f4 + e6
  for (const { a: a2, b: b2, c: c2 } of lines) {
    // a2 x + b2 y + c2 = 0
    // replace x with u + x1, y with v + y1: a2(u + x1) + b2(v + y1) + c2 = 0
    // a2 u + b2 v + a2 x1 + b2 y1 + c2 = 0
    const f5 = a2 * x1 + b2 * y1 + c2
    // a2 u + b2 v + f5 = 0
    if (isZero(b2)) {
      const u = -f5 / a2
      // group by v: (f2 v v + (-e3 u + -e5) v + f1 u u + -e4 u + -f3)^2 - 4 e2 f4 v v + (-4 e3 f4 u + -4 e5 f4) v + -4 e1 f4 u u + -4 e4 f4 u + -4 e6 f4 = 0
      const g1 = -e3 * u + -e5, g2 = f1 * u * u + -e4 * u + -f3, g3 = 4 * e2 * f4, g4 = -4 * e3 * f4 * u + -4 * e5 * f4, g5 = -4 * e1 * f4 * u * u + -4 * e4 * f4 * u + -4 * e6 * f4
      // (f2 v v + g1 v + g2)^2 - g3 v v + g4 v + g5 = 0
      // expand, group by v: f2 f2 v v v v + 2 f2 g1 v v v + (g1 g1 + 2 f2 g2 + -g3) v v + (2 g1 g2 + g4) v + g2 g2 + g5 = 0
      const vs = calculateEquation4(f2 * f2, 2 * f2 * g1, g1 * g1 + 2 * f2 * g2 + -g3, 2 * g1 * g2 + g4, g2 * g2 + g5)
      result.push(...vs.map(v => ({
        x: u + x1,
        y: v + y1,
        r: Math.abs(a3 * u + b3 * v + d3),
      })))
    } else {
      // v = -a2/b2 u - f5/b2
      const g1 = -a2 / b2, g2 = f5 / b2
      // v = g1 u - g2
      // replace v: (f1 u u - e3 u (g1 u - g2) - e4 u + f2 (g1 u - g2) (g1 u - g2) - e5 (g1 u - g2) - f3)^2 - 4 f4 (e1 u u + e3 u (g1 u - g2) + e4 u + e2 (g1 u - g2) (g1 u - g2) + e5 (g1 u - g2) + e6) = 0
      // ((-e3 g1 + f2 g1 g1 + f1) u u + (e3 g2 + -e4 + -2 f2 g1 g2 + -e5 g1) u + f2 g2 g2 + e5 g2 + -f3)^2 + (-4 e2 f4 g1 g1 + -4 e3 f4 g1 + -4 e1 f4) u u + (8 e2 f4 g1 g2 + -4 e5 f4 g1 + 4 e3 f4 g2 + -4 e4 f4) u + -4 e2 f4 g2 g2 + 4 e5 f4 g2 + -4 e6 f4 = 0
      const g3 = -e3 * g1 + f2 * g1 * g1 + f1, g4 = e3 * g2 + -e4 + -2 * f2 * g1 * g2 + -e5 * g1, g5 = f2 * g2 * g2 + e5 * g2 + -f3
      const g6 = -4 * e2 * f4 * g1 * g1 + -4 * e3 * f4 * g1 + -4 * e1 * f4, g7 = 8 * e2 * f4 * g1 * g2 + -4 * e5 * f4 * g1 + 4 * e3 * f4 * g2 + -4 * e4 * f4, g8 = -4 * e2 * f4 * g2 * g2 + 4 * e5 * f4 * g2 + -4 * e6 * f4
      // (g3 u u + g4 u + g5)^2 + g6 u u + g7 u + g8 = 0
      // expand, group by u: g3 g3 u u u u + 2 g3 g4 u u u + (g4 g4 + 2 g3 g5 + g6) u u + (2 g4 g5 + g7) u + g5 g5 + g8 = 0
      const us = calculateEquation4(g3 * g3, 2 * g3 * g4, g4 * g4 + 2 * g3 * g5 + g6, 2 * g4 * g5 + g7, g5 * g5 + g8)
      result.push(...us.map(u => {
        const v = g1 * u - g2
        return {
          x: u + x1,
          y: v + y1,
          r: Math.abs(a3 * u + b3 * v + d3),
        }
      }))
    }
  }
  return result
}

export function getCirclesTangentToLineCircleCircle({ a: a1, b: b1, c: c1 }: GeneralFormLine, { x: x2, y: y2, r: r02 }: Circle, { x: x3, y: y3, r: r03 }: Circle): Circle[] {
  const result: Circle[] = []
  const d = a1 ** 2 + b1 ** 2, d2 = Math.sqrt(d)
  // perpendicular distance: r = abs(a1 x + b1 y + c1)/d = abs(a1/d2 x + b1/d2 y + c1/d2)
  const a3 = a1 / d2, b3 = b1 / d2, c3 = c1 / d2
  // let r1 = 1,-1, r2 = r02,-r02, r3 = r03,-r03
  // r1(a3 x + b3 y + c3) = r
  // (x - x2)^2 + (y - y2)^2 = (r + r2)^2
  // (x - x3)^2 + (y - y3)^2 = (r + r3)^2
  // let u = x - x2, v = y - y2, w = r + r2
  // r1(a3 u + b3 v + a3 x2 + b3 y2 + c3) = w - r2
  const e1 = x2 - x3, e2 = y2 - y3, e4 = a3 * x2 + b3 * y2 + c3
  // r1(a3 u + b3 v + e4) + r2 = w
  // F2: u^2 + v^2 - w^2 = 0
  for (const r1 of [1, -1]) {
    const f1 = r1 * a3, f2 = r1 * b3, g3 = 1 - f1 * f1, g4 = 1 - f2 * f2
    for (const r2 of [r02, -r02]) {
      const f3 = r1 * e4 + r2
      // w = f1 u + f2 v + f3
      // F2 replace w: (1 - f1 f1) u u - 2 f1 f2 v u - 2 f1 f3 u + (1 - f2 f2) v v + -2 f2 f3 v + -f3 f3 = 0
      // F1: g3 u u - 2 f1 f2 v u - 2 f1 f3 u + g4 v v + -2 f2 f3 v + -f3 f3 = 0
      for (const r3 of [r03, -r03]) {
        const e3 = r2 - r3
        // (u + e1)^2 + (v + e2)^2 - (w - e3)^2 = 0
        // -F2: e1 e1 + e2 e2 + -e3 e3 + 2 e1 u + 2 e2 v + 2 e3 w = 0
        const e5 = (e1 * e1 + e2 * e2 - e3 * e3) / 2
        // e1 u + e2 v + e3 w + e5 = 0
        // replace w: (e3 f1 + e1) u + (e3 f2 + e2) v + e3 f3 + e5 = 0
        const f4 = e3 * f1 + e1, f5 = e3 * f2 + e2, f6 = e3 * f3 + e5
        // f4 u + f5 v + f6 = 0
        if (isZero(f5)) {
          const u = -f6 / f4
          // F1 group by v: g4 v v + (-2 f1 f2 u + -2 f2 f3) v + -2 f1 f3 u + -f3 f3 + g3 u u = 0
          const vs = calculateEquation2(g4, -2 * f1 * f2 * u + -2 * f2 * f3, -2 * f1 * f3 * u + -1 * f3 * f3 + g3 * u * u)
          for (const v of vs) {
            const w = f1 * u + f2 * v + f3
            const r = w - r2
            if (largerThan(r, 0)) {
              result.push({
                x: u + x2,
                y: v + y2,
                r,
              })
            }
          }
          continue
        }
        // v = -f4/f5 u - f6/f5
        const g1 = -f4 / f5, g2 = - f6 / f5
        // v = g1 u + g2
        // F1 replace v: (-2 f1 f2 g1 + g1 g1 g4 + g3) u u + (-2 f2 f3 g1 + -2 f1 f2 g2 + 2 g1 g2 g4 + -2 f1 f3) u + -2 f2 f3 g2 + -f3 f3 + g2 g2 g4 = 0
        const us = calculateEquation2(
          -2 * f1 * f2 * g1 + g1 * g1 * g4 + g3,
          -2 * f2 * f3 * g1 + -2 * f1 * f2 * g2 + 2 * g1 * g2 * g4 + -2 * f1 * f3,
          -2 * f2 * f3 * g2 + -1 * f3 * f3 + g2 * g2 * g4,
        )
        for (const u of us) {
          const v = g1 * u + g2
          const w = f1 * u + f2 * v + f3
          const r = w - r2
          if (largerThan(r, 0)) {
            result.push({
              x: u + x2,
              y: v + y2,
              r,
            })
          }
        }
      }
    }
  }
  return result
}

export function getCirclesTangentTo3Circles({ x: x1, y: y1, r: r01 }: Circle, { x: x2, y: y2, r: r02 }: Circle, { x: x3, y: y3, r: r03 }: Circle): Circle[] {
  const result: Circle[] = []
  // let r1 = r01,-r01, r2 = r02,-r02, r3 = r03,-r03
  // (x - x1)^2 + (y - y1)^2 = (r + r1)^2
  // (x - x2)^2 + (y - y2)^2 = (r + r2)^2
  // (x - x3)^2 + (y - y3)^2 = (r + r3)^2
  // let u = x - x1, v = y - y1, w = r + r1
  const a1 = x1 - x2, a2 = x1 - x3, a3 = y1 - y2, a4 = y1 - y3
  for (const r1 of [r01, -r01]) {
    for (const r2 of [r02, -r02]) {
      for (const r3 of [r03, -r03]) {
        const a5 = r2 - r1, a6 = r3 - r1
        // F1: u^2 + v^2 - w^2 = 0
        // F2: (u + a1)^2 + (v + a3)^2 - (w + a5)^2 = 0
        // F3: (u + a2)^2 + (v + a4)^2 - (w + a6)^2 = 0
        // F2-F1: 2 a1 u + 2 a3 v + -2 a5 w + a1 a1 + a3 a3 + -a5 a5 = 0
        // F3-F1: 2 a2 u + 2 a4 v + -2 a6 w + a2 a2 + a4 a4 + -a6 a6 = 0
        const b1 = (a1 * a1 + a3 * a3 + -a5 * a5) / 2, b2 = (a2 * a2 + a4 * a4 + -a6 * a6) / 2
        // F4: a1 u + a3 v - a5 w + b1 = 0
        // F5: a2 u + a4 v - a6 w + b2 = 0
        if (isZero(a3)) {
          if (isZero(a4)) {
            // F4*a6-F5*a5: (-a2 a5 + a1 a6) u + a6 b1 + -a5 b2 = 0
            const u = (a6 * b1 - a5 * b2) / (a2 * a5 - a1 * a6)
            const w = isZero(a5) ? (a2 * u + b2) / a6 : (a1 * u + b1) / a5
            const r = w - r1
            if (largerThan(r, 0)) {
              const d1 = w * w - u * u
              if (isZero(d1)) {
                result.push({ x: u + x1, y: y1, r })
              } else if (largerThan(d1, 0)) {
                const v = Math.sqrt(d1)
                result.push({ x: u + x1, y: v + y1, r }, { x: u + x1, y: -v + y1, r })
              }
            }
            continue
          }
          // a5 w = a1 u + b1
          // a4 v = a6 w - a2 u - b2
          // ^2: a4 a4 v v = (a6 w - a2 u - b2)^2
          // F1*a4 a4, replace a4 a4 v v: (a2 a2 + a4 a4) u u - 2 a2 a6 w u + 2 a2 b2 u + (a6 a6 - a4 a4) w w  + -2 a6 b2 w + b2 b2 = 0
          const c1 = a2 * a2 + a4 * a4, c2 = a6 * a6 - a4 * a4
          // c1 u u - 2 a2 a6 w u + 2 a2 b2 u + c2 w w  + -2 a6 b2 w + b2 b2 = 0
          // *a5 a5, replace a5 w: (-2 a1 a2 a5 a6 + a5 a5 c1 + a1 a1 c2) u u + (-2 a2 a5 a6 b1 + 2 a2 a5 a5 b2 + -2 a1 a5 a6 b2 + 2 a1 b1 c2) u + -2 a5 a6 b1 b2 + a5 a5 b2 b2 + b1 b1 c2 = 0
          const us = calculateEquation2(
            -2 * a1 * a2 * a5 * a6 + a5 * a5 * c1 + a1 * a1 * c2,
            -2 * a2 * a5 * a6 * b1 + 2 * a2 * a5 * a5 * b2 + -2 * a1 * a5 * a6 * b2 + 2 * a1 * b1 * c2,
            -2 * a5 * a6 * b1 * b2 + a5 * a5 * b2 * b2 + b1 * b1 * c2,
          )
          for (const u of us) {
            const w = isZero(a5) ? (a2 * u + b2) / a6 : (a1 * u + b1) / a5
            const r = w - r1
            if (largerThan(r, 0)) {
              const v = (a6 * w - a2 * u - b2) / a4
              result.push({
                x: u + x1,
                y: v + y1,
                r,
              })
            }
          }
          continue
        }
        // F4*a4-F5*a3: (-a2 a3 + a1 a4) u + (-a4 a5 + a3 a6) w + a4 b1 + -a3 b2 = 0
        const b3 = -a2 * a3 + a1 * a4, b4 = -a4 * a5 + a3 * a6, b5 = a4 * b1 + -a3 * b2
        // b3 u + b4 w + b5 = 0
        // b4 w = -b3 u - b5
        // a3 v = a5 w - a1 u - b1
        // ^2: a3 a3 v v = (a5 w - a1 u - b1)^2
        // F1*a3 a3, replace a3 a3 v v: (a1 a1 + a3 a3) u u + -2 a1 a5 w u + 2 a1 b1 u + (-a3 a3 + a5 a5) w w + -2 a5 b1 w + b1 b1 = 0
        const c1 = a1 * a1 + a3 * a3, c2 = -a3 * a3 + a5 * a5
        // c1 u u - 2 a1 a5 w u + 2 a1 b1 u + c2 w w + -2 a5 b1 w + b1 b1 = 0
        if (isZero(b4)) {
          const u = -b5 / b3
          // group by w: c2 w w + (-2 a1 a5 u + -2 a5 b1) w + 2 a1 b1 u + b1 b1 + c1 u u = 0
          const ws = calculateEquation2(c2, -2 * a1 * a5 * u + -2 * a5 * b1, 2 * a1 * b1 * u + b1 * b1 + c1 * u * u)
          for (const w of ws) {
            const r = w - r1
            if (largerThan(r, 0)) {
              const v = (a5 * w - a1 * u - b1) / a3
              result.push({
                x: u + x1,
                y: v + y1,
                r,
              })
            }
          }
          continue
        }
        // *b4 b4, replace b4 w: (2 a1 a5 b3 b4 + b4 b4 c1 + b3 b3 c2) u u + (2 a5 b1 b3 b4 + 2 a1 b1 b4 b4 + 2 a1 a5 b4 b5 + 2 b3 b5 c2) u + b1 b1 b4 b4 + 2 a5 b1 b4 b5 + b5 b5 c2 = 0
        const us = calculateEquation2(
          2 * a1 * a5 * b3 * b4 + b4 * b4 * c1 + b3 * b3 * c2,
          2 * a5 * b1 * b3 * b4 + 2 * a1 * b1 * b4 * b4 + 2 * a1 * a5 * b4 * b5 + 2 * b3 * b5 * c2,
          b1 * b1 * b4 * b4 + 2 * a5 * b1 * b4 * b5 + b5 * b5 * c2,
        )
        for (const u of us) {
          const w = (-b3 * u - b5) / b4
          const r = w - r1
          if (largerThan(r, 0)) {
            const v = (a5 * w - a1 * u - b1) / a3
            result.push({
              x: u + x1,
              y: v + y1,
              r,
            })
          }
        }
      }
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
  if (lessThan(f, 0)) {
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

export function getTangencyPointToEllipse({ x: x1, y: y1 }: Position, { cx, cy, rx, ry, angle }: Ellipse, delta = delta2): Position[] {
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

export function getTangencyPointToQuadraticCurve({ x: a0, y: b0 }: Position, { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve, delta = delta2) {
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
  return us.filter(u => isValidPercent(u)).map(u => ({
    x: c2 * u * u + 2 * c1 * u + a1,
    y: c4 * u * u + 2 * c3 * u + b1,
  }))
}

export function getTangencyPointToBezierCurve({ x: a0, y: b0 }: Position, { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve, delta = delta2) {
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
  return ts.filter(t => isValidPercent(t)).map(t => ({
    x: c1 * t * t * t + c2 * t * t + c3 * t + a1,
    y: c4 * t * t * t + c5 * t * t + c6 * t + b1,
  }))
}

export function getCircleTangentRadianAtRadian(circle: Circle, radian: number) {
  return normalizeRadian(radian + Math.PI / 2)
}

export function getArcTangentRadianAtRadian(arc: Arc, radian: number) {
  return normalizeRadian(radian + Math.PI / 2 * (arc.counterclockwise ? -1 : 1))
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

export function getEllipseArcTangentRadianAtRadian(arc: EllipseArc, radian: number) {
  return normalizeRadian(getEllipseTangentRadianAtRadian(arc, radian) + (arc.counterclockwise ? Math.PI : 0))
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
