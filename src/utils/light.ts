import { normalizeAngle, normalizeRadian } from "./angle";
import { GeometryLine, getGeometryLineParamAtPoint, getGeometryLineTangentRadianAtParam } from "./geometry-line";
import { getTwoGeometryLinesIntersectionPoint } from "./intersection";
import { Ray } from "./line";
import { minimumBy, mirrorNumber } from "./math";
import { Position, getTwoPointsDistance, isSamePoint } from "./position";
import { angleToRadian, radianToAngle } from "./radian";

export function getLightPath(
  light: Ray,
  getGeometriesInGeometryLineRange: (line: GeometryLine) => { lines: GeometryLine[], regions?: { lines: GeometryLine[], holes?: GeometryLine[][] }[] }[],
  inRegion = false,
  max = 10,
): GeometryLine[] {
  const result: GeometryLine[] = []
  const directionLine = { type: 'ray' as const, line: light }
  while (result.length < max) {
    const intersections: { line: GeometryLine, point: Position, hatch: boolean }[] = []
    const geometries = getGeometriesInGeometryLineRange(directionLine)
    for (const geometry of geometries) {
      if (geometry.regions && geometry.regions.length > 0) {
        for (const region of geometry.regions) {
          for (const line of region.lines) {
            intersections.push(...getTwoGeometryLinesIntersectionPoint(line, directionLine).filter(p => !isSamePoint(p, directionLine.line)).map(point => ({ line, point, hatch: true })))
          }
          if (region.holes) {
            for (const hole of region.holes) {
              for (const line of hole) {
                intersections.push(...getTwoGeometryLinesIntersectionPoint(line, directionLine).filter(p => !isSamePoint(p, directionLine.line)).map(point => ({ line, point, hatch: true })))
              }
            }
          }
        }
      } else {
        for (const line of geometry.lines) {
          intersections.push(...getTwoGeometryLinesIntersectionPoint(line, directionLine).filter(p => !isSamePoint(p, directionLine.line)).map(point => ({ line, point, hatch: false })))
        }
      }
    }
    if (intersections.length == 0) {
      result.push(directionLine)
      return result
    }
    const intersection = minimumBy(intersections, v => getTwoPointsDistance(v.point, directionLine.line))
    result.push([directionLine.line, intersection.point])
    const param = getGeometryLineParamAtPoint(intersection.point, intersection.line)
    const radian = getGeometryLineTangentRadianAtParam(param, intersection.line)
    let angle: number
    if (intersection.hatch) {
      const relativeRadian = normalizeRadian(angleToRadian(directionLine.line.angle) - radian)
      let rate = Math.cos(relativeRadian)
      if (inRegion) {
        rate /= 0.75
        if (rate > -1 && rate < 1) {
          inRegion = false
          angle = radianToAngle(Math.acos(rate) * Math.sign(relativeRadian) + radian)
        } else {
          angle = mirrorNumber(directionLine.line.angle, radianToAngle(radian))
        }
      } else {
        rate *= 0.75
        inRegion = true
        angle = radianToAngle(Math.acos(rate) * Math.sign(relativeRadian) + radian)
      }
    } else {
      angle = mirrorNumber(directionLine.line.angle, radianToAngle(radian))
    }
    directionLine.line = { x: intersection.point.x, y: intersection.point.y, angle: normalizeAngle(angle) }
  }
  return result
}
