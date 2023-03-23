import { getTwoPointsAngle, Position, rotatePositionByCenter } from "./geometry"
import { radianToAngle } from "./radian"

export function getAngleSnapPosition(
  startPosition: Position | undefined,
  newPosition: Position,
  getAngleSnap?: (angle: number) => number | undefined,
) {
  if (getAngleSnap && startPosition) {
    const angle = radianToAngle(getTwoPointsAngle(newPosition, startPosition))
    const newAngle = getAngleSnap(angle)
    if (newAngle !== undefined && newAngle !== angle) {
      newPosition = rotatePositionByCenter(newPosition, startPosition, angle - newAngle)
    }
  }
  return newPosition
}
