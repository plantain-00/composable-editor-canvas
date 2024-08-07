import { arcToPolyline, circleToArc } from "./circle"
import { calculateEquation2 } from "./equation-calculater"
import { equals, isZero } from "./math"
import { matrix, v3 } from "./matrix"
import { GeneralFormPlane, getCoordinate, getPerpendicularPointToPlane } from "./plane"
import { Position3D, getPointByLengthAndDirection3D, getTwoPointsDistance3D, position3DToVec3, vec3ToPosition3D } from "./position"
import { getCoordinateMatrix, getCoordinateVec } from "./transform"
import { slice3, Tuple4, Vec3 } from "./types"
import { and, number } from "./validators"

export interface Sphere extends Position3D {
  radius: number
}

export const Sphere = /* @__PURE__ */ and(Position3D, {
  radius: number,
})

export function getLineAndSphereIntersectionPoints([[x1, y1, z1], [x2, y2, z2]]: [Vec3, Vec3], { x: x0, y: y0, z: z0, radius }: Sphere): Vec3[] {
  const a1 = radius ** 2
  // (x - x0)^2 + (y - y0)^2 + (z - z0)^2 = a1
  // let u = x - x0, v = y - y0, w = z - z0
  // F1: u^2 + v^2 + w^2 = a1

  // (x,y,z) (x1,y1,z1) (x2,y2,z2)
  const e1 = x2 - x1, e2 = y2 - y1, e3 = z2 - z1
  // (x,y,z) = t (e1,e2,e3) + (x1,y1,z1)
  // replace x,y,z with u,v,w: (u + x0,v + y0,w + z0) = t (e1,e2,e3) + (x1,y1,z1)
  // (u,v,w) = t (e1,e2,e3) + (x1 - x0,y1 - y0,z1 - z0)
  const b1 = x1 - x0, b2 = y1 - y0, b3 = z1 - z0
  // (u,v,w) = t (e1,e2,e3) + (b1,b2,b3)
  // F1 replace u,v,w with t: (e1 t + b1)^2 + (e2 t + b2)^2 + (e3 t + b3)^2 - a1 = 0
  // (e1 e1 + e2 e2 + e3 e3) t t + (2 b1 e1 + 2 b2 e2 + 2 b3 e3) t + -a1 + b1 b1 + b2 b2 + b3 b3 = 0
  const ts = calculateEquation2(
    e1 * e1 + e2 * e2 + e3 * e3,
    2 * (b1 * e1 + b2 * e2 + b3 * e3),
    b1 * b1 + b2 * b2 + b3 * b3 - a1,
  )
  return ts.map(t => [
    e1 * t + b1 + x0,
    e2 * t + b2 + y0,
    e3 * t + b3 + z0,
  ])
}

export function pointIsOnSphere(p: Vec3, sphere: Sphere) {
  return equals(getTwoPointsDistance3D(vec3ToPosition3D(p), sphere), sphere.radius)
}

export function getPerpendicularPointsToSphere(p: Vec3, sphere: Sphere): [Vec3, Vec3] {
  const direction: Vec3 = [
    p[0] - sphere.x,
    p[1] - sphere.y,
    p[2] - sphere.z,
  ]
  return [
    getPointByLengthAndDirection3D(p, sphere.radius, direction),
    getPointByLengthAndDirection3D(p, -sphere.radius, direction),
  ]
}

export function getParallelSpheresByDistance(sphere: Sphere, distance: number): [Sphere, Sphere] {
  if (isZero(distance)) {
    return [sphere, sphere]
  }
  return [
    { ...sphere, radius: sphere.radius - distance },
    { ...sphere, radius: sphere.radius + distance },
  ]
}

export function getSphereNormalAtPoint(sphere: Sphere, point: Vec3): Vec3 {
  return v3.substract(point, position3DToVec3(sphere))
}

export function getPlaneSphereIntersection(plane: GeneralFormPlane, sphere: Sphere): Vec3[] | undefined {
  const start = position3DToVec3(sphere)
  const p = getPerpendicularPointToPlane(start, plane)
  const direction = v3.substract(p, start)
  const r = Math.sqrt(sphere.radius ** 2 - v3.lengthSquare(direction))
  if (isNaN(r)) return
  // x = r cos(t)
  // y = r sin(t)
  // z = 0
  const coordinate: Tuple4<Vec3> = [p, ...getCoordinate(direction)]
  const m = getCoordinateMatrix(coordinate)
  if (!m) return
  return arcToPolyline(circleToArc({ x: 0, y: 0, r }), 5).map(n => slice3(matrix.multiplyVec(m, getCoordinateVec([n.x, n.y, 0], coordinate))))
}

export function getTwoSpheresIntersection(sphere1: Sphere, sphere2: Sphere): Vec3[] | undefined {
  const start = position3DToVec3(sphere1)
  const direction = v3.substract(position3DToVec3(sphere2), start)
  const distanceSquare = v3.lengthSquare(direction)
  const distance = Math.sqrt(distanceSquare)
  const cos = (sphere1.radius ** 2 + distanceSquare - sphere2.radius ** 2) / 2 / sphere1.radius / distance
  if (cos < -1 || cos > 1) return
  const d = sphere1.radius * cos
  const p = getPointByLengthAndDirection3D(start, d, direction)
  const r = Math.sqrt(sphere1.radius ** 2 - d ** 2)
  if (isNaN(r)) return
  // x = r cos(t)
  // y = r sin(t)
  // z = 0
  const coordinate: Tuple4<Vec3> = [p, ...getCoordinate(direction)]
  const m = getCoordinateMatrix(coordinate)
  if (!m) return
  return arcToPolyline(circleToArc({ x: 0, y: 0, r }), 5).map(n => slice3(matrix.multiplyVec(m, getCoordinateVec([n.x, n.y, 0], coordinate))))
}
