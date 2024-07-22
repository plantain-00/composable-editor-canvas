import { calculateEquation2 } from "./equation-calculater"
import { equals, isBetween, isZero } from "./math"
import { v3 } from "./matrix"
import { getPerpendicularParamToLine, getPerpendicularPointToLine3D } from "./perpendicular"
import { getPlaneByPointAndNormal, getPlaneNormal, getPointAndDirectionLineAndPlaneIntersectionPoint, getPointAndTwoDirectionsPlane, rotateDirectionByRadianOnPlane } from "./plane"
import { getPointByLengthAndDirection3D, getPointByParamAndDirection3D } from "./position"
import { Vec3 } from "./types"
import { number, Validator } from "./validators"

export interface Cone {
  base: Vec3
  direction: Vec3
  radiusHeightRate: number
  height1: number
  height2: number
}

export const Cone: Validator = {
  base: Vec3,
  direction: Vec3,
  radiusHeightRate: number,
}

export function getLineAndConeIntersectionPoints([[x1, y1, z1], [x2, y2, z2]]: [Vec3, Vec3], { base: [x0, y0, z0], direction: [a, b, c], radiusHeightRate, height1, height2 }: Cone, extend?: boolean): Vec3[] {
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
  // radiusHeightRate = sqrt((x0 + a t - x)^2 + (y0 + b t - y)^2 + (z0 + c t - z)^2) / sqrt((x0 + a t - x0)^2 + (y0 + b t - y0)^2 + (z0 + c t - z0)^2)
  // radiusHeightRate^2 ((a t)^2 + (b t)^2 + (c t)^2) = (x0 + a t - x)^2 + (y0 + b t - y)^2 + (z0 + c t - z)^2
  // radiusHeightRate^2 (a^2 + b^2 + c^2) t^2 = (x0 + a t - x)^2 + (y0 + b t - y)^2 + (z0 + c t - z)^2
  // radiusHeightRate^2 / f1 t^2 = (x0 + a t - x)^2 + (y0 + b t - y)^2 + (z0 + c t - z)^2
  const f2 = radiusHeightRate ** 2 / f1
  // (x0 + a t - x)^2 + (y0 + b t - y)^2 + (z0 + c t - z)^2 - f2 t^2 = 0
  // replace x,y,z with u: (x0 + a t - e1 u - x1)^2 + (y0 + b t - e2 u - y1)^2 + (z0 + c t - e3 u - z1)^2 - f2 t^2 = 0
  // (a t - e1 u - g1)^2 + (b t - e2 u - g2)^2 + (c t - e3 u - g3)^2 - f2 t^2 = 0
  // replace t with u: (a(h1 u + h2) - e1 u - g1)^2 + (b(h1 u + h2) - e2 u - g2)^2 + (c(h1 u + h2) - e3 u - g3)^2 - f2 (h1 u + h2)^2 = 0
  // ((a h1 - e1) u + a h2 - g1)^2 + ((b h1 - e2) u + b h2 - g2)^2 + ((c h1 - e3) u + c h2 - g3)^2 - f2 (h1 u + h2)^2 = 0
  const j1 = a * h1 - e1, j2 = a * h2 - g1, j3 = b * h1 - e2, j4 = b * h2 - g2, j5 = c * h1 - e3, j6 = c * h2 - g3
  // (j1 u + j2)^2 + (j3 u + j4)^2 + (j5 u + j6)^2 - f2 (h1 u + h2)^2 = 0
  // expand, group by u: (j1 j1 + j3 j3 + j5 j5 - f2 h1 h1) u u + (2 j1 j2 + 2 j3 j4 + 2 j5 j6 - 2 f2 h1 h2) u + j2 j2 + j4 j4 + j6 j6 - f2 h2 h2 = 0
  let us = calculateEquation2(
    j1 * j1 + j3 * j3 + j5 * j5 - f2 * h1 * h1,
    2 * j1 * j2 + 2 * j3 * j4 + 2 * j5 * j6 - 2 * f2 * h1 * h2,
    j2 * j2 + j4 * j4 + j6 * j6 - f2 * h2 * h2,
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

export function pointIsOnCone(p: Vec3, cone: Cone) {
  const param = getPerpendicularParamToLine(p, cone.base, cone.direction)
  const length = v3.length(cone.direction)
  const minParam = cone.height1 / length
  const maxParam = cone.height2 / length
  if (!isBetween(param, minParam, maxParam)) return false
  const point = getPointByParamAndDirection3D(cone.base, param, cone.direction)
  const height = v3.length(v3.substract(point, cone.base))
  const radius = v3.length(v3.substract(point, p))
  return equals(radius, cone.radiusHeightRate * height)
}

export function getPerpendicularPointsToCone(p: Vec3, cone: Cone): Vec3[] | undefined {
  const plane = getPointAndTwoDirectionsPlane(cone.base, cone.direction, v3.substract(p, cone.base))
  if (!plane) return
  const radian = Math.atan(cone.radiusHeightRate)
  const normal = getPlaneNormal(plane)
  const result: Vec3[] = []
  const direction1 = rotateDirectionByRadianOnPlane(cone.direction, radian, normal)
  if (direction1) {
    result.push(getPerpendicularPointToLine3D(p, cone.base, direction1))
  }
  const direction2 = rotateDirectionByRadianOnPlane(cone.direction, -radian, normal)
  if (direction2) {
    result.push(getPerpendicularPointToLine3D(p, cone.base, direction2))
  }
  return result
}

export function getParallelConesByDistance(cone: Cone, distance: number): [Cone, Cone] {
  if (isZero(distance)) {
    return [cone, cone]
  }
  const length = distance / cone.radiusHeightRate
  return [
    { ...cone, base: getPointByLengthAndDirection3D(cone.base, length, cone.direction) },
    { ...cone, base: getPointByLengthAndDirection3D(cone.base, -length, cone.direction) },
  ]
}

export function getConeNormalAtPoint(cone: Cone, p: Vec3): Vec3 | undefined {
  const plane = getPlaneByPointAndNormal(p, v3.substract(p, cone.base))
  const point = getPointAndDirectionLineAndPlaneIntersectionPoint(cone.base, cone.direction, plane)
  if (!point) return
  return v3.substract(p, point)
}
