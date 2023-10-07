import { Position } from "./geometry"
import { QuadraticCurve } from "./intersection"
import { Vec3 } from "./types"

function getValueBetween2PointsByPercent(n1: number, n2: number, percent: number) {
  return n1 + ((n2 - n1) * percent)
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
  const xa = getValueBetween2PointsByPercent(p1.x, p2.x, percent)
  const ya = getValueBetween2PointsByPercent(p1.y, p2.y, percent)
  const xb = getValueBetween2PointsByPercent(p2.x, p3.x, percent)
  const yb = getValueBetween2PointsByPercent(p2.y, p3.y, percent)
  const x = getValueBetween2PointsByPercent(xa, xb, percent)
  const y = getValueBetween2PointsByPercent(ya, yb, percent)
  return { x, y }
}

export function getQuadraticCurvePoints(p1: Position, p2: Position, p3: Position, segmentCount: number) {
  const points: Position[] = []
  for (let t = 1; t < segmentCount; t++) {
    points.push(getQuadraticCurvePointAtPercent(p1, p2, p3, t / segmentCount))
  }
  return points
}

export function getBezierCurvePoints(p1: Position, p2: Position, p3: Position, p4: Position, segmentCount: number) {
  const points: Position[] = []
  for (let t = 1; t < segmentCount; t++) {
    const i = t / segmentCount
    const xa = getValueBetween2PointsByPercent(p1.x, p2.x, i)
    const ya = getValueBetween2PointsByPercent(p1.y, p2.y, i)
    const xb = getValueBetween2PointsByPercent(p2.x, p3.x, i)
    const yb = getValueBetween2PointsByPercent(p2.y, p3.y, i)
    const xc = getValueBetween2PointsByPercent(p3.x, p4.x, i)
    const yc = getValueBetween2PointsByPercent(p3.y, p4.y, i)

    // The Blue Line
    const xm = getValueBetween2PointsByPercent(xa, xb, i)
    const ym = getValueBetween2PointsByPercent(ya, yb, i)
    const xn = getValueBetween2PointsByPercent(xb, xc, i)
    const yn = getValueBetween2PointsByPercent(yb, yc, i)

    // The Black Dot
    const x = getValueBetween2PointsByPercent(xm, xn, i);
    const y = getValueBetween2PointsByPercent(ym, yn, i);
    points.push({ x, y })
  }
  return points
}

export function getBezierCurvePoints3D(p1: Vec3, p2: Vec3, p3: Vec3, p4: Vec3, segmentCount: number) {
  const points: Vec3[] = []
  for (let t = 1; t < segmentCount; t++) {
    const i = t / segmentCount
    const xa = getValueBetween2PointsByPercent(p1[0], p2[0], i)
    const ya = getValueBetween2PointsByPercent(p1[1], p2[1], i)
    const za = getValueBetween2PointsByPercent(p1[2], p2[2], i)
    const xb = getValueBetween2PointsByPercent(p2[0], p3[0], i)
    const yb = getValueBetween2PointsByPercent(p2[1], p3[1], i)
    const zb = getValueBetween2PointsByPercent(p2[2], p3[2], i)
    const xc = getValueBetween2PointsByPercent(p3[0], p4[0], i)
    const yc = getValueBetween2PointsByPercent(p3[1], p4[1], i)
    const zc = getValueBetween2PointsByPercent(p3[2], p4[2], i)

    // The Blue Line
    const xm = getValueBetween2PointsByPercent(xa, xb, i)
    const ym = getValueBetween2PointsByPercent(ya, yb, i)
    const zm = getValueBetween2PointsByPercent(za, zb, i)
    const xn = getValueBetween2PointsByPercent(xb, xc, i)
    const yn = getValueBetween2PointsByPercent(yb, yc, i)
    const zn = getValueBetween2PointsByPercent(zb, zc, i)

    // The Black Dot
    const x = getValueBetween2PointsByPercent(xm, xn, i);
    const y = getValueBetween2PointsByPercent(ym, yn, i);
    const z = getValueBetween2PointsByPercent(zm, zn, i);
    points.push([x, y, z])
  }
  return points
}

export function getBezierSplinePoints(points: Position[], segmentCount: number) {
  const result: Position[] = []
  getBezierSplineControlPointsOfPoints(points).map((p, i) => {
    result.push(points[i], ...getBezierCurvePoints(points[i], ...p, points[i + 1], segmentCount))
  })
  result.push(points[points.length - 1])
  return result
}

export function getBezierSplinePoints3D(points: Vec3[], segmentCount: number) {
  const result: Vec3[] = []
  getBezierSplineControlPointsOfPoints3D(points).map((p, i) => {
    result.push(points[i], ...getBezierCurvePoints3D(points[i], ...p, points[i + 1], segmentCount))
  })
  result.push(points[points.length - 1])
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