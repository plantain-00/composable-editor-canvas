import { getBezierCurvePoints, getQuadraticCurvePoints } from "./bezier"
import { getGeometryLineParamAtPoint, getGeometryLineTangentRadianAtParam, getGeometryLinesParamAtPoint, getPartOfGeometryLine, getPartOfGeometryLines, pointIsOnGeometryLine, splitGeometryLines, trimGeometryLines } from "./geometry-line"
import { getGeometryLineStartAndEnd, isGeometryLinesClosed } from "./geometry-line"
import { printGeometryLine, printParam, printPoint } from "./debug"
import { deepEquals, equals, first, isSameNumber, isZero, largerThan, maxmiumBy, minimumBy, minimumsBy } from "./math"
import { Position, deduplicatePosition } from "./position"
import { getPointsBoundingUnsafe } from "./bounding"
import { TwoPointsFormRegion } from "./region"
import { getTwoPointsDistance } from "./position"
import { isSamePoint } from "./position"
import { getTwoPointsRadian } from "./radian"
import { getPolygonArea, pointInPolygon } from "./line"
import { ellipseArcToPolyline } from "./ellipse"
import { arcToPolyline } from "./circle"
import { getTwoGeometryLinesIntersectionPoint, iterateGeometryLinesIntersectionPoints } from "./intersection"
import { GeometryLine } from "./geometry-line"
import { mergeGeometryLine } from "./merge"
import { getNurbsPoints } from "./nurbs"
import { getParallelGeometryLinesByDistanceDirectionIndex, getRadianSideOfRadian } from "./parallel"
import { reverseClosedGeometryLinesIfAreaIsNegative, reverseGeometryLine, reverseGeometryLines } from "./reverse"

export function getHatchByPosition(
  position: Position,
  end: Position,
  getGeometriesInGeometryLineRange: (line: GeometryLine) => (HatchGeometries | undefined)[],
  debug?: boolean,
) {
  const directionLine: [Position, Position] = [position, end]
  const intersections: HatchIntersection[] = []
  const geometries = getGeometriesInGeometryLineRange(directionLine)
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
    const result = getRightSideGeometryLines(intersection, 0, getGeometriesInGeometryLineRange, debug)
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
  debug?: boolean,
): { lines: GeometryLine[], ids: number[] } {
  if (debug) {
    console.info(`Line ${printGeometryLine(start.line)}`)
  }
  reverseGeometryLineIfDirectionIsWrong(startRadian, start)
  const closed = isGeometryLinesClosed([start.line])
  let s = getRightSideGeometryLine(start, getGeometriesInGeometryLineRange(start.line), debug)
  const result: GeometryLine[] = []
  const ids = new Set<number>()
  let i = 0
  for (; ;) {
    if (i++ >= 30) {
      console.info(start.point, result)
      break
    }
    if (!s) break
    const lineStart = getGeometryLineStartAndEnd(s.line).start
    if (
      lineStart &&
      !isSamePoint(lineStart, start.point) &&
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
      s = getRightSideGeometryLine(s.next, getGeometriesInGeometryLineRange(s.next.line), debug)
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
  getGeometriesInRange: (region: TwoPointsFormRegion) => (HatchGeometries | undefined)[],
  debug?: boolean,
) {
  const points = getGeometryLinesPoints(border)
  const geometries = getGeometriesInRange(getPointsBoundingUnsafe(points))
  const holes: { lines: GeometryLine[], start: Position, id: number }[] = []
  for (const geometry of geometries) {
    if (!geometry) continue
    for (const line of geometry.lines) {
      const start = getGeometryLineStartAndEnd(line).start
      if (start && pointInPolygon(start, points) && border.every(n => !pointIsOnGeometryLine(start, n))) {
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
    const result = getRightSideGeometryLines(intersection, startRadian, () => holes, debug)
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
  geometries: (HatchGeometries | undefined)[],
  debug?: boolean,
): { line: GeometryLine, id: number, next?: HatchIntersection } | undefined {
  const closed = isGeometryLinesClosed([start.line])
  const startParam = getGeometryLineParamAtPoint(start.point, start.line)
  if (startParam === undefined) return
  if (debug) {
    console.info(`Target ${printGeometryLine(start.line)} at ${printParam(startParam)} ${printPoint(start.point)}`)
  }
  let intersections: (HatchIntersection & { param: number, originalParam: number })[] = []
  for (const geometry of geometries) {
    if (!geometry) continue
    for (const line of geometry.lines) {
      const points = getTwoGeometryLinesIntersectionPoint(line, start.line)
      for (const point of points) {
        const param = getGeometryLineParamAtPoint(point, start.line)
        intersections.push({
          line,
          param: largerThan(param, startParam) ? param : param + ((!Array.isArray(start.line) && start.line.type === 'ray') ? Infinity : 1),
          point,
          originalParam: param,
          id: geometry.id,
        })
      }
    }
  }
  intersections = intersections.filter(n => {
    if (!equals(n.originalParam, 1) && !equals(n.originalParam, 0)) {
      const radian = getGeometryLineTangentRadianAtParam(n.originalParam, start.line)
      reverseGeometryLineIfDirectionIsWrong(radian, n)
      const targetRadian = getGeometryLineTangentRadianAtParam(getGeometryLineParamAtPoint(n.point, n.line), n.line)
      return getRadianSideOfRadian(radian, targetRadian) === -1
    }
    return true
  })
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
  const line = getPartOfGeometryLine(startParam, endParam, start.line, closed)
  if (debug) {
    console.info(`Result ${printParam(startParam)}->${printParam(endParam)} ${printGeometryLine(line)}`)
  }
  const startRadian = getGeometryLineTangentRadianAtParam(endParam, start.line)
  reverseGeometryLineIfDirectionIsWrong(startRadian, r)
  if (debug) {
    console.info(`Line ${printGeometryLine(r.line)}`)
  }
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

function reverseGeometryLineIfDirectionIsWrong(startRadian: number, r: HatchIntersection) {
  const param = getGeometryLineParamAtPoint(r.point, r.line)
  if (isZero(param)) {
    return
  }
  if (isSameNumber(param, 1)) {
    r.line = reverseGeometryLine(r.line)
    return
  }
  const radian = getGeometryLineTangentRadianAtParam(param, r.line)
  if (getRadianSideOfRadian(startRadian, radian) === 1) {
    r.line = reverseGeometryLine(r.line)
  }
}

export function getGeometryLinesPoints(lines: GeometryLine[], segmentCount = 100, angleDelta = 5) {
  const points: Position[] = []
  for (const n of lines) {
    if (Array.isArray(n)) {
      if (points.length === 0) {
        points.push(n[0])
      }
      points.push(n[1])
    } else if (n.type === 'arc') {
      points.push(...arcToPolyline(n.curve, angleDelta))
    } else if (n.type === 'ellipse arc') {
      points.push(...ellipseArcToPolyline(n.curve, angleDelta))
    } else if (n.type === 'quadratic curve') {
      points.push(...getQuadraticCurvePoints(n.curve.from, n.curve.cp, n.curve.to, segmentCount))
    } else if (n.type === 'bezier curve') {
      points.push(...getBezierCurvePoints(n.curve.from, n.curve.cp1, n.curve.cp2, n.curve.to, segmentCount))
    } else if (n.type === 'nurbs curve') {
      points.push(...getNurbsPoints(n.curve.degree, n.curve.points, n.curve.knots, n.curve.weights, segmentCount))
    }
  }
  return points
}

export function mergeHatchBorderAndHole(border: GeometryLine[], hole: GeometryLine[]): GeometryLine[] | undefined {
  const point = first(iterateGeometryLinesIntersectionPoints(border, hole))
  if (point) {
    const param1 = getGeometryLinesParamAtPoint(point, border)
    const param2 = getGeometryLinesParamAtPoint(point, hole)
    return [
      ...getPartOfGeometryLines(0, param1, border),
      ...getPartOfGeometryLines(param2, 0, hole),
      ...getPartOfGeometryLines(hole.length, param2, hole),
      ...getPartOfGeometryLines(param1, border.length, border),
    ]
  }
  return
}

export function optimizeHatch(border: GeometryLine[], holes: GeometryLine[][]) {
  border = reverseClosedGeometryLinesIfAreaIsNegative(border)
  holes = holes.map(h => reverseClosedGeometryLinesIfAreaIsNegative(h))
  return optimizeHatchInternally(border, holes)
}

export function optimizeHatchInternally(border: GeometryLine[], holes: GeometryLine[][]): Hatch[] {
  for (let i = 0; i < holes.length; i++) {
    const lines = mergeHatchBorderAndHole(border, holes[i])
    if (lines) {
      holes.splice(i, 1)
      const borders = splitGeometryLines(lines)
      return borders.map(b => optimizeHatchInternally(b, holes)).flat()
    }
  }
  return [{ border, holes }]
}

interface Hatch {
  border: GeometryLine[]
  holes: GeometryLine[][]
}

export function mergeHatchBorderAndBorder(border1: GeometryLine[], border2: GeometryLine[]): GeometryLine[] | undefined {
  const point = first(iterateGeometryLinesIntersectionPoints(border1, border2))
  if (point) {
    const param1 = getGeometryLinesParamAtPoint(point, border1)
    const param2 = getGeometryLinesParamAtPoint(point, border2)
    return [
      ...getPartOfGeometryLines(0, param1, border1),
      ...getPartOfGeometryLines(param2, border2.length, border2),
      ...getPartOfGeometryLines(0, param2, border2),
      ...getPartOfGeometryLines(param1, border1.length, border1),
    ]
  }
  return
}

export function mergeHatchBorders(border1: GeometryLine[], border2: GeometryLine[]) {
  border1 = reverseClosedGeometryLinesIfAreaIsNegative(border1)
  border2 = reverseClosedGeometryLinesIfAreaIsNegative(border2)
  const lines = mergeHatchBorderAndBorder(border1, border2)
  if (lines) {
    const results = splitGeometryLines(lines)
    if (results.length < 2) {
      return results[0]
    }
    return maxmiumBy(results.map(r => ({ line: r, area: getPolygonArea(getGeometryLinesPoints(r)) })), a => a.area).line
  }
  return
}

export function mergeHatches(hatch1: Hatch, hatch2: Hatch): Hatch[] | undefined {
  const mergedBorder = mergeHatchBorders(hatch1.border, hatch2.border)
  if (!mergedBorder) return
  return optimizeHatch(mergedBorder, [...hatch1.holes, ...hatch2.holes])
}

export function geometryLinesToHatches(lines: GeometryLine[][]): Hatch[] {
  if (lines.length === 0) return []
  if (lines.length === 1) {
    return [{ border: reverseClosedGeometryLinesIfAreaIsNegative(lines[0]), holes: [] }]
  }
  type GeometryLinePolygon = { lines: GeometryLine[], points: Position[] }
  const polygons: GeometryLinePolygon[] = lines.map(n => {
    n = reverseClosedGeometryLinesIfAreaIsNegative(n)
    const points = deduplicatePosition(getGeometryLinesPoints(n, 10))
    return {
      points,
      lines: n,
    }
  })
  let result: { border: GeometryLinePolygon, holes: GeometryLinePolygon[] }[] = []
  for (const polygon of polygons) {
    const r = result.find(r => pointInPolygon(polygon.points[0], r.border.points) && r.holes.every(h => !pointInPolygon(polygon.points[0], h.points)))
    if (r) {
      r.holes.push(polygon)
    } else {
      const newResult: { border: GeometryLinePolygon, holes: GeometryLinePolygon[] }[] = []
      const holes: GeometryLinePolygon[] = []
      for (const p of result) {
        if (pointInPolygon(p.border.points[0], polygon.points)) {
          holes.push(p.border)
          newResult.push(...p.holes.map(h => ({ border: h, holes: [] })))
        } else {
          newResult.push(p)
        }
      }
      result = newResult
      result.push({ border: polygon, holes })
    }
  }
  return result.map(r => ({ border: r.border.lines, holes: r.holes.map(h => reverseGeometryLines(h.lines)) }))
}

export function boldHatch(hatch: Hatch, distance = 1): Hatch {
  return {
    border: trimGeometryLines(getParallelGeometryLinesByDistanceDirectionIndex(hatch.border, distance, 1, 'bevel')),
    holes: hatch.holes.map(h => trimGeometryLines(getParallelGeometryLinesByDistanceDirectionIndex(h, -distance, 0, 'bevel'))),
  }
}
