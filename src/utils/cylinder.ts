import { calculateEquation2 } from "./equation-calculater";
import { equals, isBetween, isZero } from "./math";
import { v3 } from "./matrix";
import { getPerpendicularParamToLine, getPerpendicularPointToLine3D } from "./perpendicular";
import { getPointByLengthAndDirection3D, getPointByParamAndDirection3D } from "./position";
import { Vec3 } from "./types";
import { Validator, number } from "./validators";

export interface Cylinder {
  base: Vec3
  direction: Vec3
  radius: number
  height1: number
  height2: number
}

export const Cylinder: Validator = {
  base: Vec3,
  direction: Vec3,
  radius: number,
}

export function getLineAndCylinderIntersectionPoints([[x1, y1, z1], [x2, y2, z2]]: [Vec3, Vec3], { base: [x0, y0, z0], direction: [a, b, c], radius, height1, height2 }: Cylinder, extend?: boolean): Vec3[] {
  // (x,y,z) (x1,y1,z1) (x2,y2,z2)
  const e1 = x2 - x1, e2 = y2 - y1, e3 = z2 - z1
  // (x,y,z) = u (e1,e2,e3) + (x1,y1,z1)
  /**
   * @see getPerpendicularPointToLine3D
   */
  // t = (a(x - x0) + b(y - y0) + c(z - z0))/(a a + b b + c c)
  const f1 = 1 / (a * a + b * b + c * c)
  // replace x,y,z with u: t = f1(a(e1 u + x1 - x0) + b(e2 u + y1 - y0) + c(e3 u + z1 - z0))
  const g1 = x1 - x0, g2 = y1 - y0, g3 = z1 - z0
  // t = f1(a(e1 u + g1) + b(e2 u + g2) + c(e3 u + g3))
  // expand, group by u: t = (a e1 f1 + b e2 f1 + c e3 f1) u + a f1 g1 + b f1 g2 + c f1 g3
  const h1 = a * e1 * f1 + b * e2 * f1 + c * e3 * f1, h2 = a * f1 * g1 + b * f1 * g2 + c * f1 * g3
  // t = h1 u + h2

  // p = [x0 + a t, y0 + b t, z0 + c t]
  // (x0 + a t - x)^2 + (y0 + b t - y)^2 + (z0 + c t - z)^2 = radius^2
  // replace x,y,z with u: (x0 + a t - e1 u - x1)^2 + (y0 + b t - e2 u - y1)^2 + (z0 + c t - e3 u - z1)^2 - radius^2 = 0
  // (a t - e1 u - g1)^2 + (b t - e2 u - g2)^2 + (c t - e3 u - g3)^2 - radius^2 = 0
  // replace t with u: (a(h1 u + h2) - e1 u - g1)^2 + (b(h1 u + h2) - e2 u - g2)^2 + (c(h1 u + h2) - e3 u - g3)^2 - radius^2 = 0
  // ((a h1 - e1) u + a h2 - g1)^2 + ((b h1 - e2) u + b h2 - g2)^2 + ((c h1 - e3) u + c h2 - g3)^2 - radius^2 = 0
  const j1 = a * h1 - e1, j2 = a * h2 - g1, j3 = b * h1 - e2, j4 = b * h2 - g2, j5 = c * h1 - e3, j6 = c * h2 - g3
  // (j1 u + j2)^2 + (j3 u + j4)^2 + (j5 u + j6)^2 - radius^2 = 0
  // expand, group by u: (j1 j1 + j3 j3 + j5 j5) u u + (2 j1 j2 + 2 j3 j4 + 2 j5 j6) u + j2 j2 + j4 j4 + j6 j6 - radius radius = 0
  let us = calculateEquation2(
    j1 * j1 + j3 * j3 + j5 * j5,
    2 * j1 * j2 + 2 * j3 * j4 + 2 * j5 * j6,
    j2 * j2 + j4 * j4 + j6 * j6 - radius * radius,
  )
  if (!extend && us.length > 0) {
    const length = v3.length([e1, e2, e3])
    const minT = height1 / length
    const maxT = height2 / length
    us = us.filter(u => isBetween(h1 * u + h2, minT, maxT))
  }
  return us.map(u => [
    u * e1 + x1,
    u * e2 + y1,
    u * e3 + z1,
  ])
}

export function pointIsOnCylinder(p: Vec3, cylinder: Cylinder) {
  const param = getPerpendicularParamToLine(p, cylinder.base, cylinder.direction)
  const length = v3.length(cylinder.direction)
  const minParam = cylinder.height1 / length
  const maxParam = cylinder.height2 / length
  if (!isBetween(param, minParam, maxParam)) return false
  const point = getPointByParamAndDirection3D(cylinder.base, param, cylinder.direction)
  return equals(v3.length(v3.substract(p, point)), cylinder.radius)
}

export function getPerpendicularPointsToCylinder(p: Vec3, cylinder: Cylinder): [Vec3, Vec3] {
  const point = getPerpendicularPointToLine3D(p, cylinder.base, cylinder.direction)
  const direction = v3.substract(point, p)
  return [
    getPointByLengthAndDirection3D(point, cylinder.radius, direction),
    getPointByLengthAndDirection3D(point, -cylinder.radius, direction),
  ]
}

export function getParallelCylindersByDistance(cylinder: Cylinder, distance: number): [Cylinder, Cylinder] {
  if (isZero(distance)) {
    return [cylinder, cylinder]
  }
  return [
    { ...cylinder, radius: cylinder.radius - distance },
    { ...cylinder, radius: cylinder.radius + distance },
  ]
}

export function getCylinderNormalAtPoint(cylinder: Cylinder, p: Vec3): Vec3 {
  const point = getPerpendicularPointToLine3D(p, cylinder.base, cylinder.direction)
  return v3.substract(p, point)
}
