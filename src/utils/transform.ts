import { Position, Size } from "./geometry"

export function transformPosition(
  { x, y }: Position,
  transform?: Partial<Transform>,
) {
  const positionX = (transform?.targetSize?.width ?? 0) / 2 - ((transform?.containerSize?.width ?? 0) / 2 - x + (transform?.x ?? 0)) / (transform?.scale ?? 1)
  const positionY = (transform?.targetSize?.height ?? 0) / 2 - ((transform?.containerSize?.height ?? 0) / 2 - y + (transform?.y ?? 0)) / (transform?.scale ?? 1)
  return {
    x: positionX,
    y: positionY,
  }
}

export function reverseTransformX(
  x: number,
  transform?: Partial<Transform>,
) {
  return (transform?.containerSize?.width ?? 0) / 2 - ((transform?.targetSize?.width ?? 0) / 2 - x) * (transform?.scale ?? 1) + (transform?.x ?? 0)
}

export function reverseTransformY(
  y: number,
  transform?: Partial<Transform>,
) {
  return (transform?.containerSize?.height ?? 0) / 2 - ((transform?.targetSize?.height ?? 0) / 2 - y) * (transform?.scale ?? 1) + (transform?.y ?? 0)
}

export interface Transform extends Position {
  containerSize: Size
  targetSize: Size
  scale: number
}

export interface Transform2 extends Position {
  center: Position
  scale: number
}

export function reverseTransformPosition(position: Position, transform?: Transform2) {
  if (!transform) {
    return position
  }
  return {
    x: (position.x - transform.center.x) / transform.scale + transform.center.x - transform.x / transform.scale,
    y: (position.y - transform.center.y) / transform.scale + transform.center.y - transform.y / transform.scale,
  }
}
