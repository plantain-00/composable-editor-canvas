import { GeometryLine, geometryLineIntersectWithPolygon } from "./intersection"
import { isRecord } from "./is-record"
import { angleToRadian, radianToAngle } from "./radian"
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
export function getPointAndRegionMaximumDistance(position: Position, region: TwoPointsFormRegion) {
  return getPointAndPolygonMaximumDistance(position, getPolygonFromTwoPointsFormRegion(region))
}

export function getPointAndPolygonMaximumDistance(position: Position, polygon: Position[]) {
  return Math.max(...polygon.map((r) => getTwoPointsDistance(position, r)))
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

export function generalFormLineToTwoPointLine({ a, b, c }: GeneralFormLine): [Position, Position] {
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

export function getPolygonFromTwoPointsFormRegion(region: TwoPointsFormRegion) {
  return [
    region.start,
    { x: region.start.x, y: region.end.y },
    region.end,
    { x: region.end.x, y: region.start.y },
  ]
}

export function* getPolygonLine(polygon: Position[]): Generator<[Position, Position], void, unknown> {
  for (let i = 0; i < polygon.length; i++) {
    yield [polygon[i], polygon[i + 1 < polygon.length ? i + 1 : 0]]
  }
}

export function getSymmetryPoint(p: Position, { a, b, c }: GeneralFormLine) {
  const d = a ** 2
  const e = b ** 2
  const f = d + e
  const g = -2 * a * b
  const h = e - d
  return {
    x: (h * p.x + g * p.y - 2 * a * c) / f,
    y: (g * p.x - h * p.y - 2 * b * c) / f,
  }
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
  return radianToAngle(getEllipseRadian(p, ellipse))
}

export function getEllipseRadian(p: Position, ellipse: Ellipse) {
  const newPosition = rotatePositionByCenter(p, getEllipseCenter(ellipse), ellipse.angle ?? 0)
  return Math.atan2((newPosition.y - ellipse.cy) / ellipse.ry, (newPosition.x - ellipse.cx) / ellipse.rx)
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
  let start: Position
  let end: Position
  if (line.type === 'ellipse arc') {
    start = getEllipseArcPointAtAngle(line.ellipseArc, line.ellipseArc.startAngle)
    end = getEllipseArcPointAtAngle(line.ellipseArc, line.ellipseArc.endAngle)
  } else {
    start = getArcPointAtAngle(line.arc, line.arc.startAngle)
    end = getArcPointAtAngle(line.arc, line.arc.endAngle)
  }
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
