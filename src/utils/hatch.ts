import { getGeometryLineParamAtPoint, getGeometryLinePointAndTangentRadianAtParam, getGeometryLineStartAndEnd, getPartOfGeometryLine, isGeometryLinesClosed, pointIsOnGeometryLine } from "./break"
import { Position, TwoPointsFormRegion, getPointsBoundingUnsafe, getTwoPointsDistance, getTwoPointsRadian, isSamePoint, largerThan, maxmiumBy, minimumBy, minimumsBy, pointInPolygon } from "./geometry"
import { GeometryLine, getTwoGeometryLinesIntersectionPoint } from "./intersection"
import { mergeGeometryLine } from "./merge"
import { getRadianSideOfRadian } from "./parallel"
import { reverseGeometryLine } from "./reverse"

export function getHatchByPosition(
  position: Position,
  bounding: TwoPointsFormRegion,
  getGeometryLinesPoints: (lines: GeometryLine[]) => Position[],
  getGeometryLineBounding: (line: GeometryLine) => TwoPointsFormRegion,
  getGeometriesInRange: (region: TwoPointsFormRegion) => (HatchGeometries | undefined)[],
) {
  const directionLine: [Position, Position] = [position, { x: bounding.end.x, y: position.y }]
  const intersections: { line: GeometryLine, point: Position }[] = []
  const geometries = getGeometriesInRange(getGeometryLineBounding(directionLine))
  for (const geometry of geometries) {
    if (!geometry) continue
    for (const line of geometry.lines) {
      const points = getTwoGeometryLinesIntersectionPoint(line, directionLine)
      intersections.push(...points.map(point => ({ line, point })))
    }
  }
  if (intersections.length == 0) return
  intersections.sort((a, b) => a.point.x - b.point.x)
  for (const intersection of intersections) {
    const result = getRightSideGeometryLines(intersection, 0, line => getGeometriesInRange(getGeometryLineBounding(line)))
    if (result.length > 0 && pointInPolygon(position, getGeometryLinesPoints(result))) {
      return result
    }
  }
  return
}

function getRightSideGeometryLines(
  start: { line: GeometryLine, point: Position },
  startRadian: number,
  getGeometriesInGeometryLineRange: (line: GeometryLine) => (HatchGeometries | undefined)[],
) {
  const param = getGeometryLineParamAtPoint(start.point, start.line)
  const radian = getGeometryLinePointAndTangentRadianAtParam(param, start.line).radian
  if (getRadianSideOfRadian(startRadian, radian) === 1) {
    start.line = reverseGeometryLine(start.line)
  }
  const closed = isGeometryLinesClosed([start.line])
  let s = getRightSideGeometryLine(start.point, start.line, closed, getGeometriesInGeometryLineRange(start.line))
  const result: GeometryLine[] = []
  let i = 0
  for (; ;) {
    if (i++ >= 10) {
      console.info(start.point, result)
      break
    }
    if (!s) break
    if (
      !isSamePoint(getGeometryLineStartAndEnd(s.line).start, start.point) &&
      s.next &&
      pointIsOnGeometryLine(start.point, s.line)
    ) {
      result.push(getPartOfGeometryLine(0, getGeometryLineParamAtPoint(start.point, s.line), s.line, closed))
      break
    }
    result.push(s.line)
    if (s.next) {
      s = getRightSideGeometryLine(s.next.point, s.next.line, closed, getGeometriesInGeometryLineRange(s.next.line))
    } else {
      break
    }
  }
  if (result.length === 0) return []
  if (!isGeometryLinesClosed(result)) return []
  if (result.length > 1) {
    const line = mergeGeometryLine(result[result.length - 1], result[0])
    if (line) {
      result.splice(0, 1)
      result.splice(result.length - 1, 1, line)
    }
  }
  return result
}

export function getHatchHoles(
  border: GeometryLine[],
  getGeometryLinesPoints: (lines: GeometryLine[]) => Position[],
  getGeometriesInRange: (region: TwoPointsFormRegion) => (HatchGeometries | undefined)[],
) {
  const points = getGeometryLinesPoints(border)
  const geometries = getGeometriesInRange(getPointsBoundingUnsafe(points))
  const holes: { lines: GeometryLine[], start: Position }[] = []
  for (const geometry of geometries) {
    if (!geometry) continue
    for (const line of geometry.lines) {
      const start = getGeometryLineStartAndEnd(line).start
      if (pointInPolygon(start, points) && border.every(n => !pointIsOnGeometryLine(start, n))) {
        holes.push({ lines: [line], start })
      }
    }
  }
  if (holes.length === 0) return
  const mergedHoles: GeometryLine[][] = []
  for (const hole of holes) {
    if (mergedHoles.length > 0 && mergedHoles.some(h => pointInPolygon(hole.start, getGeometryLinesPoints(h)) || h.some(g => pointIsOnGeometryLine(hole.start, g)))) {
      continue
    }
    const directionLine: [Position, Position] = [points[0], hole.start]
    const intersections: { line: GeometryLine, point: Position, distance: number }[] = []
    for (const otherHole of holes) {
      for (const line of otherHole.lines) {
        const points = getTwoGeometryLinesIntersectionPoint(line, directionLine)
        intersections.push(...points.map(point => ({ line, point, distance: getTwoPointsDistance(directionLine[0], point) })))
      }
    }
    if (intersections.length == 0) continue
    const intersection = minimumBy(intersections, s => s.distance)
    const startRadian = getTwoPointsRadian(directionLine[1], directionLine[0])
    const result = getRightSideGeometryLines(intersection, startRadian, () => holes)
    mergedHoles.push(result)
  }
  return mergedHoles
}

export interface HatchGeometries {
  lines: GeometryLine[]
}

function getRightSideGeometryLine(
  startPoint: Position,
  startLine: GeometryLine,
  closed: boolean,
  geometries: (HatchGeometries | undefined)[],
): { line: GeometryLine, next?: { line: GeometryLine, point: Position } } | undefined {
  const startParam = getGeometryLineParamAtPoint(startPoint, startLine)
  const intersections: { line: GeometryLine, point: Position, param: number, originalParam: number }[] = []
  for (const geometry of geometries) {
    if (!geometry) continue
    for (const line of geometry.lines) {
      const points = getTwoGeometryLinesIntersectionPoint(line, startLine)
      for (const point of points) {
        const param = getGeometryLineParamAtPoint(point, startLine)
        intersections.push({ line, param: largerThan(param, startParam) ? param : param + 1, point, originalParam: param })
      }
    }
  }
  if (intersections.length === 0 && closed) {
    return {
      line: startLine,
    }
  }
  if (intersections.length < 2) return
  const minimums = minimumsBy(intersections, s => s.param)
  let r = minimums[0]
  if (minimums.length > 1) {
    r = maxmiumBy(intersections, s => s.originalParam)
  }
  const endParam = getGeometryLineParamAtPoint(r.point, startLine)
  const startRadian = getGeometryLinePointAndTangentRadianAtParam(endParam, startLine).radian
  const radian = getGeometryLinePointAndTangentRadianAtParam(getGeometryLineParamAtPoint(r.point, r.line), r.line).radian
  if (getRadianSideOfRadian(startRadian, radian) === 1) {
    r.line = reverseGeometryLine(r.line)
  }
  const line = getPartOfGeometryLine(startParam, endParam, startLine, closed)
  return {
    line,
    next: {
      line: r.line,
      point: r.point,
    },
  }
}
