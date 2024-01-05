import { Position, polygonToPolyline, isSamePoint, GeneralFormLine, twoPointLineToGeneralFormLine, getParallelLinesByDistance, getTwoPointsRadian, arcToPolyline, getPointByLengthAndDirection, isSameNumber, largerThan, lessThan, normalizeRadian } from "./geometry"
import { getTwoGeneralFormLinesIntersectionPoint } from "./intersection"
import { getPerpendicularPoint } from "./perpendicular"
import { radianToAngle } from "./radian"

export function getPolylineTriangles(
  points: Position[],
  width: number,
  lineCapWithClosed: LineCapWithClosed = defaultLineCap,
  lineJoinWithLimit: LineJoinWithLimit = defaultMiterLimit,
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
  const base: number[] = []
  for (let i = 0; i < points.length; i++) {
    if (lineCapWithClosed !== true) {
      if (i === 0) {
        let p = points[0]
        if (lineCapWithClosed === 'round') {
          const angle = radianToAngle(getTwoPointsRadian(p, points[1]))
          const ps = arcToPolyline({ x: p.x, y: p.y, r: radius, startAngle: angle - 90, endAngle: angle + 90 }, 5)
          for (const s of ps) {
            result.push(s.x, s.y, p.x, p.y)
            base.push(p.x, p.y, p.x, p.y)
          }
        }
        if (lineCapWithClosed === 'square') {
          p = getPointByLengthAndDirection(p, -radius, points[1])
        }
        for (const line1 of parallelLines[i]) {
          const point2 = getPerpendicularPoint(p, line1)
          result.push(point2.x, point2.y)
          base.push(p.x, p.y)
        }
        continue
      }
      if (i === points.length - 1) {
        let p = points[i]
        if (lineCapWithClosed === 'square') {
          p = getPointByLengthAndDirection(p, -radius, points[i - 1])
        }
        for (const line1 of parallelLines[i - 1]) {
          const point2 = getPerpendicularPoint(p, line1)
          result.push(point2.x, point2.y)
          base.push(p.x, p.y)
        }
        if (lineCapWithClosed === 'round') {
          const angle = radianToAngle(getTwoPointsRadian(p, points[i - 1]))
          const ps = arcToPolyline({ x: p.x, y: p.y, r: radius, startAngle: angle + 90, endAngle: angle - 90, counterclockwise: true }, 5)
          for (const s of ps) {
            result.push(p.x, p.y, s.x, s.y)
            base.push(p.x, p.y, p.x, p.y)
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
    radian = normalizeRadian(radian)

    if (isSameNumber(radian, Math.PI) || isSameNumber(radian, -Math.PI)) {
      const p1 = getPerpendicularPoint(points[i], previousParallelLines[0])
      const p2 = getPerpendicularPoint(points[i], nextParallelLines[0])
      result.push(p1.x, p1.y, p2.x, p2.y)
      base.push(b.x, b.y, b.x, b.y)
    } else if (!isSameNumber(radian, 0)) {
      let lineJoin = lineJoinWithLimit
      if (radianLimit !== undefined) {
        let a = Math.abs(radian)
        if (largerThan(a, Math.PI / 2)) {
          a = Math.PI - a
        }
        if (a < radianLimit) {
          lineJoin = 'bevel'
        }
      }

      if (lineJoin === 'bevel' || lineJoin === 'round') {
        const sweep = largerThan(radian, 0) && lessThan(radian, Math.PI)
        const index1 = sweep ? 0 : 1
        const index2 = sweep ? 1 : 0
        const p = getTwoGeneralFormLinesIntersectionPoint(previousParallelLines[index1], nextParallelLines[index1])
        const p1 = getPerpendicularPoint(points[i], previousParallelLines[index2])
        const p2 = getPerpendicularPoint(points[i], nextParallelLines[index2])
        if (p) {
          let ps: Position[]
          if (lineJoin === 'bevel') {
            ps = [p1, p2]
          } else {
            const startAngle = radianToAngle(getTwoPointsRadian(p1, b))
            const endAngle = radianToAngle(getTwoPointsRadian(p2, b))
            ps = arcToPolyline({ x: b.x, y: b.y, r: radius, startAngle, endAngle, counterclockwise: !sweep }, 5)
          }
          for (const s of ps) {
            if (sweep) {
              result.push(p.x, p.y, s.x, s.y)
            } else {
              result.push(s.x, s.y, p.x, p.y)
            }
            base.push(b.x, b.y, b.x, b.y)
          }
        }
      } else {
        const point1 = getTwoGeneralFormLinesIntersectionPoint(previousParallelLines[0], nextParallelLines[0])
        if (point1) {
          result.push(point1.x, point1.y)
          base.push(b.x, b.y)
          const point2 = getTwoGeneralFormLinesIntersectionPoint(previousParallelLines[1], nextParallelLines[1])
          if (point2) {
            result.push(point2.x, point2.y)
            base.push(b.x, b.y)
          }
        }
      }
    }
  }
  return { points: result, base }
}

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

export type LineJoin = 'round' | 'bevel' | 'miter'
export type LineCap = 'butt' | 'round' | 'square'
export type LineCapWithClosed = true | LineCap
export type LineJoinWithLimit = 'round' | 'bevel' | number

export const defaultMiterLimit = 10
export const defaultLineJoin = 'miter'
export const defaultLineCap = 'butt'
