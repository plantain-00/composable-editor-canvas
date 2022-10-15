import { getTwoPointsDistance, isSamePoint, pointIsOnLine, pointIsOnLineSegment, Position } from "./geometry"

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
    const current: Position[] = []
    const remain: Position[] = []
    intersectionPoints.forEach((p) => {
      if (pointIsOnLine(p, ...line) && pointIsOnLineSegment(p, ...line)) {
        current.push(p)
      } else {
        remain.push(p)
      }
    })
    if (current.length === 0) {
      lastPoints.push(line[1])
    } else {
      intersectionPoints = remain
      current.sort((a, b) => getTwoPointsDistance(a, line[0]) - getTwoPointsDistance(b, line[0]))
      current.forEach((p) => {
        if (!isSamePoint(lastPoints[lastPoints.length - 1], p)) {
          lastPoints.push(p)
        }
        result.push(lastPoints)
        lastPoints = [p]
      })
      if (!isSamePoint(lastPoints[lastPoints.length - 1], line[1])) {
        lastPoints.push(line[1])
      }
    }
  })
  result.push(lastPoints)
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
