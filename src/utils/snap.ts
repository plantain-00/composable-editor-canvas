import { Position, rotatePositionByCenter } from "./geometry"

export function getAngleSnapPosition(
  startPosition: Position | undefined,
  newPosition: Position,
  getAngleSnap?: (angle: number) => number | undefined,
) {
  if (getAngleSnap && startPosition) {
    const angle = Math.atan2(newPosition.y - startPosition.y, newPosition.x - startPosition.x) * 180 / Math.PI
    const newAngle = getAngleSnap(angle)
    if (newAngle !== undefined && newAngle !== angle) {
      newPosition = rotatePositionByCenter(newPosition, startPosition, angle - newAngle)
    }
  }
  return newPosition
}
