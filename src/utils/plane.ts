import { GeneralFormLine } from "./line";
import { isZero } from "./math";
import { v3 } from "./matrix";
import { transformPointFromCoordinate } from "./transform";
import { Tuple3, Tuple4, Vec3 } from "./types";
import { and, number } from "./validators";

export interface GeneralFormPlane extends GeneralFormLine {
  d: number
}

export const GeneralFormPlane = /* @__PURE__ */ and(GeneralFormLine, {
  d: number,
})

export function getLineAndPlaneIntersectionPoint([p1, p2]: [Vec3, Vec3], plane: GeneralFormPlane): Vec3 | undefined {
  const direction = v3.substract(p2, p1)
  return getPointAndDirectionLineAndPlaneIntersectionPoint(p1, direction, plane)
}

export function getPointAndDirectionLineAndPlaneIntersectionPoint([x1, y1, z1]: Vec3, [e1, e2, e3]: Vec3, { a, b, c, d }: GeneralFormPlane): Vec3 | undefined {
  // a x + b y + c z + d = 0
  // x = x1 + e1 t
  // y = y1 + e2 t
  // z = z1 + e3 t
  // a(x1 + e1 t) + b(y1 + e2 t) + c(z1 + e3 t) + d = 0
  // (a e1 + b e2 + c e3) t + a x1 + b y1 + c z1 + d = 0
  const f = a * e1 + b * e2 + c * e3
  if (isZero(f)) return
  const t = -(a * x1 + b * y1 + c * z1 + d) / f
  return [
    x1 + e1 * t,
    y1 + e2 * t,
    z1 + e3 * t,
  ]
}

export function getLineAndZPlaneIntersectionPoint([[x1, y1, z1], [x2, y2, z2]]: [Vec3, Vec3], z: number): Vec3 | undefined {
  const f = z2 - z1
  if (isZero(f)) return
  const b = (z - z1) / f
  return [
    x1 + (x2 - x1) * b,
    y1 + (y2 - y1) * b,
    z,
  ]
}

export function pointIsOnPlane([x, y, z]: Vec3, { a, b, c, d }: GeneralFormPlane) {
  return isZero(a * x + b * y + c * z + d)
}

export function directionIsOnPlane([x, y, z]: Vec3, { a, b, c }: GeneralFormPlane) {
  // a x0 + b y0 + c z0 + d = 0
  // a (x0 + x) + b (y0 + y) + c (z0 + z) + d = 0
  // a x + b y + c z = 0
  return isZero(a * x + b * y + c * z)
}

export function getThreePointPlane(p1: Vec3, p2: Vec3, p3: Vec3): GeneralFormPlane | undefined {
  return getPointAndTwoDirectionsPlane(p1, v3.substract(p2, p1), v3.substract(p3, p1))
}

export function getPointAndTwoDirectionsPlane(p: Vec3, direction1: Vec3, direction2: Vec3): GeneralFormPlane | undefined {
  const normal = v3.cross(direction1, direction2)
  return getPlaneByPointAndNormal(p, normal)
}

export function getPlaneByPointAndNormal([x, y, z]: Vec3, [a, b, c]: Vec3): GeneralFormPlane {
  return {
    a,
    b,
    c,
    d: -(a * x + b * y + c * z),
  }
}

export function pointInTriangle(p: Vec3, a: Vec3, b: Vec3, c: Vec3): boolean {
  // p = a + u(c - a) + v(b - a)
  const v0 = v3.substract(c, a)
  const v1 = v3.substract(b, a)
  const v2 = v3.substract(p, a)
  // v2 = u v0 + v v1
  // *v0: v2 v0 = (u v0 + v v1) v0 = u v0 v0 + v v1 v0
  // *v1: v2 v1 = (u v0 + v v1) v1 = u v0 v1 + v v1 v1
  const e1 = v3.dot(v0, v0)
  const e2 = v3.dot(v0, v1)
  const e3 = v3.dot(v0, v2)
  const e4 = v3.dot(v1, v1)
  const e5 = v3.dot(v1, v2)
  // F1: e3 = u e1 + v e2
  // F2: e5 = u e2 + v e4
  // F1 e2 - F2 e1: (e1 e4 - e2 e2)v = e1 e5 - e2 e3
  // F1 e4 - F2 e2: (e1 e4 - e2 e2)u = e3 e4 - e2 e5
  const d = e1 * e4 - e2 * e2
  const u = (e3 * e4 - e2 * e5) / d
  if (u < 0 || u > 1) return false
  const v = (e1 * e5 - e2 * e3) / d
  if (v < 0 || v > 1) return false
  return u + v <= 1
}

export function getPlaneNormal(plane: GeneralFormPlane): Vec3 {
  return [plane.a, plane.b, plane.c]
}

export function getPerpendicularPointToPlane([x1, y1, z1]: Vec3, { a, b, c, d }: GeneralFormPlane): Vec3 {
  // a x + b y + c z + d = 0
  // x = x1 + a t
  // y = y1 + b t
  // z = z1 + c t
  // a(x1 + a t) + b(y1 + b t) + c(z1 + c t) + d = 0
  // (a a + b b + c c) t + a x1 + b y1 + c z1 + d = 0
  const t = -(a * x1 + b * y1 + c * z1 + d) / (a * a + b * b + c * c)
  return [
    x1 + a * t,
    y1 + b * t,
    z1 + c * t,
  ]
}

export function getParallelPlanesByDistance({ a, b, c, d }: GeneralFormPlane, distance: number): [GeneralFormPlane, GeneralFormPlane] {
  // a x + b y + c z + d = 0
  // a x + b y + c z + e = 0
  // [0,0,0]
  // t1 = -d / (a a + b b + c c)
  // t2 = -e / (a a + b b + c c)
  const f = a * a + b * b + c * c
  // distance^2 = (a t1 - a t2)^2 + (b t1 - b t2)^2 + (c t1 - c t2)^2)
  // distance^2 = (a a + b b + c c)(t1 - t2)^2
  // distance^2 = f(d - e)^2/f/f = (d - e)^2/f
  const g = distance * Math.sqrt(f)
  return [
    { a, b, c, d: d + g },
    { a, b, c, d: d - g },
  ]
}

export function getLineAndTrianglesIntersectionPoint(line: [Vec3, Vec3], triangles: Tuple3<Vec3>[]): Vec3[] {
  const points: Vec3[] = []
  for (const triangle of triangles) {
    const plane = getThreePointPlane(...triangle)
    if (plane) {
      const p = getLineAndPlaneIntersectionPoint(line, plane)
      if (p && pointInTriangle(p, ...triangle)) {
        points.push(p)
      }
    }
  }
  return points
}

export function rotateDirectionByRadianOnPlane(direction: Vec3, radian: number, normal: Vec3): Vec3 | undefined {
  direction = v3.normalize(direction)
  normal = v3.normalize(normal)
  const coordinate: Tuple4<Vec3> = [[0, 0, 0], direction, v3.cross(direction, normal), normal]
  const e1 = Math.cos(radian), e2 = Math.sin(radian)
  const p1 = transformPointFromCoordinate([e1, e2, 0], coordinate)
  if (!p1) return
  return v3.normalize(p1)
}

export function getCoordinate(direction: Vec3): Tuple3<Vec3> {
  direction = v3.normalize(direction)
  const d1: Vec3 = isZero(direction[0]) && isZero(direction[1]) ? [1, 0, 0] : [0, 0, 1]
  const d2 = v3.normalize(v3.cross(direction, d1))
  const d3 = v3.cross(direction, d2)
  return [d2, d3, direction]
}
