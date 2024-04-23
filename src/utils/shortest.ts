import { GeometryLine, getGeometryLineStartAndEnd } from "./geometry-line"
import { getTwoGeometryLinesIntersectionPoint } from "./intersection"
import { iterateItemOrArray } from "./iterator"
import { isZero, minimumBy } from "./math"
import { getPointAndGeometryLineNearestPointAndDistance } from "./perpendicular"
import { Position } from "./position"
import { Tuple2 } from "./types"

export function getShortestDistanceOfTwoGeometryLine(line1: GeometryLine, line2: GeometryLine): { points: [Position, Position], distance: number } {
  const point = getTwoGeometryLinesIntersectionPoint(line1, line2)[0]
  if (point) {
    return { points: [point, point], distance: 0 }
  }
  const { start: start1, end: end1 } = getGeometryLineStartAndEnd(line1)
  const { start: start2, end: end2 } = getGeometryLineStartAndEnd(line2)
  return minimumBy([
    ...Array.from(iterateItemOrArray([start1, end1])).map(p => {
      const r = getPointAndGeometryLineNearestPointAndDistance(p, line2)
      return { points: [p, r.point] as Tuple2<Position>, distance: r.distance }
    }),
    ...Array.from(iterateItemOrArray([start2, end2])).map(p => {
      const r = getPointAndGeometryLineNearestPointAndDistance(p, line1)
      return { points: [p, r.point] as Tuple2<Position>, distance: r.distance }
    }),
  ], n => n.distance)
}

export function getShortestDistanceOfTwoGeometryLines(lines1: GeometryLine[], lines2: GeometryLine[]): { points: [Position, Position], distance: number } {
  return minimumBy(lines1.map(n1 => minimumBy(lines2.map(n2 => getShortestDistanceOfTwoGeometryLine(n1, n2)), n => n.distance, isZero)), n => n.distance, isZero)
}
