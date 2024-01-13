import { Position, rotatePositionByCenter } from "./position"
import { getPointByLengthAndDirection } from "./position"
import { angleToRadian } from "./radian"

export function getArrow(from: Position, to: Position, arrowSize: number, arrowAngle: number, strokeWidth = 1) {
  const arrow = getPointByLengthAndDirection(to, arrowSize, from)
  const distance = strokeWidth / 2 / Math.tan(angleToRadian(arrowAngle))
  return {
    arrowPoints: [
      to,
      rotatePositionByCenter(arrow, to, arrowAngle),
      rotatePositionByCenter(arrow, to, -arrowAngle),
    ],
    distance,
    endPoint: getPointByLengthAndDirection(to, distance, from),
  }
}
