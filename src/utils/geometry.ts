import { GeometryLine } from "./intersection"
import { isRecord } from "./is-record"
import { angleToRadian, radianToAngle } from "./radian"
import { Vec3 } from "./types"
import { and, boolean, minimum, number, optional, Path, string, validate, ValidationResult } from "./validators"

export function getPointByLengthAndDirection(
  startPoint: Position,
  length: number,
  directionPoint: Position
) {
  let dx = directionPoint.x - startPoint.x
  let dy = directionPoint.y - startPoint.y
  if (length < 0) {
    length = -length
    dx = -dx
    dy = -dy
  }
  if (isZero(dx)) {
    return {
      x: startPoint.x,
      y: startPoint.y + length * (dy > 0 ? 1 : -1),
    }
  }
  const offsetX = Math.sqrt(length ** 2 * dx ** 2 / (dx ** 2 + dy ** 2)) * (dx > 0 ? 1 : -1)
  return {
    x: startPoint.x + offsetX,
    y: startPoint.y + dy / dx * offsetX,
  }
}

/**
 * @public
 */
export function isZero(value: number, delta = 0.00000001) {
  return Math.abs(value) < delta
}

export function lessThan(value1: number, value2: number, delta = 0.00000001) {
  return value1 < value2 && !isZero(value1 - value2, delta)
}

export function largerThan(value1: number, value2: number, delta = 0.00000001) {
  return value1 > value2 && !isZero(value1 - value2, delta)
}

export function sqrt3(value: number) {
  if (value < 0) {
    return -((-value) ** (1 / 3))
  }
  return value ** (1 / 3)
}

/**
 * @public
 */
export function getPointByLengthAndDirectionSafely(
  startPoint: Position,
  length: number,
  directionPoint: Position
) {
  if (isSamePoint(startPoint, directionPoint)) {
    return undefined
  }
  return getPointByLengthAndDirection(startPoint, length, directionPoint)
}

/**
 * @public
 */
export function isSamePoint(p1: Position, p2: Position) {
  return equals(p1.x, p2.x) && equals(p1.y, p2.y)
}

export function deepEquals<T>(a: T, b: T): boolean {
  if (a === b) return true

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) {
        return false
      }
    }
    return true
  }

  if (isRecord(a)) {
    if (!isRecord(b)) return false
    const keys = Object.keys(a)
    if (keys.length !== Object.keys(b).length) return false
    for (const key of keys) {
      if (!deepEquals(a[key], b[key])) {
        return false
      }
    }
    return true
  }

  if (typeof a === 'number') {
    if (typeof b !== 'number') return false
    if (isNaN(a) && isNaN(b)) return true
    return equals(a, b)
  }

  return false
}

/**
 * @public
 */
export function getPointByLengthAndRadian(
  startPoint: Position,
  length: number,
  radian: number,
) {
  const direction = multipleDirection(getDirectionByRadian(radian), length)
  return {
    x: startPoint.x + direction.x,
    y: startPoint.y + direction.y,
  }
}

export function getDirectionByRadian(radian: number): Position {
  return {
    x: Math.cos(radian),
    y: Math.sin(radian),
  }
}

export function multipleDirection(direction: Position, scalar: number): Position {
  return {
    x: direction.x * scalar,
    y: direction.y * scalar,
  }
}

/**
 * @public
 */
export function getPointAndLineSegmentMinimumDistance(position: Position, point1: Position, point2: Position) {
  const { distance } = getPointAndLineSegmentNearestPointAndDistance(position, point1, point2)
  return distance
}

/**
 * @public
 */
export function getPointAndLineSegmentNearestPointAndDistance(position: Position, point1: Position, point2: Position) {
  const perpendicularPoint = getPerpendicularPoint(position, twoPointLineToGeneralFormLine(point1, point2))
  if (pointIsOnLineSegment(perpendicularPoint, point1, point2)) {
    return {
      point: perpendicularPoint,
      distance: getTwoPointsDistance(position, perpendicularPoint),
    }
  }
  const d1 = getTwoPointsDistance(position, point1)
  const d2 = getTwoPointsDistance(position, point2)
  if (d1 < d2) {
    return {
      point: point1,
      distance: d1,
    }
  }
  return {
    point: point2,
    distance: d2,
  }
}

export function getPointAndGeometryLineNearestPointAndDistance(p: Position, line: GeometryLine) {
  if (Array.isArray(line)) {
    return getPointAndLineSegmentNearestPointAndDistance(p, ...line)
  }
  return getPointAndArcNearestPointAndDistance(p, line.arc)
}

export function getPointAndGeometryLineMinimumDistance(p: Position, line: GeometryLine) {
  if (Array.isArray(line)) {
    return getPointAndLineSegmentMinimumDistance(p, ...line)
  }
  return getPointAndArcMinimumDistance(p, line.arc)
}

export function getPointAndArcMinimumDistance(position: Position, arc: Arc) {
  const { distance } = getPointAndArcNearestPointAndDistance(position, arc)
  return distance
}

export function getAngleInRange(angle: number, range: AngleRange) {
  while (angle > range.endAngle && angle >= range.startAngle + 360) {
    angle -= 360
  }
  while (angle < range.startAngle) {
    angle += 360
  }
  return angle
}

export function angleInRange(angle: number, range: AngleRange) {
  return getAngleInRange(angle, range) <= range.endAngle
}

export function getPerpendicularPointToCircle(position: Position, circle: Circle) {
  const radian1 = getTwoPointsRadian(position, circle)
  const radian2 = radian1 + Math.PI
  const point1 = getCirclePointAtRadian(circle, radian1)
  const point2 = getCirclePointAtRadian(circle, radian2)
  const d1 = getTwoPointsDistance(position, point1)
  const d2 = getTwoPointsDistance(position, point2)
  if (d1 < d2) {
    return {
      point: point1,
      distance: d1,
      radian: radian1,
    }
  }
  return {
    point: point2,
    distance: d2,
    radian: radian2,
  }
}

export function getTangencyPointToCircle({ x: x1, y: y1 }: Position, { x: x2, y: y2, r }: Circle): Position[] {
  const a3 = r ** 2
  // (x - x2)^2 + (y - y2)^2 = a3
  // (x - x1)/(y - y1) = -(y - x2)/(x - x2)
  // let u = x - x2, v = y - y2
  // u^2 + v^2 = a3
  // (u + x2 - x1)/(v + y2 - y1) = -v/u
  const a1 = x2 - x1
  const a2 = y2 - y1
  // (u + a1)/(v + a2) + v/u = 0
  // u(u + a1) + v(v + a2) = 0
  // u^2 + a1 u + v^2 + a2 v = 0
  // a1 u + a2 v + a3 = 0
  // a2 v = -a3 - a1 u
  // a2 a2 v^2 = a3 a3 + a1 a1 u^2 + 2 a3 a1 u
  // a2 a2 u^2 + a2 a2 v^2 = a2 a2 a3
  // a2 a2 u^2 + a3 a3 + a1 a1 u^2 + 2 a3 a1 u = a2 a2 a3
  // (a1 a1 + a2 a2)u^2 + 2 a3 a1 u + a3 a3 - a2 a2 a3 = 0
  // a = a1 a1 + a2 a2
  // b = 2 a3 a1
  // c = a3 a3 - a2 a2 a3
  // bb-4ac = 4 a3 a3 a1 a1 - 4(a1 a1 + a2 a2)(a3 a3 - a2 a2 a3)
  // bb-4ac = 4 a3(a1 a1 a3 - (a1 a1 + a2 a2)(a3 - a2 a2))
  // bb-4ac = 4 a3(a1 a1 a3 - (a1 a1 a3 - a1 a1 a2 a2 + a2 a2 a3 - a2 a2 a2 a2))
  // bb-4ac = 4 a3(a1 a1 a2 a2 - a2 a2 a3 + a2 a2 a2 a2)
  // bb-4ac = 4 a2 a2 a3(a1 a1 + a2 a2 - a3)
  // bb-4ac = 4 a2 a2 a3(a - a3)
  const a = a1 ** 2 + a2 ** 2
  const f = a - a3
  if (f < 0 && !isZero(f)) {
    return []
  }
  // -b/2/a = -2 a3 a1/2/a = -a1 a3/a
  const d = -a1 * a3 / a
  // v = (-a3 - a1 u)/a2
  // v = (-a3 - a1 (-a1 a3/a))/a2
  // v = (-a3 + a1 a1 a3/a)/a2
  // v = a3(a1 a1 - a)/a/a2
  // v = a3(-a2 a2)/a/a2
  // v = -a2 a3/a
  const e = -a2 * a3 / a
  const d1 = x2 + d
  const d2 = y2 + e
  if (isZero(f)) {
    return [
      {
        x: d1,
        y: d2,
      }
    ]
  }
  const g = r * Math.sqrt(f) / a
  // sqrt(bb-4ac)/2/a = sqrt(4 a2 a2 a3(a - a3))/2/a
  // sqrt(bb-4ac)/2/a = a2 g
  const h = a2 * g
  const i = a1 * g
  // v = (-a3 - a1 u)/a2
  // v = (-a3 - a1(d + h))/a2
  // v = (-a3 - a1(-a1 a3/a + a2 g))/a2
  // v = (-a a3 - a1(-a1 a3 + a a2 g))/a2/a
  // v = (-a a3 + a1 a1 a3 - a a1 a2 g)/a2/a
  // v = ((a1 a1 - 1)a3 - a a1 a2 g)/a2/a
  // v = (-a2 a2 a3 - a a1 a2 g)/a2/a
  // v = (-a2 a3 - a a1 g)/a
  // v = -a2 a3/a - a1 g
  // v = e - i
  return [
    {
      x: d1 + h,
      y: d2 - i,
    },
    {
      x: d1 - h,
      y: d2 + i,
    }
  ]
}

export function getPointAndArcNearestPointAndDistance(position: Position, arc: Arc) {
  const { point, distance, radian } = getPerpendicularPointToCircle(position, arc)
  if (angleInRange(radianToAngle(radian), arc)) {
    return { point, distance }
  }
  const point3 = getArcPointAtAngle(arc, arc.startAngle)
  const point4 = getArcPointAtAngle(arc, arc.endAngle)
  const d3 = getTwoPointsDistance(position, point3)
  const d4 = getTwoPointsDistance(position, point4)
  if (d3 < d4) {
    return {
      point: point3,
      distance: d3,
    }
  }
  return {
    point: point4,
    distance: d4,
  }
}

/**
 * @public
 */
export function pointIsOnLineSegment(p: Position, point1: Position, point2: Position) {
  if (!equals(point1.x, point2.x) && isBetween(p.x, point1.x, point2.x)) {
    return true
  }
  if (!equals(point1.y, point2.y) && isBetween(p.y, point1.y, point2.y)) {
    return true
  }
  return false
}

export function pointIsOnArc(p: Position, arc: Arc) {
  const radian = getCircleRadian(p, arc)
  return angleInRange(radianToAngle(radian), arc)
}

export function pointIsOnEllipseArc(p: Position, ellipseArc: EllipseArc) {
  const angle = getEllipseAngle(p, ellipseArc)
  return angleInRange(angle, ellipseArc)
}

/**
 * @public
 */
export function pointIsOnLine(p: Position, point1: Position, point2: Position) {
  const { a, b, c } = twoPointLineToGeneralFormLine(point1, point2)
  return isZero(a * p.x + b * p.y + c)
}

/**
 * @public
 */
export function getPointAndRegionMinimumDistance(position: Position, region: TwoPointsFormRegion) {
  return getPointAndPolygonMinimumDistance(position, getPolygonFromTwoPointsFormRegion(region))
}

export function getPointAndPolygonMinimumDistance(position: Position, polygon: Position[]) {
  const polygonLine = Array.from(getPolygonLine(polygon))
  return Math.min(...polygonLine.map((r) => getPointAndLineSegmentMinimumDistance(position, ...r)))
}

/**
 * @public
 */
export function getPointAndRegionMaximumDistance(position: Position, region: TwoPointsFormRegion) {
  return getPointAndPolygonMaximumDistance(position, getPolygonFromTwoPointsFormRegion(region))
}

export function getPointAndPolygonMaximumDistance(position: Position, polygon: Position[]) {
  return Math.max(...polygon.map((r) => getTwoPointsDistance(position, r)))
}

/**
 * @public
 */
export function getPerpendicularPoint(point: Position, line: GeneralFormLine): Position {
  const d = line.a ** 2 + line.b ** 2
  const e = line.a * line.b
  return {
    x: (line.b ** 2 * point.x - e * point.y - line.a * line.c) / d,
    y: (-e * point.x + line.a ** 2 * point.y - line.b * line.c) / d,
  }
}

/**
 * @public
 * 0: point on line
 * >0: point on left side of line
 * <0: point on right side of line
 */
export function getPointSideOfLine(point: Position, line: GeneralFormLine): number {
  return line.a * point.x + line.b * point.y + line.c
}

/**
 * @public
 */
export function getTwoPointsDistance(point1: Position, point2: Position = { x: 0, y: 0 }) {
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
export function getTwoPointCenter(p1: Position, p2: Position) {
  return {
    x: getTwoNumberCenter(p1.x, p2.x),
    y: getTwoNumberCenter(p1.y, p2.y),
  }
}

/**
 * @public
 */
export function getTwoNumberCenter(p1: number, p2: number) {
  return (p1 + p2) / 2
}

/**
 * @public
 */
export function isBetween(target: number, a: number, b: number) {
  return target <= Math.max(a, b) && target >= Math.min(a, b)
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

function generalFormLineToTwoPointLine({ a, b, c }: GeneralFormLine): [Position, Position] {
  if (isZero(a)) {
    return [
      {
        x: 0,
        y: -c / b
      },
      {
        x: 1,
        y: -c / b
      },
    ]
  }
  if (isZero(b)) {
    return [
      {
        x: -c / a,
        y: 0
      },
      {
        x: -c / a,
        y: 1
      },
    ]
  }
  return [
    {
      x: 0,
      y: -c / b
    },
    {
      x: -c / a,
      y: 0
    },
  ]
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

export function mergeBoundings(boundings: TwoPointsFormRegion[]): TwoPointsFormRegion {
  return getPointsBoundingUnsafe(boundings.map(b => [b.start, b.end]).flat())
}

/**
 * @public
 */
export function getPointsBounding(points: Position[]): TwoPointsFormRegion | undefined {
  if (points.length === 0) {
    return
  }
  return getPointsBoundingUnsafe(points)
}

export function getPointsBoundingUnsafe(points: Position[]): TwoPointsFormRegion {
  const result = {
    start: {
      x: points[0].x,
      y: points[0].y,
    },
    end: {
      x: points[0].x,
      y: points[0].y,
    },
  }
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    if (p.x < result.start.x) {
      result.start.x = p.x
    }
    if (p.y < result.start.y) {
      result.start.y = p.y
    }
    if (p.x > result.end.x) {
      result.end.x = p.x
    }
    if (p.y > result.end.y) {
      result.end.y = p.y
    }
  }
  return result
}

/**
 * @public
 */
export function lineIntersectWithTwoPointsFormRegion(p1: Position, p2: Position, region: TwoPointsFormRegion) {
  return lineIntersectWithPolygon(p1, p2, getPolygonFromTwoPointsFormRegion(region))
}

export function getPolygonFromTwoPointsFormRegion(region: TwoPointsFormRegion) {
  return [
    region.start,
    { x: region.start.x, y: region.end.y },
    region.end,
    { x: region.end.x, y: region.start.y },
  ]
}

export function lineIntersectWithPolygon(p1: Position, p2: Position, polygon: Position[]) {
  for (const line of getPolygonLine(polygon)) {
    if (lineIntersectWithLine(p1, p2, ...line)) {
      return true
    }
  }
  return false
}

export function geometryLineIntersectWithPolygon(g: GeometryLine, polygon: Position[]) {
  for (const line of getPolygonLine(polygon)) {
    if (!Array.isArray(g)) {
      if (getLineSegmentArcIntersectionPoints(...line, g.arc).length > 0) {
        return true
      }
    } else if (lineIntersectWithLine(...g, ...line)) {
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
  return u * v <= 0 && w * z <= 0
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
export function getTwoLineSegmentsIntersectionPoint(p1Start: Position, p1End: Position, p2Start: Position, p2End: Position) {
  const result = getTwoLinesIntersectionPoint(p1Start, p1End, p2Start, p2End)
  if (result && pointIsOnLineSegment(result, p1Start, p1End) && pointIsOnLineSegment(result, p2Start, p2End)) {
    return result
  }
  return undefined
}

export function getTwoGeometryLinesIntersectionPoint(line1: GeometryLine, line2: GeometryLine) {
  if (Array.isArray(line1)) {
    if (Array.isArray(line2)) {
      const point = getTwoLineSegmentsIntersectionPoint(...line1, ...line2)
      if (point) {
        return [point]
      }
      return []
    }
    return getLineSegmentArcIntersectionPoints(...line1, line2.arc)
  }
  if (Array.isArray(line2)) {
    return getLineSegmentArcIntersectionPoints(...line2, line1.arc)
  }
  return getTwoArcIntersectionPoints(line1.arc, line2.arc)
}

/**
 * @public
 */
export function getTwoLinesIntersectionPoint(p1Start: Position, p1End: Position, p2Start: Position, p2End: Position) {
  return getTwoGeneralFormLinesIntersectionPoint(twoPointLineToGeneralFormLine(p1Start, p1End), twoPointLineToGeneralFormLine(p2Start, p2End))
}

/**
 * @public
 */
export function getTwoGeneralFormLinesIntersectionPoint(p1: GeneralFormLine, p2: GeneralFormLine) {
  const { a: a1, b: b1, c: c1 } = p1
  const { a: a2, b: b2, c: c2 } = p2
  const d = a2 * b1 - a1 * b2
  if (isZero(d)) {
    return undefined
  }
  return {
    x: (c1 * b2 - b1 * c2) / d,
    y: (c2 * a1 - c1 * a2) / d,
  }
}

/**
 * @public
 */
export function getTwoCircleIntersectionPoints({ x: x1, y: y1, r: r1 }: Circle, { x: x2, y: y2, r: r2 }: Circle): Position[] {
  const m = r1 ** 2
  const n = r2 ** 2
  // (x - x1)^2 + (y - y1)^2 = m
  // (x - x2)^2 + (y - y2)^2 = n

  // let u = x - x1, v = y - y1
  // F1: u^2 + v^2 = m
  // (u + x1 - x2)^2 + (v + y1 - y2)^2 = n

  const p = x2 - x1
  const q = y2 - y1
  // (u - p)^2 + (v - q)^2 = n
  // u^2 - 2pu + pp + v^2 - 2qv + qq = n

  // F1-: 2pu + 2qv - (pp + qq) = m - n
  // 2(pu + qv) = (pp + qq) + m - n

  const r = p ** 2 + q ** 2
  // 2(pu + qv) = r + m - n
  // pu + qv = (r + m - n) / 2

  const d = Math.sqrt(r)
  const l = (r + m - n) / 2 / d
  // pu + qv = ld
  // F2: qv = ld - pu

  // F1*qq: qqu^2 + qqv^2 = mqq
  // qqu^2 + (qv)^2 = mqq
  // qqu^2 + (ld - pu)^2 = mqq
  // qqu^2 + lldd - 2ldpu + ppu^2 = mqq
  // (pp + qq)u^2 - 2ldpu + lldd - mqq = 0
  // ru^2 - 2ldpu + (llr - mqq) = 0
  // a = r, b = -2ldp, c = llr - mqq
  // bb - 4ac = (2ldp)^2 - 4r(llr - mqq)
  // bb - 4ac = 4llddpp - 4rlldd + 4rmqq
  // bb - 4ac = 4rllpp - 4rllr + 4rmqq
  // bb - 4ac = 4r(llpp - llr + mqq)
  // bb - 4ac = 4r(ll(pp - r) + mqq)
  // bb - 4ac = 4r(ll(-qq) + mqq) = 4rqq(m - ll)

  const f = m - l ** 2
  // bb - 4ac = 4rqqf
  if (f < 0 && !isZero(f)) {
    return []
  }
  // u = -b/2/a = 2ldp/2/r = ldp/r = lp/d
  const c = l / d
  // u = -b/2/a = cp
  // x = u + x1 = cp + x1
  const g = c * p + x1

  // F2/q: v = (ld - pu)/q
  // v = (ld - pcp)/q
  // v = (ldd/d - cpp)/q
  // v = (lr/d - cpp)/q
  // v = (cr - cpp)/q
  // v = c(r - pp)/q = cqq/q = cq
  // y = v + y1 = cq + y1
  const i = c * q + y1
  if (isZero(f)) {
    return [
      {
        x: g,
        y: i,
      },
    ]
  }
  const h = Math.sqrt(f)
  // sqrt(bb - 4ac)/2/a = sqrt(4rqqf)/2/r
  // sqrt(bb - 4ac)/2/a = sqrt(4ddqqhh)/2/r
  // sqrt(bb - 4ac)/2/a = 2dqh/2/r = dqh/r = qh/d
  const e = h / d
  // sqrt(bb - 4ac)/2/a = q(de)/d = qe
  const j = e * q

  // F2/q: v = (ld - pu)/q
  // v = (ld - p(x - x1))/q
  // v = (ld - p(g + j - x1))/q
  // v = (ld - p(cp + x1 + j - x1))/q
  // v = (ld - p(cp + j))/q
  // v = (ld - p(cp + eq))/q
  // v = (cdd - cpp - peq)/q
  // v = (c(dd - pp) - peq)/q
  // v = (cqq - peq)/q
  // v = cq - pe
  // v = (i - y1) - pe
  // y = v + y1 = (i - y1) - pe + y1 = i - pe
  const k = e * p
  // y = i - k
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

export function getLineSegmentArcIntersectionPoints(start: Position, end: Position, arc: Arc) {
  return getLineSegmentCircleIntersectionPoints(start, end, arc).filter((p) => pointIsOnArc(p, arc))
}

export function getTwoArcIntersectionPoints(arc1: Arc, arc2: Arc) {
  return getTwoCircleIntersectionPoints(arc1, arc2).filter((p) => pointIsOnArc(p, arc1) && pointIsOnArc(p, arc2))
}

/**
 * @public
 */
export function getLineCircleIntersectionPoints({ x: x2, y: y2 }: Position, { x: x3, y: y3 }: Position, { x: x1, y: y1, r }: Circle) {
  // (x - x1)^2 + (y - y1)^2 = rr
  // let u = x - x1, v = y - y1
  // F1: u^2 + v^2 = rr

  // (x - x2) / (x3 - x2) = (y - y2) / (y3 - y2)
  const d = x3 - x2
  const e = y3 - y2
  // (x - x2) / d = (y - y2) / e
  // e(x - x2) = d(y - y2)
  // e((u + x1) - x2) = d((v + y1) - y2)
  const f = x1 - x2
  const g = y1 - y2
  // e(u + f) = d(v + g)
  // eu + ef = dv + dg
  const s = e * f - d * g
  // F2: dv = eu + ef - dg = eu + s
  // ddv^2 = (eu + s)^2
  // F1*dd: ddu^2 + ddv^2 = rrdd
  // ddu^2 + (eu + s)^2 = rrdd
  // ddu^2 + eeu^2 + 2esu + ss = rrdd
  // (dd + ee)u^2 + 2esu + (ss - rrdd) = 0
  const h = d ** 2 + e ** 2
  // hu^2 + 2esu + (ss - rrdd) = 0
  // a = h, b = 2es, c = ss - rrdd
  // bb - 4ac = 4eess - 4(dd + ee)(ss - rrdd)
  // bb - 4ac = 4ee(ef - dg)^2 - 4(dd + ee)((ef - dg)^2 - rrdd)
  // bb - 4ac = 4ee(eeff - 2efdg + ddgg) - 4(dd + ee)(eeff - 2efdg + ddgg - rrdd)
  // bb - 4ac = 4(eeeeff - 2eeefdg + ddeegg - (dd + ee)(eeff - 2efdg + ddgg - rrdd))
  // bb - 4ac = 4(eeeeff - 2eeefdg + ddeegg - (ddeeff - 2ddefdg + ddddgg - rrdddd + eeeeff - 2eeefdg + ddeegg - rrddee))
  // bb - 4ac = 4(-(ddeeff - 2ddefdg + ddddgg - rrdddd - rrddee))
  // bb - 4ac = 4dd(-(eeff - 2efdg + ddgg - rrdd - rree))
  // bb - 4ac = 4dd(-eeff + 2efdg - ddgg + rrdd + rree)
  // bb - 4ac = 4dd(rr(dd + ee) - (eeff - 2efdg + ddgg))
  // bb - 4ac = 4dd(rrh - ss)
  const t = r * r * h - s * s
  // bb - 4ac = 4ddt
  if (t < 0 && !isZero(t)) {
    return []
  }
  // u = -b/2/a = -2es/2/h = -es/h
  // x = u + x1 = -es/h + x1
  const i = -e * s / h + x1

  // F2/d: v = (eu + s) / d
  // v = (e(-es/h) + s) / d
  // v = (-ees/h + s) / d
  // v = (-ee + h)s/h/d
  // v = dds/h/d = ds/h
  // y = v + y1 = ds/h + y1
  const j = d * s / h + y1

  if (isZero(t)) {
    return [
      {
        x: i,
        y: j,
      }
    ]
  }
  const n = Math.sqrt(t)
  // sqrt(bb - 4ac)/2/a = sqrt(4ddt)/2/h = 2d sqrt(t)/2/h = nd/h
  const p = n * d / h

  // F2/d: v = (eu + s) / d
  // v = (e(x - x1) + s) / d
  // v = (e(-es/h + x1 - nd/h - x1) + s) / d
  // v = (e(-es/h - nd/h) + s) / d
  // v = (-ees/h - end/h + s) / d
  // v = (-ees - end + sh)/h/d
  // v = ((h - ee)s - end)/h/d
  // v = (dds - end)/h/d
  // v = (ds - en)/h
  // y = v + y1 = (ds - en)/h + y1
  // y = j - enh
  const q = n * e / h

  // y = j - q
  return [
    {
      x: i - p,
      y: j - q,
    },
    {
      x: i + p,
      y: j + q,
    },
  ]
}

function getGeneralFormLineCircleIntersectionPoints(line: GeneralFormLine, circle: Circle) {
  return getLineCircleIntersectionPoints(...generalFormLineToTwoPointLine(line), circle)
}

/**
 * @public
 */
export function rotatePositionByCenter(position: Position, center: Position, angle: number) {
  if (!angle) {
    return position
  }
  return rotatePosition(position, center, -angleToRadian(angle))
}

/**
 * @public
 */
export function rotatePositionByEllipseCenter(p: Position, content: Ellipse) {
  return rotatePositionByCenter(p, getEllipseCenter(content), -(content.angle ?? 0))
}

/**
 * @public
 */
export function rotatePosition(position: Position, center: Position, radian: number) {
  if (!radian) {
    return position
  }
  const offsetX = position.x - center.x
  const offsetY = position.y - center.y
  const sin = Math.sin(radian)
  const cos = Math.cos(radian)
  return {
    x: cos * offsetX - sin * offsetY + center.x,
    y: sin * offsetX + cos * offsetY + center.y,
  }
}

/**
 * @public
 */
export function getPolygonPoints(point: Position, center: Position, sides: number, toEdge?: boolean) {
  if (toEdge) {
    const length = getTwoPointsDistance(point, center) / Math.cos(Math.PI / sides)
    point = rotatePositionByCenter(point, center, 180 / sides)
    point = getPointByLengthAndDirection(center, length, point)
  }
  const points = [point]
  for (let i = 1; i < sides; i++) {
    points.push(rotatePositionByCenter(point, center, 360 / sides * i))
  }
  return points
}

/**
 * @public
 */
export function getEllipseRadiusOfAngle(ellipse: Ellipse, radian: number) {
  if (ellipse.angle) {
    radian -= angleToRadian(ellipse.angle)
  }
  return ellipse.rx * ellipse.ry / Math.sqrt((ellipse.rx * Math.sin(radian)) ** 2 + (ellipse.ry * Math.cos(radian)) ** 2)
}

/**
 * @public
 */
export function dashedPolylineToLines(
  points: Position[],
  dashArray?: number[],
  skippedLines?: number[],
  dashOffset = 0,
) {
  if (!dashArray || dashArray.length === 0) {
    return [points]
  }
  const result: Position[][] = []
  let last: Position[] = []
  const g = {
    moveTo(x: number, y: number) {
      if (last.length > 1) {
        result.push(last)
      }
      last = [{ x, y }]
    },
    lineTo(x: number, y: number) {
      if (last.length === 0) {
        last.push({ x: 0, y: 0 })
      }
      last.push({ x, y })
    },
  }
  drawDashedPolyline(g, points, dashArray, skippedLines, dashOffset)
  if (last.length > 1) {
    result.push(last)
  }
  return result
}

/**
 * @public
 */
export function drawDashedPolyline(
  g: { moveTo: (x: number, y: number) => void, lineTo: (x: number, y: number) => void },
  points: Position[],
  dashArray: number[],
  skippedLines?: number[],
  dashOffset = 0,
) {
  if (dashArray.length % 2 === 1) {
    dashArray = [...dashArray, ...dashArray]
  }
  if (dashArray.reduce((p, c) => p + c) <= 0) return
  points.forEach((p, i) => {
    if (i === 0 || skippedLines?.includes(i - 1)) {
      g.moveTo(p.x, p.y)
    } else {
      dashOffset = drawDashedLine(g, points[i - 1], p, dashArray, dashOffset)
    }
  })
}

/**
 * @public
 */
export function drawDashedLine(
  g: { moveTo: (x: number, y: number) => void, lineTo: (x: number, y: number) => void },
  p1: Position,
  p2: Position,
  dashArray: number[],
  dashOffset = 0,
) {
  if (dashArray.length % 2 === 1) {
    dashArray = [...dashArray, ...dashArray]
  }
  const dashTotalLength = dashArray.reduce((p, c) => p + c)
  if (dashTotalLength <= 0) return dashOffset
  let distance = getTwoPointsDistance(p1, p2)
  const newDashOffset = (dashOffset + distance) % dashTotalLength
  let p = p1
  while (distance > 0) {
    for (let i = 0; i < dashArray.length; i++) {
      let dashLength = dashArray[i]
      if (dashOffset > 0) {
        if (dashLength <= dashOffset) {
          dashOffset -= dashLength
          continue
        }
        dashLength -= dashOffset
        dashOffset = 0
      }
      const operate = i % 2 === 0 ? 'lineTo' : 'moveTo'
      if (dashLength >= distance) {
        g[operate](p2.x, p2.y)
        return newDashOffset
      }
      const end = getPointByLengthAndDirection(p, dashLength, p2)
      g[operate](end.x, end.y)
      distance -= dashLength
      p = end
    }
  }
  return newDashOffset
}

function getValueBetween2PointsByPercent(n1: number, n2: number, percent: number) {
  return n1 + ((n2 - n1) * percent)
}

/**
 * @public
 */
export function getQuadraticCurvePoints(p1: Position, p2: Position, p3: Position, segmentCount: number) {
  const points: Position[] = []
  for (let t = 1; t < segmentCount; t++) {
    const i = t / segmentCount
    const xa = getValueBetween2PointsByPercent(p1.x, p2.x, i)
    const ya = getValueBetween2PointsByPercent(p1.y, p2.y, i)
    const xb = getValueBetween2PointsByPercent(p2.x, p3.x, i)
    const yb = getValueBetween2PointsByPercent(p2.y, p3.y, i)
    const x = getValueBetween2PointsByPercent(xa, xb, i)
    const y = getValueBetween2PointsByPercent(ya, yb, i)
    points.push({ x, y })
  }
  return points
}

/**
 * @public
 */
export function getBezierCurvePoints(p1: Position, p2: Position, p3: Position, p4: Position, segmentCount: number) {
  const points: Position[] = []
  for (let t = 1; t < segmentCount; t++) {
    const i = t / segmentCount
    const xa = getValueBetween2PointsByPercent(p1.x, p2.x, i)
    const ya = getValueBetween2PointsByPercent(p1.y, p2.y, i)
    const xb = getValueBetween2PointsByPercent(p2.x, p3.x, i)
    const yb = getValueBetween2PointsByPercent(p2.y, p3.y, i)
    const xc = getValueBetween2PointsByPercent(p3.x, p4.x, i)
    const yc = getValueBetween2PointsByPercent(p3.y, p4.y, i)

    // The Blue Line
    const xm = getValueBetween2PointsByPercent(xa, xb, i)
    const ym = getValueBetween2PointsByPercent(ya, yb, i)
    const xn = getValueBetween2PointsByPercent(xb, xc, i)
    const yn = getValueBetween2PointsByPercent(yb, yc, i)

    // The Black Dot
    const x = getValueBetween2PointsByPercent(xm, xn, i);
    const y = getValueBetween2PointsByPercent(ym, yn, i);
    points.push({ x, y })
  }
  return points
}

export function getBezierCurvePoints3D(p1: Vec3, p2: Vec3, p3: Vec3, p4: Vec3, segmentCount: number) {
  const points: Vec3[] = []
  for (let t = 1; t < segmentCount; t++) {
    const i = t / segmentCount
    const xa = getValueBetween2PointsByPercent(p1[0], p2[0], i)
    const ya = getValueBetween2PointsByPercent(p1[1], p2[1], i)
    const za = getValueBetween2PointsByPercent(p1[2], p2[2], i)
    const xb = getValueBetween2PointsByPercent(p2[0], p3[0], i)
    const yb = getValueBetween2PointsByPercent(p2[1], p3[1], i)
    const zb = getValueBetween2PointsByPercent(p2[2], p3[2], i)
    const xc = getValueBetween2PointsByPercent(p3[0], p4[0], i)
    const yc = getValueBetween2PointsByPercent(p3[1], p4[1], i)
    const zc = getValueBetween2PointsByPercent(p3[2], p4[2], i)

    // The Blue Line
    const xm = getValueBetween2PointsByPercent(xa, xb, i)
    const ym = getValueBetween2PointsByPercent(ya, yb, i)
    const zm = getValueBetween2PointsByPercent(za, zb, i)
    const xn = getValueBetween2PointsByPercent(xb, xc, i)
    const yn = getValueBetween2PointsByPercent(yb, yc, i)
    const zn = getValueBetween2PointsByPercent(zb, zc, i)

    // The Black Dot
    const x = getValueBetween2PointsByPercent(xm, xn, i);
    const y = getValueBetween2PointsByPercent(ym, yn, i);
    const z = getValueBetween2PointsByPercent(zm, zn, i);
    points.push([x, y, z])
  }
  return points
}

export function getBezierSplinePoints(points: Position[], segmentCount: number) {
  const result: Position[] = []
  getBezierSplineControlPointsOfPoints(points).map((p, i) => {
    result.push(points[i], ...getBezierCurvePoints(points[i], ...p, points[i + 1], segmentCount))
  })
  result.push(points[points.length - 1])
  return result
}

export function getBezierSplinePoints3D(points: Vec3[], segmentCount: number) {
  const result: Vec3[] = []
  getBezierSplineControlPointsOfPoints3D(points).map((p, i) => {
    result.push(points[i], ...getBezierCurvePoints3D(points[i], ...p, points[i + 1], segmentCount))
  })
  result.push(points[points.length - 1])
  return result
}

/**
 * @public
 */
export function getBezierSplineControlPointsOfPoints(points: Position[]) {
  const x = getBezierSplineControlPoints(points.map((p) => p.x))
  const y = getBezierSplineControlPoints(points.map((p) => p.y))
  return x.p1.map((_, i) => [{ x: x.p1[i], y: y.p1[i] }, { x: x.p2[i], y: y.p2[i] }] as const)
}

export function getBezierSplineControlPointsOfPoints3D(points: Vec3[]) {
  const x = getBezierSplineControlPoints(points.map((p) => p[0]))
  const y = getBezierSplineControlPoints(points.map((p) => p[1]))
  const z = getBezierSplineControlPoints(points.map((p) => p[2]))
  return x.p1.map((_, i) => [[x.p1[i], y.p1[i], z.p1[i]], [x.p2[i], y.p2[i], z.p2[i]]] as [Vec3, Vec3])
}

function getBezierSplineControlPoints(k: number[]) {
  const p1: number[] = []
  const p2: number[] = []
  const n = k.length - 1;
  const a: number[] = []
  const b: number[] = []
  const c: number[] = []
  const r: number[] = []
  a[0] = 0;
  b[0] = 2;
  c[0] = 1;
  r[0] = k[0] + 2 * k[1];
  for (let i = 1; i < n - 1; i++) {
    a[i] = 1;
    b[i] = 4;
    c[i] = 1;
    r[i] = 4 * k[i] + 2 * k[i + 1];
  }
  a[n - 1] = 2;
  b[n - 1] = 7;
  c[n - 1] = 0;
  r[n - 1] = 8 * k[n - 1] + k[n];

  for (let i = 1; i < n; i++) {
    const m = a[i] / b[i - 1];
    b[i] = b[i] - m * c[i - 1];
    r[i] = r[i] - m * r[i - 1];
  }

  p1[n - 1] = r[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; --i)
    p1[i] = (r[i] - c[i] * p1[i + 1]) / b[i];

  for (let i = 0; i < n - 1; i++) {
    p2[i] = 2 * k[i + 1] - p1[i + 1];
  }

  p2[n - 1] = 0.5 * (k[n] + p1[n - 1])
  return { p1: p1, p2: p2 };
}

export interface Position {
  x: number
  y: number
}

/**
 * @public
 */
export const Position = {
  x: number,
  y: number,
}

/**
 * @public
 */
export interface Size {
  width: number
  height: number
}

/**
 * @public
 */
export const Size = {
  width: /* @__PURE__ */ minimum(0, number),
  height: /* @__PURE__ */ minimum(0, number),
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
export const Region = /* @__PURE__ */ and(Position, Size)

export interface Ellipse {
  cx: number
  cy: number
  rx: number
  ry: number
  angle?: number
}

/**
 * @public
 */
export const Ellipse = {
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: /* @__PURE__ */ optional(number),
}

/**
 * @public
 */
export interface TwoPointsFormRegion {
  start: Position
  end: Position
}

/**
 * @public
 */
export interface Bounding {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

/**
 * @public
 */
export const Bounding = {
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
}

export interface Circle extends Position {
  r: number
}

/**
 * @public
 */
export const Circle = /* @__PURE__ */ and(Position, {
  r: /* @__PURE__ */ minimum(0, number),
})

/**
 * @public
 */
export interface Arc extends Circle, AngleRange {
}

/**
 * @public
 */
export const AngleRange = {
  startAngle: number,
  endAngle: number,
  counterclockwise: /* @__PURE__ */ optional(boolean),
}

/**
 * @public
 */
export const Arc = /* @__PURE__ */ and(Circle, AngleRange)

/**
 * @public
 */
export interface EllipseArc extends Ellipse, AngleRange {
}

/**
 * @public
 */
export const EllipseArc = /* @__PURE__ */ and(Ellipse, AngleRange)

/**
 * @public
 */
export interface AngleRange {
  startAngle: number
  endAngle: number
  counterclockwise?: boolean
}

/**
 * @public
 */
export function getCirclesTangentTo2Circles(circle1: Circle, circle2: Circle, radius: number) {
  const result: Position[] = []
  const circles1 = [circle1.r + radius, Math.abs(circle1.r - radius)]
  const circles2 = [circle2.r + radius, Math.abs(circle2.r - radius)]
  for (const r1 of circles1) {
    for (const r2 of circles2) {
      result.push(...getTwoCircleIntersectionPoints({ ...circle1, r: r1 }, { ...circle2, r: r2 }))
    }
  }
  return result
}

/**
 * @public
 */
export function getPerpendicular(point: Position, line: GeneralFormLine) {
  return {
    a: -line.b,
    b: line.a,
    c: point.x * line.b - line.a * point.y,
  }
}

export const defaultMiterLimit = 10

/**
 * @public
 */
export function getPolylineTriangles(
  points: Position[],
  width: number,
  lineCapWithClosed: true | 'butt' | 'round' | 'square' = 'butt',
  lineJoinWithLimit: 'round' | 'bevel' | number = defaultMiterLimit,
) {
  const radius = width / 2
  if (lineCapWithClosed === true) {
    points = polygonToPolyline(points)
  } else if (isSamePoint(points[0], points[points.length - 1])) {
    lineCapWithClosed = true
  }

  const lines: GeneralFormLine[] = []
  const parallelLines: [GeneralFormLine, GeneralFormLine][] = []
  for (let i = 1; i < points.length; i++) {
    const line = twoPointLineToGeneralFormLine(points[i - 1], points[i])
    lines.push(line)
    parallelLines.push(getParallelLinesByDistance(line, radius))
  }

  const radianLimit = typeof lineJoinWithLimit === 'number' ? Math.asin(1 / lineJoinWithLimit) * 2 : undefined

  const result: number[] = []
  for (let i = 0; i < points.length; i++) {
    if (lineCapWithClosed !== true) {
      if (i === 0) {
        let p = points[0]
        if (lineCapWithClosed === 'round') {
          const angle = radianToAngle(getTwoPointsRadian(p, points[1]))
          const ps = arcToPolyline({ x: p.x, y: p.y, r: radius, startAngle: angle - 90, endAngle: angle + 90 }, 5)
          for (const s of ps) {
            result.push(s.x, s.y, p.x, p.y)
          }
        }
        if (lineCapWithClosed === 'square') {
          p = getPointByLengthAndDirection(p, -radius, points[1])
        }
        const line2 = getPerpendicular(p, lines[i])
        for (const line1 of parallelLines[i]) {
          const point2 = getTwoGeneralFormLinesIntersectionPoint(line1, line2)
          if (point2) {
            result.push(point2.x, point2.y)
          }
        }
        continue
      }
      if (i === points.length - 1) {
        let p = points[i]
        if (lineCapWithClosed === 'square') {
          p = getPointByLengthAndDirection(p, -radius, points[i - 1])
        }
        const line2 = getPerpendicular(p, lines[i - 1])
        for (const line1 of parallelLines[i - 1]) {
          const point2 = getTwoGeneralFormLinesIntersectionPoint(line1, line2)
          if (point2) {
            result.push(point2.x, point2.y)
          }
        }
        if (lineCapWithClosed === 'round') {
          const angle = radianToAngle(getTwoPointsRadian(p, points[i - 1]))
          const ps = arcToPolyline({ x: p.x, y: p.y, r: radius, startAngle: angle + 90, endAngle: angle - 90, counterclockwise: true }, 5)
          for (const s of ps) {
            result.push(p.x, p.y, s.x, s.y)
          }
        }
        continue
      }
    }
    const previousIndex = i === 0 ? parallelLines.length - 1 : i - 1
    const nextIndex = i === points.length - 1 ? 0 : i
    const previousParallelLines = parallelLines[previousIndex]
    const nextParallelLines = parallelLines[nextIndex]
    const a = points[previousIndex]
    const b = points[i]
    const c = points[nextIndex + 1]
    let radian = getTwoPointsRadian(c, b) - getTwoPointsRadian(b, a)
    if (radian < -Math.PI) {
      radian += Math.PI * 2
    } else if (radian > Math.PI) {
      radian -= Math.PI * 2
    }

    if (!equals(radian, 0) && !equals(radian, Math.PI) && !equals(radian, -Math.PI)) {
      let lineJoin = lineJoinWithLimit
      if (radianLimit !== undefined) {
        let a = Math.abs(radian)
        if (a > Math.PI / 2) {
          a = Math.PI - a
        }
        if (a < radianLimit) {
          lineJoin = 'bevel'
        }
      }

      if (lineJoin === 'bevel' || lineJoin === 'round') {
        if (radian > 0 && radian < Math.PI) {
          const p = getTwoGeneralFormLinesIntersectionPoint(previousParallelLines[0], nextParallelLines[0])
          const p1 = getTwoGeneralFormLinesIntersectionPoint(previousParallelLines[1], getPerpendicular(points[i], lines[previousIndex]))
          const p2 = getTwoGeneralFormLinesIntersectionPoint(nextParallelLines[1], getPerpendicular(points[i], lines[nextIndex]))
          if (p && p1 && p2) {
            let ps: Position[]
            if (lineJoin === 'bevel') {
              ps = [p1, p2]
            } else {
              const startAngle = radianToAngle(getTwoPointsRadian(p1, b))
              const endAngle = radianToAngle(getTwoPointsRadian(p2, b))
              ps = arcToPolyline({ x: b.x, y: b.y, r: radius, startAngle, endAngle }, 5)
            }
            for (const s of ps) {
              result.push(p.x, p.y, s.x, s.y)
            }
          }
        } else {
          const p = getTwoGeneralFormLinesIntersectionPoint(previousParallelLines[1], nextParallelLines[1])
          const p1 = getTwoGeneralFormLinesIntersectionPoint(previousParallelLines[0], getPerpendicular(points[i], lines[previousIndex]))
          const p2 = getTwoGeneralFormLinesIntersectionPoint(nextParallelLines[0], getPerpendicular(points[i], lines[nextIndex]))
          if (p && p1 && p2) {
            let ps: Position[]
            if (lineJoin === 'bevel') {
              ps = [p1, p2]
            } else {
              const startAngle = radianToAngle(getTwoPointsRadian(p1, b))
              const endAngle = radianToAngle(getTwoPointsRadian(p2, b))
              ps = arcToPolyline({ x: b.x, y: b.y, r: radius, startAngle, endAngle, counterclockwise: true }, 5)
            }
            for (const s of ps) {
              result.push(s.x, s.y, p.x, p.y)
            }
          }
        }
      } else {
        const point1 = getTwoGeneralFormLinesIntersectionPoint(previousParallelLines[0], nextParallelLines[0])
        if (point1) {
          result.push(point1.x, point1.y)
          const point2 = getTwoGeneralFormLinesIntersectionPoint(previousParallelLines[1], nextParallelLines[1])
          if (point2) {
            result.push(point2.x, point2.y)
          }
        }
      }
    }
  }
  return result
}

/**
 * @public
 */
export function combineStripTriangles(triangles: number[][]) {
  const result: number[] = []
  for (let i = 0; i < triangles.length; i++) {
    const triangle = triangles[i]
    if (i !== 0) {
      const lastTriangle = triangles[i - 1]
      result.push(
        lastTriangle[lastTriangle.length - 2], lastTriangle[lastTriangle.length - 1],
        triangle[0], triangle[1],
        triangle[0], triangle[1],
        triangle[2], triangle[3],
      )
    }
    result.push(...triangle)
  }
  return result
}

export function triangleStripToTriangles(points: number[]) {
  const result: number[] = []
  let flag = false
  for (let i = 5; i < points.length; i += 2) {
    if (flag) {
      result.push(points[i - 5], points[i - 4], points[i - 3], points[i - 2], points[i - 1], points[i])
    } else {
      result.push(points[i - 5], points[i - 4], points[i - 1], points[i], points[i - 3], points[i - 2])
    }
    flag = !flag
  }
  return result
}

/**
 * @public
 */
export function combineStripTriangleColors(colors: number[][]) {
  const result: number[] = []
  for (let i = 0; i < colors.length; i++) {
    const triangle = colors[i]
    if (i !== 0) {
      const lastTriangle = colors[i - 1]
      result.push(
        lastTriangle[lastTriangle.length - 4], lastTriangle[lastTriangle.length - 3], lastTriangle[lastTriangle.length - 2], lastTriangle[lastTriangle.length - 1],
        triangle[0], triangle[1], triangle[2], triangle[3],
        triangle[0], triangle[1], triangle[2], triangle[3],
        triangle[4], triangle[5], triangle[6], triangle[7],
      )
    }
    result.push(...triangle)
  }
  return result
}

/**
 * @public
 */
export function getCirclesTangentTo2Lines(p1Start: Position, p1End: Position, p2Start: Position, p2End: Position, radius: number) {
  const result: Position[] = []
  const lines1 = getParallelLinesByDistance(twoPointLineToGeneralFormLine(p1Start, p1End), radius)
  const lines2 = getParallelLinesByDistance(twoPointLineToGeneralFormLine(p2Start, p2End), radius)
  for (const line1 of lines1) {
    for (const line2 of lines2) {
      const point = getTwoGeneralFormLinesIntersectionPoint(line1, line2)
      if (point) {
        result.push(point)
      }
    }
  }
  return result
}

/**
 * @public
 */
export function getCirclesTangentToLineAndCircle(p1Start: Position, p1End: Position, circle: Circle, radius: number) {
  const result: Position[] = []
  const lines = getParallelLinesByDistance(twoPointLineToGeneralFormLine(p1Start, p1End), radius)
  const circles = [circle.r + radius, Math.abs(circle.r - radius)]
  for (const line of lines) {
    for (const r of circles) {
      result.push(...getGeneralFormLineCircleIntersectionPoints(line, { ...circle, r }))
    }
  }
  return result
}

/**
 * @public
 */
export function getParallelLinesByDistance(line: GeneralFormLine, distance: number): [GeneralFormLine, GeneralFormLine] {
  if (isZero(distance)) {
    return [line, line]
  }
  const d = distance * Math.sqrt(line.a ** 2 + line.b ** 2)
  return [
    {
      ...line,
      c: line.c + d, // on right side of line
    },
    {
      ...line,
      c: line.c - d, // on left side of line
    },
  ]
}

/**
 * @public
 */
export function deduplicate<T>(array: T[], isSameValue: (a: T, b: T) => boolean) {
  const result: T[] = []
  for (const item of array) {
    if (result.every((r) => !isSameValue(r, item))) {
      result.push(item)
    }
  }
  return result
}

/**
 * @public
 */
export function equals(a: number | undefined, b: number | undefined) {
  if (a === undefined && b === undefined) return true
  if (a === undefined || b === undefined) return false
  return isZero(a - b)
}

/**
 * @public
 */
export function deduplicatePosition(array: Position[]) {
  return deduplicate(array, isSamePoint)
}

/**
 * @public
 */
export function getEllipseAngle(p: Position, ellipse: Ellipse) {
  const newPosition = rotatePositionByCenter(p, getEllipseCenter(ellipse), ellipse.angle ?? 0)
  return radianToAngle(Math.atan2((newPosition.y - ellipse.cy) / ellipse.ry, (newPosition.x - ellipse.cx) / ellipse.rx))
}

export function getEllipseCenter(ellipse: Ellipse) {
  return { x: ellipse.cx, y: ellipse.cy }
}

export function getCircleRadian(p: Position, circle: Circle) {
  return getTwoPointsRadian(p, circle)
}

export function getTwoPointsRadian(to: Position, from: Position = { x: 0, y: 0 }) {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

/**
 * @public
 */
export function normalizeAngleInRange(angle: number, range: AngleRange) {
  while (angle > range.endAngle) {
    angle -= 360
  }
  while (angle < range.startAngle) {
    angle += 360
  }
  return angle
}

/**
 * @public
 */
export function normalizeAngleRange(content: AngleRange) {
  if (content.endAngle < content.startAngle) {
    content.endAngle += 360
  } else if (content.endAngle - content.startAngle > 360) {
    content.endAngle -= 360
  }
}

/**
 * @public
 */
export function pointInPolygon({ x, y }: Position, polygon: Position[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside;
}

export function geometryLineInPolygon(line: GeometryLine, polygon: Position[]) {
  if (Array.isArray(line)) {
    return pointInPolygon(line[0], polygon) && pointInPolygon(line[1], polygon)
  }
  const start = getArcPointAtAngle(line.arc, line.arc.startAngle)
  const end = getArcPointAtAngle(line.arc, line.arc.endAngle)
  return pointInPolygon(start, polygon) && pointInPolygon(end, polygon) && !geometryLineIntersectWithPolygon(line, polygon)
}

export function* iteratePolylineLines(points: Position[]) {
  for (let i = 1; i < points.length; i++) {
    yield [points[i - 1], points[i]] as [Position, Position]
  }
}

export function* iteratePolygonLines(points: Position[]) {
  yield* iteratePolylineLines(polygonToPolyline(points))
}

export function polygonToPolyline(points: Position[]) {
  if (isSamePoint(points[points.length - 1], points[0])) {
    return points
  }
  return [...points, points[0]]
}

/**
 * @public
 */
export function arcToPolyline(content: Arc, angleDelta: number) {
  return getAngleRange(content, angleDelta).map(i => getArcPointAtAngle(content, i))
}

export function getArcPointAtAngle(content: Circle, angle: number) {
  return getCirclePointAtRadian(content, angleToRadian(angle))
}

export function getCirclePointAtRadian(content: Circle, radian: number) {
  return getPointByLengthAndRadian(content, content.r, radian)
}

export function getEllipsePointAtRadian(content: Ellipse, radian: number) {
  const direction = getDirectionByRadian(radian)
  const p = {
    x: content.cx + content.rx * direction.x,
    y: content.cy + content.ry * direction.y,
  }
  if (content.angle) {
    return rotatePosition(p, getEllipseCenter(content), angleToRadian(content.angle))
  } else {
    return p
  }
}

function getAngleRange(range: AngleRange, angleDelta: number) {
  let endAngle: number
  if (range.counterclockwise) {
    endAngle = range.startAngle < range.endAngle ? range.endAngle - 360 : range.endAngle
  } else {
    endAngle = range.startAngle > range.endAngle ? range.endAngle + 360 : range.endAngle
  }
  const angles: number[] = []
  for (let i = range.startAngle; ;) {
    if (equals(i, endAngle)) {
      break
    }
    if (range.counterclockwise ? i < endAngle : i > endAngle) {
      break
    }
    angles.push(i)
    if (range.counterclockwise) {
      i -= angleDelta
    } else {
      i += angleDelta
    }
  }
  if (angles.length === 0 || !equals(angles[angles.length - 1], endAngle)) {
    angles.push(endAngle)
  }
  return angles
}

/**
 * @public
 */
export function ellipseToPolygon(content: Ellipse, angleDelta: number) {
  const lineSegmentCount = 360 / angleDelta
  const points: Position[] = []
  for (let i = 0; i < lineSegmentCount; i++) {
    const radian = angleToRadian(angleDelta * i)
    points.push(getEllipsePointAtRadian(content, radian))
  }
  return points
}

/**
 * @public
 */
export function ellipseArcToPolyline(content: EllipseArc, angleDelta: number) {
  return getAngleRange(content, angleDelta).map(i => getEllipseArcPointAtAngle(content, i))
}

export function getEllipseArcPointAtAngle(content: EllipseArc, angle: number) {
  return getEllipsePointAtRadian(content, angleToRadian(angle))
}

/**
 * @public
 */
export type PathCommand =
  | {
    type: 'move'
    to: Position
  }
  | {
    type: 'line'
    to: Position
  }
  | {
    type: 'arc'
    from: Position
    to: Position
    radius: number
  }
  | {
    type: 'bezierCurve'
    cp1: Position
    cp2: Position
    to: Position
  }
  | {
    type: 'quadraticCurve'
    cp: Position
    to: Position
  }
  | {
    type: 'close'
  }

/**
 * @public
 */
export const PathCommand = (v: unknown, path: Path): ValidationResult => {
  if (!isRecord(v)) return { path, expect: 'object' }
  if (v.type === 'move') return validate(v, {
    type: 'move',
    to: Position,
  }, path)
  if (v.type === 'line') return validate(v, {
    type: 'line',
    to: Position,
  }, path)
  if (v.type === 'arc') return validate(v, {
    type: 'arc',
    from: Position,
    to: Position,
    radius: number,
  }, path)
  if (v.type === 'bezierCurve') return validate(v, {
    type: 'bezierCurve',
    cp1: Position,
    cp2: Position,
    to: Position,
  }, path)
  if (v.type === 'quadraticCurve') return validate(v, {
    type: 'quadraticCurve',
    cp: Position,
    to: Position,
  }, path)
  if (v.type === 'close') return validate(v, {
    type: 'close',
  }, path)
  return { path: [...path, 'type'], expect: 'or', args: ['move', 'line', 'arc', 'bezierCurve', 'quadraticCurve', 'close'] }
}


/**
 * @public
 */
export interface TextStyle {
  fontSize: number
  fontFamily: string
}

/**
 * @public
 */
export const TextStyle = {
  fontSize: number,
  fontFamily: string,
}

export function getTextStyleFont(textStyleFont: TextStyle) {
  return `${textStyleFont.fontSize}px ${textStyleFont.fontFamily}`
}

/**
 * @public
 */
export type Text = Position & TextStyle & {
  text: string
  color: number
}

/**
 * @public
 */
export const Text = /* @__PURE__ */ and(Position, TextStyle, {
  text: string,
  color: number,
})

/**
 * @public
 */
export type Image = Region & {
  url: string
}

/**
 * @public
 */
export const Image = /* @__PURE__ */ and(Region, {
  url: string,
})
