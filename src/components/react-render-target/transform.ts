import { getTwoNumberCenter, Position, Size, TwoPointsFormRegion } from "../../utils"

/**
 * @public
 */
export interface Transform extends Position {
  center: Position
  scale: number
}

/**
 * @public
 */
export function reverseTransformPosition(position: Position, transform: Transform | undefined) {
  if (!transform) {
    return position
  }
  return {
    x: (position.x - transform.center.x - transform.x) / transform.scale + transform.center.x,
    y: (position.y - transform.center.y - transform.y) / transform.scale + transform.center.y,
  }
}

/**
 * @public
 */
export function zoomToFit(
  bounding: TwoPointsFormRegion | undefined,
  { width, height }: Size,
  center: Position,
  paddingScale = 0.8,
) {
  if (bounding && bounding.start.x < bounding.end.x && bounding.start.y < bounding.end.y) {
    const scale = Math.min(width / (bounding.end.x - bounding.start.x), height / (bounding.end.y - bounding.start.y)) * paddingScale
    return {
      scale,
      x: (center.x - getTwoNumberCenter(bounding.start.x, bounding.end.x)) * scale,
      y: (center.y - getTwoNumberCenter(bounding.start.y, bounding.end.y)) * scale,
    }
  }
  return
}

/**
 * @public
 */
export function scaleByCursorPosition({ width, height }: Size, scale: number, cursor: Position) {
  return {
    setX: (x: number) => cursor.x - width / 2 - (cursor.x - width / 2 - x) * scale,
    setY: (y: number) => cursor.y - height / 2 - (cursor.y - height / 2 - y) * scale,
  }
}
