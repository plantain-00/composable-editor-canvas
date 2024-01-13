import { Position } from "./position"

export function radianToAngle(radian = 0) {
  return radian * 180 / Math.PI
}

export function angleToRadian(angle = 0) {
  return angle * Math.PI / 180
}

export function getTwoPointsRadian(to: Position, from: Position = { x: 0, y: 0 }) {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

export function getDirectionByRadian(radian: number): Position {
  return {
    x: Math.cos(radian),
    y: Math.sin(radian),
  }
}
