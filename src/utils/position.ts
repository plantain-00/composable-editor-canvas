import { equals, getTwoNumberCenter } from "./math";
import { deduplicate } from "./math";
import { isSameNumber } from "./math";
import { isZero } from "./math";
import { v3 } from "./matrix";
import { angleToRadian, getDirectionByRadian } from "./radian";
import { Vec2, Vec3 } from "./types";
import { and, number } from "./validators";

export interface Position {
  x: number
  y: number
}

export const Position = {
  x: number,
  y: number,
}


export interface Position3D extends Position {
  z: number
}

export const Position3D = /* @__PURE__ */ and(Position, {
  z: number,
})

export function position3DToVec3(p: Position3D): Vec3 {
  return [p.x, p.y, p.z]
}

export function vec3ToPosition3D(vec: Vec3): Position3D {
  return {
    x: vec[0],
    y: vec[1],
    z: vec[2],
  }
}

export function positionToVec2(p: Position): Vec2 {
  return [p.x, p.y]
}

export function vec2ToPosition(vec: Vec2): Position {
  return {
    x: vec[0],
    y: vec[1],
  }
}

export function getPointByLengthAndDirection(
  startPoint: Position,
  length: number,
  directionPoint: Position
) {
  let dx = directionPoint.x - startPoint.x
  let dy = directionPoint.y - startPoint.y
  if (isZero(length)) {
    return startPoint
  }
  if (length < 0) {
    length = -length
    dx = -dx
    dy = -dy
  }
  if (isZero(dx)) {
    return {
      x: startPoint.x,
      y: startPoint.y + length * (dy > 0 ? 1 : -1),
    }
  }
  const offsetX = Math.sqrt(length ** 2 * dx ** 2 / (dx ** 2 + dy ** 2)) * (dx > 0 ? 1 : -1)
  return {
    x: startPoint.x + offsetX,
    y: startPoint.y + dy / dx * offsetX,
  }
}

export function getPointByLengthAndDirectionSafely(
  startPoint: Position,
  length: number,
  directionPoint: Position
) {
  if (isSamePoint(startPoint, directionPoint)) {
    return undefined
  }
  return getPointByLengthAndDirection(startPoint, length, directionPoint)
}

export function isSamePoint(p1: Position, p2: Position, delta?: number) {
  return isSameNumber(p1.x, p2.x, delta) && isSameNumber(p1.y, p2.y, delta)
}

export function getPointByLengthAndRadian(
  startPoint: Position,
  length: number,
  radian: number
) {
  const direction = multiplyDirection(getDirectionByRadian(radian), length)
  return {
    x: startPoint.x + direction.x,
    y: startPoint.y + direction.y,
  }
}

export function multiplyDirection(direction: Position, scalar: number): Position {
  return {
    x: direction.x * scalar,
    y: direction.y * scalar,
  }
}

export function getPointAndPolygonMaximumDistance(position: Position, polygon: Position[]) {
  return Math.max(...polygon.map((r) => getTwoPointsDistance(position, r)))
}

export function getTwoPointsDistance(point1: Position, point2: Position = { x: 0, y: 0 }) {
  return Math.sqrt(getTwoPointsDistanceSquare(point1, point2))
}

export function getTwoPointsDistanceSquare(point1: Position, point2: Position = { x: 0, y: 0 }) {
  return (point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2
}

export function getTwoPointsDistance3D(point1: Position3D, point2: Position3D = { x: 0, y: 0, z: 0 }) {
  return Math.sqrt(getTwoPointsDistance3DSquare(point1, point2))
}

export function getTwoPointsDistance3DSquare(point1: Position3D, point2: Position3D = { x: 0, y: 0, z: 0 }) {
  return (point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2 + (point1.z - point2.z) ** 2
}

export function getTwoPointCenter(p1: Position, p2: Position) {
  return {
    x: getTwoNumberCenter(p1.x, p2.x),
    y: getTwoNumberCenter(p1.y, p2.y),
  }
}

export function deduplicatePosition(array: Position[]) {
  return deduplicate(array, isSamePoint)
}

export function rotatePositionByCenter(position: Position, center: Position, angle: number) {
  if (!angle) {
    return position
  }
  return rotatePosition(position, center, -angleToRadian(angle))
}

export function rotatePosition(position: Position, center: Position, radian: number) {
  if (!radian) {
    return position
  }
  const offsetX = position.x - center.x
  const offsetY = position.y - center.y
  const sin = Math.sin(radian)
  const cos = Math.cos(radian)
  return {
    x: cos * offsetX - sin * offsetY + center.x,
    y: sin * offsetX + cos * offsetY + center.y,
  }
}

export function isSameDirection(d1: Position, d2: Position): boolean {
  return equals(d1.x * d2.y, d1.y * d2.x)
}

export function isSameDirection3D(d1: Vec3, d2: Vec3): boolean {
  return isSameDirection({ x: d1[0], y: d1[1] }, { x: d2[0], y: d2[1] }) && isSameDirection({ x: d1[0], y: d1[2] }, { x: d2[0], y: d2[2] })
}

export function getPointByLengthAndDirection3D(startPoint: Vec3, length: number, direction: Vec3): Vec3 {
  const param = length / v3.length(direction)
  return getPointByParamAndDirection3D(startPoint, param, direction)
}

export function getPointByParamAndDirection3D(startPoint: Vec3, param: number, direction: Vec3): Vec3 {
  return v3.add(startPoint, v3.multiplyScalar(direction, param))
}
