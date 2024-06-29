import { GeneralFormLine } from "./line";
import { isZero } from "./math";
import { v3 } from "./matrix";
import { Vec3 } from "./types";
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

export function getLineAndZPlaneIntersectionPoint([[x1, y1, z1], [x2, y2, z2]]: [Vec3, Vec3], z: number): Vec3 {
  const b = (z - z1) / (z2 - z1)
  return [
    x1 + (x2 - x1) * b,
    y1 + (y2 - y1) * b,
    z,
  ]
}

export function pointIsOnPlane([x, y, z]: Vec3, { a, b, c, d }: GeneralFormPlane) {
  return isZero(a * x + b * y + c * z + d)
}

export function getThreePointPlane([x1, y1, z1]: Vec3, [x2, y2, z2]: Vec3, [x3, y3, z3]: Vec3): GeneralFormPlane | undefined {
  // a x1 + b y1 + c z1 + d = 0
  // a x2 + b y2 + c z2 + d = 0
  // a x3 + b y3 + c z3 + d = 0
  const e1 = x1 - x2, e2 = x1 - x3
  const f1 = y1 - y2, f2 = y1 - y3
  const g1 = z1 - z2, g2 = z1 - z3
  // a e1 + b f1 + c g1 = 0
  // a e2 + b f2 + c g2 = 0

  // a e1 g2 + b f1 g2 + c g1 g2 = 0
  // a e2 g1 + b f2 g1 + c g1 g2 = 0

  // a (e1 g2 - e2 g1) + b (f1 g2 - f2 g1) = 0
  const a = f1 * g2 - f2 * g1
  const b = e2 * g1 - e1 * g2
  let c: number
  if (!isZero(g1)) {
    c = -(a * e1 + b * f1) / g1
  } else if (!isZero(g2)) {
    c = -(a * e2 + b * f2) / g2
  } else {
    return { a: 0, b: 0, c: 1, d: -z1 }
  }
  const d = -(a * x1 + b * y1 + c * z1)
  return { a, b, c, d }
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
