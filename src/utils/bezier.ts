import { calculateEquation2, calculateEquation3 } from "./equation-calculater"
import { Position, getTwoPointCenter, isZero } from "./geometry"
import { BezierCurve, QuadraticCurve } from "./intersection"
import { Vec3 } from "./types"

function interpolate2(n1: number, n2: number, percent: number) {
  return n1 + (n2 - n1) * percent
}

function interpolate3(n1: number, n2: number, n3: number, percent: number) {
  return interpolate2(
    interpolate2(n1, n2, percent),
    interpolate2(n2, n3, percent),
    percent,
  )
}

function interpolate4(n1: number, n2: number, n3: number, n4: number, percent: number) {
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
  return -((a1 - point.x) * c4 - (b1 - point.y) * c2) / 2 / (c1 * c4 - c2 * c3)
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
    .filter(t => t >= 0 && t <= 1 && isZero(c4 * t * t + 2 * c3 * t + b1 - point.y)).length > 0
}

export function pointIsOnBezierCurve(point: Position, { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // px = c1 t t t + c2 t t + c3 t + a1
  // py = c4 t t t + c5 t t + c6 t + b1
  return calculateEquation3(c1, c2, c3, a1 - point.x)
    .filter(t => t >= 0 && t <= 1 && isZero(c4 * t * t * t + c5 * t * t + c6 * t + b1 - point.y)).length > 0
}

export function getBezierCurvePercentAtPoint({ from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve, point: Position) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // px = c1 t t t + c2 t t + c3 t + a1
  // py = c4 t t t + c5 t t + c6 t + b1
  return calculateEquation3(c1, c2, c3, a1 - point.x)
    .filter(t => isZero(c4 * t * t * t + c5 * t * t + c6 * t + b1 - point.y))[0]
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

export function getBezierSplineCurves(points: Position[]) {
  const result: BezierCurve[] = []
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
