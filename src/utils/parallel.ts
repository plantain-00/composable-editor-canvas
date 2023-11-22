import { getBezierCurvePercentAtPoint, getPartOfBezierCurve, getPartOfQuadraticCurve, getQuadraticCurvePercentAtPoint } from "./bezier"
import { getGeometryLineStartAndEnd } from "./break"
import { Arc, Circle, Ellipse, EllipseArc, GeneralFormLine, Position, getEllipseAngle, getParallelLineSegmentsByDistance, getParallelLinesByDistance, getPointSideOfLine, getTwoPointsDistance, getTwoPointsRadian, isSamePoint, isZero, minimumBy, pointAndDirectionToGeneralFormLine, twoPointLineToGeneralFormLine } from "./geometry"
import { BezierCurve, GeometryLine, QuadraticCurve, getTwoGeneralFormLinesIntersectionPoint, getTwoGeometryLinesIntersectionPoint } from "./intersection"
import { getNurbsCurveParamAtPoint, getParallelNurbsCurvesByDistance, getPartOfNurbsCurve, getPointSideOfNurbsCurve } from "./nurbs"
import { getPerpendicular, getPerpendicularPoint, getPointAndBezierCurveNearestPointAndDistance, getPointAndGeometryLineMinimumDistance, getPointAndQuadraticCurveNearestPointAndDistance } from "./perpendicular"
import { angleToRadian, radianToAngle } from "./radian"
import { getBezierCurveTangentRadianAtPercent, getQuadraticCurveTangentRadianAtPercent } from "./tangency"

export function getParallelCirclesByDistance<T extends Circle>(circle: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [circle, circle]
  }
  return [
    {
      ...circle,
      r: circle.r - distance, // on right side of circle
    },
    {
      ...circle,
      r: circle.r + distance, // on left side of circle
    },
  ]
}

export function getParallelArcsByDistance<T extends Arc>(arc: T, distance: number): [T, T] {
  const arcs = getParallelCirclesByDistance(arc, distance)
  if (arc.counterclockwise) {
    return [arcs[1], arcs[0]]
  }
  return arcs
}

export function getParallelEllipsesByDistance<T extends Ellipse>(ellipse: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [ellipse, ellipse]
  }
  return [
    {
      ...ellipse,
      rx: ellipse.rx - distance, // on right side of ellipse
      ry: ellipse.ry - distance,
    },
    {
      ...ellipse,
      rx: ellipse.rx + distance, // on left side of ellipse
      ry: ellipse.ry + distance,
    },
  ]
}

export function getParallelEllipseArcsByDistance<T extends EllipseArc>(ellipseArc: T, distance: number): [T, T] {
  const ellipseArcs = getParallelEllipsesByDistance(ellipseArc, distance)
  if (ellipseArc.counterclockwise) {
    return [ellipseArcs[1], ellipseArcs[0]]
  }
  return ellipseArcs
}

export function getParallelQuadraticCurvesByDistance<T extends QuadraticCurve>(curve: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [curve, curve]
  }
  const line1 = twoPointLineToGeneralFormLine(curve.from, curve.cp)
  const line2 = twoPointLineToGeneralFormLine(curve.cp, curve.to)
  const parallelLines1 = getParallelLinesByDistance(line1, distance)
  const parallelLines2 = getParallelLinesByDistance(line2, distance)
  const from = getPerpendicular(curve.from, line1)
  const to = getPerpendicular(curve.to, line2)
  return [
    {
      ...curve,
      from: getTwoGeneralFormLinesIntersectionPoint(from, parallelLines1[0]),
      cp: getTwoGeneralFormLinesIntersectionPoint(parallelLines1[0], parallelLines2[0]),
      to: getTwoGeneralFormLinesIntersectionPoint(to, parallelLines2[0]),
    },
    {
      ...curve,
      from: getTwoGeneralFormLinesIntersectionPoint(from, parallelLines1[1]),
      cp: getTwoGeneralFormLinesIntersectionPoint(parallelLines1[1], parallelLines2[1]),
      to: getTwoGeneralFormLinesIntersectionPoint(to, parallelLines2[1]),
    },
  ]
}

export function getParallelBezierCurvesByDistance<T extends BezierCurve>(curve: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [curve, curve]
  }
  const line1 = twoPointLineToGeneralFormLine(curve.from, curve.cp1)
  const line2 = twoPointLineToGeneralFormLine(curve.cp1, curve.cp2)
  const line3 = twoPointLineToGeneralFormLine(curve.cp2, curve.to)
  const parallelLines1 = getParallelLinesByDistance(line1, distance)
  const parallelLines2 = getParallelLinesByDistance(line2, distance)
  const parallelLines3 = getParallelLinesByDistance(line3, distance)
  const from = getPerpendicular(curve.from, line1)
  const to = getPerpendicular(curve.to, line3)
  return [
    {
      ...curve,
      from: getTwoGeneralFormLinesIntersectionPoint(from, parallelLines1[0]),
      cp1: getTwoGeneralFormLinesIntersectionPoint(parallelLines1[0], parallelLines2[0]),
      cp2: getTwoGeneralFormLinesIntersectionPoint(parallelLines2[0], parallelLines3[0]),
      to: getTwoGeneralFormLinesIntersectionPoint(to, parallelLines3[0]),
    },
    {
      ...curve,
      from: getTwoGeneralFormLinesIntersectionPoint(from, parallelLines1[1]),
      cp1: getTwoGeneralFormLinesIntersectionPoint(parallelLines1[1], parallelLines2[1]),
      cp2: getTwoGeneralFormLinesIntersectionPoint(parallelLines2[1], parallelLines3[1]),
      to: getTwoGeneralFormLinesIntersectionPoint(to, parallelLines3[1]),
    },
  ]
}

/**
 * 0: point on circle
 * 1: point on left side of circle
 * -1: point on right side of circle
 */
export function getPointSideOfCircle(point: Position, circle: Circle): number {
  const distance = getTwoPointsDistance(point, circle)
  if (isZero(distance - circle.r)) return 0
  return distance > circle.r ? 1 : -1
}

/**
 * 0: point on arc
 * 1: point on left side of arc
 * -1: point on right side of arc
 */
export function getPointSideOfArc(point: Position, arc: Arc): number {
  return getPointSideOfCircle(point, arc) * (arc.counterclockwise ? -1 : 1)
}

/**
 * 0: point on ellipse
 * 1: point on left side of ellipse
 * -1: point on right side of ellipse
 */
export function getPointSideOfEllipse(point: Position, { rx, ry, cx, cy, angle }: Ellipse): number {
  const radian = angleToRadian(angle)
  const a1 = Math.sin(radian), a2 = Math.cos(radian)
  // (a2(x - cx) + a1(y - cy))^2/rx/rx + (-a1(x - cx) + a2(y - cy))^2/ry/ry = 1
  const d = (a2 * (point.x - cx) + a1 * (point.y - cy)) ** 2 / rx / rx + (-a1 * (point.x - cx) + a2 * (point.y - cy)) ** 2 / ry / ry
  if (isZero(d - 1)) return 0
  return d > 1 ? 1 : -1
}

/**
 * 0: point on ellipse arc
 * 1: point on left side of ellipse arc
 * -1: point on right side of ellipse arc
 */
export function getPointSideOfEllipseArc(point: Position, arc: EllipseArc): number {
  return getPointSideOfEllipse(point, arc) * (arc.counterclockwise ? -1 : 1)
}

/**
 * 0: point on quadratic curve
 * 1: point on left side of quadratic curve
 * -1: point on right side of quadratic curve
 */
export function getPointSideOfQuadraticCurve(point: Position, curve: QuadraticCurve): number {
  const p = getPointAndQuadraticCurveNearestPointAndDistance(point, curve, true)
  const radian = getQuadraticCurveTangentRadianAtPercent(curve, p.percent)
  const line = pointAndDirectionToGeneralFormLine(p.point, radian)
  return getPointSideOfLine(point, line)
}

/**
 * 0: point on bezier curve
 * 1: point on left side of bezier curve
 * -1: point on right side of bezier curve
 */
export function getPointSideOfBezierCurve(point: Position, curve: BezierCurve): number {
  const p = getPointAndBezierCurveNearestPointAndDistance(point, curve, true)
  const radian = getBezierCurveTangentRadianAtPercent(curve, p.percent)
  const line = pointAndDirectionToGeneralFormLine(p.point, radian)
  return getPointSideOfLine(point, line)
}

export function getPointSideOfGeometryLine(point: Position, line: GeometryLine): number {
  if (Array.isArray(line)) {
    return getPointSideOfLine(point, twoPointLineToGeneralFormLine(...line))
  }
  if (line.type === 'arc') {
    return getPointSideOfArc(point, line.curve)
  }
  if (line.type === 'ellipse arc') {
    return getPointSideOfEllipseArc(point, line.curve)
  }
  if (line.type === 'quadratic curve') {
    return getPointSideOfQuadraticCurve(point, line.curve)
  }
  if (line.type === 'bezier curve') {
    return getPointSideOfBezierCurve(point, line.curve)
  }
  return getPointSideOfNurbsCurve(point, line.curve)
}

export function getLinesOffsetDirection(point: Position, lines: GeometryLine[]) {
  const min = minimumBy(lines.map(line => ({
    distance: getPointAndGeometryLineMinimumDistance(point, line),
    line,
  })), v => v.distance)
  return pointSideToIndex(getPointSideOfGeometryLine(point, min.line))
}

export function pointSideToIndex(side: number) {
  return side > 0 ? 1 : 0
}

export function getParallelGeometryLineByDistance(line: GeometryLine, distance: number, index: 0 | 1): GeometryLine {
  if (Array.isArray(line)) {
    return getParallelLineSegmentsByDistance(line, distance)[index]
  }
  if (line.type === 'arc') {
    return {
      type: 'arc',
      curve: getParallelArcsByDistance(line.curve, distance)[index],
    }
  }
  if (line.type === 'ellipse arc') {
    return {
      type: 'ellipse arc',
      curve: getParallelEllipseArcsByDistance(line.curve, distance)[index],
    }
  }
  if (line.type === 'quadratic curve') {
    return {
      type: line.type,
      curve: getParallelQuadraticCurvesByDistance(line.curve, distance)[index],
    }
  }
  if (line.type === 'bezier curve') {
    return {
      type: line.type,
      curve: getParallelBezierCurvesByDistance(line.curve, distance)[index],
    }
  }
  return {
    type: line.type,
    curve: getParallelNurbsCurvesByDistance(line.curve, distance)[index],
  }
}

export function getParallelGeometryLinesByDistance(point: Position, lines: GeometryLine[], distance: number): GeometryLine[][] {
  if (!distance) {
    distance = Math.min(...lines.map(line => getPointAndGeometryLineMinimumDistance(point, line)))
  }
  if (isZero(distance)) {
    return [lines]
  }
  const first = getGeometryLineStartAndEnd(lines[0]).start
  const last = getGeometryLineStartAndEnd(lines[lines.length - 1]).end
  const closed = isSamePoint(first, last) && lines.length > 1
  const index = getLinesOffsetDirection(point, lines)
  const parallels = lines.map(line => getParallelGeometryLineByDistance(line, distance, index))
  if (parallels.length === 1) {
    return [parallels]
  }
  const result: GeometryLine[] = []
  let previous: Position | undefined
  for (let i = 0; i < parallels.length + 1; i++) {
    let parallel = parallels[i]
    let current: Position | undefined
    if (i === 0) {
      if (closed) {
        current = getTwoGeometryLinesNearestIntersectionPoint(parallels[parallels.length - 1], parallel)
      } else {
        current = getGeometryLineStartAndEnd(parallel).start
      }
    } else if (i === parallels.length) {
      parallel = parallels[parallels.length - 1]
      if (closed) {
        current = getTwoGeometryLinesNearestIntersectionPoint(parallel, parallels[0])
      } else {
        current = getGeometryLineStartAndEnd(parallel).end
      }
    } else {
      current = getTwoGeometryLinesNearestIntersectionPoint(parallels[i - 1], parallel)
    }
    if (current && previous) {
      const line = parallels[i - 1]
      if (Array.isArray(line)) {
        result.push([previous, current])
      } else if (line.type === 'arc') {
        result.push({
          type: 'arc',
          curve: {
            ...line.curve,
            startAngle: radianToAngle(getTwoPointsRadian(previous, line.curve)),
            endAngle: radianToAngle(getTwoPointsRadian(current, line.curve)),
          },
        })
      } else if (line.type === 'ellipse arc') {
        result.push({
          type: 'ellipse arc',
          curve: {
            ...line.curve,
            startAngle: getEllipseAngle(previous, line.curve),
            endAngle: getEllipseAngle(current, line.curve),
          },
        })
      } else if (line.type === 'quadratic curve') {
        result.push({
          type: 'quadratic curve',
          curve: getPartOfQuadraticCurve(line.curve, getQuadraticCurvePercentAtPoint(line.curve, previous), getQuadraticCurvePercentAtPoint(line.curve, current)),
        })
      } else if (line.type === 'bezier curve') {
        result.push({
          type: 'bezier curve',
          curve: getPartOfBezierCurve(line.curve, getBezierCurvePercentAtPoint(line.curve, previous), getBezierCurvePercentAtPoint(line.curve, current)),
        })
      } else if (line.type === 'nurbs curve') {
        result.push({
          type: 'nurbs curve',
          curve: getPartOfNurbsCurve(line.curve, getNurbsCurveParamAtPoint(line.curve, previous), getNurbsCurveParamAtPoint(line.curve, current)),
        })
      }
    }
    previous = current
  }
  return [result]
}

function getTwoGeometryLinesNearestIntersectionPoint(line1: GeometryLine, line2: GeometryLine) {
  const intersections = getTwoGeometryLinesIntersectionPoint(line1, line2, true)
  if (intersections.length > 1) {
    const s = getGeometryLineStartAndEnd(line2).start
    return minimumBy(intersections.map(p => ({ point: p, distance: getTwoPointsDistance(p, s) })), p => p.distance).point
  }
  return intersections[0]
}

export function getParallelPolylineByDistance(lines: [Position, Position][], index: 0 | 1, distance: number) {
  const first = lines[0][0]
  const last = lines[lines.length - 1][1]
  const closed = isSamePoint(first, last) && lines.length > 1
  const generalFormLines = lines.map(line => twoPointLineToGeneralFormLine(...line))
  const parallelLines = generalFormLines.map(line => getParallelLinesByDistance(line, distance)[index])
  const result: Position[] = []
  for (let i = 0; i < parallelLines.length + 1; i++) {
    let pline1: GeneralFormLine
    let pline2 = parallelLines[i]
    let line2 = lines[i]
    if (i === 0) {
      if (closed) {
        pline1 = parallelLines[parallelLines.length - 1]
      } else {
        pline1 = getPerpendicular(first, pline2)
      }
    } else if (i === parallelLines.length) {
      pline1 = parallelLines[parallelLines.length - 1]
      line2 = lines[0]
      if (closed) {
        pline2 = parallelLines[0]
      } else {
        pline2 = getPerpendicular(last, pline1)
      }
    } else {
      pline1 = parallelLines[i - 1]
    }
    const p = getTwoGeneralFormLinesIntersectionPoint(pline1, pline2)
    if (p) {
      result.push(p)
    } else {
      result.push(getPerpendicularPoint(line2[0], pline2))
    }
  }
  return result
}