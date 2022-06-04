import { Position } from "../../utils"

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
