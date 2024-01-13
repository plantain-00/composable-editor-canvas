import { Position, rotatePositionByCenter } from "./position"
import { getTwoPointsRadian, radianToAngle } from "./radian"

export function getAngleSnapPosition(
  startPosition: Position | undefined,
  newPosition: Position,
  getAngleSnap?: (angle: number) => number | undefined,
) {
  if (getAngleSnap && startPosition) {
    const angle = radianToAngle(getTwoPointsRadian(newPosition, startPosition))
    const newAngle = getAngleSnap(angle)
    if (newAngle !== undefined && newAngle !== angle) {
      newPosition = rotatePositionByCenter(newPosition, startPosition, angle - newAngle)
    }
  }
  return newPosition
}
