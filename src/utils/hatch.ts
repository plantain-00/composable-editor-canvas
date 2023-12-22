import { getGeometryLineParamAtPoint, getGeometryLinePointAndTangentRadianAtParam, getGeometryLineStartAndEnd, getPartOfGeometryLine, isGeometryLinesClosed, pointIsOnGeometryLine } from "./break"
import { Position, TwoPointsFormRegion, deepEquals, getPointsBoundingUnsafe, getTwoPointsDistance, getTwoPointsRadian, isSamePoint, largerThan, maxmiumBy, minimumBy, minimumsBy, pointInPolygon } from "./geometry"
import { GeometryLine, getTwoGeometryLinesIntersectionPoint } from "./intersection"
import { mergeGeometryLine } from "./merge"
import { getRadianSideOfRadian } from "./parallel"
import { reverseGeometryLine } from "./reverse"

export function getHatchByPosition(
  position: Position,
  end: Position,
  getGeometryLinesPoints: (lines: GeometryLine[]) => Position[],
  getGeometryLineBounding: (line: GeometryLine) => TwoPointsFormRegion,
  getGeometriesInRange: (region: TwoPointsFormRegion) => (HatchGeometries | undefined)[],
) {
  const directionLine: [Position, Position] = [position, end]
  const intersections: HatchIntersection[] = []
  const geometries = getGeometriesInRange(getGeometryLineBounding(directionLine))
  for (const geometry of geometries) {
    if (!geometry) continue
    for (const line of geometry.lines) {
      const points = getTwoGeometryLinesIntersectionPoint(line, directionLine)
      intersections.push(...points.map(point => ({ line, point, id: geometry.id })))
    }
  }
  if (intersections.length == 0) return
  intersections.sort((a, b) => a.point.x - b.point.x)
  for (const intersection of intersections) {
    const result = getRightSideGeometryLines(intersection, 0, line => getGeometriesInRange(getGeometryLineBounding(line)))
    if (result.lines.length > 0 && pointInPolygon(position, getGeometryLinesPoints(result.lines))) {
      return result
    }
  }
  return
}

function getRightSideGeometryLines(
  start: HatchIntersection,
  startRadian: number,
  getGeometriesInGeometryLineRange: (line: GeometryLine) => (HatchGeometries | undefined)[],
): { lines: GeometryLine[], ids: number[] } {
  const param = getGeometryLineParamAtPoint(start.point, start.line)
  const radian = getGeometryLinePointAndTangentRadianAtParam(param, start.line).radian
  if (getRadianSideOfRadian(startRadian, radian) === 1) {
    start.line = reverseGeometryLine(start.line)
  }
  const closed = isGeometryLinesClosed([start.line])
  let s = getRightSideGeometryLine(start, closed, getGeometriesInGeometryLineRange(start.line))
  const result: GeometryLine[] = []
  const ids = new Set<number>()
  let i = 0
  for (; ;) {
    if (i++ >= 30) {
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
      ids.add(start.id)
      break
    }
    if (result.some(r => deepEquals(r, s?.line))) return { lines: [], ids: [] }
    result.push(s.line)
    ids.add(s.id)
    if (s.next) {
      s = getRightSideGeometryLine(s.next, closed, getGeometriesInGeometryLineRange(s.next.line))
    } else {
      break
    }
  }
  if (result.length === 0) return { lines: [], ids: [] }
  if (!isGeometryLinesClosed(result)) return { lines: [], ids: [] }
  if (result.length > 1) {
    const line = mergeGeometryLine(result[result.length - 1], result[0])
    if (line) {
      result.splice(0, 1)
      result.splice(result.length - 1, 1, line)
    }
  }
  return {
    lines: result,
    ids: Array.from(ids),
  }
}

export function getHatchHoles(
  border: GeometryLine[],
  getGeometryLinesPoints: (lines: GeometryLine[]) => Position[],
  getGeometriesInRange: (region: TwoPointsFormRegion) => (HatchGeometries | undefined)[],
) {
  const points = getGeometryLinesPoints(border)
  const geometries = getGeometriesInRange(getPointsBoundingUnsafe(points))
  const holes: { lines: GeometryLine[], start: Position, id: number }[] = []
  for (const geometry of geometries) {
    if (!geometry) continue
    for (const line of geometry.lines) {
      const start = getGeometryLineStartAndEnd(line).start
      if (pointInPolygon(start, points) && border.every(n => !pointIsOnGeometryLine(start, n))) {
        holes.push({ lines: [line], start, id: geometry.id })
      }
    }
  }
  if (holes.length === 0) return
  const mergedHoles: GeometryLine[][] = []
  const ids = new Set<number>()
  for (const hole of holes) {
    if (mergedHoles.length > 0 && mergedHoles.some(h => pointInPolygon(hole.start, getGeometryLinesPoints(h)) || h.some(g => pointIsOnGeometryLine(hole.start, g)))) {
      continue
    }
    const directionLine: [Position, Position] = [points[0], hole.start]
    const intersections: (HatchIntersection & { distance: number })[] = []
    for (const otherHole of holes) {
      for (const line of otherHole.lines) {
        const points = getTwoGeometryLinesIntersectionPoint(line, directionLine)
        intersections.push(...points.map(point => ({ line, point, distance: getTwoPointsDistance(directionLine[0], point), id: otherHole.id })))
      }
    }
    if (intersections.length == 0) continue
    const intersection = minimumBy(intersections, s => s.distance)
    const startRadian = getTwoPointsRadian(directionLine[1], directionLine[0])
    const result = getRightSideGeometryLines(intersection, startRadian, () => holes)
    mergedHoles.push(result.lines)
    for (const id of result.ids) {
      ids.add(id)
    }
  }
  return {
    holes: mergedHoles,
    ids: Array.from(ids),
  }
}

export interface HatchGeometries {
  lines: GeometryLine[]
  id: number
}

interface HatchIntersection {
  line: GeometryLine
  point: Position
  id: number
}

function getRightSideGeometryLine(
  start: HatchIntersection,
  closed: boolean,
  geometries: (HatchGeometries | undefined)[],
): { line: GeometryLine, id: number, next?: HatchIntersection } | undefined {
  const startParam = getGeometryLineParamAtPoint(start.point, start.line)
  if (startParam === undefined) return
  const intersections: (HatchIntersection & { param: number, originalParam: number })[] = []
  for (const geometry of geometries) {
    if (!geometry) continue
    for (const line of geometry.lines) {
      const points = getTwoGeometryLinesIntersectionPoint(line, start.line)
      for (const point of points) {
        const param = getGeometryLineParamAtPoint(point, start.line)
        intersections.push({ line, param: largerThan(param, startParam) ? param : param + 1, point, originalParam: param, id: geometry.id })
      }
    }
  }
  if (intersections.length === 0 && closed) {
    return {
      line: start.line,
      id: start.id,
    }
  }
  if (intersections.length < 2) return
  const minimums = minimumsBy(intersections, s => s.param)
  let r = minimums[0]
  if (minimums.length > 1) {
    r = maxmiumBy(intersections, s => s.originalParam)
  }
  const endParam = getGeometryLineParamAtPoint(r.point, start.line)
  const startRadian = getGeometryLinePointAndTangentRadianAtParam(endParam, start.line).radian
  const radian = getGeometryLinePointAndTangentRadianAtParam(getGeometryLineParamAtPoint(r.point, r.line), r.line).radian
  if (getRadianSideOfRadian(startRadian, radian) === 1) {
    r.line = reverseGeometryLine(r.line)
  }
  const line = getPartOfGeometryLine(startParam, endParam, start.line, closed)
  return {
    line,
    id: start.id,
    next: {
      line: r.line,
      point: r.point,
      id: r.id,
    },
  }
}
