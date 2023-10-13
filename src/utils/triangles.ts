import { Position, polygonToPolyline, isSamePoint, GeneralFormLine, twoPointLineToGeneralFormLine, getParallelLinesByDistance, getTwoPointsRadian, arcToPolyline, getPointByLengthAndDirection, equals } from "./geometry"
import { getTwoGeneralFormLinesIntersectionPoint } from "./intersection"
import { getPerpendicular } from "./perpendicular"
import { radianToAngle } from "./radian"

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

export const defaultMiterLimit = 10