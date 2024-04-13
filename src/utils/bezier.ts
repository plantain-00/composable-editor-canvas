import { calculateEquation2, calculateEquation3 } from "./equation-calculater"
import { isSameNumber, delta3, isValidPercent, isZero } from "./math"
import { Position } from "./position"
import { getTwoPointCenter } from "./position"
import { toBezierCurves } from "./nurbs"
import { Tuple3, Tuple4, Vec3 } from "./types"

export interface BezierCurve {
  from: Position
  cp1: Position
  cp2: Position
  to: Position
}

export const BezierCurve = {
  from: Position,
  cp1: Position,
  cp2: Position,
  to: Position,
}

export interface QuadraticCurve {
  from: Position
  cp: Position
  to: Position
}

export const QuadraticCurve = {
  from: Position,
  cp: Position,
  to: Position,
}

export function interpolate2(n1: number, n2: number, percent: number) {
  return n1 + (n2 - n1) * percent
}

export function interpolate3(n1: number, n2: number, n3: number, percent: number) {
  return interpolate2(
    interpolate2(n1, n2, percent),
    interpolate2(n2, n3, percent),
    percent,
  )
}

export function interpolate4(n1: number, n2: number, n3: number, n4: number, percent: number) {
  return interpolate3(
    interpolate2(n1, n2, percent),
    interpolate2(n2, n3, percent),
    interpolate2(n3, n4, percent),
    percent,
  )
}

export function getQuadraticCurvePercentAtPoint({ from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve, point: Position) {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // px = c2 u u + 2 c1 u + a1
  // py = c4 u u + 2 c3 u + b1
  // c2 c4 u u + 2 c1 c4 u + (a1 - px) c4 = 0
  // c2 c4 u u + 2 c2 c3 u + (b1 - py) c2 = 0
  // 2(c1 c4 - c2 c3)u + ((a1 - px) c4 - (b1 - py) c2) = 0
  // u = -((a1 - px) c4 - (b1 - py) c2)/2/(c1 c4 - c2 c3)
  const d = c1 * c4 - c2 * c3
  if (isZero(d)) {
    return calculateEquation2(c2, 2 * c1, a1 - point.x).filter(u => isSameNumber(c4 * u * u + 2 * c3 * u + b1, point.y, delta3))[0]
  }
  return -((a1 - point.x) * c4 - (b1 - point.y) * c2) / 2 / d
}

export function getQuadraticCurvePointAtPercent(p1: Position, p2: Position, p3: Position, percent: number) {
  return {
    x: interpolate3(p1.x, p2.x, p3.x, percent),
    y: interpolate3(p1.y, p2.y, p3.y, percent),
  }
}

export function getQuadraticCurvePoints(p1: Position, p2: Position, p3: Position, segmentCount: number) {
  const points: Position[] = []
  for (let t = 0; t <= segmentCount; t++) {
    points.push(getQuadraticCurvePointAtPercent(p1, p2, p3, t / segmentCount))
  }
  return points
}

export function pointIsOnQuadraticCurve(point: Position, { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve) {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 t t + 2 c1 t + a1
  // y = c4 t t + 2 c3 t + b1
  return calculateEquation2(c2, 2 * c1, a1 - point.x)
    .filter(t => isValidPercent(t) && isSameNumber(c4 * t * t + 2 * c3 * t + b1, point.y, delta3)).length > 0
}

export function pointIsOnBezierCurve(point: Position, { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // px = c1 t t t + c2 t t + c3 t + a1
  // py = c4 t t t + c5 t t + c6 t + b1
  return calculateEquation3(c1, c2, c3, a1 - point.x)
    .filter(t => isValidPercent(t) && isSameNumber(c4 * t * t * t + c5 * t * t + c6 * t + b1, point.y, delta3)).length > 0
}

export function getBezierCurvePercentAtPoint({ from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve, point: Position) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // px = c1 t t t + c2 t t + c3 t + a1
  // py = c4 t t t + c5 t t + c6 t + b1
  return calculateEquation3(c1, c2, c3, a1 - point.x)
    .filter(t => isSameNumber(c4 * t * t * t + c5 * t * t + c6 * t + b1, point.y, delta3))[0]
}

export function getBezierCurvePointAtPercent(p1: Position, p2: Position, p3: Position, p4: Position, percent: number) {
  return {
    x: interpolate4(p1.x, p2.x, p3.x, p4.x, percent),
    y: interpolate4(p1.y, p2.y, p3.y, p4.y, percent),
  }
}

export function getBezierCurvePoints(p1: Position, p2: Position, p3: Position, p4: Position, segmentCount: number) {
  const points: Position[] = []
  for (let t = 0; t <= segmentCount; t++) {
    points.push(getBezierCurvePointAtPercent(p1, p2, p3, p4, t / segmentCount))
  }
  return points
}

export function getBezierCurvePoints3D(p1: Vec3, p2: Vec3, p3: Vec3, p4: Vec3, segmentCount: number) {
  const points: Vec3[] = []
  for (let t = 0; t <= segmentCount; t++) {
    const i = t / segmentCount
    const x = interpolate4(p1[0], p2[0], p3[0], p4[0], i)
    const y = interpolate4(p1[1], p2[1], p3[1], p4[1], i)
    const z = interpolate4(p1[2], p2[2], p3[2], p4[2], i)
    points.push([x, y, z])
  }
  return points
}

export function getBezierSplineCurves(points: Position[], fitting = true) {
  const result: BezierCurve[] = []
  if (!fitting) {
    const x = points.map(p => p.x)
    const y = points.map(p => p.y)
    for (let i = 1; i < points.length - 2; i++) {
      const sx = toBezierCurves(x, i)
      const sy = toBezierCurves(y, i)
      result.push({
        from: { x: sx.from, y: sy.from },
        cp1: { x: sx.cp1, y: sy.cp1 },
        cp2: { x: sx.cp2, y: sy.cp2 },
        to: { x: sx.to, y: sy.to },
      })
    }
    return result
  }
  const cps = getBezierSplineControlPointsOfPoints(points)
  cps.forEach((p, i) => {
    result.push({
      from: points[i],
      cp1: p[0],
      cp2: p[1],
      to: points[i + 1],
    })
  })
  return result
}

export function getQuadraticSplineCurves(points: Position[]) {
  const result: QuadraticCurve[] = []
  for (let i = 1; i < points.length - 1; i++) {
    result.push({
      from: i === 1 ? points[i - 1] : getTwoPointCenter(points[i], points[i - 1]),
      cp: points[i],
      to: i === points.length - 2 ? points[i + 1] : getTwoPointCenter(points[i], points[i + 1]),
    })
  }
  return result
}

export function getBezierSplinePoints(points: Position[], segmentCount: number) {
  const curves = getBezierSplineCurves(points)
  return curves.map(c => getBezierCurvePoints(c.from, c.cp1, c.cp2, c.to, segmentCount)).flat()
}

export function getBezierSplinePoints3D(points: Vec3[], segmentCount: number) {
  const result: Vec3[] = []
  const cps = getBezierSplineControlPointsOfPoints3D(points)
  cps.forEach((p, i) => {
    result.push(...getBezierCurvePoints3D(points[i], ...p, points[i + 1], segmentCount))
  })
  return result
}

export function getBezierSplineControlPointsOfPoints(points: Position[]) {
  const x = getBezierSplineControlPoints(points.map((p) => p.x))
  const y = getBezierSplineControlPoints(points.map((p) => p.y))
  return x.p1.map((_, i) => [{ x: x.p1[i], y: y.p1[i] }, { x: x.p2[i], y: y.p2[i] }] as const)
}

export function getBezierSplineControlPointsOfPoints3D(points: Vec3[]) {
  const x = getBezierSplineControlPoints(points.map((p) => p[0]))
  const y = getBezierSplineControlPoints(points.map((p) => p[1]))
  const z = getBezierSplineControlPoints(points.map((p) => p[2]))
  return x.p1.map((_, i) => [[x.p1[i], y.p1[i], z.p1[i]], [x.p2[i], y.p2[i], z.p2[i]]] as [Vec3, Vec3])
}

function getBezierSplineControlPoints(k: number[]) {
  const p1: number[] = []
  const p2: number[] = []
  const n = k.length - 1;
  const a: number[] = []
  const b: number[] = []
  const c: number[] = []
  const r: number[] = []
  a[0] = 0;
  b[0] = 2;
  c[0] = 1;
  r[0] = k[0] + 2 * k[1];
  for (let i = 1; i < n - 1; i++) {
    a[i] = 1;
    b[i] = 4;
    c[i] = 1;
    r[i] = 4 * k[i] + 2 * k[i + 1];
  }
  a[n - 1] = 2;
  b[n - 1] = 7;
  c[n - 1] = 0;
  r[n - 1] = 8 * k[n - 1] + k[n];

  for (let i = 1; i < n; i++) {
    const m = a[i] / b[i - 1];
    b[i] = b[i] - m * c[i - 1];
    r[i] = r[i] - m * r[i - 1];
  }

  p1[n - 1] = r[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; --i)
    p1[i] = (r[i] - c[i] * p1[i + 1]) / b[i];

  for (let i = 0; i < n - 1; i++) {
    p2[i] = 2 * k[i + 1] - p1[i + 1];
  }

  p2[n - 1] = 0.5 * (k[n] + p1[n - 1])
  return { p1: p1, p2: p2 };
}

export function getPartOfQuadraticCurve({ from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve, t1: number, t2: number): QuadraticCurve {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 t t + 2 c1 t + a1
  // y = c4 t t + 2 c3 t + b1
  const d = t2 - t1
  // t = d u + t1
  // x = c2 d d u u + 2(c2 d t1 + c1 d) u + a1 + c2 t1 t1 + 2 c1 t1
  // x = (e1 + e3 - 2 e2) u u + 2 (e2 - e1) u + e1
  const e1 = a1 + c2 * t1 * t1 + 2 * c1 * t1
  const e2 = e1 + (c2 * d * t1 + c1 * d)
  const e3 = c2 * d * d - e1 + 2 * e2
  const f1 = b1 + c4 * t1 * t1 + 2 * c3 * t1
  const f2 = f1 + (c4 * d * t1 + c3 * d)
  const f3 = c4 * d * d - f1 + 2 * f2
  return {
    from: { x: e1, y: f1 },
    cp: { x: e2, y: f2 },
    to: { x: e3, y: f3 },
  }
}

export function getPartOfBezierCurve({ from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve, t1: number, t2: number): BezierCurve {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = c4 t t t + c5 t t + c6 t + b1
  const d = t2 - t1
  // t = d u + t1
  // x = c1 d d d u u u + (3 c1 d d t1 + c2 d d) u u + (3 c1 d t1 t1 + 2 c2 d t1 + c3 d) u + a1 + c1 t1 t1 t1 + c2 t1 t1 + c3 t1
  // x = (-e1 + 3 e2 + -3 e3 + e4) u u u + 3 (e1 - 2 e2 + e3) u u + 3 (e2 - e1) u + e1
  const e1 = a1 + c1 * t1 * t1 * t1 + c2 * t1 * t1 + c3 * t1
  const e2 = e1 + (3 * c1 * d * t1 * t1 + 2 * c2 * d * t1 + c3 * d) / 3
  const e3 = (3 * c1 * d * d * t1 + c2 * d * d) / 3 + 2 * e2 - e1
  const e4 = c1 * d * d * d + e1 - 3 * e2 + 3 * e3
  const f1 = b1 + c4 * t1 * t1 * t1 + c5 * t1 * t1 + c6 * t1
  const f2 = f1 + (3 * c4 * d * t1 * t1 + 2 * c5 * d * t1 + c6 * d) / 3
  const f3 = (3 * c4 * d * d * t1 + c5 * d * d) / 3 + 2 * f2 - f1
  const f4 = c4 * d * d * d + f1 - 3 * f2 + 3 * f3
  return {
    from: { x: e1, y: f1 },
    cp1: { x: e2, y: f2 },
    cp2: { x: e3, y: f3 },
    to: { x: e4, y: f4 },
  }
}

export function getQuadraticCurveDerivatives({ from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve): Tuple3<(t: number) => Position> {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 t t + 2 c1 t + a1
  // y = c4 t t + 2 c3 t + b1
  return [
    t => ({
      x: c2 * t ** 2 + 2 * c1 * t + a1,
      y: c4 * t ** 2 + 2 * c3 * t + b1,
    }),
    t => ({
      x: 2 * c2 * t + 2 * c1,
      y: 2 * c4 * t + 2 * c3,
    }),
    () => ({
      x: 2 * c2,
      y: 2 * c4,
    }),
  ]
}

export function getBezierCurveDerivatives({ from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve): Tuple4<(t: number) => Position> {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = c4 t t t + c5 t t + c6 t + b1
  return [
    t => ({
      x: c1 * t ** 3 + c2 * t ** 2 + c3 * t + a1,
      y: c4 * t ** 3 + c5 * t ** 2 + c6 * t + b1,
    }),
    t => ({
      x: 3 * c1 * t ** 2 + 2 * c2 * t + c3,
      y: 3 * c4 * t ** 2 + 2 * c5 * t + c6,
    }),
    t => ({
      x: 6 * c1 * t + 2 * c2,
      y: 6 * c4 * t + 2 * c5,
    }),
    () => ({
      x: 6 * c1,
      y: 6 * c4,
    }),
  ]
}

export function getQuadraticCurveCurvatureAtParam(curve: QuadraticCurve, param: number) {
  const derivatives = getQuadraticCurveDerivatives(curve)
  const { x: x1, y: y1 } = derivatives[1](param)
  const { x: x2, y: y2 } = derivatives[2](param)
  // (x1 y2 - y1 x2)/(x1 ** 2 + y1 ** 2)**1.5
  return (x1 * y2 - y1 * x2) / (x1 ** 2 + y1 ** 2) ** 1.5
}

export function getBezierCurveCurvatureAtParam(curve: BezierCurve, param: number) {
  const derivatives = getBezierCurveDerivatives(curve)
  const { x: x1, y: y1 } = derivatives[1](param)
  const { x: x2, y: y2 } = derivatives[2](param)
  // (x1 y2 - y1 x2)/(x1 ** 2 + y1 ** 2)**1.5
  return (x1 * y2 - y1 * x2) / (x1 ** 2 + y1 ** 2) ** 1.5
}

export function getQuadraticCurvePercentsAtQuadraticCurve(curve1: QuadraticCurve, curve2: QuadraticCurve): [number, number] | undefined {
  /**
   * @see getPartOfQuadraticCurve
   */
  const { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } } = curve1
  const { from: { x: e1, y: f1 }, cp: { x: e2, y: f2 }, to: { x: e3, y: f3 } } = curve2
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3

  // e1 = a1 + c2 * t1 * t1 + 2 * c1 * t1
  // f1 = b1 + c4 * t1 * t1 + 2 * c3 * t1
  let t1s = calculateEquation2(c2, 2 * c1, a1 - e1)
  t1s = t1s.filter(t1 => isSameNumber(f1, b1 + c4 * t1 * t1 + 2 * c3 * t1))
  if (t1s.length === 0) return

  // e3 = c2 * d * d - e1 + 2 * e2
  // f3 = c4 * d * d - f1 + 2 * f2
  let ds = calculateEquation2(c2, 0, - e1 + 2 * e2 - e3)
  ds = ds.filter(d => isSameNumber(f3, c4 * d * d - f1 + 2 * f2))
  if (ds.length === 0) return

  // f2 = f1 + (c4 * d * t1 + c3 * d)
  // e2 = e1 + (c2 * d * t1 + c1 * d)
  for (const t1 of t1s) {
    for (const d of ds) {
      if (isSameNumber(f2, f1 + (c4 * d * t1 + c3 * d)) && isSameNumber(e2, e1 + (c2 * d * t1 + c1 * d))) {
        // d = t2 - t1
        return [t1, d + t1]
      }
    }
  }
  return
}

export function getBezierCurvePercentsAtBezierCurve(curve1: BezierCurve, curve2: BezierCurve): [number, number] | undefined {
  /**
   * @see getPartOfBezierCurve
   */
  const { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } } = curve1
  const { from: { x: e1, y: f1 }, cp1: { x: e2, y: f2 }, cp2: { x: e3, y: f3 }, to: { x: e4, y: f4 } } = curve2
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)

  // e1 = a1 + c1 * t1 * t1 * t1 + c2 * t1 * t1 + c3 * t1
  // f1 = b1 + c4 * t1 * t1 * t1 + c5 * t1 * t1 + c6 * t1
  let t1s = calculateEquation3(c1, c2, c3, a1 - e1)
  t1s = t1s.filter(t1 => isSameNumber(f1, b1 + c4 * t1 * t1 * t1 + c5 * t1 * t1 + c6 * t1))
  if (t1s.length === 0) return

  // e4 = c1 * d * d * d + e1 - 3 * e2 + 3 * e3
  // f4 = c4 * d * d * d + f1 - 3 * f2 + 3 * f3
  let ds = calculateEquation3(c1, 0, 0, e1 - 3 * e2 + 3 * e3 - e4)
  ds = ds.filter(d => isSameNumber(f4, c4 * d * d * d + f1 - 3 * f2 + 3 * f3))
  if (ds.length === 0) return

  // e2 = e1 + (3 * c1 * d * t1 * t1 + 2 * c2 * d * t1 + c3 * d) / 3
  // e3 = (3 * c1 * d * d * t1 + c2 * d * d) / 3 + 2 * e2 - e1
  // f2 = f1 + (3 * c4 * d * t1 * t1 + 2 * c5 * d * t1 + c6 * d) / 3
  // f3 = (3 * c4 * d * d * t1 + c5 * d * d) / 3 + 2 * f2 - f1
  for (const t1 of t1s) {
    for (const d of ds) {
      if (
        isSameNumber(e2, e1 + (3 * c1 * d * t1 * t1 + 2 * c2 * d * t1 + c3 * d) / 3) &&
        isSameNumber(e3, (3 * c1 * d * d * t1 + c2 * d * d) / 3 + 2 * e2 - e1) &&
        isSameNumber(f2, f1 + (3 * c4 * d * t1 * t1 + 2 * c5 * d * t1 + c6 * d) / 3) &&
        isSameNumber(f3, (3 * c4 * d * d * t1 + c5 * d * d) / 3 + 2 * f2 - f1)
      ) {
        // d = t2 - t1
        return [t1, d + t1]
      }
    }
  }
  return
}
