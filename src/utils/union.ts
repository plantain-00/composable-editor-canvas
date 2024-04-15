import { getNormalizedAngleInRanges, twoAnglesSameDirection } from "./angle"
import { getBezierCurvePercentsAtBezierCurve, getQuadraticCurvePercentsAtQuadraticCurve } from "./bezier"
import { isSameCircle } from "./circle"
import { isSameEllipse } from "./ellipse"
import { GeometryLine, getGeometryLineParamAtPoint, getPartOfGeometryLine } from "./geometry-line"
import { getRayAngle, isSameLine, pointAndDirectionToGeneralFormLine, pointIsOnRay, twoPointLineToGeneralFormLine } from "./line"
import { getNumberRangeUnion, mergeItems } from "./math"
import { mergeArc, mergeEllipseArc } from "./merge"
import { angleToRadian } from "./radian"

export function getTwoGeometryLinesUnionLine(line1: GeometryLine, line2: GeometryLine): GeometryLine | undefined {
  if (Array.isArray(line1)) {
    const generalFormLine1 = twoPointLineToGeneralFormLine(...line1)
    if (!generalFormLine1) return
    if (Array.isArray(line2)) {
      const generalFormLine2 = twoPointLineToGeneralFormLine(...line2)
      if (!generalFormLine2) return
      if (!isSameLine(generalFormLine1, generalFormLine2)) return
      const params = line2.map(n => getGeometryLineParamAtPoint(n, line1))
      const range = getNumberRangeUnion([params[0], params[1]], [0, 1])
      if (!range) return
      return getPartOfGeometryLine(...range, line1)
    }
    if (line2.type === 'ray') {
      const generalFormLine2 = pointAndDirectionToGeneralFormLine(line2.line, angleToRadian(line2.line.angle))
      if (!isSameLine(generalFormLine1, generalFormLine2)) return
      if (line2.line.bidirectional) return line2
      const onRays = line1.map(n => pointIsOnRay(n, line2.line))
      if (onRays.every(r => r)) return line2
      let index = onRays.findIndex(r => r)
      if (index >= 0) {
        index = index === 0 ? 1 : 0
        return { type: 'ray', line: { ...line2.line, x: line1[index].x, y: line1[index].y } }
      }
      return
    }
    return
  }
  if (Array.isArray(line2)) return getTwoGeometryLinesUnionLine(line2, line1)
  if (line1.type === 'arc') {
    if (line2.type === 'arc') {
      if (!isSameCircle(line1.curve, line2.curve)) return
      const ranges = mergeItems([...getNormalizedAngleInRanges(line1.curve), ...getNormalizedAngleInRanges(line2.curve)], getNumberRangeUnion)
      const result = mergeItems(ranges.map(r => ({ ...line1.curve, startAngle: r[0], endAngle: r[1], counterclockwise: undefined })), mergeArc)
      if (result.length > 0) {
        return { type: 'arc', curve: result[0] }
      }
      return
    }
    return
  }
  if (line2.type === 'arc') return getTwoGeometryLinesUnionLine(line2, line1)
  if (line1.type === 'ellipse arc') {
    if (line2.type === 'ellipse arc') {
      if (!isSameEllipse(line1.curve, line2.curve)) return
      const ranges = mergeItems([...getNormalizedAngleInRanges(line1.curve), ...getNormalizedAngleInRanges(line2.curve)], getNumberRangeUnion)
      const result = mergeItems(ranges.map(r => ({ ...line1.curve, startAngle: r[0], endAngle: r[1], counterclockwise: undefined })), mergeEllipseArc)
      if (result.length > 0) {
        return { type: 'ellipse arc', curve: result[0] }
      }
      return
    }
    return
  }
  if (line2.type === 'ellipse arc') return getTwoGeometryLinesUnionLine(line2, line1)
  if (line1.type === 'quadratic curve') {
    if (line2.type === 'quadratic curve') {
      const percents = getQuadraticCurvePercentsAtQuadraticCurve(line1.curve, line2.curve)
      if (!percents) return
      const params = getNumberRangeUnion(percents, [0, 1])
      if (!params) return
      return getPartOfGeometryLine(...params, line1)
    }
    return
  }
  if (line2.type === 'quadratic curve') return getTwoGeometryLinesUnionLine(line2, line1)
  if (line1.type === 'bezier curve') {
    if (line2.type === 'bezier curve') {
      const percents = getBezierCurvePercentsAtBezierCurve(line1.curve, line2.curve)
      if (!percents) return
      const params = getNumberRangeUnion(percents, [0, 1])
      if (!params) return
      return getPartOfGeometryLine(...params, line1)
    }
    return
  }
  if (line2.type === 'bezier curve') return getTwoGeometryLinesUnionLine(line2, line1)
  if (line1.type === 'ray') {
    if (line2.type === 'ray') {
      const generalFormLine1 = pointAndDirectionToGeneralFormLine(line1.line, angleToRadian(line1.line.angle))
      const generalFormLine2 = pointAndDirectionToGeneralFormLine(line2.line, angleToRadian(line2.line.angle))
      if (!isSameLine(generalFormLine1, generalFormLine2)) return
      if (line1.line.bidirectional) return line1
      if (line2.line.bidirectional) return line2
      if (twoAnglesSameDirection(getRayAngle(line1.line), getRayAngle(line2.line))) {
        return pointIsOnRay(line1.line, line2.line) ? line2 : line1
      }
      if (pointIsOnRay(line1.line, line2.line)) {
        return { type: 'ray', line: { ...line2.line, bidirectional: true } }
      }
      return
    }
    return
  }
  if (line2.type === 'ray') return getTwoGeometryLinesUnionLine(line2, line1)
  return
}
