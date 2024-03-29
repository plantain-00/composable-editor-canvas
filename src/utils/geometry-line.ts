import { geometryLineIntersectWithPolygon, iterateGeometryLinesSelfIntersectionPoints } from "./intersection";
import { QuadraticCurve, BezierCurve, getBezierCurvePercentAtPoint, getBezierCurvePointAtPercent, getPartOfBezierCurve, getPartOfQuadraticCurve, getQuadraticCurvePercentAtPoint, getQuadraticCurvePointAtPercent, pointIsOnBezierCurve, pointIsOnQuadraticCurve } from "./bezier";
import { getArcStartAndEnd, Arc, getArcPointAtAngle, getCirclePointAtRadian, pointIsOnArc, pointIsOnCircle, getArcByStartEndBulge } from "./circle";
import { getEllipseArcStartAndEnd, EllipseArc, getEllipseAngle, getEllipseArcPointAtAngle, getEllipsePointAtRadian, pointIsOnEllipse, pointIsOnEllipseArc } from "./ellipse";
import { isArray } from "./is-array";
import { isRecord } from "./is-record";
import { Ray, getLineParamAtPoint, getPolygonArea, getRayParamAtPoint, getRayPointAtDistance, getRayStartAndEnd, pointInPolygon, pointIsOnLine, pointIsOnLineSegment, pointIsOnRay } from "./line";
import { getNurbsCurveDerivatives, getNurbsCurveParamAtPoint, getNurbsCurvePointAtParam, getNurbsCurveStartAndEnd, getNurbsMaxParam, getPartOfNurbsCurve, NurbsCurve, pointIsOnNurbsCurve } from "./nurbs";
import { Position, deduplicatePosition, getPointByLengthAndDirection, getTwoPointsDistance, isSamePoint } from "./position";
import { Path, ValidationResult, validate, tuple } from "./validators";
import { getAngleInRange, AngleRange } from "./angle";
import { deduplicate, equals, first, isBetween, isSameNumber, isZero, largerThan, lessOrEqual, lessThan, maxmiumBy } from "./math";
import { radianToAngle, getTwoPointsRadian, angleToRadian } from "./radian";
import { getArcTangentRadianAtRadian, getEllipseArcTangentRadianAtRadian, getQuadraticCurveTangentRadianAtPercent, getBezierCurveTangentRadianAtPercent } from "./tangency";
import { reverseClosedGeometryLinesIfAreaIsNegative, reverseGeometryLines } from "./reverse";
import { getGeometryLinesPoints } from "./hatch";
import { getParallelGeometryLinesByDistanceDirectionIndex, pointSideToIndex } from "./parallel";

export type GeometryLine = [Position, Position] |
{ type: 'arc'; curve: Arc } |
{ type: 'ellipse arc'; curve: EllipseArc } |
{ type: 'quadratic curve'; curve: QuadraticCurve } |
{ type: 'bezier curve'; curve: BezierCurve } |
{ type: 'nurbs curve'; curve: NurbsCurve } |
{ type: 'ray', line: Ray }

export const GeometryLine = (v: unknown, path: Path): ValidationResult => {
  if (isArray(v)) return validate(v, tuple(Position, Position), path)
  if (!isRecord(v)) return { path, expect: 'object' }
  if (v.type === 'arc') return validate(v, { type: 'arc', curve: Arc }, path)
  if (v.type === 'ellipse arc') return validate(v, { type: 'ellipse arc', curve: EllipseArc }, path)
  if (v.type === 'quadratic curve') return validate(v, { type: 'quadratic curve', curve: QuadraticCurve }, path)
  if (v.type === 'bezier curve') return validate(v, { type: 'bezier curve', curve: BezierCurve }, path)
  if (v.type === 'nurbs curve') return validate(v, { type: 'nurbs curve', curve: NurbsCurve }, path)
  if (v.type === 'ray') return validate(v, { type: 'ray', line: Ray }, path)
  return { path: [...path, 'type'], expect: 'or', args: ['arc', 'ellipse arc', 'quadratic curve', 'bezier curve', 'nurbs curve', 'ray'] }
}

export function geometryLineInPolygon(line: GeometryLine, polygon: Position[]) {
  if (Array.isArray(line)) {
    return pointInPolygon(line[0], polygon) && pointInPolygon(line[1], polygon)
  }
  let points: { start: Position; end: Position }
  if (line.type === 'arc') {
    points = getArcStartAndEnd(line.curve)
  } else if (line.type === 'ellipse arc') {
    points = getEllipseArcStartAndEnd(line.curve)
  } else if (line.type === 'nurbs curve') {
    points = getNurbsCurveStartAndEnd(line.curve)
  } else if (line.type === 'ray') {
    return false
  } else {
    points = {
      start: line.curve.from,
      end: line.curve.to,
    }
  }
  return pointInPolygon(points.start, polygon) && pointInPolygon(points.end, polygon) && !geometryLineIntersectWithPolygon(line, polygon)
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
  if (line.type === 'ray') {
    return getRayStartAndEnd(line.line)
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
  if (!start || !end) return false
  return isSamePoint(start, end)
}

export function pointIsOnGeometryLines(p: Position, lines: GeometryLine[]) {
  return lines.some(line => pointIsOnGeometryLine(p, line))
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
  if (line.type === 'ray') {
    return pointIsOnRay(p, line.line)
  }
  return pointIsOnNurbsCurve(p, line.curve)
}

export function getGeometryLineParamAtPoint(point: Position, line: GeometryLine, beforeStart?: boolean) {
  if (Array.isArray(line)) {
    return getLineParamAtPoint(...line, point)
  }
  if (line.type === 'arc') {
    const angle = getAngleInRange(radianToAngle(getTwoPointsRadian(point, line.curve)), line.curve)
    const angleRange = line.curve.endAngle - line.curve.startAngle
    const param = (angle - line.curve.startAngle) / angleRange
    if (param > 1 && beforeStart) {
      return param - 360 / angleRange
    }
    return param
  }
  if (line.type === 'ellipse arc') {
    const angle = getAngleInRange(getEllipseAngle(point, line.curve), line.curve)
    const angleRange = line.curve.endAngle - line.curve.startAngle
    const param = (angle - line.curve.startAngle) / angleRange
    if (param > 1 && beforeStart) {
      return param - 360 / angleRange
    }
    return param
  }
  if (line.type === 'quadratic curve') {
    return getQuadraticCurvePercentAtPoint(line.curve, point)
  }
  if (line.type === 'bezier curve') {
    return getBezierCurvePercentAtPoint(line.curve, point)
  }
  if (line.type === 'ray') {
    return getRayParamAtPoint(line.line, point)
  }
  return getNurbsCurveParamAtPoint(line.curve, point) / getNurbsMaxParam(line.curve)
}

export function getGeometryLinesParamAtPoint(point: Position, lines: GeometryLine[]) {
  return first(iterateGeometryLinesParamsAtPoint(point, lines)) ?? 0
}

export function* iterateGeometryLinesParamsAtPoint(point: Position, lines: GeometryLine[]) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (pointIsOnGeometryLine(point, line)) {
      yield i + getGeometryLineParamAtPoint(point, line)
    }
  }
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
  if (line.type === 'ray') {
    return getRayPointAtDistance(line.line, param)
  }
  return getNurbsCurvePointAtParam(line.curve, param * getNurbsMaxParam(line.curve))
}

export function getGeometryLinePointAndTangentRadianAtParam(param: number, line: GeometryLine): { point: Position; radian: number } {
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
  if (line.type === 'ray') {
    return {
      point: getRayPointAtDistance(line.line, param),
      radian: angleToRadian(line.line.angle),
    }
  }
  const [point, point1] = getNurbsCurveDerivatives(line.curve, param * getNurbsMaxParam(line.curve))
  return {
    point,
    radian: Math.atan2(point1.y, point1.x),
  }
}

export function getGeometryLinesPointAtParam(param: number, lines: GeometryLine[]) {
  for (const line of lines) {
    if (!Array.isArray(line) && line.type === 'ray') {
      return getGeometryLinePointAtParam(param, line)
    }
    if (lessThan(param, 0)) return
    if (lessOrEqual(param, 1)) {
      return getGeometryLinePointAtParam(param, line)
    }
    param--
  }
  return
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
  if (line.type === 'ray') {
    return [getRayPointAtDistance(line.line, param1), getRayPointAtDistance(line.line, param2)]
  }
  const maxParam = getNurbsMaxParam(line.curve)
  return {
    ...line,
    curve: getPartOfNurbsCurve(line.curve, param1 * maxParam, param2 * maxParam)
  }
}

export function getPartOfGeometryLines(param1: number, param2: number, lines: GeometryLine[]): GeometryLine[] {
  if (param1 > param2) {
    return reverseGeometryLines(getPartOfGeometryLines(param2, param1, lines))
  }
  const result: GeometryLine[] = []
  const start = Math.max(0, Math.floor(param1))
  const end = Math.min(lines.length - 1, Math.floor(param2))
  for (let i = start; i <= end; i++) {
    const line = lines[i]
    const j = param1 - i
    const k = param2 - i
    if (isBetween(j, 0, 1)) {
      if (isBetween(k, 0, 1)) {
        if (!equals(j, k)) {
          result.push(getPartOfGeometryLine(j, k, line))
        }
      } else {
        if (!equals(j, 1)) {
          result.push(getPartOfGeometryLine(j, 1, line))
        }
      }
    } else if (isBetween(k, 0, 1)) {
      if (!equals(k, 0)) {
        result.push(getPartOfGeometryLine(0, k, line))
      }
    } else {
      result.push(line)
    }
  }
  return result
}

export function getGeometryLineByStartEndBulge(start: Position, end: Position, bulge: number): GeometryLine {
  if (isZero(bulge)) {
    return [start, end]
  }
  return {
    type: 'arc',
    curve: getArcByStartEndBulge(start, end, bulge),
  }
}

export function splitGeometryLines(lines: GeometryLine[]): GeometryLine[][] {
  const points = deduplicatePosition(Array.from(iterateGeometryLinesSelfIntersectionPoints(lines)))
  for (const point of points) {
    const params = deduplicate(Array.from(iterateGeometryLinesParamsAtPoint(point, lines)), isSameNumber)
    if (params.length < 2) {
      continue
    }
    const result: GeometryLine[][] = []
    const part1 = [
      ...getPartOfGeometryLines(params[1], lines.length, lines),
      ...getPartOfGeometryLines(0, params[0], lines),
    ]
    if (part1.length === 0) continue
    const part2 = getPartOfGeometryLines(params[0], params[1], lines)
    if (part2.length === 0) continue
    const area1 = getPolygonArea(getGeometryLinesPoints(part1))
    if (!isZero(area1)) {
      if (area1 < 0) continue
      result.push(...splitGeometryLines(part1))
    }
    const area2 = getPolygonArea(getGeometryLinesPoints(part2))
    if (!isZero(area2)) {
      if (area2 < 0) continue
      result.push(...splitGeometryLines(part2))
    }
    return result
  }
  return [lines]
}

export function optimizeGeometryLine(line: GeometryLine): GeometryLine | undefined {
  if (Array.isArray(line)) {
    if (isSamePoint(...line)) return
  } else if (line.type === 'arc') {
    if (isSameNumber(line.curve.startAngle, line.curve.endAngle)) return
    if (lessOrEqual(line.curve.r, 0)) return
  } else if (line.type === 'ellipse arc') {
    if (isSameNumber(line.curve.startAngle, line.curve.endAngle)) return
    if (lessOrEqual(line.curve.rx, 0)) return
    if (lessOrEqual(line.curve.ry, 0)) return
    if (isSameNumber(line.curve.rx, line.curve.ry)) {
      return optimizeGeometryLine({
        type: 'arc',
        curve: {
          r: line.curve.rx,
          x: line.curve.cx,
          y: line.curve.cy,
          startAngle: line.curve.startAngle,
          endAngle: line.curve.endAngle,
          counterclockwise: line.curve.counterclockwise,
        }
      })
    }
  } else if (line.type === 'quadratic curve') {
    if (pointIsOnLine(line.curve.cp, line.curve.from, line.curve.to)) {
      return optimizeGeometryLine([line.curve.from, line.curve.to])
    }
  } else if (line.type === 'bezier curve') {
    if (pointIsOnLine(line.curve.cp1, line.curve.from, line.curve.to) && pointIsOnLine(line.curve.cp2, line.curve.from, line.curve.to)) {
      return optimizeGeometryLine([line.curve.from, line.curve.to])
    }
  } else if (line.type === 'nurbs curve') {
    if (line.curve.points.length < 2) return
    if (line.curve.points.length === 2) {
      return optimizeGeometryLine([line.curve.points[0], line.curve.points[1]])
    }
  }
  return line
}

export function optimizeGeometryLines(lines: GeometryLine[]): GeometryLine[] {
  const result: GeometryLine[] = []
  for (const line of lines) {
    const r = optimizeGeometryLine(line)
    if (r) {
      result.push(r)
    }
  }
  return result
}

export function boldGeometryLines(lines: GeometryLine[][], distance = 1): GeometryLine[][] {
  const polygons = lines.map(n => {
    const points = deduplicatePosition(getGeometryLinesPoints(n, 10))
    return {
      points,
      lines: n,
      direction: Math.sign(getPolygonArea(points)),
    }
  })
  const baseDirection = (polygons.find(p => polygons.every(e => e === p || !pointInPolygon(p.points[0], e.points))) || polygons[0]).direction
  const result: GeometryLine[][] = []
  for (const polygon of polygons) {
    const direction = polygon.direction
    result.push(getParallelGeometryLinesByDistanceDirectionIndex(polygon.lines, direction === baseDirection ? distance : -distance, pointSideToIndex(direction), 'bevel'))
  }
  return result.map(lines => trimGeometryLines(lines))
}

export function trimGeometryLines(lines: GeometryLine[]): GeometryLine[] {
  const newLines = reverseClosedGeometryLinesIfAreaIsNegative(lines)
  const reversed = newLines !== lines
  lines = newLines
  lines = maxmiumBy(splitGeometryLines(lines).map(n => ({
    lines: n,
    area: Math.abs(getPolygonArea(getGeometryLinesPoints(n, 10))),
  })), n => n.area).lines
  if (reversed) {
    lines = reverseGeometryLines(lines)
  }
  return lines
}
