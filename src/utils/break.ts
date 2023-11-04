import { getBezierCurvePercentAtPoint, getPartOfBezierCurve, getPartOfQuadraticCurve, getQuadraticCurvePercentAtPoint, pointIsOnBezierCurve, pointIsOnQuadraticCurve } from "./bezier"
import { getAngleInRange, getCirclePointAtRadian, getCircleRadian, getEllipseAngle, getEllipseArcPointAtAngle, getTwoPointsDistance, isSamePoint, pointIsOnArc, pointIsOnCircle, pointIsOnEllipse, pointIsOnEllipseArc, pointIsOnLine, pointIsOnLineSegment, Position } from "./geometry"
import { GeometryLine } from "./intersection"
import { angleToRadian, radianToAngle } from "./radian"

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

export function getGeometryLineStartAndEnd(line: GeometryLine) {
  if (Array.isArray(line)) {
    return {
      start: line[0],
      end: line[1],
    }
  }
  if (line.type === 'quadratic curve') {
    return {
      start: line.curve.from,
      end: line.curve.to,
    }
  }
  if (line.type === 'bezier curve') {
    return {
      start: line.curve.from,
      end: line.curve.to,
    }
  }
  if (line.type === 'arc') {
    return {
      start: getCirclePointAtRadian(line.curve, angleToRadian(line.curve.startAngle)),
      end: getCirclePointAtRadian(line.curve, angleToRadian(line.curve.endAngle)),
    }
  }
  return {
    start: getEllipseArcPointAtAngle(line.curve, line.curve.startAngle),
    end: getEllipseArcPointAtAngle(line.curve, line.curve.endAngle),
  }
}

export function breakGeometryLines(lines: GeometryLine[], intersectionPoints: Position[]): GeometryLine[][] {
  const result: GeometryLine[][] = []
  let current: GeometryLine[] = []
  let lineStart: Position | undefined
  let lineEnd: Position | undefined
  const save = () => {
    if (current.length > 0) {
      result.push(current)
      current = []
    }
  }
  for (const line of lines) {
    const { start, end } = getGeometryLineStartAndEnd(line)
    if (!lineStart) lineStart = start
    let data: { isOnLine: (p: Position) => boolean, breakLine: (points: Position[]) => void } | undefined
    if (Array.isArray(line)) {
      data = {
        isOnLine: p => pointIsOnLine(p, ...line) && pointIsOnLineSegment(p, ...line),
        breakLine(points) {
          points.sort((a, b) => getTwoPointsDistance(a, line[0]) - getTwoPointsDistance(b, line[0]))
          points.unshift(start)
          points.push(end)
          for (let i = 1; i < points.length; i++) {
            current.push([points[i - 1], points[i]])
            if (i !== points.length - 1) save()
          }
        },
      }
    } else if (line.type === 'arc') {
      data = {
        isOnLine: p => pointIsOnCircle(p, line.curve) && pointIsOnArc(p, line.curve),
        breakLine(points) {
          const angles = points.map(p => getAngleInRange(radianToAngle(getCircleRadian(p, line.curve)), line.curve))
          angles.sort((a, b) => a - b)
          angles.unshift(line.curve.startAngle)
          angles.push(line.curve.endAngle)
          for (let i = 1; i < angles.length; i++) {
            current.push({
              type: 'arc',
              curve: {
                ...line.curve,
                startAngle: angles[i - 1],
                endAngle: angles[i],
              },
            })
            if (i !== angles.length - 1) save()
          }
        },
      }
    } else if (line.type === 'ellipse arc') {
      data = {
        isOnLine: p => pointIsOnEllipse(p, line.curve) && pointIsOnEllipseArc(p, line.curve),
        breakLine(points) {
          const angles = points.map(p => getAngleInRange(getEllipseAngle(p, line.curve), line.curve))
          angles.sort((a, b) => a - b)
          angles.unshift(line.curve.startAngle)
          angles.push(line.curve.endAngle)
          for (let i = 1; i < angles.length; i++) {
            current.push({
              type: 'ellipse arc',
              curve: {
                ...line.curve,
                startAngle: angles[i - 1],
                endAngle: angles[i],
              },
            })
            if (i !== angles.length - 1) save()
          }
        },
      }
    } else if (line.type === 'quadratic curve') {
      data = {
        isOnLine: p => pointIsOnQuadraticCurve(p, line.curve),
        breakLine(points) {
          const percents = points.map(p => getQuadraticCurvePercentAtPoint(line.curve, p))
          percents.sort((a, b) => a - b)
          percents.unshift(0)
          percents.push(1)
          for (let i = 1; i < percents.length; i++) {
            current.push({
              type: 'quadratic curve',
              curve: getPartOfQuadraticCurve(line.curve, percents[i - 1], percents[i]),
            })
            if (i !== percents.length - 1) save()
          }
        },
      }
    } else if (line.type === 'bezier curve') {
      data = {
        isOnLine: p => pointIsOnBezierCurve(p, line.curve),
        breakLine(points) {
          const percents = points.map(p => getBezierCurvePercentAtPoint(line.curve, p))
          percents.sort((a, b) => a - b)
          percents.unshift(0)
          percents.push(1)
          for (let i = 1; i < percents.length; i++) {
            current.push({
              type: 'bezier curve',
              curve: getPartOfBezierCurve(line.curve, percents[i - 1], percents[i]),
            })
            if (i !== percents.length - 1) save()
          }
        },
      }
    }
    if (data) {
      const { isOnLine: filter, breakLine: handle } = data
      if (intersectionPoints.some(p => isSamePoint(p, start))) save()
      const points = intersectionPoints.filter(p => !isSamePoint(p, start) && !isSamePoint(p, end) && filter(p))
      if (points.length === 0) {
        current.push(line)
      } else {
        handle(points)
      }
      if (intersectionPoints.some(p => isSamePoint(p, end))) save()
    }
    lineEnd = end
  }
  save()
  if (result.length > 1 && lineStart && lineEnd) {
    const start = lineStart
    if (isSamePoint(start, lineEnd) && intersectionPoints.every((p) => !isSamePoint(start, p))) {
      const end = result.splice(result.length - 1, 1)
      result[0].unshift(...end[0])
    }
  }
  return result
}
