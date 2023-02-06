import { getPointByLengthAndDirection, Position, rotatePositionByCenter } from "./geometry"

export function getArrow(from: Position, to: Position, arrowSize: number, arrowAngle: number, strokeWidth = 1) {
  const arrow = getPointByLengthAndDirection(to, arrowSize, from)
  const distance = strokeWidth / 2 / Math.tan(arrowAngle * Math.PI / 180)
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
