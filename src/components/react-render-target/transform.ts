import { getTwoNumberCenter, Position, Size } from "../../utils"

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
  points: Position[],
  { width, height }: Size,
  center: Position,
  paddingScale = 0.8,
) {
  if (points.length > 0) {
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const xMin = Math.min(...xs)
    const xMax = Math.max(...xs)
    const yMin = Math.min(...ys)
    const yMax = Math.max(...ys)
    if (xMin < xMax && yMin < yMax) {
      const scale = Math.min(width / (xMax - xMin), height / (yMax - yMin)) * paddingScale
      return {
        scale,
        x: (center.x - getTwoNumberCenter(xMin, xMax)) * scale,
        y: (center.y - getTwoNumberCenter(yMin, yMax)) * scale,
      }
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
