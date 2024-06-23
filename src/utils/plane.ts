import { calculateEquationSet } from "./equation-calculater";
import { GeneralFormLine } from "./line";
import { isZero } from "./math";
import { Vec3 } from "./types";
import { and, number } from "./validators";

export interface GeneralFormPlane extends GeneralFormLine {
  d: number
}

export const GeneralFormPlane = /* @__PURE__ */ and(GeneralFormLine, {
  d: number,
})

export function getLineAndPlaneIntersectionPoint([[x1, y1, z1], [x2, y2, z2]]: [Vec3, Vec3], { a, b, c, d }: GeneralFormPlane): Vec3 | undefined {
  // a x + b y + c z + d = 0
  // (x,y,z) (x1,y1,z1) (x2,y2,z2)
  const e1 = x2 - x1, e2 = y2 - y1, e3 = z2 - z1
  // e2(x - x1) - e1(y - y1) = 0
  // e3(x - x1) - e1(z - z1) = 0
  const result = calculateEquationSet([
    [a, b, c, d],
    [e2, -e1, 0, e1 * y1 - e2 * x1],
    [e3, 0, -e1, e1 * z1 - e3 * x1],
  ])
  if (!result) return
  return [
    result[0],
    result[1],
    result[2],
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
