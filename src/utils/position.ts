import { getTwoNumberCenter } from "./math";
import { deduplicate } from "./math";
import { isSameNumber } from "./math";
import { isZero } from "./math";
import { angleToRadian, getDirectionByRadian } from "./radian";
import { number } from "./validators";

export interface Position {
  x: number
  y: number
}

export const Position = {
  x: number,
  y: number,
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
  const direction = multipleDirection(getDirectionByRadian(radian), length)
  return {
    x: startPoint.x + direction.x,
    y: startPoint.y + direction.y,
  }
}

export function multipleDirection(direction: Position, scalar: number): Position {
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
