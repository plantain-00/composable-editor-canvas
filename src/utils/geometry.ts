export function getPointByLengthAndDirection(
  startPoint: Position,
  length: number,
  directionPoint: Position
) {
  const dx = directionPoint.x - startPoint.x
  const dy = directionPoint.y - startPoint.y
  const offsetX = Math.sqrt(length ** 2 * dx ** 2 / (dx ** 2 + dy ** 2)) * (dx > 0 ? 1 : -1)
  return {
    x: startPoint.x + offsetX,
    y: startPoint.y + dy / dx * offsetX,
  }
}

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Region extends Position, Size { }

export interface Circle extends Position {
  r: number
}
