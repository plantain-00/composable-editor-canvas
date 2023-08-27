import { getPointAndLineSegmentMinimumDistance, getPointSideOfLine, getTwoPointsDistance, isSamePoint, pointIsOnLine, pointIsOnLineSegment, Position, twoPointLineToGeneralFormLine } from "./geometry"

/**
 * @public
 */
export function breakPolylineToPolylines(
  lines: [Position, Position][],
  intersectionPoints: Position[],
) {
  const result: Position[][] = []
  let lastPoints: Position[] = [lines[0][0]]
  lines.forEach((line) => {
    const current = intersectionPoints.filter(p => pointIsOnLine(p, ...line) && pointIsOnLineSegment(p, ...line))
    if (current.length === 0) {
      lastPoints.push(line[1])
    } else {
      current.sort((a, b) => getTwoPointsDistance(a, line[0]) - getTwoPointsDistance(b, line[0]))
      current.forEach((p) => {
        if (!isSamePoint(lastPoints[lastPoints.length - 1], p)) {
          lastPoints.push(p)
        }
        if (lastPoints.length > 1) {
          result.push(lastPoints)
        }
        lastPoints = [p]
      })
      if (!isSamePoint(lastPoints[lastPoints.length - 1], line[1])) {
        lastPoints.push(line[1])
      }
    }
  })
  if (lastPoints.length > 1) {
    result.push(lastPoints)
  }
  if (result.length > 1) {
    const startPoint = result[0][0]
    const lastResult = result[result.length - 1]
    if (isSamePoint(startPoint, lastResult[lastResult.length - 1]) && intersectionPoints.every((p) => !isSamePoint(startPoint, p))) {
      result[0].unshift(...lastResult.slice(0, lastResult.length - 1))
      return result.slice(0, result.length - 1)
    }
    return result
  }
  return result
}

export function mergePolylinesToPolyline<T extends { points: Position[] }>(lines: T[]) {
  for (let i = lines.length - 1; i > 0; i--) {
    for (let j = i - 1; j >= 0; j--) {
      const previous = lines[j]
      const current = lines[i]
      if (isSamePoint(current.points[0], previous.points[previous.points.length - 1])) {
        lines.splice(i, 1)
        previous.points.push(...current.points.slice(1))
        break
      }
      if (isSamePoint(current.points[0], previous.points[0])) {
        lines.splice(i, 1)
        previous.points.unshift(...current.points.slice(1).reverse())
        break
      }
      if (isSamePoint(current.points[current.points.length - 1], previous.points[previous.points.length - 1])) {
        lines.splice(i, 1)
        previous.points.push(...current.points.reverse().slice(1))
        break
      }
      if (isSamePoint(current.points[current.points.length - 1], previous.points[0])) {
        lines.splice(i, 1)
        previous.points.unshift(...current.points.slice(0, current.points.length - 1))
        break
      }
    }
  }
}

export function getLinesOffsetDirection(point: Position, lines: [Position, Position][]) {
  let min: { distance: number, line: [Position, Position] } | undefined
  for (const line of lines) {
    const distance = getPointAndLineSegmentMinimumDistance(point, ...line)
    if (!min || distance < min.distance) {
      min = { distance, line }
    }
  }
  const line = min?.line ?? lines[0]
  return getPointSideOfLine(point, twoPointLineToGeneralFormLine(...line)) > 0 ? 1 : 0
}
