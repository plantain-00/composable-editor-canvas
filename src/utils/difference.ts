import { getAngleRangesDifferences, twoAnglesSameDirection } from "./angle"
import { getBezierCurvePercentsAtBezierCurve, getQuadraticCurvePercentsAtQuadraticCurve } from "./bezier"
import { isSameCircle } from "./circle"
import { isSameEllipse } from "./ellipse"
import { GeometryLine, getGeometryLineParamAtPoint, getPartOfGeometryLine } from "./geometry-line"
import { isSameHyperbola } from "./hyperbola"
import { getRayAngle, isSameLine, pointAndDirectionToGeneralFormLine, pointIsOnLineSegment, pointIsOnRay, twoPointLineToGeneralFormLine } from "./line"
import { applyToItems, getNumberRangeDifference, mergeItems } from "./math"
import { mergeArc, mergeEllipseArc } from "./merge"
import { angleToRadian, getTwoPointsRadian, radianToAngle } from "./radian"
import { reverseAngle } from "./reverse"

export function getTwoGeometryLinesDifferenceLine(line1: GeometryLine, line2: GeometryLine): GeometryLine[] {
  if (Array.isArray(line1)) {
    const generalFormLine1 = twoPointLineToGeneralFormLine(...line1)
    if (!generalFormLine1) return [line1]
    if (Array.isArray(line2)) {
      const generalFormLine2 = twoPointLineToGeneralFormLine(...line2)
      if (!generalFormLine2) return [line1]
      if (!isSameLine(generalFormLine1, generalFormLine2)) return [line1]
      const params = line2.map(n => getGeometryLineParamAtPoint(n, line1))
      const ranges = getNumberRangeDifference([0, 1], [params[0], params[1]])
      return ranges.map(r => getPartOfGeometryLine(...r, line1))
    }
    if (line2.type === 'ray') {
      const generalFormLine2 = pointAndDirectionToGeneralFormLine(line2.line, angleToRadian(line2.line.angle))
      if (!isSameLine(generalFormLine1, generalFormLine2)) return [line1]
      if (line2.line.bidirectional) return []
      const onRays = line1.map(n => pointIsOnRay(n, line2.line))
      if (onRays.every(r => r)) return []
      let index = onRays.findIndex(r => r)
      if (index >= 0) {
        index = index === 0 ? 1 : 0
        return [[line1[index], line2.line]]
      }
      return [line1]
    }
    return [line1]
  }
  if (line1.type === 'arc') {
    if (Array.isArray(line2)) return [line1]
    if (line2.type === 'arc') {
      if (!isSameCircle(line1.curve, line2.curve)) return [line1]
      const ranges = getAngleRangesDifferences(line1.curve, line2.curve)
      const result = mergeItems(ranges.map(r => ({ ...line1.curve, startAngle: r[0], endAngle: r[1], counterclockwise: undefined })), mergeArc)
      return result.map(r => ({ type: 'arc', curve: r }))
    }
    return [line1]
  }
  if (line1.type === 'ellipse arc') {
    if (Array.isArray(line2)) return [line1]
    if (line2.type === 'ellipse arc') {
      if (!isSameEllipse(line1.curve, line2.curve)) return [line1]
      const ranges = getAngleRangesDifferences(line1.curve, line2.curve)
      const result = mergeItems(ranges.map(r => ({ ...line1.curve, startAngle: r[0], endAngle: r[1], counterclockwise: undefined })), mergeEllipseArc)
      return result.map(r => ({ type: 'ellipse arc', curve: r }))
    }
    return [line1]
  }
  if (line1.type === 'quadratic curve') {
    if (Array.isArray(line2)) return [line1]
    if (line2.type === 'quadratic curve') {
      const percents = getQuadraticCurvePercentsAtQuadraticCurve(line1.curve, line2.curve)
      if (!percents) return [line1]
      const params = getNumberRangeDifference([0, 1], percents)
      return params.map(p => getPartOfGeometryLine(...p, line1))
    }
    return [line1]
  }
  if (line1.type === 'bezier curve') {
    if (Array.isArray(line2)) return [line1]
    if (line2.type === 'bezier curve') {
      const percents = getBezierCurvePercentsAtBezierCurve(line1.curve, line2.curve)
      if (!percents) return [line1]
      const params = getNumberRangeDifference([0, 1], percents)
      return params.map(p => getPartOfGeometryLine(...p, line1))
    }
    return [line1]
  }
  if (line1.type === 'hyperbola curve') {
    if (Array.isArray(line2)) return [line1]
    if (line2.type === 'hyperbola curve') {
      if (!isSameHyperbola(line1.curve, line2.curve)) return [line1]
      const params = getNumberRangeDifference([line1.curve.t1, line1.curve.t2], [line2.curve.t1, line2.curve.t2])
      return params.map(p => ({ type: 'hyperbola curve', curve: { ...line1.curve, t1: p[0], t2: p[1] } }))
    }
    return [line1]
  }
  if (line1.type === 'ray') {
    const generalFormLine1 = pointAndDirectionToGeneralFormLine(line1.line, angleToRadian(line1.line.angle))
    if (Array.isArray(line2)) {
      const generalFormLine2 = twoPointLineToGeneralFormLine(...line2)
      if (!generalFormLine2) return [line1]
      if (!isSameLine(generalFormLine1, generalFormLine2)) return [line1]
      if (line1.line.bidirectional) {
        return [
          { type: 'ray', line: { x: line2[0].x, y: line2[0].y, angle: radianToAngle(getTwoPointsRadian(line2[0], line2[1])) } },
          { type: 'ray', line: { x: line2[1].x, y: line2[1].y, angle: radianToAngle(getTwoPointsRadian(line2[1], line2[0])) } },
        ]
      }
      const onRays = line2.map(n => pointIsOnRay(n, line1.line))
      if (onRays.every(r => r)) {
        const index0IsCloser = pointIsOnLineSegment(line2[0], line1.line, line2[1])
        const i1 = index0IsCloser ? 0 : 1, i2 = index0IsCloser ? 1 : 0
        return [
          [line1.line, line2[i1]],
          { type: 'ray', line: { ...line1.line, x: line2[i2].x, y: line2[i2].y } },
        ]
      }
      const index = onRays.findIndex(r => r)
      if (index >= 0) {
        return [{ type: 'ray', line: { ...line1.line, x: line2[index].x, y: line2[index].y } }]
      }
      return [line1]
    } else if (line2.type === 'ray') {
      const generalFormLine2 = pointAndDirectionToGeneralFormLine(line2.line, angleToRadian(line2.line.angle))
      if (!isSameLine(generalFormLine1, generalFormLine2)) return [line1]
      if (line2.line.bidirectional) return []
      if (line1.line.bidirectional) {
        return [{ type: 'ray', line: { ...line1.line, angle: reverseAngle(line1.line.angle) } }]
      }
      if (twoAnglesSameDirection(getRayAngle(line1.line), getRayAngle(line2.line))) {
        return pointIsOnRay(line1.line, line2.line) ? [] : [[line1.line, line2.line]]
      }
      if (pointIsOnRay(line1.line, line2.line)) {
        return [{ type: 'ray', line: { ...line1.line, x: line2.line.x, y: line2.line.y } }]
      }
      return [line1]
    }
    return [line1]
  }
  return [line1]
}

export function getGeometryLinesDifferenceLines(lines1: GeometryLine[], lines2: GeometryLine[]): GeometryLine[] {
  return lines1.map(line1 => applyToItems(line1, lines2, getTwoGeometryLinesDifferenceLine)).flat()
}

export function geometrylineIsOnGeometryLine(line1: GeometryLine, line2: GeometryLine): boolean {
  return getTwoGeometryLinesDifferenceLine(line1, line2).length === 0
}

export function isSameGeometryline(line1: GeometryLine, line2: GeometryLine): boolean {
  return geometrylineIsOnGeometryLine(line1, line2) && geometrylineIsOnGeometryLine(line2, line1)
}

export function isSameGeometrylines(lines1: GeometryLine[], lines2: GeometryLine[]): boolean {
  if (lines1.length !== lines2.length) return false
  return lines1.every(n1 => lines2.some(n2 => isSameGeometryline(n1, n2)))
}
