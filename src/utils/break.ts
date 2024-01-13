import { getBezierCurvePercentAtPoint, getBezierCurvePointAtPercent, getPartOfBezierCurve, getPartOfQuadraticCurve, getQuadraticCurvePercentAtPoint, getQuadraticCurvePointAtPercent, pointIsOnBezierCurve, pointIsOnQuadraticCurve } from "./bezier"
import { largerThan } from "./math"
import { Position } from "./position"
import { getTwoPointsDistance } from "./position"
import { isSamePoint } from "./position"
import { getPointByLengthAndDirection } from "./position"
import { getTwoPointsRadian } from "./radian"
import { getAngleInRange } from "./angle"
import { AngleRange } from "./angle"
import { pointIsOnLine } from "./line"
import { pointIsOnLineSegment } from "./line"
import { getEllipseArcPointAtAngle, getEllipseArcStartAndEnd } from "./ellipse"
import { getEllipsePointAtRadian } from "./ellipse"
import { getArcPointAtAngle, getArcStartAndEnd, getCirclePointAtRadian } from "./circle"
import { getCircleRadian } from "./circle"
import { getEllipseAngle } from "./ellipse"
import { pointIsOnEllipse, pointIsOnEllipseArc } from "./ellipse"
import { pointIsOnArc, pointIsOnCircle } from "./circle"
import { GeometryLine } from "./intersection"
import { getNurbsCurveDerivatives, getNurbsCurveParamAtPoint, getNurbsCurvePointAtParam, getNurbsCurveStartAndEnd, getNurbsMaxParam, getPartOfNurbsCurve, pointIsOnNurbsCurve } from "./nurbs"
import { angleToRadian, radianToAngle } from "./radian"
import { getArcTangentRadianAtRadian, getBezierCurveTangentRadianAtPercent, getEllipseArcTangentRadianAtRadian, getQuadraticCurveTangentRadianAtPercent } from "./tangency"

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
    return getArcStartAndEnd(line.curve)
  }
  if (line.type === 'nurbs curve') {
    return getNurbsCurveStartAndEnd(line.curve)
  }
  return getEllipseArcStartAndEnd(line.curve)
}

export function getGeometryLinesStartAndEnd(lines: GeometryLine[]) {
  return {
    start: getGeometryLineStartAndEnd(lines[0]).start,
    end: getGeometryLineStartAndEnd(lines[lines.length - 1]).end,
  }
}

export function isGeometryLinesClosed(lines: GeometryLine[]) {
  const { start, end } = getGeometryLinesStartAndEnd(lines)
  return isSamePoint(start, end)
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
    }
    if (data) {
      const { breakLine: handle } = data
      if (intersectionPoints.some(p => isSamePoint(p, start))) save()
      const points = intersectionPoints.filter(p => !isSamePoint(p, start) && !isSamePoint(p, end) && pointIsOnGeometryLine(p, line))
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

export function pointIsOnGeometryLine(p: Position, line: GeometryLine) {
  if (Array.isArray(line)) {
    return pointIsOnLine(p, ...line) && pointIsOnLineSegment(p, ...line)
  }
  if (line.type === 'arc') {
    return pointIsOnCircle(p, line.curve) && pointIsOnArc(p, line.curve)
  }
  if (line.type === 'ellipse arc') {
    return pointIsOnEllipse(p, line.curve) && pointIsOnEllipseArc(p, line.curve)
  }
  if (line.type === 'quadratic curve') {
    return pointIsOnQuadraticCurve(p, line.curve)
  }
  if (line.type === 'bezier curve') {
    return pointIsOnBezierCurve(p, line.curve)
  }
  return pointIsOnNurbsCurve(p, line.curve)
}

export function getGeometryLineParamAtPoint(point: Position, line: GeometryLine) {
  if (Array.isArray(line)) {
    return getTwoPointsDistance(line[0], point) / getTwoPointsDistance(...line)
  }
  if (line.type === 'arc') {
    const angle = getAngleInRange(radianToAngle(getTwoPointsRadian(point, line.curve)), line.curve)
    return (angle - line.curve.startAngle) / (line.curve.endAngle - line.curve.startAngle)
  }
  if (line.type === 'ellipse arc') {
    const angle = getAngleInRange(getEllipseAngle(point, line.curve), line.curve)
    return (angle - line.curve.startAngle) / (line.curve.endAngle - line.curve.startAngle)
  }
  if (line.type === 'quadratic curve') {
    return getQuadraticCurvePercentAtPoint(line.curve, point)
  }
  if (line.type === 'bezier curve') {
    return getBezierCurvePercentAtPoint(line.curve, point)
  }
  return getNurbsCurveParamAtPoint(line.curve, point) / getNurbsMaxParam(line.curve)
}

export function getGeometryLinesParamAtPoint(point: Position, lines: GeometryLine[]) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (pointIsOnGeometryLine(point, line)) {
      return i + getGeometryLineParamAtPoint(point, line)
    }
  }
  return 0
}

export function getGeometryLinePointAtParam(param: number, line: GeometryLine) {
  if (Array.isArray(line)) {
    const distance = param * getTwoPointsDistance(...line)
    return getPointByLengthAndDirection(line[0], distance, line[1])
  }
  if (line.type === 'arc') {
    return getArcPointAtAngle(line.curve, getAngleAtParam(param, line.curve))
  }
  if (line.type === 'ellipse arc') {
    return getEllipseArcPointAtAngle(line.curve, getAngleAtParam(param, line.curve))
  }
  if (line.type === 'quadratic curve') {
    return getQuadraticCurvePointAtPercent(line.curve.from, line.curve.cp, line.curve.to, param)
  }
  if (line.type === 'bezier curve') {
    return getBezierCurvePointAtPercent(line.curve.from, line.curve.cp1, line.curve.cp2, line.curve.to, param)
  }
  return getNurbsCurvePointAtParam(line.curve, param * getNurbsMaxParam(line.curve))
}

export function getGeometryLinePointAndTangentRadianAtParam(param: number, line: GeometryLine): { point: Position, radian: number } {
  if (Array.isArray(line)) {
    const distance = param * getTwoPointsDistance(...line)
    return {
      point: getPointByLengthAndDirection(line[0], distance, line[1]),
      radian: getTwoPointsRadian(line[1], line[0]),
    }
  }
  if (line.type === 'arc') {
    const radian = angleToRadian(getAngleAtParam(param, line.curve))
    return {
      point: getCirclePointAtRadian(line.curve, radian),
      radian: getArcTangentRadianAtRadian(line.curve, radian),
    }
  }
  if (line.type === 'ellipse arc') {
    const radian = angleToRadian(getAngleAtParam(param, line.curve))
    return {
      point: getEllipsePointAtRadian(line.curve, radian),
      radian: getEllipseArcTangentRadianAtRadian(line.curve, radian),
    }
  }
  if (line.type === 'quadratic curve') {
    return {
      point: getQuadraticCurvePointAtPercent(line.curve.from, line.curve.cp, line.curve.to, param),
      radian: getQuadraticCurveTangentRadianAtPercent(line.curve, param),
    }
  }
  if (line.type === 'bezier curve') {
    return {
      point: getBezierCurvePointAtPercent(line.curve.from, line.curve.cp1, line.curve.cp2, line.curve.to, param),
      radian: getBezierCurveTangentRadianAtPercent(line.curve, param)
    }
  }
  const [point, point1] = getNurbsCurveDerivatives(line.curve, param * getNurbsMaxParam(line.curve))
  return {
    point,
    radian: Math.atan2(point1.y, point1.x),
  }
}

export function getGeometryLinesPointAtParam(param: number, lines: GeometryLine[]) {
  const index = Math.floor(param)
  const line = lines[index]
  if (!line) return
  return getGeometryLinePointAtParam(param - index, line)
}

function getAngleAtParam(param: number, range: AngleRange) {
  return param * (range.endAngle - range.startAngle) + range.startAngle
}

export function getPartOfGeometryLine(param1: number, param2: number, line: GeometryLine, closed = false): GeometryLine {
  if (Array.isArray(line)) {
    return [
      getGeometryLinePointAtParam(param1, line),
      getGeometryLinePointAtParam(param2, line),
    ]
  }
  if (line.type === 'arc') {
    return {
      ...line,
      curve: {
        ...line.curve,
        startAngle: getAngleAtParam(param1, line.curve),
        endAngle: getAngleAtParam(param2, line.curve),
        counterclockwise: !closed && largerThan(param1, param2) ? !line.curve.counterclockwise : line.curve.counterclockwise,
      },
    }
  }
  if (line.type === 'ellipse arc') {
    return {
      ...line,
      curve: {
        ...line.curve,
        startAngle: getAngleAtParam(param1, line.curve),
        endAngle: getAngleAtParam(param2, line.curve),
        counterclockwise: !closed && largerThan(param1, param2) ? !line.curve.counterclockwise : line.curve.counterclockwise,
      },
    }
  }
  if (line.type === 'quadratic curve') {
    return {
      ...line,
      curve: getPartOfQuadraticCurve(line.curve, param1, param2),
    }
  }
  if (line.type === 'bezier curve') {
    return {
      ...line,
      curve: getPartOfBezierCurve(line.curve, param1, param2),
    }
  }
  const maxParam = getNurbsMaxParam(line.curve)
  return {
    ...line,
    curve: getPartOfNurbsCurve(line.curve, param1 * maxParam, param2 * maxParam)
  }
}
