import { calculateEquation2 } from "./equation-calculater"
import { Position3D } from "./position"
import { Vec3 } from "./types"
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
