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
export function getPointAndLineMinimumDistance(position: Position, point1: Position, point2: Position) {
  const footPoint = getFootPoint(position, twoPointLineToGeneralFormLine(point1, point2))
  if (pointIsOnLineSegment(footPoint, point1, point2)) {
    return getTwoPointsDistance(position, footPoint)
  }
  return Math.min(getTwoPointsDistance(position, point1), getTwoPointsDistance(position, point2))
}

function pointIsOnLineSegment(p: Position, point1: Position, point2: Position) {
  if (point1.x !== point2.x && isBetween(p.x, point1.x, point2.x)) {
    return true
  }
  if (point1.y !== point2.y && isBetween(p.y, point1.y, point2.y)) {
    return true
  }
  return false
}

/**
 * @public
 */
export function getPointAndRegionMinimumDistance(position: Position, region: TwoPointsFormRegion) {
  const polygon = getPolygonFromTwoPointsFormRegion(region)
  const polygonLine = Array.from(getPolygonLine(polygon))
  return Math.min(...polygonLine.map((r) => getPointAndLineMinimumDistance(position, ...r)))
}

/**
 * @public
 */
export function getPointAndRegionMaximumDistance(position: Position, region: TwoPointsFormRegion) {
  const polygon = getPolygonFromTwoPointsFormRegion(region)
  return Math.max(...polygon.map((r) => getTwoPointsDistance(position, r)))
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
export function twoPointLineToGeneralFormLine(point1: Position, point2: Position): GeneralFormLine {
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

/**
 * @public
 */
export function getTwoPointsFormRegion(p1: Position, p2: Position): TwoPointsFormRegion {
  return {
    start: {
      x: Math.min(p1.x, p2.x),
      y: Math.min(p1.y, p2.y),
    },
    end: {
      x: Math.max(p1.x, p2.x),
      y: Math.max(p1.y, p2.y),
    },
  }
}

/**
 * @public
 */
export function getRegion(p1: Position, p2: Position): Region {
  return {
    x: Math.min(p1.x, p2.x),
    y: Math.min(p1.y, p2.y),
    width: getTwoNumbersDistance(p1.x, p2.x),
    height: getTwoNumbersDistance(p1.y, p2.y),
  }
}

/**
 * @public
 */
export function pointIsInRegion(point: Position, region: TwoPointsFormRegion) {
  return point.x >= region.start.x && point.y >= region.start.y && point.x <= region.end.x && point.y <= region.end.y
}

/**
 * @public
 */
export function lineIntersectWithTwoPointsFormRegion(p1: Position, p2: Position, region: TwoPointsFormRegion) {
  return lineIntersectWithPolygon(p1, p2, getPolygonFromTwoPointsFormRegion(region))
}

function getPolygonFromTwoPointsFormRegion(region: TwoPointsFormRegion) {
  return [
    region.start,
    { x: region.start.x, y: region.end.y },
    region.end,
    { x: region.end.x, y: region.start.y },
  ]
}

function lineIntersectWithPolygon(p1: Position, p2: Position, polygon: Position[]) {
  for (const line of getPolygonLine(polygon)) {
    if (lineIntersectWithLine(p1, p2, ...line)) {
      return true
    }
  }
  return false
}

function* getPolygonLine(polygon: Position[]): Generator<[Position, Position], void, unknown> {
  for (let i = 0; i < polygon.length; i++) {
    yield [polygon[i], polygon[i + 1 < polygon.length ? i + 1 : 0]]
  }
}

function lineIntersectWithLine(a: Position, b: Position, c: Position, d: Position) {
  if (!(Math.min(a.x, b.x) <= Math.max(c.x, d.x) && Math.min(c.y, d.y) <= Math.max(a.y, b.y) && Math.min(c.x, d.x) <= Math.max(a.x, b.x) && Math.min(a.y, b.y) <= Math.max(c.y, d.y))) {
    return false
  }
  const u = (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y)
  const v = (d.x - a.x) * (b.y - a.y) - (b.x - a.x) * (d.y - a.y)
  const w = (a.x - c.x) * (d.y - c.y) - (d.x - c.x) * (a.y - c.y)
  const z = (b.x - c.x) * (d.y - c.y) - (d.x - c.x) * (b.y - c.y)
  return (u * v <= 0.00000001 && w * z <= 0.00000001);
}

/**
 * @public
 */
export function getSymmetryPoint(p: Position, { a, b, c }: GeneralFormLine) {
  const d = a ** 2
  const e = b ** 2
  const x = ((e - d) * p.x - 2 * a * b * p.y - 2 * a * c) / (d + e)
  return {
    x: x,
    y: b * (x - p.x) / a + p.y,
  }
}

/**
 * @public
 */
export function getTwoLinesIntersectionPoint(p1Start: Position, p1End: Position, p2Start: Position, p2End: Position) {
  const { a: a1, b: b1, c: c1 } = twoPointLineToGeneralFormLine(p1Start, p1End)
  const { a: a2, b: b2, c: c2 } = twoPointLineToGeneralFormLine(p2Start, p2End)
  const d = a2 * b1 - a1 * b2
  if (d === 0) {
    return undefined
  }
  const result = {
    x: (c1 * b2 - b1 * c2) / d,
    y: (c2 * a1 - c1 * a2) / d,
  }
  if (pointIsOnLineSegment(result, p1Start, p1End) && pointIsOnLineSegment(result, p2Start, p2End)) {
    return result
  }
  return undefined
}

/**
 * @public
 */
export function getTwoCircleIntersectionPoints({ x: x1, y: y1, r: r1 }: Circle, { x: x2, y: y2, r: r2 }: Circle): Position[] {
  const dx = x2 - x1
  const dy = y2 - y1
  const a = dx ** 2 + dy ** 2
  const d = Math.sqrt(a)
  const b = r1 ** 2
  const l = (b - r2 ** 2 + a) / 2 / d
  const f = b - l ** 2
  if (f < 0) {
    return []
  }
  const c = l / d
  const g = c * dx + x1
  const i = c * dy + y1
  if (f === 0) {
    return [
      {
        x: g,
        y: i,
      },
    ]
  }
  const h = Math.sqrt(f)
  const e = h / d
  const j = e * dy
  const k = e * dx
  return [
    {
      x: g + j,
      y: i - k,
    },
    {
      x: g - j,
      y: i + k,
    },
  ]
}

/**
 * @public
 */
export function getLineSegmentCircleIntersectionPoints(start: Position, end: Position, circle: Circle) {
  return getLineCircleIntersectionPoints(start, end, circle).filter((p) => pointIsOnLineSegment(p, start, end))
}

function getLineCircleIntersectionPoints(start: Position, end: Position, { x, y, r }: Circle) {
  const baX = end.x - start.x
  const baY = end.y - start.y
  const caX = x - start.x
  const caY = y - start.y
  const a = baX ** 2 + baY ** 2
  const bBy2 = baX * caX + baY * caY
  const c = caX * caX + caY * caY - r * r
  const pBy2 = bBy2 / a
  const q = c / a
  const disc = pBy2 * pBy2 - q;
  if (disc < 0) {
    return []
  }
  if (disc == 0) {
    return [
      {
        x: start.x + baX * pBy2,
        y: start.y + baY * pBy2,
      }
    ]
  }
  const tmpSqrt = Math.sqrt(disc)
  const abScalingFactor1 = -pBy2 + tmpSqrt
  const abScalingFactor2 = -pBy2 - tmpSqrt
  return [
    {
      x: start.x - baX * abScalingFactor1,
      y: start.y - baY * abScalingFactor1,
    },
    {
      x: start.x - baX * abScalingFactor2,
      y: start.y - baY * abScalingFactor2,
    },
  ]
}

/**
 * @public
 */
export function rotatePositionByCenter(position: Position, center: Position, rotate: number) {
  if (!rotate) {
    return position
  }
  rotate = -rotate * Math.PI / 180
  const offsetX = position.x - center.x
  const offsetY = position.y - center.y
  const sin = Math.sin(rotate)
  const cos = Math.cos(rotate)
  return {
    x: cos * offsetX - sin * offsetY + center.x,
    y: sin * offsetX + cos * offsetY + center.y,
  }
}

/**
 * @public
 */
export function getPolygonPoints(point: Position, center: Position, sides: number) {
  const points = [point]
  for (let i = 1; i < sides; i++) {
    points.push(rotatePositionByCenter(point, center, 360 / sides * i))
  }
  return points
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

/**
 * @public
 */
export interface TwoPointsFormRegion {
  start: Position
  end: Position
}

export interface Circle extends Position {
  r: number
}
