import { BezierCurve, getBezierCurveDerivatives, getBezierCurvePointAtPercent, getQuadraticCurveDerivatives, getQuadraticCurvePointAtPercent, QuadraticCurve } from "./bezier";
import { calculateEquation4, calculateEquation5, newtonIterate2 } from "./equation-calculater";
import { GeometryLine } from "./geometry-line";
import { getHyperbolaDerivatives, HyperbolaSegment } from "./hyperbola";
import { deduplicate, deepEquals, delta2, isBetween, isValidPercent } from "./math";
import { Matrix2 } from "./matrix";
import { fromVerbPoint, getNurbsMaxParam, NurbsCurve, toVerbNurbsCurve } from "./nurbs";
import { Position } from "./position";
import { getLinesTangentTo2Circles } from "./tangency";
import { Tuple2, Vec2 } from "./types";

export function getLinesTangentTo2GeometryLines(line1: GeometryLine, line2: GeometryLine): Tuple2<Position>[] {
  if (Array.isArray(line1) || line1.type === 'ray') {
    return []
  }
  if (Array.isArray(line2) || line2.type === 'ray') return []
  if (line1.type === 'arc') {
    if (line2.type === 'arc') {
      return getLinesTangentTo2Circles(line1.curve, line2.curve)
    }
    return []
  }
  if (line2.type === 'arc') return getLinesTangentTo2GeometryLines(line2, line1)
  if (line1.type === 'ellipse arc') {
    return []
  }
  if (line2.type === 'ellipse arc') return getLinesTangentTo2GeometryLines(line2, line1)
  if (line1.type === 'quadratic curve') {
    if (line2.type === 'quadratic curve') {
      return getLinesTangentTo2QuadraticCurves(line1.curve, line2.curve)
    }
    if (line2.type === 'bezier curve') {
      return getLinesTangentToQuadraticCurveAndBezierCurve(line1.curve, line2.curve)
    }
    if (line2.type === 'hyperbola curve') {
      return getLinesTangentToQuadraticCurveAndHyperbola(line1.curve, line2.curve)
    }
    return []
  }
  if (line2.type === 'quadratic curve') return getLinesTangentTo2GeometryLines(line2, line1)
  if (line1.type === 'bezier curve') {
    if (line2.type === 'bezier curve') {
      return getLinesTangentTo2BezierCurves(line1.curve, line2.curve)
    }
    if (line2.type === 'hyperbola curve') {
      return getLinesTangentToBezierCurveAndHyperbola(line1.curve, line2.curve)
    }
    return []
  }
  if (line2.type === 'bezier curve') return getLinesTangentTo2GeometryLines(line2, line1)
  if (line1.type === 'hyperbola curve') {
    return []
  }
  if (line2.type === 'hyperbola curve') return getLinesTangentTo2GeometryLines(line2, line1)
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

export function getLinesTangentToQuadraticCurveAndBezierCurve(curve1: QuadraticCurve, curve2: BezierCurve): Tuple2<Position>[] {
  const { from: { x: a5, y: b5 }, cp: { x: a6, y: b6 }, to: { x: a7, y: b7 } } = curve1
  const d1 = a6 - a5, d2 = a7 - a6 - d1, d3 = b6 - b5, d4 = b7 - b6 - d3
  // x1 = d2 u u + 2 d1 u + a5
  // y1 = d4 u u + 2 d3 u + b5
  // x1' = 2 d2 u + 2 d1
  // y1' = 2 d4 u + 2 d3

  const { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } } = curve2
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x2 = c1 v v v + c2 v v + c3 v + a1
  // y2 = c4 v v v + c5 v v + c6 v + b1
  // x2' = 3 c1 v v + 2 c2 v + c3
  // y2' = 3 c4 v v + 2 c5 v + c6

  // (y1 - y2)/(x1 - x2) = y1'/x1' = y2'/x2'
  // (d4 u + d3)(3 c1 v v + 2 c2 v + c3) - (3 c4 v v + 2 c5 v + c6)(d2 u + d1) = 0
  // expand, group by u v: ((3 c1 d4 + -3 c4 d2) v v + (-2 c5 d2 + 2 c2 d4) v + -c6 d2 + c3 d4) u + (-3 c4 d1 + 3 c1 d3) v v + (-2 c5 d1 + 2 c2 d3) v + -c6 d1 + c3 d3 = 0
  const e1 = 3 * c1 * d4 - 3 * c4 * d2, e2 = -2 * c5 * d2 + 2 * c2 * d4, e3 = -c6 * d2 + c3 * d4
  const e4 = 3 * c4 * d1 - 3 * c1 * d3, e5 = 2 * c5 * d1 - 2 * c2 * d3, e6 = c6 * d1 - c3 * d3
  // (e1 v v + e2 v + e3) u - e4 v v - e5 v - e6 = 0
  // u = (e4 v v + e5 v + e6)/(e1 v v + e2 v + e3)

  // (d4 u u + 2 d3 u + b5 - c4 v v v - c5 v v - c6 v - b1)/(d2 u u + 2 d1 u + a5 - c1 v v v - c2 v v - c3 v - a1) = (d4 u + d3)/(d2 u + d1)
  const f1 = b5 - b1, f2 = a5 - a1
  // (d4 u u + 2 d3 u + f1 - c4 v v v - c5 v v - c6 v)/(d2 u u + 2 d1 u + f2 - c1 v v v - c2 v v - c3 v) = (d4 u + d3)/(d2 u + d1)
  // (d4 u u + 2 d3 u + f1 - c4 v v v - c5 v v - c6 v)(d2 u + d1) - (d4 u + d3)(d2 u u + 2 d1 u + f2 - c1 v v v - c2 v v - c3 v) = 0
  // (d2 d3 + -d1 d4) u u + ((-c4 d2 + c1 d4) v v v + (-c5 d2 + c2 d4) v v + (-c6 d2 + c3 d4) v + d2 f1 + -d4 f2) u + (-c4 d1 + c1 d3) v v v + (-c5 d1 + c2 d3) v v + (-c6 d1 + c3 d3) v + d1 f1 + -d3 f2 = 0
  const g1 = d2 * d3 - d1 * d4, g2 = -c4 * d2 + c1 * d4, g3 = -c5 * d2 + c2 * d4, g4 = -c6 * d2 + c3 * d4, g5 = d2 * f1 - d4 * f2
  const g6 = -c4 * d1 + c1 * d3, g7 = -c5 * d1 + c2 * d3, g8 = -c6 * d1 + c3 * d3, g9 = d1 * f1 - d3 * f2
  // g1 u u + (g2 v v v + g3 v v + g4 v + g5) u + g6 v v v + g7 v v + g8 v + g9 = 0
  // *(e1 v v + e2 v + e3)^2: g1 u u(e1 v v + e2 v + e3)^2 + (g2 v v v + g3 v v + g4 v + g5) u(e1 v v + e2 v + e3)^2 + (g6 v v v + g7 v v + g8 v + g9)(e1 v v + e2 v + e3)^2 = 0
  // replace u: g1 (e4 v v + e5 v + e6)^2 + (g2 v v v + g3 v v + g4 v + g5)(e4 v v + e5 v + e6)(e1 v v + e2 v + e3) + (g6 v v v + g7 v v + g8 v + g9)(e1 v v + e2 v + e3)^2 = 0
  // group by v: (e1 e4 g2 + e1 e1 g6) v v v v v v v + (e2 e4 g2 + e1 e5 g2 + e1 e4 g3 + 2 e1 e2 g6 + e1 e1 g7) v v v v v v + (e3 e4 g2 + e2 e5 g2 + e1 e6 g2 + e2 e4 g3 + e1 e5 g3 + e1 e4 g4 + e2 e2 g6 + 2 e1 e3 g6 + 2 e1 e2 g7 + e1 e1 g8) v v v v v + (e4 e4 g1 + e3 e5 g2 + e2 e6 g2 + e3 e4 g3 + e2 e5 g3 + e1 e6 g3 + e2 e4 g4 + e1 e5 g4 + e1 e4 g5 + 2 e2 e3 g6 + e2 e2 g7 + 2 e1 e3 g7 + 2 e1 e2 g8 + e1 e1 g9) v v v v + (2 e4 e5 g1 + e3 e6 g2 + e3 e5 g3 + e2 e6 g3 + e3 e4 g4 + e2 e5 g4 + e1 e6 g4 + e2 e4 g5 + e1 e5 g5 + e3 e3 g6 + 2 e2 e3 g7 + e2 e2 g8 + 2 e1 e3 g8 + 2 e1 e2 g9) v v v + (e5 e5 g1 + 2 e4 e6 g1 + e3 e6 g3 + e3 e5 g4 + e2 e6 g4 + e3 e4 g5 + e2 e5 g5 + e1 e6 g5 + e3 e3 g7 + 2 e2 e3 g8 + e2 e2 g9 + 2 e1 e3 g9) v v + (2 e5 e6 g1 + e3 e6 g4 + e3 e5 g5 + e2 e6 g5 + e3 e3 g8 + 2 e2 e3 g9) v + e6 e6 g1 + e3 e6 g5 + e3 e3 g9 = 0
  let vs = calculateEquation5([
    e1 * e4 * g2 + e1 * e1 * g6,
    e2 * e4 * g2 + e1 * e5 * g2 + e1 * e4 * g3 + 2 * e1 * e2 * g6 + e1 * e1 * g7,
    e3 * e4 * g2 + e2 * e5 * g2 + e1 * e6 * g2 + e2 * e4 * g3 + e1 * e5 * g3 + e1 * e4 * g4 + e2 * e2 * g6 + 2 * e1 * e3 * g6 + 2 * e1 * e2 * g7 + e1 * e1 * g8,
    e4 * e4 * g1 + e3 * e5 * g2 + e2 * e6 * g2 + e3 * e4 * g3 + e2 * e5 * g3 + e1 * e6 * g3 + e2 * e4 * g4 + e1 * e5 * g4 + e1 * e4 * g5 + 2 * e2 * e3 * g6 + e2 * e2 * g7 + 2 * e1 * e3 * g7 + 2 * e1 * e2 * g8 + e1 * e1 * g9,
    2 * e4 * e5 * g1 + e3 * e6 * g2 + e3 * e5 * g3 + e2 * e6 * g3 + e3 * e4 * g4 + e2 * e5 * g4 + e1 * e6 * g4 + e2 * e4 * g5 + e1 * e5 * g5 + e3 * e3 * g6 + 2 * e2 * e3 * g7 + e2 * e2 * g8 + 2 * e1 * e3 * g8 + 2 * e1 * e2 * g9,
    e5 * e5 * g1 + 2 * e4 * e6 * g1 + e3 * e6 * g3 + e3 * e5 * g4 + e2 * e6 * g4 + e3 * e4 * g5 + e2 * e5 * g5 + e1 * e6 * g5 + e3 * e3 * g7 + 2 * e2 * e3 * g8 + e2 * e2 * g9 + 2 * e1 * e3 * g9,
    2 * e5 * e6 * g1 + e3 * e6 * g4 + e3 * e5 * g5 + e2 * e6 * g5 + e3 * e3 * g8 + 2 * e2 * e3 * g9,
    e6 * e6 * g1 + e3 * e6 * g5 + e3 * e3 * g9,
  ], 0.5)
  vs = vs.filter(v => isValidPercent(v))
  const result: Tuple2<Position>[] = []
  for (const v of vs) {
    const u = (e4 * v * v + e5 * v + e6) / (e1 * v * v + e2 * v + e3)
    if (isValidPercent(u)) {
      result.push([
        getQuadraticCurvePointAtPercent(curve1.from, curve1.cp, curve1.to, u),
        getBezierCurvePointAtPercent(curve2.from, curve2.cp1, curve2.cp2, curve2.to, v),
      ])
    }
  }
  return result
}

export function getLinesTangentToQuadraticCurveAndHyperbola(curve1: QuadraticCurve, curve2: HyperbolaSegment): Tuple2<Position>[] {
  const [p1, d1, d2] = getQuadraticCurveDerivatives(curve1)
  const [p2, e1, e2] = getHyperbolaDerivatives(curve2)
  const f1 = (t: Vec2): Vec2 => {
    // (y1 - y2)/(x1 - x2) = y1'/x1' = y2'/x2'
    // z1 = (y1 - y2)x1' - (x1 - x2)y1'
    // z2 = y1'x2' - x1'y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    return [(y1 - y2) * x11 - (x1 - x2) * y11, y11 * x21 - x11 * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    const { x: x22, y: y22 } = e2(t[1])
    // dz1/dt1 = y1'x1' + (y1 - y2)x1'' - (x1'y1' + (x1 - x2)y1'')
    // dz1/dt2 = -y2'x1' + x2'y1'
    // dz2/dt1 = y1''x2' - x1''y2'
    // dz2/dt2 = y1'x2'' - x1'y2''
    return [
      y11 * x11 + (y1 - y2) * x12 - (x11 * y11 + (x1 - x2) * y12),
      -y21 * x11 + x21 * y11,
      y12 * x21 - x12 * y21,
      y11 * x22 - x11 * y22,
    ]
  }
  let ts: Vec2[] = []
  for (const t1 of [0.25, 0.75]) {
    const t = newtonIterate2([t1, 0], f1, f2, delta2)
    if (t !== undefined) {
      ts.push(t)
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isValidPercent(v[0]) && isBetween(v[1], curve2.t1, curve2.t2)).map(t => {
    return [p1(t[0]), p2(t[1])]
  })
}

export function getLinesTangentToQuadraticCurveAndNurbsCurve(curve1: QuadraticCurve, curve2: NurbsCurve): Tuple2<Position>[] {
  const [p1, d1, d2] = getQuadraticCurveDerivatives(curve1)
  const nurbs2 = toVerbNurbsCurve(curve2)
  const f1 = (t: Vec2): Vec2 => {
    // (y1 - y2)/(x1 - x2) = y1'/x1' = y2'/x2'
    // z1 = (y1 - y2)x1' - (x1 - x2)y1'
    // z2 = y1'x2' - x1'y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const [[x2, y2], [x21, y21]] = nurbs2.derivatives(t[1])
    return [(y1 - y2) * x11 - (x1 - x2) * y11, y11 * x21 - x11 * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const [[x2, y2], [x21, y21], [x22, y22]] = nurbs2.derivatives(t[1], 2)
    // dz1/dt1 = y1'x1' + (y1 - y2)x1'' - (x1'y1' + (x1 - x2)y1'')
    // dz1/dt2 = -y2'x1' + x2'y1'
    // dz2/dt1 = y1''x2' - x1''y2'
    // dz2/dt2 = y1'x2'' - x1'y2''
    return [
      y11 * x11 + (y1 - y2) * x12 - (x11 * y11 + (x1 - x2) * y12),
      -y21 * x11 + x21 * y11,
      y12 * x21 - x12 * y21,
      y11 * x22 - x11 * y22,
    ]
  }
  let ts: Vec2[] = []
  const maxParam2 = getNurbsMaxParam(curve2)
  for (const t1 of [0.25, 0.75]) {
    for (let t2 = 0.5; t2 < maxParam2; t2++) {
      const t = newtonIterate2([t1, t2], f1, f2, delta2)
      if (t !== undefined) {
        ts.push(t)
      }
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isValidPercent(v[0]) && isBetween(v[1], 0, maxParam2)).map(t => {
    return [p1(t[0]), fromVerbPoint(nurbs2.point(t[1]))]
  })
}

export function getLinesTangentTo2BezierCurves(curve1: BezierCurve, curve2: BezierCurve): Tuple2<Position>[] {
  const [p1, d1, d2] = getBezierCurveDerivatives(curve1)
  const [p2, e1, e2] = getBezierCurveDerivatives(curve2)
  const f1 = (t: Vec2): Vec2 => {
    // (y1 - y2)/(x1 - x2) = y1'/x1' = y2'/x2'
    // z1 = (y1 - y2)x1' - (x1 - x2)y1'
    // z2 = y1'x2' - x1'y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    return [(y1 - y2) * x11 - (x1 - x2) * y11, y11 * x21 - x11 * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    const { x: x22, y: y22 } = e2(t[1])
    // dz1/dt1 = y1'x1' + (y1 - y2)x1'' - (x1'y1' + (x1 - x2)y1'')
    // dz1/dt2 = -y2'x1' + x2'y1'
    // dz2/dt1 = y1''x2' - x1''y2'
    // dz2/dt2 = y1'x2'' - x1'y2''
    return [
      y11 * x11 + (y1 - y2) * x12 - (x11 * y11 + (x1 - x2) * y12),
      -y21 * x11 + x21 * y11,
      y12 * x21 - x12 * y21,
      y11 * x22 - x11 * y22,
    ]
  }
  let ts: Vec2[] = []
  for (const t1 of [0.25, 0.5, 0.75]) {
    for (const t2 of [0.25, 0.5, 0.75]) {
      const t = newtonIterate2([t1, t2], f1, f2, delta2)
      if (t !== undefined) {
        ts.push(t)
      }
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isValidPercent(v[0]) && isValidPercent(v[1])).map(t => {
    return [p1(t[0]), p2(t[1])]
  })
}

export function getLinesTangentToBezierCurveAndHyperbola(curve1: BezierCurve, curve2: HyperbolaSegment): Tuple2<Position>[] {
  const [p1, d1, d2] = getBezierCurveDerivatives(curve1)
  const [p2, e1, e2] = getHyperbolaDerivatives(curve2)
  const f1 = (t: Vec2): Vec2 => {
    // (y1 - y2)/(x1 - x2) = y1'/x1' = y2'/x2'
    // z1 = (y1 - y2)x1' - (x1 - x2)y1'
    // z2 = y1'x2' - x1'y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    return [(y1 - y2) * x11 - (x1 - x2) * y11, y11 * x21 - x11 * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    const { x: x22, y: y22 } = e2(t[1])
    // dz1/dt1 = y1'x1' + (y1 - y2)x1'' - (x1'y1' + (x1 - x2)y1'')
    // dz1/dt2 = -y2'x1' + x2'y1'
    // dz2/dt1 = y1''x2' - x1''y2'
    // dz2/dt2 = y1'x2'' - x1'y2''
    return [
      y11 * x11 + (y1 - y2) * x12 - (x11 * y11 + (x1 - x2) * y12),
      -y21 * x11 + x21 * y11,
      y12 * x21 - x12 * y21,
      y11 * x22 - x11 * y22,
    ]
  }
  let ts: Vec2[] = []
  for (const t1 of [0.25, 0.5, 0.75]) {
    const t = newtonIterate2([t1, 0], f1, f2, delta2)
    if (t !== undefined) {
      ts.push(t)
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isValidPercent(v[0]) && isBetween(v[1], curve2.t1, curve2.t2)).map(t => {
    return [p1(t[0]), p2(t[1])]
  })
}
