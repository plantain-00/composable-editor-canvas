import { Arc, Circle, Ellipse, EllipseArc, Position, getTwoPointsDistance, isZero } from "./geometry"
import { angleToRadian } from "./radian"

export function getParallelCirclesByDistance<T extends Circle>(circle: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [circle, circle]
  }
  return [
    {
      ...circle,
      r: circle.r - distance, // on right side of circle
    },
    {
      ...circle,
      r: circle.r + distance, // on left side of circle
    },
  ]
}

export function getParallelArcsByDistance<T extends Arc>(arc: T, distance: number): [T, T] {
  const arcs = getParallelCirclesByDistance(arc, distance)
  if (arc.counterclockwise) {
    return [arcs[1], arcs[0]]
  }
  return arcs
}

export function getParallelEllipsesByDistance<T extends Ellipse>(ellipse: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [ellipse, ellipse]
  }
  return [
    {
      ...ellipse,
      rx: ellipse.rx - distance, // on right side of ellipse
      ry: ellipse.ry - distance,
    },
    {
      ...ellipse,
      rx: ellipse.rx + distance, // on left side of ellipse
      ry: ellipse.ry + distance,
    },
  ]
}

export function getParallelEllipseArcsByDistance<T extends EllipseArc>(ellipseArc: T, distance: number): [T, T] {
  const ellipseArcs = getParallelEllipsesByDistance(ellipseArc, distance)
  if (ellipseArc.counterclockwise) {
    return [ellipseArcs[1], ellipseArcs[0]]
  }
  return ellipseArcs
}

/**
 * 0: point on circle
 * 1: point on left side of circle
 * -1: point on right side of circle
 */
export function getPointSideOfCircle(point: Position, circle: Circle): number {
  const distance = getTwoPointsDistance(point, circle)
  if (isZero(distance - circle.r)) return 0
  return distance > circle.r ? 1 : -1
}

/**
 * 0: point on arc
 * 1: point on left side of arc
 * -1: point on right side of arc
 */
export function getPointSideOfArc(point: Position, arc: Arc): number {
  return getPointSideOfCircle(point, arc) * (arc.counterclockwise ? -1 : 1)
}

/**
 * 0: point on ellipse
 * 1: point on left side of ellipse
 * -1: point on right side of ellipse
 */
export function getPointSideOfEllipse(point: Position, { rx, ry, cx, cy, angle }: Ellipse): number {
  const radian = angleToRadian(angle)
  const a1 = Math.sin(radian), a2 = Math.cos(radian)
  // (a2(x - cx) + a1(y - cy))^2/rx/rx + (-a1(x - cx) + a2(y - cy))^2/ry/ry = 1
  const d = (a2 * (point.x - cx) + a1 * (point.y - cy)) ** 2 / rx / rx + (-a1 * (point.x - cx) + a2 * (point.y - cy)) ** 2 / ry / ry
  if (isZero(d - 1)) return 0
  return d > 1 ? 1 : -1
}

/**
 * 0: point on ellipse arc
 * 1: point on left side of ellipse arc
 * -1: point on right side of ellipse arc
 */
export function getPointSideOfEllipseArc(point: Position, arc: EllipseArc): number {
  return getPointSideOfEllipse(point, arc) * (arc.counterclockwise ? -1 : 1)
}
