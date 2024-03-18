import { getBezierCurvePercentAtPoint, getPartOfBezierCurve, getPartOfQuadraticCurve, getQuadraticCurvePercentAtPoint } from "./bezier"
import { getGeometryLineParamAtPoint, getGeometryLinePointAndTangentRadianAtParam, pointIsOnGeometryLine } from "./geometry-line"
import { isGeometryLinesClosed, getGeometryLineStartAndEnd } from "./geometry-line"
import { isSameNumber, isZero, minimumBy, minimumsBy } from "./math"
import { Position } from "./position"
import { getTwoPointsDistance } from "./position"
import { isSamePoint } from "./position"
import { getTwoPointsRadian } from "./radian"
import { normalizeRadian, twoRadiansSameDirection } from "./angle"
import { GeneralFormLine, getParallelRaysByDistance } from "./line"
import { getParallelLineSegmentsByDistance, getParallelLinesByDistance } from "./line"
import { pointAndDirectionToGeneralFormLine, twoPointLineToGeneralFormLine } from "./line"
import { getPointSideOfLine } from "./line"
import { getEllipseAngle } from "./ellipse"
import { EllipseArc } from "./ellipse"
import { Arc, Circle } from "./circle"
import { Ellipse } from "./ellipse"
import { getTwoGeneralFormLinesIntersectionPoint, getTwoGeometryLinesIntersectionPoint } from "./intersection"
import { GeometryLine } from "./geometry-line"
import { QuadraticCurve } from "./bezier"
import { BezierCurve } from "./bezier"
import { getGeometryLineLength, getGeometryLinesPointAndTangentRadianByLength } from "./length"
import { getNurbsCurveParamAtPoint, getParallelNurbsCurvesByDistance, getPartOfNurbsCurve, getPointSideOfNurbsCurve } from "./nurbs"
import { getPerpendicularLine, getPerpendicularPoint, getPointAndBezierCurveNearestPointAndDistance, getPointAndGeometryLineMinimumDistance, getPointAndGeometryLineNearestPointAndDistance, getPointAndQuadraticCurveNearestPointAndDistance } from "./perpendicular"
import { angleToRadian, radianToAngle } from "./radian"
import { getBezierCurveTangentRadianAtPercent, getQuadraticCurveTangentRadianAtPercent } from "./tangency"
import { LineJoin, defaultLineJoin } from "./triangles"

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
  let line: GeneralFormLine | undefined
  if (isSamePoint(curve.from, curve.cp)) {
    line = twoPointLineToGeneralFormLine(curve.cp, curve.to)
  }
  if (isSamePoint(curve.cp, curve.to)) {
    line = twoPointLineToGeneralFormLine(curve.from, curve.cp)
  }
  if (line) {
    const parallelLines = getParallelLinesByDistance(line, distance)
    return [
      {
        ...curve,
        from: getPerpendicularPoint(curve.from, parallelLines[0]),
        cp: getPerpendicularPoint(curve.cp, parallelLines[0]),
        to: getPerpendicularPoint(curve.to, parallelLines[0]),
      },
      {
        ...curve,
        from: getPerpendicularPoint(curve.from, parallelLines[1]),
        cp: getPerpendicularPoint(curve.cp, parallelLines[1]),
        to: getPerpendicularPoint(curve.to, parallelLines[1]),
      },
    ]
  }
  const line1 = twoPointLineToGeneralFormLine(curve.from, curve.cp)
  const line2 = twoPointLineToGeneralFormLine(curve.cp, curve.to)
  const parallelLines1 = getParallelLinesByDistance(line1, distance)
  const parallelLines2 = getParallelLinesByDistance(line2, distance)
  return [
    {
      ...curve,
      from: getPerpendicularPoint(curve.from, parallelLines1[0]),
      cp: getTwoGeneralFormLinesIntersectionPoint(parallelLines1[0], parallelLines2[0]),
      to: getPerpendicularPoint(curve.to, parallelLines2[0]),
    },
    {
      ...curve,
      from: getPerpendicularPoint(curve.from, parallelLines1[1]),
      cp: getTwoGeneralFormLinesIntersectionPoint(parallelLines1[1], parallelLines2[1]),
      to: getPerpendicularPoint(curve.to, parallelLines2[1]),
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
  return [
    {
      ...curve,
      from: getPerpendicularPoint(curve.from, parallelLines1[0]),
      cp1: getTwoGeneralFormLinesIntersectionPoint(parallelLines1[0], parallelLines2[0]),
      cp2: getTwoGeneralFormLinesIntersectionPoint(parallelLines2[0], parallelLines3[0]),
      to: getPerpendicularPoint(curve.to, parallelLines3[0]),
    },
    {
      ...curve,
      from: getPerpendicularPoint(curve.from, parallelLines1[1]),
      cp1: getTwoGeneralFormLinesIntersectionPoint(parallelLines1[1], parallelLines2[1]),
      cp2: getTwoGeneralFormLinesIntersectionPoint(parallelLines2[1], parallelLines3[1]),
      to: getPerpendicularPoint(curve.to, parallelLines3[1]),
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
  if (isSameNumber(distance, circle.r)) return 0
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
  if (isSameNumber(d, 1)) return 0
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
  if (line.type === 'ray') {
    return getPointSideOfLine(point, pointAndDirectionToGeneralFormLine(line.line, angleToRadian(line.line.angle)))
  }
  return getPointSideOfNurbsCurve(point, line.curve)
}

/**
 * 0: same direction
 * 1: left side
 * -1: right side
 */
export function getRadianSideOfRadian(from: number, to: number) {
  let radian = to - from
  radian = normalizeRadian(radian)
  return isZero(radian) ? 0 : radian > 0 ? -1 : 1
}

export function getLinesOffsetDirection(point: Position, lines: GeometryLine[]) {
  const mins = minimumsBy(lines.map(line => ({
    ...getPointAndGeometryLineNearestPointAndDistance(point, line),
    line,
  })), v => v.distance)
  let min = mins[0]
  if (mins.length > 1) {
    min = minimumBy(mins.map(m => {
      const param = getGeometryLineParamAtPoint(m.point, m.line)
      let length = 0.1
      if (!isZero(param)) {
        const len = getGeometryLineLength(m.line)
        if (len !== undefined) {
          length = len - 0.1
        }
      }
      const p = getGeometryLinesPointAndTangentRadianByLength([m.line], length)
      return {
        ...m,
        distance: p ? getTwoPointsDistance(p.point, point) : m.distance,
      }
    }), v => v.distance)
  }
  return pointSideToIndex(getPointSideOfGeometryLine(point, min.line))
}

export function pointSideToIndex(side: number) {
  return side > 0 ? 1 : 0
}

export function getParallelGeometryLinesByDistance(line: GeometryLine, distance: number): [GeometryLine, GeometryLine] {
  if (Array.isArray(line)) {
    return getParallelLineSegmentsByDistance(line, distance)
  }
  if (line.type === 'arc') {
    const curves = getParallelArcsByDistance(line.curve, distance)
    return [{ type: 'arc', curve: curves[0] }, { type: 'arc', curve: curves[1] }]
  }
  if (line.type === 'ellipse arc') {
    const curves = getParallelEllipseArcsByDistance(line.curve, distance)
    return [{ type: 'ellipse arc', curve: curves[0] }, { type: 'ellipse arc', curve: curves[1] }]
  }
  if (line.type === 'quadratic curve') {
    const curves = getParallelQuadraticCurvesByDistance(line.curve, distance)
    return [{ type: 'quadratic curve', curve: curves[0] }, { type: 'quadratic curve', curve: curves[1] }]
  }
  if (line.type === 'bezier curve') {
    const curves = getParallelBezierCurvesByDistance(line.curve, distance)
    return [{ type: 'bezier curve', curve: curves[0] }, { type: 'bezier curve', curve: curves[1] }]
  }
  if (line.type === 'ray') {
    const curves = getParallelRaysByDistance(line.line, distance)
    return [{ type: 'ray', line: curves[0] }, { type: 'ray', line: curves[1] }]
  }
  const curves = getParallelNurbsCurvesByDistance(line.curve, distance)
  return [{ type: 'nurbs curve', curve: curves[0] }, { type: 'nurbs curve', curve: curves[1] }]
}

export function getParallelGeometryLinesByDistancePoint(point: Position, lines: GeometryLine[], distance: number): GeometryLine[] {
  if (!distance) {
    distance = Math.min(...lines.map(line => getPointAndGeometryLineMinimumDistance(point, line)))
  }
  const index = getLinesOffsetDirection(point, lines)
  return getParallelGeometryLinesByDistanceDirectionIndex(lines, distance, index)
}

export function getParallelGeometryLinesByDistanceDirectionIndex(
  lines: GeometryLine[],
  distance: number,
  index: 0 | 1,
  lineJoin: LineJoin = defaultLineJoin,
): GeometryLine[] {
  if (isZero(distance)) {
    return lines
  }
  const closed = isGeometryLinesClosed(lines) && lines.length > 1
  const parallels = lines.map(line => getParallelGeometryLinesByDistance(line, distance)[index])
  if (parallels.length === 1) {
    return parallels
  }
  const result: GeometryLine[] = []
  let previous: Position | undefined
  for (let i = 0; i < parallels.length + 1; i++) {
    let parallel = parallels[i]
    let current: Position | undefined
    let newItem: { line: GeometryLine, current: Position } | undefined
    if (i === 0) {
      if (closed) {
        current = getTwoGeometryLinesNearestIntersectionPoint(parallels[parallels.length - 1], parallel, lines[i])
      } else {
        current = getGeometryLineStartAndEnd(parallel).start
      }
    } else if (i === parallels.length) {
      parallel = parallels[parallels.length - 1]
      if (closed) {
        current = getTwoGeometryLinesNearestIntersectionPoint(parallel, parallels[0], lines[0])
      } else {
        current = getGeometryLineStartAndEnd(parallel).end
      }
    } else {
      const previousParallel = parallels[i - 1]
      current = getTwoGeometryLinesNearestIntersectionPoint(previousParallel, parallel, lines[i])
      if (lineJoin !== 'miter' && current && !pointIsOnGeometryLine(current, parallel)) {
        current = undefined
      }
      if (!current) {
        if (!Array.isArray(parallel) && parallel.type === 'arc' && parallel.curve.r <= 0) {
          lines = lines.toSpliced(i, 1)
          parallels.splice(i, 1)
          i--
          continue
        }
        if (lineJoin === 'miter' && Array.isArray(previousParallel) && Array.isArray(parallel)) {
          current = parallel[0]
        } else if (lineJoin === 'bevel') {
          current = getGeometryLineStartAndEnd(previousParallel).end
          const next = getGeometryLineStartAndEnd(parallel).start
          if (current && next) {
            newItem = {
              current: next,
              line: [current, next],
            }
          }
        } else {
          const previousLine = lines[i - 1]
          const center = getGeometryLineStartAndEnd(previousLine).end
          current = getGeometryLineStartAndEnd(previousParallel).end
          const next = getGeometryLineStartAndEnd(parallel).start
          if (center && current && next) {
            const arc: Arc = {
              x: center.x,
              y: center.y,
              r: distance,
              startAngle: radianToAngle(getTwoPointsRadian(current, center)),
              endAngle: radianToAngle(getTwoPointsRadian(next, center)),
            }
            newItem = {
              current: next,
              line: {
                type: 'arc',
                curve: {
                  ...arc,
                  counterclockwise: twoRadiansSameDirection(getGeometryLinePointAndTangentRadianAtParam(0, { type: 'arc', curve: arc }).radian, getGeometryLinePointAndTangentRadianAtParam(1, previousLine).radian) ? undefined : true,
                },
              },
            }
          }
        }
      }
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
    if (newItem) {
      result.push(newItem.line)
      previous = newItem.current
    }
  }
  return result
}

function getTwoGeometryLinesNearestIntersectionPoint(line1: GeometryLine, line2: GeometryLine, originalLine2: GeometryLine) {
  const intersections = getTwoGeometryLinesIntersectionPoint(line1, line2, true)
  if (intersections.length > 1) {
    const s = getGeometryLineStartAndEnd(originalLine2).start
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
        pline1 = getPerpendicularLine(first, pline2)
      }
    } else if (i === parallelLines.length) {
      pline1 = parallelLines[parallelLines.length - 1]
      line2 = lines[0]
      if (closed) {
        pline2 = parallelLines[0]
      } else {
        pline2 = getPerpendicularLine(last, pline1)
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
