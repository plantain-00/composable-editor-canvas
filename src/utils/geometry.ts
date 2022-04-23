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

/**
 * @public
 */
export function getFootPoint(point: Position, line: GeneralFormLine): Position {
  const d = line.a ** 2 + line.b ** 2
  const e = line.a * line.b
  return {
    x: (line.b ** 2 * point.x - e * point.y - line.a * line.c) / d,
    y: (-e * point.x + line.a ** 2 * point.y - line.b * line.c) / d,
  }
}

/**
 * @public
 */
export function getTwoPointsDistance(point1: Position, point2: Position) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2)
}

/**
 * @public
 */
export function getTwoNumbersDistance(n1: number, n2: number) {
  return Math.abs(n1 - n2)
}

/**
 * @public
 */
export function isBetween(target: number, a: number, b: number) {
  return target < Math.max(a, b) && target > Math.min(a, b)
}

/**
 * @public
 */
export function TwoPointLineToGeneralFormLine(point1: Position, point2: Position): GeneralFormLine {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return {
    a: dy,
    b: -dx,
    c: -point1.x * dy + point1.y * dx,
  }
}

export function getThreePointsCircle(startPosition: Position, middlePosition: Position, endPosition: Position) {
  const x1 = middlePosition.x - startPosition.x
  const y1 = middlePosition.y - startPosition.y
  const x2 = endPosition.x - middlePosition.x
  const y2 = endPosition.y - middlePosition.y
  const t1 = middlePosition.x ** 2 - startPosition.x ** 2 + middlePosition.y ** 2 - startPosition.y ** 2
  const t2 = endPosition.x ** 2 - middlePosition.x ** 2 + endPosition.y ** 2 - middlePosition.y ** 2
  const center = {
    x: (t1 * y2 - t2 * y1) / (x1 * y2 - x2 * y1) / 2,
    y: (x2 * t1 - t2 * x1) / (x2 * y1 - y2 * x1) / 2,
  }
  return {
    ...center,
    r: getTwoPointsDistance(center, startPosition),
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

/**
 * @public
 */
export interface GeneralFormLine {
  a: number
  b: number
  c: number
}

export interface Region extends Position, Size { }

export interface Circle extends Position {
  r: number
}
