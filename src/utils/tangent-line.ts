import { getQuadraticCurvePointAtPercent, QuadraticCurve } from "./bezier";
import { calculateEquation4 } from "./equation-calculater";
import { GeometryLine } from "./geometry-line";
import { isValidPercent } from "./math";
import { Position } from "./position";
import { getLinesTangentTo2Circles } from "./tangency";
import { Tuple2 } from "./types";

export function getLinesTangentTo2GeometryLines(line1: GeometryLine, line2: GeometryLine): Tuple2<Position>[] {
  if (Array.isArray(line1)) {
    return []
  }
  if (Array.isArray(line2)) return []
  if (line1.type === 'arc') {
    if (line2.type === 'arc') {
      return getLinesTangentTo2Circles(line1.curve, line2.curve)
    }
    return []
  }
  if (line2.type === 'arc') return getLinesTangentTo2GeometryLines(line2, line1)
  if (line1.type === 'quadratic curve') {
    if (line2.type === 'quadratic curve') {
      return getLinesTangentTo2QuadraticCurves(line1.curve, line2.curve)
    }
    return []
  }
  if (line2.type === 'quadratic curve') return getLinesTangentTo2GeometryLines(line2, line1)
  return []
}

export function getLinesTangentTo2QuadraticCurves(curve1: QuadraticCurve, curve2: QuadraticCurve): Tuple2<Position>[] {
  const { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } } = curve1
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x1 = c2 u u + 2 c1 u + a1
  // y1 = c4 u u + 2 c3 u + b1
  const { from: { x: a4, y: b4 }, cp: { x: a5, y: b5 }, to: { x: a6, y: b6 } } = curve2
  const d1 = a5 - a4, d2 = a6 - a5 - d1, d3 = b5 - b4, d4 = b6 - b5 - d3
  // x2 = d2 v v + 2 d1 v + a4
  // y2 = d4 v v + 2 d3 v + b4
  // x1' = 2 c2 u + 2 c1
  // y1' = 2 c4 u + 2 c3
  // x2' = 2 d2 v + 2 d1
  // y2' = 2 d4 v + 2 d3

  // (y1 - y2)/(x1 - x2) = y1'/x1' = y2'/x2'
  // (c4 u + c3)/(c2 u + c1) = (d4 v + d3)/(d2 v + d1)
  // (c4 u + c3)(d2 v + d1) = (d4 v + d3)(c2 u + c1)
  // ((c4 d2 - c2 d4) v + c4 d1 - c2 d3) u + (c3 d2 - c1 d4) v + c3 d1 - c1 d3 = 0
  const h1 = c4 * d2 - c2 * d4, h2 = c4 * d1 - c2 * d3, h3 = c3 * d2 - c1 * d4, h4 = c3 * d1 - c1 * d3
  // (h1 v + h2) u + h3 v + h4 = 0
  // u = -(h3 v + h4)/(h1 v + h2)

  // (c4 u u + 2 c3 u + b1 - d4 v v - 2 d3 v - b4)/(c2 u u + 2 c1 u + a1 - d2 v v - 2 d1 v - a4) = (c4 u + c3)/(c2 u + c1)
  const e1 = a1 - a4, e2 = b1 - b4
  // (c4 u u + 2 c3 u + e2 - d4 v v - 2 d3 v)/(c2 u u + 2 c1 u + e1 - d2 v v - 2 d1 v) = (c4 u + c3)/(c2 u + c1)
  // (c4 u u + 2 c3 u + e2 - d4 v v - 2 d3 v)(c2 u + c1) - (c4 u + c3)(c2 u u + 2 c1 u + e1 - d2 v v - 2 d1 v) = 0
  // (c2 c3 + -c1 c4) u u + ((-c2 d4 + c4 d2) v v + (2 c4 d1 + -2 c2 d3) v + c2 e2 + -c4 e1) u + (c3 d2 + -c1 d4) v v + (-2 c1 d3 + 2 c3 d1) v + -c3 e1 + c1 e2 = 0
  const f1 = c2 * c3 - c1 * c4, f2 = -c2 * d4 + c4 * d2, f3 = 2 * c4 * d1 - 2 * c2 * d3, f4 = c2 * e2 - c4 * e1
  const f5 = c3 * d2 - c1 * d4, f6 = -2 * c1 * d3 + 2 * c3 * d1, f7 = -c3 * e1 + c1 * e2
  // f1 u u + (f2 v v + f3 v + f4) u + f5 v v + f6 v + f7 = 0
  // *(h1 v + h2)^2: f1 u u(h1 v + h2)^2 + (f2 v v + f3 v + f4) u(h1 v + h2)^2 + (f5 v v + f6 v + f7)(h1 v + h2)^2 = 0
  // replace u: f1 (h3 v + h4)^2 - (f2 v v + f3 v + f4)(h3 v + h4)(h1 v + h2) + (f5 v v + f6 v + f7)(h1 v + h2)^2 = 0
  // group by v: (f5 h1 h1 + -f2 h1 h3) v v v v + (f6 h1 h1 + 2 f5 h1 h2 + -f3 h1 h3 + -f2 h2 h3 + -f2 h1 h4) v v v + (f7 h1 h1 + f1 h3 h3 + 2 f6 h1 h2 + f5 h2 h2 + -f4 h1 h3 + -f3 h2 h3 + -f3 h1 h4 + -f2 h2 h4) v v + (2 f1 h3 h4 + 2 f7 h1 h2 + f6 h2 h2 + -f4 h2 h3 + -f4 h1 h4 + -f3 h2 h4) v + f1 h4 h4 + f7 h2 h2 + -f4 h2 h4 = 0
  let vs = calculateEquation4(
    f5 * h1 * h1 - f2 * h1 * h3,
    f6 * h1 * h1 + 2 * f5 * h1 * h2 + - f3 * h1 * h3 + - f2 * h2 * h3 - f2 * h1 * h4,
    f7 * h1 * h1 + f1 * h3 * h3 + 2 * f6 * h1 * h2 + f5 * h2 * h2 + - f4 * h1 * h3 + - f3 * h2 * h3 - f3 * h1 * h4 - f2 * h2 * h4,
    2 * f1 * h3 * h4 + 2 * f7 * h1 * h2 + f6 * h2 * h2 + - f4 * h2 * h3 - f4 * h1 * h4 - f3 * h2 * h4,
    f1 * h4 * h4 + f7 * h2 * h2 - f4 * h2 * h4,
  )
  vs = vs.filter(v => isValidPercent(v))
  const result: Tuple2<Position>[] = []
  for (const v of vs) {
    const u = -(h3 * v + h4) / (h1 * v + h2)
    if (isValidPercent(u)) {
      result.push([
        getQuadraticCurvePointAtPercent(curve1.from, curve1.cp, curve1.to, u),
        getQuadraticCurvePointAtPercent(curve2.from, curve2.cp, curve2.to, v),
      ])
    }
  }
  return result
}
