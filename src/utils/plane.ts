import { calculateEquation2, calculateEquationSet } from "./equation-calculater";
import { GeneralFormLine } from "./line";
import { isZero } from "./math";
import { v3 } from "./matrix";
import { Tuple3, Vec3 } from "./types";
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

export function getPointAndTwoDirectionsPlane([x1, y1, z1]: Vec3, [e1, f1, g1]: Vec3, [e2, f2, g2]: Vec3): GeneralFormPlane | undefined {
  // a x1 + b y1 + c z1 + d = 0
  // a(x1 + e1) + b(y1 + f1) + c(z1 + g1) + d = 0
  // a(x1 + e2) + b(y1 + f2) + c(z1 + g2) + d = 0

  // a e1 + b f1 + c g1 = 0
  // a e2 + b f2 + c g2 = 0

  // a e1 g2 + b f1 g2 + c g1 g2 = 0
  // a e2 g1 + b f2 g1 + c g1 g2 = 0
  // a(e2 g1 - e1 g2) - b(f1 g2 - f2 g1) = 0

  // a e1 f2 + b f1 f2 + c f2 g1 = 0
  // a e2 f1 + b f1 f2 + c f1 g2 = 0
  // a(e1 f2 - e2 f1) - c(f1 g2 - f2 g1) = 0

  const a = f1 * g2 - f2 * g1
  const b = e2 * g1 - e1 * g2
  const c = e1 * f2 - e2 * f1
  const d = -(a * x1 + b * y1 + c * z1)
  return { a, b, c, d }
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

export function rotateDirectionByRadianOnPlane(direction: Vec3, radian: number, plane: GeneralFormPlane): Vec3[] {
  const [d1, d2, d3] = v3.normalize(direction)
  const [a, b, c] = v3.normalize([plane.a, plane.b, plane.c])
  const e = Math.cos(radian)
  // a d1 + b d2 + c d3 = 0
  // d1^2 + d2^2 + d3^2 = 1
  // a^2 + b^2 + c^2 = 1
  // a x + b y + c z = 0
  // x^2 + y^2 + z^2 = 1
  // d1 x + d2 y + d3 z = e

  if (isZero(c)) {
    if (isZero(d3)) {
      const xy = calculateEquationSet([
        [a, b, 0],
        [d1, d2, -e],
      ])
      if (!xy) return []
      const [x, y] = xy
      return [[x, y, Math.sqrt(1 - x ** 2 + y ** 2)]]
    }
    // d3 z = e - d1 x - d2 y
    // d3 d3 x^2 + d3 d3 y^2 + d3 d3 z^2 = d3 d3
    // d3 d3 x^2 + d3 d3 y^2 + (e - d1 x - d2 y)^2 - d3 d3 = 0
    // (d3 d3 + d1 d1) x x + (2 d1 d2 y + -2 d1 e) x + (d3 d3 + d2 d2) y y + -2 d2 e y + e e + -d3 d3 = 0
    // (1 - d2 d2) x x + (2 d1 d2 y + -2 d1 e) x + (1 - d1 d1) y y + -2 d2 e y + e e + -d3 d3 = 0
    // y = -a / b x
    if (isZero(b)) return []
    const g1 = -a / b
    // (1 + -d1 d1 g1 g1 + 2 d1 d2 g1 + -d2 d2 + g1 g1) x x + (-2 d2 e g1 + -2 d1 e) x + e e - d3 d3 = 0
    const xs = calculateEquation2(
      1 - d1 * d1 * g1 * g1 + 2 * d1 * d2 * g1 - d2 * d2 + g1 * g1,
      -2 * d2 * e * g1 - 2 * d1 * e,
      e * e - d3 * d3,
    )
    return xs.map(x => {
      const y = g1 * x
      return [x, y, (e - d1 * x - d2 * y) / d3]
    })
  }

  // c z = -(a x + b y)
  // c c x^2 + c c y^2 + c c z^2 = c c
  // c c x^2 + c c y^2 + (a x + b y)^2 - c c = 0
  // (a a + c c) x x + 2 a b x y + (b b + c c) y y - c c = 0
  const h1 = a * a + c * c, h2 = b * b + c * c, h3 = c * c
  // F1: h1 x x + 2 a b x y + h2 y y - h3 = 0

  // a d3 x + b d3 y + c d3 z = 0
  // c d1 x + c d2 y + c d3 z = c e
  // (c d1 - a d3) x + (c d2 - b d3) y = c e
  const g1 = c * d1 - a * d3, g2 = c * d2 - b * d3, g3 = c * e
  // g1 x + g2 y - g3 = 0

  if (isZero(g2)) {
    if (isZero(g1)) return []
    const x = g3 / g1
    const ys = calculateEquation2(
      h2,
      2 * a * b * x,
      h1 * x * x - h3,
    )
    return ys.map(y => {
      return [x, y, -(a * x + b * y) / c]
    })
  }

  // g2 y = g3 - g1 x
  // F1*g2 g2: g2 g2 h1 x x + 2 a b g2 g2 x y + g2 g2 h2 y y - g2 g2 h3 = 0
  // g2 g2 h1 x x + 2 a b g2 x(g3 - g1 x) + h2(g3 - g1 x)^2 - g2 g2 h3 = 0
  // (-2 a b g1 g2 + g2 g2 h1 + g1 g1 h2) x x + (2 a b g2 g3 + -2 g1 g3 h2) x + g3 g3 h2 + -g2 g2 h3 = 0
  // A: c c (b b d1 d1 + c c d1 d1 + -2 a b d1 d2 + a a d2 d2 + c c d2 d2 + -2 a c d1 d3 + -2 b c d2 d3 + a a d3 d3 + b b d3 d3)
  // A: b b d1 d1 + c c d1 d1 + -2 a b d1 d2 + a a d2 d2 + c c d2 d2 + -2 a c d1 d3 + -2 b c d2 d3 + a a d3 d3 + b b d3 d3
  // A: (1 - a a) d1 d1 + -2 a b d1 d2 + (1 - b b) d2 d2 + -2 a c d1 d3 + -2 b c d2 d3 + (1 - c c) d3 d3
  // A: (d1 d1 + d2 d2 + d3 d3) + (-a a d1 d1 + -2 a b d1 d2 + -b b d2 d2) + -2 a c d1 d3 + -2 b c d2 d3 + -c c d3 d3
  // A: 1 - (a d1 + b d2)^2 + -2 a c d1 d3 + -2 b c d2 d3 + -c c d3 d3
  // A: 1 - c c d3 d3 + -2 a c d1 d3 + -2 b c d2 d3 + -c c d3 d3
  // A: 1 - 2 (a d1 + b d2 + c d3) c d3
  // A: 1
  // B: 2 c c e (-b b d1 + -c c d1 + a b d2 + a c d3)
  // B: 2 e (-b b d1 + -c c d1 - a a d1)
  // B: -2 e d1
  // C: g3 g3 h2 + -g2 g2 h3
  // C: c c e e(1 - a a) - g2 g2 c c
  // C: c c (e e(1 - a a) - g2 g2)
  const xs = calculateEquation2(
    1,
    -2 * e * d1,
    e * e * (1 - a * a) - g2 * g2,
  )
  return xs.map(x => {
    const y = (g3 - g1 * x) / g2
    return [x, y, -(a * x + b * y) / c]
  })
}
