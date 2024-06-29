import { getPointByLengthAndRadian, isSameDirection3D } from "./position";
import { angleToRadian, getTwoPointsRadian } from "./radian";
import { ExtendType, deduplicate, equals, largerThan, lessOrEqual, lessThan } from "./math";
import { isSamePoint } from "./position";
import { getTwoPointsDistance } from "./position";
import { getPointByLengthAndDirection } from "./position";
import { isZero } from "./math";
import { isSameNumber, isBetween } from "./math";
import { Position } from "./position";
import { rotatePositionByCenter } from "./position";
import { and, boolean, number, optional } from "./validators";
import { RenderTransform, Transform, reverseTransformPosition } from "./transform";
import { Matrix, m3, v3 } from "./matrix";
import { reverseAngle, reverseRadian } from "./reverse";
import { Vec3 } from "./types";

export interface GeneralFormLine {
  a: number
  b: number
  c: number
}

export const GeneralFormLine = {
  a: number,
  b: number,
  c: number,
}

export interface Ray extends Position {
  angle: number
  bidirectional?: boolean
  reversed?: boolean
}

export const Ray = /* @__PURE__ */ and(Position, {
  angle: number,
  bidirectional: /* @__PURE__ */ optional(boolean),
  reversed: /* @__PURE__ */ optional(boolean),
})

export function pointIsOnLineSegment(p: Position, point1: Position, point2: Position, extend: ExtendType = { body: true }) {
  if (extend.head && extend.body && extend.tail) return true
  if (!extend.head && !extend.body && !extend.tail) return false
  if (!isSameNumber(point1.x, point2.x)) {
    return isBetween(p.x, point1.x, point2.x, extend)
  }
  if (!isSameNumber(point1.y, point2.y)) {
    return isBetween(p.y, point1.y, point2.y, extend)
  }
  return false
}

export function pointIsOnLine(p: Position, point1: Position, point2: Position): boolean {
  const line = twoPointLineToGeneralFormLine(point1, point2)
  if (!line) return false
  return pointIsOnGeneralFormLine(p, line)
}

export function pointIsOnGeneralFormLine(p: Position, { a, b, c }: GeneralFormLine) {
  return isZero(a * p.x + b * p.y + c)
}

export function pointIsOnRay(p: Position, ray: Ray, extend: ExtendType = { body: true }): boolean {
  if (extend.head && extend.body && extend.tail) return true
  if (!extend.head && !extend.body && !extend.tail) return false
  const radian = angleToRadian(ray.angle)
  if (ray.bidirectional) {
    return !!extend.body && pointIsOnGeneralFormLine(p, pointAndDirectionToGeneralFormLine(p, radian))
  }
  if (extend.body && isSamePoint(p, ray)) return true
  const r = getTwoPointsRadian(p, ray)
  if (extend.body && isSameNumber(radian, r)) return true
  if (extend.head && isSameNumber(radian, reverseRadian(r))) return true
  return false
}

export function isSameLine(line1: GeneralFormLine, line2: GeneralFormLine): boolean {
  // a1 x + b1 y + c1 = 0
  // a2 x + b2 y + c2 = 0
  // a1/a2 = b1/b2
  if (!equals(line1.a * line2.b, line2.a * line1.b)) {
    return false
  }
  if (isZero(line1.a)) {
    // b1/b2 = c1/c2
    return equals(line1.b * line2.c, line2.b * line1.c)
  }
  // a1/a2 = c1/c2
  return equals(line1.a * line2.c, line2.a * line1.c)
}

/**
 * 0: point on line
 * >0: point on left side of line
 * <0: point on right side of line
 */
export function getPointSideOfLine(point: Position, line: GeneralFormLine): number {
  return line.a * point.x + line.b * point.y + line.c
}

export function twoPointLineToGeneralFormLine(point1: Position, point2: Position): GeneralFormLine | undefined {
  if (isSamePoint(point1, point2)) return undefined
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return {
    a: dy,
    b: -dx,
    c: -point1.x * dy + point1.y * dx,
  }
}

export function pointAndDirectionToGeneralFormLine(point: Position, radian: number): GeneralFormLine {
  // a x + b y + c = 0
  // -a/b = sin(radian)/cos(radian)
  const dx = Math.cos(radian)
  const dy = Math.sin(radian)
  return {
    a: dy,
    b: -dx,
    c: -point.x * dy + point.y * dx,
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

export function dashedPolylineToLines(
  points: Position[],
  dashArray?: number[],
  skippedLines?: number[],
  dashOffset = 0
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

export function drawDashedPolyline(
  g: { moveTo: (x: number, y: number) => void; lineTo: (x: number, y: number) => void },
  points: Position[],
  dashArray: number[],
  skippedLines?: number[],
  dashOffset = 0
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

export function drawDashedLine(
  g: { moveTo: (x: number, y: number) => void; lineTo: (x: number, y: number) => void },
  p1: Position,
  p2: Position,
  dashArray: number[],
  dashOffset = 0
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

export function getParallelLineSegmentsByDistance(line: [Position, Position], distance: number): [[Position, Position], [Position, Position]] | undefined {
  if (isZero(distance)) {
    return [line, line]
  }
  if (isSamePoint(...line)) return
  const radian = getTwoPointsRadian(line[1], line[0])
  const leftRadian = radian - Math.PI / 2
  const rightRadian = radian + Math.PI / 2
  return [
    [
      getPointByLengthAndRadian(line[0], distance, rightRadian),
      getPointByLengthAndRadian(line[1], distance, rightRadian)
    ],
    [
      getPointByLengthAndRadian(line[0], distance, leftRadian),
      getPointByLengthAndRadian(line[1], distance, leftRadian)
    ],
  ]
}

export function getParallelRaysByDistance<T extends Ray>(ray: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [ray, ray]
  }
  const radian = angleToRadian(ray.angle)
  return [
    {
      ...ray,
      ...getPointByLengthAndRadian(ray, distance, radian + Math.PI / 2),
    },
    {
      ...ray,
      ...getPointByLengthAndRadian(ray, distance, radian - Math.PI / 2),
    },
  ]
}

export function getGeneralFormLineRadian({ a, b }: GeneralFormLine) {
  // a x1 + b y1 + c = 0
  // a x2 + b y2 + c = 0
  // a(x2 - x1) + b(y2 - y1) = 0
  // y2 - y1 = a
  // x2 - x1 = -b
  return Math.atan2(a, -b)
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

export function pointInPolygon({ x, y }: Position, polygon: Position[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    if ((largerThan(yi, y) !== largerThan(yj, y)) && lessThan(x, (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
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

export function getPolygonArea(points: Position[]) {
  let result = 0
  for (let i = 0; i < points.length; i++) {
    const next = i === points.length - 1 ? 0 : i + 1
    result += points[i].x * points[next].y - points[next].x * points[i].y
  }
  return result / 2
}

export function* getPolygonLine(polygon: Position[]): Generator<[Position, Position], void, unknown> {
  for (let i = 0; i < polygon.length; i++) {
    yield [polygon[i], polygon[i + 1 < polygon.length ? i + 1 : 0]]
  }
}

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

export function getRayPointAtDistance({ x: x1, y: y1, angle, reversed }: Ray, distance: number): Position {
  if (reversed) {
    distance = -distance
  }
  const r = angleToRadian(angle)
  return {
    x: x1 + distance * Math.cos(r),
    y: y1 + distance * Math.sin(r),
  }
}

export function rayToLineSegment(ray: Ray, polygon: Position[]): [Position, Position] | undefined {
  let distances: number[] = []
  for (const line of getPolygonLine(polygon)) {
    const d = getRayLineSegmentIntersectionDistance(ray, line)
    if (d !== undefined) {
      distances.push(d)
    }
  }
  distances = deduplicate(distances, isSameNumber)
  if (distances.length === 0) return
  if (distances.length === 1) {
    if (pointInPolygon(ray, polygon)) {
      return [ray, getRayPointAtDistance(ray, distances[0])]
    }
    return
  }
  distances.sort((a, b) => a - b)
  return [getRayPointAtDistance(ray, distances[0]), getRayPointAtDistance(ray, distances[distances.length - 1])]
}

export function getRayLineSegmentIntersectionDistance({ x: x1, y: y1, angle, bidirectional }: Ray, line: [Position, Position]): number | undefined {
  const generalFormLine = twoPointLineToGeneralFormLine(...line)
  if (!generalFormLine) return
  const r = angleToRadian(angle), e1 = Math.cos(r), e2 = Math.sin(r)
  // x = x1 + d e1
  // y = y1 + d e2
  const { a, b, c } = generalFormLine
  // a x + b y + c = 0
  // replace x,y: (a e1 + b e2) d + a x1 + b y1 + c = 0
  const e3 = a * e1 + b * e2
  if (isZero(e3)) return
  const d = -(a * x1 + b * y1 + c) / e3
  if (!bidirectional && lessOrEqual(d, 0)) return
  if (!pointIsOnLineSegment({ x: x1 + d * e1, y: y1 + d * e2 }, ...line)) return
  return d
}

export function getRayTransformedLineSegment(ray: Ray, width: number, height: number, transform?: RenderTransform, parentMatrix?: Matrix) {
  let points = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }]
  if (transform) {
    const t: Transform = {
      ...transform,
      center: {
        x: width / 2,
        y: height / 2,
      }
    }
    points = points.map(p => reverseTransformPosition(p, t))
  }
  if (parentMatrix) {
    const inverse = m3.inverse(parentMatrix)
    points = points.map(p => {
      const v = m3.multiplyVec3(inverse, [p.x, p.y, 1])
      return { x: v[0], y: v[1] }
    })
  }
  return rayToLineSegment(ray, points)
}

export function getRayStartAndEnd(ray: Ray): { start?: Position, end?: Position } {
  return {
    start: ray.bidirectional || ray.reversed ? undefined : ray,
    end: !ray.bidirectional && ray.reversed ? ray : undefined,
  }
}

export function getLineParamAtPoint(p1: Position, p2: Position, point: Position) {
  if (isSameNumber(p1.x, p2.x)) {
    return (point.y - p1.y) / (p2.y - p1.y)
  }
  return (point.x - p1.x) / (p2.x - p1.x)
}

export function getRayParamAtPoint(ray: Ray, point: Position) {
  const d = getTwoPointsDistance(ray, point)
  if (isZero(d)) return 0
  return d * (isSameNumber(angleToRadian(ray.angle), getTwoPointsRadian(point, ray)) ? 1 : -1) * (ray.reversed ? -1 : 1)
}

export function getRayAngle(ray: Ray): number {
  return ray.reversed ? reverseAngle(ray.angle) : ray.angle
}

export function pointIsOnLine3D(p: Vec3, p1: Vec3, direction: Vec3): boolean {
  const d = v3.substract(p, p1)
  return isSameDirection3D(d, direction)
}
