import { getBezierCurvePercentAtPoint, getPartOfBezierCurve, getPartOfQuadraticCurve, getQuadraticCurvePercentAtPoint } from "./bezier"
import { Position } from "./position"
import { getTwoPointsDistance } from "./position"
import { isSamePoint } from "./position"
import { getAngleInRange } from "./angle"
import { getRayParamAtPoint, getRayPointAtDistance, pointIsOnLine } from "./line"
import { pointIsOnLineSegment } from "./line"
import { getCircleRadian } from "./circle"
import { getEllipseAngle } from "./ellipse"
import { GeometryLine, getPartOfGeometryLine } from "./geometry-line"
import { getNurbsCurveParamAtPoint, getNurbsMaxParam, getPartOfNurbsCurve } from "./nurbs"
import { radianToAngle } from "./radian"
import { getGeometryLineStartAndEnd } from "./geometry-line"
import { pointIsOnGeometryLine } from "./geometry-line"
import { reverseRay } from "./reverse"

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
    let data: { breakLine: (points: Position[]) => void } | undefined
    if (Array.isArray(line)) {
      data = {
        breakLine(points) {
          points.sort((a, b) => getTwoPointsDistance(a, line[0]) - getTwoPointsDistance(b, line[0]))
          if (start) {
            points.unshift(start)
          }
          if (end) {
            points.push(end)
          }
          for (let i = 1; i < points.length; i++) {
            current.push([points[i - 1], points[i]])
            if (i !== points.length - 1) save()
          }
        },
      }
    } else if (line.type === 'arc') {
      data = {
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
    } else if (line.type === 'nurbs curve') {
      data = {
        breakLine(points) {
          const params = points.map(p => getNurbsCurveParamAtPoint(line.curve, p))
          params.sort((a, b) => a - b)
          params.unshift(0)
          params.push(getNurbsMaxParam(line.curve))
          for (let i = 1; i < params.length; i++) {
            current.push({
              type: 'nurbs curve',
              curve: getPartOfNurbsCurve(line.curve, params[i - 1], params[i]),
            })
            if (i !== params.length - 1) save()
          }
        },
      }
    } else if (line.type === 'ray') {
      data = {
        breakLine(points) {
          const params = points.map(p => getRayParamAtPoint(line.line, p))
          if (!line.line.bidirectional) {
            params.push(0)
          }
          params.sort((a, b) => a - b)
          if (line.line.bidirectional) {
            const point = getRayPointAtDistance(line.line, params[0])
            current.push({
              type: 'ray',
              line: reverseRay({
                ...line.line,
                x: point.x,
                y: point.y,
                bidirectional: false,
              })
            })
            save()
          }
          for (let i = 1; i < params.length; i++) {
            current.push(getPartOfGeometryLine(params[i - 1], params[i], line))
            save()
          }
          const point = getRayPointAtDistance(line.line, params[params.length - 1])
          current.push({
            type: 'ray',
            line: {
              ...line.line,
              x: point.x,
              y: point.y,
              bidirectional: false,
            }
          })
          save()
        },
      }
    }
    if (data) {
      const { breakLine: handle } = data
      if (start && intersectionPoints.some(p => isSamePoint(p, start))) save()
      const points = intersectionPoints.filter(p => (!start || !isSamePoint(p, start)) && (!end || !isSamePoint(p, end)) && pointIsOnGeometryLine(p, line))
      if (points.length === 0) {
        current.push(line)
      } else {
        handle(points)
      }
      if (end && intersectionPoints.some(p => isSamePoint(p, end))) save()
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
