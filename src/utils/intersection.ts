import { BezierCurve } from "./bezier"
import { QuadraticCurve } from "./bezier"
import { getBezierCurvePercentAtPoint, getQuadraticCurvePercentAtPoint } from "./bezier"
import { calculateEquation2, calculateEquation3, calculateEquation4, calculateEquation5 } from "./equation-calculater"
import { delta2, isSameNumber, isValidPercent, isZero, lessOrEqual, lessThan } from "./math"
import { Position, isSamePoint } from "./position"
import { getPolygonFromTwoPointsFormRegion } from "./region"
import { TwoPointsFormRegion } from "./region"
import { getPolygonLine, getRayPointAtDistance, pointAndDirectionToGeneralFormLine, pointIsOnRay, rayToLineSegment } from "./line"
import { GeneralFormLine } from "./line"
import { generalFormLineToTwoPointLine, twoPointLineToGeneralFormLine } from "./line"
import { pointIsOnLineSegment } from "./line"
import { EllipseArc } from "./ellipse"
import { Arc, Circle } from "./circle"
import { Ellipse } from "./ellipse"
import { pointIsOnEllipseArc } from "./ellipse"
import { pointIsOnArc } from "./circle"
import { getArcNurbsCurveIntersectionPoints, getBezierCurveNurbsCurveIntersectionPoints, getEllipseArcNurbsCurveIntersectionPoints, getLineSegmentNurbsCurveIntersectionPoints, getQuadraticCurveNurbsCurveIntersectionPoints, getTwoNurbsCurveIntersectionPoints } from "./nurbs"
import { angleToRadian } from "./radian"
import { Nullable } from "./types"
import { GeometryLine, getGeometryLineStartAndEnd, isGeometryLinesClosed } from "./geometry-line"
import { getGeometryLineBounding } from "./bounding"

/**
 * @public
 */
export function* iterateIntersectionPoints<T>(
  content1: T,
  content2: T,
  contents: readonly Nullable<T>[],
  getModel: (content: T) => {
    getGeometries?: (content: T, contents: readonly Nullable<T>[]) => { lines: GeometryLine[] },
  } | undefined,
) {
  const model1 = getModel(content1)
  const model2 = getModel(content2)
  if (model1 && model2) {
    if (model1.getGeometries && model2.getGeometries) {
      const lines1 = model1.getGeometries(content1, contents).lines
      const lines2 = model2.getGeometries(content2, contents).lines
      yield* iterateGeometryLinesIntersectionPoints(lines1, lines2)
    }
  }
}

export function* iterateGeometryLinesIntersectionPoints(lines1: GeometryLine[], lines2: GeometryLine[]) {
  for (const line1 of lines1) {
    for (const line2 of lines2) {
      yield* getTwoGeometryLinesIntersectionPoint(line1, line2)
    }
  }
}

export function* iterateGeometryLinesSelfIntersectionPoints(lines: GeometryLine[]) {
  const closed = isGeometryLinesClosed(lines)
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      let points = getTwoGeometryLinesIntersectionPoint(lines[i], lines[j])
      if (j === i + 1) {
        const end = getGeometryLineStartAndEnd(lines[i])?.end
        if (end) {
          points = points.filter(p => !isSamePoint(p, end))
        }
      }
      if (closed && i === 0 && j === lines.length - 1) {
        const start = getGeometryLineStartAndEnd(lines[i])?.start
        if (start) {
          points = points.filter(p => !isSamePoint(p, start))
        }
      }
      yield* points
    }
  }
}

/**
 * @public
 */
export function getTwoLineSegmentsIntersectionPoint(p1Start: Position, p1End: Position, p2Start: Position, p2End: Position) {
  const result = getTwoLinesIntersectionPoint(p1Start, p1End, p2Start, p2End)
  if (result && pointIsOnLineSegment(result, p1Start, p1End) && pointIsOnLineSegment(result, p2Start, p2End)) {
    return result
  }
  return undefined
}

export function getTwoGeometryLinesIntersectionPoint(line1: GeometryLine, line2: GeometryLine, extend = false, delta = delta2) {
  if (Array.isArray(line1)) {
    if (Array.isArray(line2)) {
      const point = extend
        ? getTwoLinesIntersectionPoint(...line1, ...line2)
        : getTwoLineSegmentsIntersectionPoint(...line1, ...line2)
      if (point) {
        return [point]
      }
      return []
    }
    if (line2.type === 'arc') {
      if (extend) {
        return getLineCircleIntersectionPoints(...line1, line2.curve, delta)
      }
      return getLineSegmentArcIntersectionPoints(...line1, line2.curve)
    }
    if (line2.type === 'ellipse arc') {
      if (extend) {
        return getLineEllipseIntersectionPoints(...line1, line2.curve)
      }
      return getLineSegmentEllipseArcIntersectionPoints(...line1, line2.curve)
    }
    if (line2.type === 'quadratic curve') {
      if (extend) {
        return getLineQuadraticCurveIntersectionPoints(...line1, line2.curve, true)
      }
      return getLineSegmentQuadraticCurveIntersectionPoints(...line1, line2.curve)
    }
    if (line2.type === 'bezier curve') {
      if (extend) {
        return getLineBezierCurveIntersectionPoints(...line1, line2.curve, true)
      }
      return getLineSegmentBezierCurveIntersectionPoints(...line1, line2.curve)
    }
    if (line2.type === 'ray') {
      const point = getTwoGeneralFormLinesIntersectionPoint(twoPointLineToGeneralFormLine(...line1), pointAndDirectionToGeneralFormLine(line2.line, angleToRadian(line2.line.angle)))
      if (point && (extend || (pointIsOnLineSegment(point, ...line1) && pointIsOnRay(point, line2.line)))) {
        return [point]
      }
      return []
    }
    return getLineSegmentNurbsCurveIntersectionPoints(...line1, line2.curve)
  }
  if (Array.isArray(line2)) return getTwoGeometryLinesIntersectionPoint(line2, line1, extend)
  if (line1.type === 'arc') {
    if (line2.type === 'arc') {
      if (extend) {
        return getTwoCircleIntersectionPoints(line1.curve, line2.curve)
      }
      return getTwoArcIntersectionPoints(line1.curve, line2.curve)
    }
    if (line2.type === 'ellipse arc') {
      if (extend) {
        return getCircleEllipseIntersectionPoints(line1.curve, line2.curve)
      }
      return getArcEllipseArcIntersectionPoints(line1.curve, line2.curve)
    }
    if (line2.type === 'quadratic curve') {
      if (extend) {
        return getCircleQuadraticCurveIntersectionPoints(line1.curve, line2.curve, true)
      }
      return getArcQuadraticCurveIntersectionPoints(line1.curve, line2.curve)
    }
    if (line2.type === 'bezier curve') {
      if (extend) {
        return getCircleBezierCurveIntersectionPoints(line1.curve, line2.curve, undefined, true)
      }
      return getArcBezierCurveIntersectionPoints(line1.curve, line2.curve)
    }
    if (line2.type === 'ray') {
      let points = getLineCircleIntersectionPoints(line2.line, getRayPointAtDistance(line2.line, 1), line1.curve, delta)
      if (!extend) {
        points = points.filter(p => pointIsOnArc(p, line1.curve) && pointIsOnRay(p, line2.line))
      }
      return points
    }
    return getArcNurbsCurveIntersectionPoints(line1.curve, line2.curve)
  }
  if (line2.type === 'arc') return getTwoGeometryLinesIntersectionPoint(line2, line1, extend)
  if (line1.type === 'ellipse arc') {
    if (line2.type === 'ellipse arc') {
      if (extend) {
        return getTwoEllipseIntersectionPoints(line1.curve, line2.curve)
      }
      return getTwoEllipseArcIntersectionPoints(line1.curve, line2.curve)
    }
    if (line2.type === 'quadratic curve') {
      if (extend) {
        return getEllipseQuadraticCurveIntersectionPoints(line1.curve, line2.curve, true)
      }
      return getEllipseArcQuadraticCurveIntersectionPoints(line1.curve, line2.curve)
    }
    if (line2.type === 'bezier curve') {
      if (extend) {
        return getEllipseBezierCurveIntersectionPoints(line1.curve, line2.curve, undefined, true)
      }
      return getEllipseArcBezierCurveIntersectionPoints(line1.curve, line2.curve)
    }
    if (line2.type === 'ray') {
      let points = getLineEllipseIntersectionPoints(line2.line, getRayPointAtDistance(line2.line, 1), line1.curve)
      if (!extend) {
        points = points.filter(p => pointIsOnEllipseArc(p, line1.curve) && pointIsOnRay(p, line2.line))
      }
      return points
    }
    return getEllipseArcNurbsCurveIntersectionPoints(line1.curve, line2.curve)
  }
  if (line2.type === 'ellipse arc') return getTwoGeometryLinesIntersectionPoint(line2, line1, extend)
  if (line1.type === 'quadratic curve') {
    if (line2.type === 'quadratic curve') {
      return getTwoQuadraticCurveIntersectionPoints(line1.curve, line2.curve, extend)
    }
    if (line2.type === 'bezier curve') {
      return getQuadraticCurveBezierCurveIntersectionPoints(line1.curve, line2.curve, undefined, extend)
    }
    if (line2.type === 'ray') {
      let points = getLineQuadraticCurveIntersectionPoints(line2.line, getRayPointAtDistance(line2.line, 1), line1.curve, extend)
      if (!extend) {
        points = points.filter(p => pointIsOnRay(p, line2.line))
      }
      return points
    }
    return getQuadraticCurveNurbsCurveIntersectionPoints(line1.curve, line2.curve)
  }
  if (line2.type === 'quadratic curve') return getTwoGeometryLinesIntersectionPoint(line2, line1, extend)
  if (line1.type === 'bezier curve') {
    if (line2.type === 'bezier curve') {
      return getTwoBezierCurveIntersectionPoints(line1.curve, line2.curve, undefined, extend)
    }
    if (line2.type === 'ray') {
      let points = getLineBezierCurveIntersectionPoints(line2.line, getRayPointAtDistance(line2.line, 1), line1.curve, extend)
      if (!extend) {
        points = points.filter(p => pointIsOnRay(p, line2.line))
      }
      return points
    }
    return getBezierCurveNurbsCurveIntersectionPoints(line1.curve, line2.curve)
  }
  if (line2.type === 'bezier curve') return getTwoGeometryLinesIntersectionPoint(line2, line1, extend)
  if (line1.type === 'ray') {
    if (line2.type === 'ray') {
      const point = getTwoGeneralFormLinesIntersectionPoint(pointAndDirectionToGeneralFormLine(line1.line, angleToRadian(line1.line.angle)), pointAndDirectionToGeneralFormLine(line2.line, angleToRadian(line2.line.angle)))
      if (point && (extend || (pointIsOnRay(point, line1.line) && pointIsOnRay(point, line2.line)))) {
        return [point]
      }
      return []
    }
    const bounding = getGeometryLineBounding(line2)
    if (bounding) {
      const line = rayToLineSegment(line1.line, getPolygonFromTwoPointsFormRegion(bounding))
      if (line) {
        return getLineSegmentNurbsCurveIntersectionPoints(...line, line2.curve)
      }
    }
    return []
  }
  if (line2.type === 'ray') return getTwoGeometryLinesIntersectionPoint(line2, line1, extend)
  return getTwoNurbsCurveIntersectionPoints(line1.curve, line2.curve)
}

/**
 * @public
 */
export function getTwoLinesIntersectionPoint(p1Start: Position, p1End: Position, p2Start: Position, p2End: Position) {
  return getTwoGeneralFormLinesIntersectionPoint(twoPointLineToGeneralFormLine(p1Start, p1End), twoPointLineToGeneralFormLine(p2Start, p2End))
}

/**
 * @public
 */
export function getTwoGeneralFormLinesIntersectionPoint(p1: GeneralFormLine, p2: GeneralFormLine) {
  const { a: a1, b: b1, c: c1 } = p1
  const { a: a2, b: b2, c: c2 } = p2
  // F1: a1 x + b1 y + c1 = 0
  // F2: a2 x + b2 y + c2 = 0
  // F1*a2-F2*a1: (a2 b1 - a1 b2) y + a2 c1 - a1 c2 = 0
  // F2*b1-F1*b2: (a2 b1 - a1 b2) x - b2 c1 + b1 c2 = 0
  const d = a2 * b1 - a1 * b2
  if (isZero(d)) {
    return undefined
  }
  return {
    x: (c1 * b2 - b1 * c2) / d,
    y: (c2 * a1 - c1 * a2) / d,
  }
}

/**
 * @public
 */
export function getTwoCircleIntersectionPoints({ x: x1, y: y1, r: r1 }: Circle, { x: x2, y: y2, r: r2 }: Circle): Position[] {
  const m = r1 ** 2
  const n = r2 ** 2
  // (x - x1)^2 + (y - y1)^2 = m
  // (x - x2)^2 + (y - y2)^2 = n
  // let u = x - x1, v = y - y1
  // F1: u^2 + v^2 - m = 0
  // (u + x1 - x2)^2 + (v + y1 - y2)^2 - n = 0
  const p = x2 - x1
  const q = y2 - y1
  // (u - p)^2 + (v - q)^2 - n = 0
  // u^2 - 2pu + pp + v^2 - 2qv + qq - n = 0
  // -F1: -2pu - 2qv + (pp + qq) + m - n = 0
  // pu + qv = ((pp + qq) + m - n) / 2
  const a = p ** 2 + q ** 2
  // pu + qv = (a + m - n) / 2
  const d = Math.sqrt(a)
  const l = (a + m - n) / 2 / d
  // pu + qv = ld
  // F2: v = (l d - p u)/q
  // F1 replace v, *q q, group u: (p p + q q) u u + -2 d l p u + d d l l + -m q q = 0
  // a u^2 - 2 l d p u + (l l a - m q q) = 0
  // let b = - 2 l d p, c = l l a - m q q
  // bb - 4ac = (2 l d p)^2 - 4 a (l l a - m q q)
  // (bb - 4ac)/4/a = l l p p - a l l + m q q
  // (bb - 4ac)/4/a = l l(p p - a) + m q q
  // (bb - 4ac)/4/a = l l(-qq) + m q q
  // bb - 4ac = 4 a q q(m - l l)
  const f = m - l ** 2
  // bb - 4ac = 4aqqf
  if (lessThan(f, 0)) {
    return []
  }
  // u = -b/2/a = 2 l d p/2/a = l d p/a = l p/d
  const c = l / d
  // u = -b/2/a = cp
  // x = u + x1 = cp + x1
  const g = c * p + x1

  // F2 replace u with c*p: v = (l d - p c p)/q
  // v = (l d d/d - c p p)/q
  // v = (l a/d - c p p)/q
  // v = (c a - c p p)/q
  // v = c(a - p p)/q = c q q/q = c q
  // y = v + y1 = cq + y1
  const i = c * q + y1
  if (isZero(f)) {
    return [
      {
        x: g,
        y: i,
      },
    ]
  }
  const h = Math.sqrt(f)
  // sqrt(bb - 4ac)/2/a = sqrt(4 a q q f)/2/a
  // sqrt(bb - 4ac)/2/a = sqrt(4 d d q q h h)/2/a
  // sqrt(bb - 4ac)/2/a = 2 d q h/2/r = d q h/a = q h/d
  const e = h / d
  // sqrt(bb - 4ac)/2/a = q(d e)/d = q e
  const j = e * q

  // F2 replace u with x - x1: v = (l d - p(x - x1))/q
  // v = (l d - p(g + j - x1))/q
  // v = (l d - p(c p + x1 + j - x1))/q
  // v = (l d - p(c p + j))/q
  // v = (l d - p(c p + e q))/q
  // v = (c d d - c p p - p e q)/q
  // v = (c(d d - p p) - p e q)/q
  // v = (c q q - p e q)/q
  // v = c q - p e
  // v = (i - y1) - p e
  // y = v + y1 = (i - y1) - p e + y1 = i - p e
  const k = e * p
  // y = i - k
  return [
    {
      x: g + j,
      y: i - k,
    },
    {
      x: g - j,
      y: i + k,
    },
  ]
}

/**
 * @public
 */
export function getLineSegmentCircleIntersectionPoints(start: Position, end: Position, circle: Circle) {
  return getLineCircleIntersectionPoints(start, end, circle).filter((p) => pointIsOnLineSegment(p, start, end))
}

export function getLineSegmentArcIntersectionPoints(start: Position, end: Position, arc: Arc) {
  return getLineSegmentCircleIntersectionPoints(start, end, arc).filter((p) => pointIsOnArc(p, arc))
}

export function getTwoArcIntersectionPoints(arc1: Arc, arc2: Arc) {
  return getTwoCircleIntersectionPoints(arc1, arc2).filter((p) => pointIsOnArc(p, arc1) && pointIsOnArc(p, arc2))
}

/**
 * @public
 */
export function getLineCircleIntersectionPoints({ x: x2, y: y2 }: Position, { x: x3, y: y3 }: Position, { x: x1, y: y1, r }: Circle, delta = delta2) {
  // (x - x1)^2 + (y - y1)^2 = r r
  // let u = x - x1, v = y - y1
  // F1: u^2 + v^2 - r r = 0
  // (x - x2) / (x3 - x2) = (y - y2) / (y3 - y2)
  const d = x3 - x2
  const e = y3 - y2
  // (x - x2) / d = (y - y2) / e
  // e(x - x2) = d(y - y2)
  // e((u + x1) - x2) = d((v + y1) - y2)
  const f = x1 - x2
  const g = y1 - y2
  // e(u + f) = d(v + g)
  // e u + e f - d v + d g = 0
  const s = e * f - d * g
  // F2: v = (e u + e f - d g)/d = (e u + s)/d
  // F2 replace v, *d d, group u: (d d + e e) u u + 2 e s u + s s + -d d r r = 0
  const h = d ** 2 + e ** 2
  // h u^2 + 2 e s u + (s s - r r d d) = 0
  // a = h, b = 2 e s, c = s s - r r d d
  // (bb - 4ac)/4/d/d = d d r r + e e r r + -s s = h r r -  s s
  const t = r * r * h - s * s
  // bb - 4ac = 4 d d t
  if (lessThan(t, 0, delta)) {
    return []
  }
  // u = -b/2/a = -2 e s/2/h = -e s/h
  // x = u + x1 = -e s/h + x1
  const i = -e * s / h + x1

  // F2 replace u: v = (e(-e s/h) + s) / d
  // *h, /s: v = s(-e e + h)/h/d = s d d /h/d = d s/h
  // y = v + y1 = d s/h + y1
  const j = d * s / h + y1

  if (isZero(t, delta)) {
    return [
      {
        x: i,
        y: j,
      }
    ]
  }
  const n = Math.sqrt(t)
  // sqrt(bb - 4ac)/2/a = sqrt(4 d d t)/2/h = 2d sqrt(t)/2/h = n d/h
  const p = n * d / h
  // F2 replace u with i - p: v = (e(x - x1) + s) / d
  // v = (e(-e s/h + x1 - n d/h - x1) + s) / d
  // *h, v = (-d e n + -e e s + h s)/h/d
  // v = (-d e n + d d s)/h/d
  // /d, v = (-e n + d s)/h
  // y = v + y1 = (d s - e n)/h + y1
  // y = j - e n h
  const q = n * e / h
  // y = j - q
  return [
    {
      x: i - p,
      y: j - q,
    },
    {
      x: i + p,
      y: j + q,
    },
  ]
}

export function getGeneralFormLineCircleIntersectionPoints(line: GeneralFormLine, circle: Circle) {
  return getLineCircleIntersectionPoints(...generalFormLineToTwoPointLine(line), circle)
}

export function lineIntersectWithPolygon(p1: Position, p2: Position, polygon: Position[]) {
  for (const line of getPolygonLine(polygon)) {
    if (lineIntersectWithLine(p1, p2, ...line)) {
      return true
    }
  }
  return false
}

export function geometryLineIntersectWithPolygon(g: GeometryLine, polygon: Position[]) {
  for (const line of getPolygonLine(polygon)) {
    if (Array.isArray(g)) {
      if (lineIntersectWithLine(...g, ...line)) {
        return true
      }
    } else if (g.type === 'arc') {
      if (getLineSegmentArcIntersectionPoints(...line, g.curve).length > 0) {
        return true
      }
    } else if (g.type === 'ellipse arc') {
      if (getLineSegmentEllipseArcIntersectionPoints(...line, g.curve).length > 0) {
        return true
      }
    } else if (g.type === 'quadratic curve') {
      if (getLineSegmentQuadraticCurveIntersectionPoints(...line, g.curve).length > 0) {
        return true
      }
    } else if (g.type === 'bezier curve') {
      if (getLineSegmentBezierCurveIntersectionPoints(...line, g.curve).length > 0) {
        return true
      }
    } else if (g.type === 'nurbs curve') {
      if (getLineSegmentNurbsCurveIntersectionPoints(...line, g.curve).length > 0) {
        return true
      }
    } else if (g.type === 'ray') {
      const p = getTwoGeneralFormLinesIntersectionPoint(twoPointLineToGeneralFormLine(...line), pointAndDirectionToGeneralFormLine(g.line, angleToRadian(g.line.angle)))
      if (p && pointIsOnRay(p, g.line) && pointIsOnLineSegment(p, ...line)) {
        return true
      }
    }
  }
  return false
}

function lineIntersectWithLine(a: Position, b: Position, c: Position, d: Position) {
  if (!(lessOrEqual(Math.min(a.x, b.x), Math.max(c.x, d.x)) && lessOrEqual(Math.min(c.y, d.y), Math.max(a.y, b.y)) && lessOrEqual(Math.min(c.x, d.x), Math.max(a.x, b.x)) && lessOrEqual(Math.min(a.y, b.y), Math.max(c.y, d.y)))) {
    return false
  }
  const u = (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y)
  const v = (d.x - a.x) * (b.y - a.y) - (b.x - a.x) * (d.y - a.y)
  const w = (a.x - c.x) * (d.y - c.y) - (d.x - c.x) * (a.y - c.y)
  const z = (b.x - c.x) * (d.y - c.y) - (d.x - c.x) * (b.y - c.y)
  return lessOrEqual(u * v, 0) && lessOrEqual(w * z, 0)
}

export function lineIntersectWithTwoPointsFormRegion(p1: Position, p2: Position, region: TwoPointsFormRegion) {
  return lineIntersectWithPolygon(p1, p2, getPolygonFromTwoPointsFormRegion(region))
}

export function getLineEllipseIntersectionPoints({ x: x1, y: y1 }: Position, { x: x2, y: y2 }: Position, { rx, ry, cx, cy, angle }: Ellipse) {
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian)
  const d2 = Math.cos(radian)
  // (d2(x - cx) + d1(y - cy))^2/rx/rx + (-d1(x - cx) + d2(y - cy))^2/ry/ry = 1
  // let u = x - cx, v = y - cy
  const i1 = rx * rx, i2 = ry * ry
  // (d2 u + d1 v)^2/i1 + (-d1 u + d2 v)^2/i2 = 1
  // i2(d2 u + d1 v)^2 + i1(-d1 u + d2 v)^2 - i1 i2 = 0
  // group v, F1: (d2 d2 i1 + d1 d1 i2) v v + (-2 d1 d2 i1 u + 2 d1 d2 i2 u) v + d1 d1 i1 u u + d2 d2 i2 u u + -i1 i2

  // (x - x1) / (x2 - x1) = (y - y1) / (y2 - y1)
  const e1 = x2 - x1, e2 = y2 - y1
  // (u + cx - x1) / e1 = (v + cy - y1)/ e2
  const h1 = cx - x1, h2 = cy - y1
  // e2 (u + h1) = e1 (v + h2)
  // group v: e1 v = e2 u + e2 h1 - e1 h2
  const f1 = e2 * h1 - e1 * h2
  // F2: v = (e2 u + f1) / e1
  // F1 replace v, *e1 e1, group u: (d1 d1 e1 e1 i1 + -2 d1 d2 e1 e2 i1 + d2 d2 e2 e2 i1 + d2 d2 e1 e1 i2 + 2 d1 d2 e1 e2 i2 + d1 d1 e2 e2 i2) u u + (-2 d1 d2 e1 f1 i1 + 2 d2 d2 e2 f1 i1 + 2 d1 d2 e1 f1 i2 + 2 d1 d1 e2 f1 i2) u + d2 d2 f1 f1 i1 + d1 d1 f1 f1 i2 + -e1 e1 i1 i2 = 0
  // a = d1 d1 e1 e1 i1 + -2 d1 d2 e1 e2 i1 + d2 d2 e2 e2 i1 + d2 d2 e1 e1 i2 + 2 d1 d2 e1 e2 i2 + d1 d1 e2 e2 i2
  // a = (d1 d1 e1 e1 + -2 d1 d2 e1 e2 + d2 d2 e2 e2) i1 + (d2 d2 e1 e1 + 2 d1 d2 e1 e2 + d1 d1 e2 e2) i2
  // a = (d1 e1 - d2 e2)^2 i1 + (d2 e1 + d1 e2)^2 i2
  const f2 = d2 * e1 + d1 * e2, f3 = d2 * e2 - d1 * e1
  // a = f3 f3 i1 + f2 f2 i2
  const k1 = i2 * f2, k2 = i1 * f3
  // a = f3 k2 + f2 k1
  const a = k1 * f2 + k2 * f3
  // b = -2 d1 d2 e1 f1 i1 + 2 d2 d2 e2 f1 i1 + 2 d1 d2 e1 f1 i2 + 2 d1 d1 e2 f1 i2
  // /2/f1, b = 2 f1 (-d1 d2 e1 i1 + d2 d2 e2 i1 + d1 d2 e1 i2 + d1 d1 e2 i2)
  // b = 2 f1 ((d2 e2 - d1 e1) d2 i1 + (d2 e1 + d1 e2) d1 i2)
  // b = 2 f1 (f3 d2 i1 + f2 d1 i2)
  // b = 2 f1 (d2 k2 + d1 k1)
  // c = d2 d2 f1 f1 i1 + d1 d1 f1 f1 i2 + -e1 e1 i1 i2

  // (bb - 4ac)/4/i1/i2/e1/e1 = -d1 d1 d1 d1 f1 f1 + -2 d1 d1 d2 d2 f1 f1 + -d2 d2 d2 d2 f1 f1 + a
  // (bb - 4ac)/4/i1/i2/e1/e1 = -(d1 d1 + d2 d2)^2 f1 f1 + a = a - f1 f1
  const t = a - f1 * f1
  // bb - 4ac = 4e1 e1 i1 i2 t
  if (lessThan(t, 0)) {
    return []
  }
  // u = -b/2/a = -2 f1 (d2 k2 + d1 k1)/2/a
  // u = -f1 (k1 d1 + k2 d2)/a
  // x = u + cx = cx - f1 (k1 d1 + k2 d2)/a
  const i = cx - f1 * (k1 * d1 + k2 * d2) / a
  // F2 replace u, /f1*a: v = f1 (-e2 (k1 d1 + k2 d2) + a) / e1 / a
  // replace a: v = f1 (-e2 k1 d1 - e2 k2 d2 + f3 k2 + f2 k1) / e1 / a
  // replace f2, replace f3, /e1: f1 (d2 k1 + -d1 k2) / a
  // y = v + cy = cy + f1(k1 d2 - k2 d1)/a
  const j = cy + f1 * (k1 * d2 - k2 * d1) / a
  if (isZero(t)) {
    return [
      {
        x: i,
        y: j,
      }
    ]
  }
  const n = Math.sqrt(t)
  // sqrt(bb - 4ac)/2/a = sqrt(4e1 e1 i1 i2 t)/2/a = 2 e1 rx ry n/2/a = e1 rx ry n/a
  const r = rx * ry * n / a
  const p = e1 * r
  // F2 replace u: v = (e2(x - cx) + f1)/e1
  // replace x with i + p: v = (e2(cx - f1 (k1 d1 + k2 d2) / a + e1 rx ry n/a - cx) + f1)/e1
  // *a e1: v = (-d1 e2 f1 k1 + -d2 e2 f1 k2 + e1 e2 n rx ry + a f1)/e1/a
  // replace a: v = (-d1 e2 f1 k1 + -d2 e2 f1 k2 + f1 f2 k1 + f1 f3 k2 + e1 e2 n rx ry)/e1/a
  // replace f2, replace f3, /e1: v = (d2 f1 k1 + -d1 f1 k2 + e2 n rx ry)/a
  // v = (f1(d2 k1 + -d1 k2) + e2 n rx ry)/a
  // y = v + cy = cy + (f1(d2 k1 + -d1 k2) + e2 n rx ry)/a
  // y = cy + f1(d2 k1 + -d1 k2)/a + e2 n rx ry/a
  // y = j + e2 r
  const q = e2 * r
  return [
    {
      x: i + p,
      y: j + q,
    },
    {
      x: i - p,
      y: j - q,
    },
  ]
}

export function getLineSegmentEllipseIntersectionPoints(start: Position, end: Position, ellipse: Ellipse) {
  return getLineEllipseIntersectionPoints(start, end, ellipse).filter((p) => pointIsOnLineSegment(p, start, end))
}

export function getLineSegmentEllipseArcIntersectionPoints(start: Position, end: Position, ellipseArc: EllipseArc) {
  return getLineSegmentEllipseIntersectionPoints(start, end, ellipseArc).filter((p) => pointIsOnEllipseArc(p, ellipseArc))
}

export function getCircleEllipseIntersectionPoints({ x: x1, y: y1, r: r1 }: Circle, { rx, ry, cx, cy, angle }: Ellipse) {
  if (isSameNumber(rx, ry)) {
    return getTwoCircleIntersectionPoints({ x: x1, y: y1, r: r1 }, { x: cx, y: cy, r: rx })
  }
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  // (d2(x - cx) + d1(y - cy))^2/rx/rx + (-d1(x - cx) + d2(y - cy))^2/ry/ry = 1
  const i1 = 1 / rx / rx, i2 = 1 / ry / ry
  // let u = x - cx, v = y - cy
  // (d2 u + d1 v)^2 i1 + (-d1 u + d2 v)^2 i2 - 1 = 0
  // group v: (d1 d1 i1 + d2 d2 i2) v v + (2 d1 d2 i1 u + -2 d1 d2 i2 u) v + d2 d2 i1 u u + d1 d1 i2 u u + -1 = 0
  const g1 = d1 * d1 * i1 + d2 * d2 * i2, g2 = (2 * d1 * d2 * i1 - 2 * d1 * d2 * i2) / g1
  const g3 = (d2 * d2 * i1 + d1 * d1 * i2) / g1, g4 = -1 / g1
  // F1: v v + g2 u v + g3 u u + g4 = 0

  const m = r1 ** 2
  // (x - x1)^2 + (y - y1)^2 = m
  // (u + cx - x1)^2 + (v + cy - y1)^2 - m = 0
  const e1 = cx - x1
  const e2 = cy - y1
  // (u + e1)^2 + (v + e2)^2 - m = 0
  // group v: v v + 2 e2 v + e1 e1 + e2 e2 + 2 e1 u + -m + u u = 0
  const g5 = e1 * e1 + e2 * e2 - m
  // v v + 2 e2 v + g5 + 2 e1 u + u u = 0

  // -F1, group v: (2 e2 + -g2 u) v + -g4 + g5 + 2 e1 u + u u + -g3 u u = 0
  // let w = 2 e2 + -g2 u
  const h1 = 1 - g3, h2 = -g4 + g5
  // w v + h2 + 2 e1 u + h1 u u = 0
  // v = -(h2 + 2 e1 u + h1 u u) / w

  // F1 replace v, *w w, replace w, group u: (g2 g2 h1 + g2 g2 g3 + h1 h1) u u u u + (-2 e2 g2 h1 + 2 e1 g2 g2 + -4 e2 g2 g3 + 4 e1 h1) u u u + (-4 e1 e2 g2 + 4 e2 e2 g3 + 4 e1 e1 + g2 g2 g4 + 2 h1 h2 + g2 g2 h2) u u + (4 e1 h2 + -4 e2 g2 g4 + -2 e2 g2 h2) u + h2 h2 + 4 e2 e2 g4 = 0
  const a = g2 * g2 * h1 + g2 * g2 * g3 + h1 * h1
  const b = -2 * e2 * g2 * h1 + 2 * e1 * g2 * g2 + -4 * e2 * g2 * g3 + 4 * e1 * h1
  const c = -4 * e1 * e2 * g2 + 4 * e2 * e2 * g3 + 4 * e1 * e1 + g2 * g2 * g4 + 2 * h1 * h2 + g2 * g2 * h2
  const d = 4 * e1 * h2 + -4 * e2 * g2 * g4 + -2 * e2 * g2 * h2
  const e = h2 * h2 + 4 * e2 * e2 * g4

  const us = calculateEquation4(a, b, c, d, e)
  return us.map(u => {
    const v = -(h2 + 2 * e1 * u + h1 * u * u) / (2 * e2 - g2 * u)
    return {
      x: u + cx,
      y: v + cy,
    }
  })
}

export function getArcEllipseIntersectionPoints(arc: Arc, ellipse: Ellipse) {
  return getCircleEllipseIntersectionPoints(arc, ellipse).filter((p) => pointIsOnArc(p, arc))
}

export function getArcEllipseArcIntersectionPoints(arc: Arc, ellipseArc: EllipseArc) {
  return getArcEllipseIntersectionPoints(arc, ellipseArc).filter((p) => pointIsOnEllipseArc(p, ellipseArc))
}

export function getTwoEllipseIntersectionPoints({ rx: rx1, ry: ry1, cx: cx1, cy: cy1, angle: angle1 }: Ellipse, { rx: rx2, ry: ry2, cx: cx2, cy: cy2, angle: angle2 }: Ellipse) {
  if (isSameNumber(rx1, ry1)) {
    return getCircleEllipseIntersectionPoints({ x: cx1, y: cy1, r: rx1 }, { rx: rx2, ry: ry2, cx: cx2, cy: cy2, angle: angle2 })
  }
  if (isSameNumber(rx2, ry2)) {
    return getCircleEllipseIntersectionPoints({ x: cx2, y: cy2, r: rx2 }, { rx: rx1, ry: ry1, cx: cx1, cy: cy1, angle: angle1 })
  }
  const radian1 = angleToRadian(angle1), radian2 = angleToRadian(angle2)
  const a1 = Math.sin(radian1), a2 = Math.cos(radian1)
  const c1 = Math.sin(radian2), c2 = Math.cos(radian2)
  // (a2(x - cx1) + a1(y - cy1))^2/rx1/rx1 + (-a1(x - cx1) + a2(y - cy1))^2/ry1/ry1 = 1
  const b1 = 1 / rx1 / rx1, b2 = 1 / ry1 / ry1
  // let u = x - cx1, v = y - cy1
  // (a2 u + a1 v)^2 b1 + (-a1 u + a2 v)^2 b2 - 1 = 0
  // group v: (a1 a1 b1 + a2 a2 b2) v v + (2 a1 a2 b1 u + -2 a1 a2 b2 u) v + a2 a2 b1 u u + a1 a1 b2 u u + -1 = 0
  const b3 = a1 * a1 * b1 + a2 * a2 * b2, b4 = 2 * a1 * a2 * b1 / b3, b5 = 2 * a1 * a2 * b2 / b3, b6 = (a2 * a2 * b1 + a1 * a1 * b2) / b3, b7 = -1 / b3
  // F1: v v + (b4 u + -b5 u) v + b6 u u + b7 = 0

  // (c2(x - cx2) + c1(y - cy2))^2/rx2/rx2 + (-c1(x - cx2) + c2(y - ry2))^2/ry2/ry2 = 1
  const d1 = 1 / rx2 / rx2, d2 = 1 / ry2 / ry2
  // (c2(u + cx1 - cx2) + c1(v + cy1 - cy2))^2 d1 + (-c1(u + cx1 - cx2) + c2(v + cy1 - cy2))^2 d2 - 1 = 0
  const e1 = cx1 - cx2, e2 = cy1 - cy2
  // (c2(u + e1) + c1(v + e2))^2 d1 + (-c1(u + e1) + c2(v + e2))^2 d2 - 1 = 0
  // group v: (c1 c1 d1 + c2 c2 d2) v v + (2 c1 c2 d1 e1 + -2 c1 c2 d2 e1 + 2 c1 c1 d1 e2 + 2 c2 c2 d2 e2 + 2 c1 c2 d1 u + -2 c1 c2 d2 u) v + c2 c2 d1 e1 e1 + c1 c1 d2 e1 e1 + 2 c1 c2 d1 e1 e2 + -2 c1 c2 d2 e1 e2 + c1 c1 d1 e2 e2 + c2 c2 d2 e2 e2 + 2 c2 c2 d1 e1 u + 2 c1 c1 d2 e1 u + 2 c1 c2 d1 e2 u + -2 c1 c2 d2 e2 u + c2 c2 d1 u u + c1 c1 d2 u u + -1 = 0
  const c3 = c1 * c1 * d1 + c2 * c2 * d2, c4 = (2 * c1 * c2 * d1 * e1 - 2 * c1 * c2 * d2 * e1 + 2 * c1 * c1 * d1 * e2 + 2 * c2 * c2 * d2 * e2) / c3
  const c5 = (2 * c1 * c2 * d1 - 2 * c1 * c2 * d2) / c3, c6 = (c2 * c2 * d1 * e1 * e1 + c1 * c1 * d2 * e1 * e1 + 2 * c1 * c2 * d1 * e1 * e2 + -2 * c1 * c2 * d2 * e1 * e2 + c1 * c1 * d1 * e2 * e2 + c2 * c2 * d2 * e2 * e2 - 1) / c3
  const c7 = (2 * c2 * c2 * d1 * e1 + 2 * c1 * c1 * d2 * e1 + 2 * c1 * c2 * d1 * e2 - 2 * c1 * c2 * d2 * e2) / c3, c8 = (c2 * c2 * d1 + c1 * c1 * d2) / c3
  // v v + (c4 + c5 u) v + c6 + c7 u + c8 u u = 0

  // -F1, group v: (c5 u + b5 u + c4 + -b4 u) v + c7 u + -b6 u u + c8 u u + -b7 + c6 = 0
  const d3 = b5 + -b4 + c5, d4 = c8 - b6, d5 = -b7 + c6
  // (d3 u + c4) v + c7 u + d4 u u + d5 = 0
  // let w = d3 u + c4
  // v = -(c7 u + d4 u u + d5)/w
  // F1 replace v, *w w, replace w, group u: (b6 d3 d3 + b5 d3 d4 + d4 d4 + -b4 d3 d4) u u u u + (2 b6 c4 d3 + -b4 c7 d3 + 2 c7 d4 + b5 c7 d3 + -b4 c4 d4 + b5 c4 d4) u u u + (b6 c4 c4 + -b4 c4 c7 + b5 c4 c7 + b7 d3 d3 + c7 c7 + b5 d3 d5 + 2 d4 d5 + -b4 d3 d5) u u + (2 b7 c4 d3 + 2 c7 d5 + -b4 c4 d5 + b5 c4 d5) u + b7 c4 c4 + d5 d5 = 0
  const a = b6 * d3 * d3 + b5 * d3 * d4 + d4 * d4 + -b4 * d3 * d4
  const b = 2 * b6 * c4 * d3 + -b4 * c7 * d3 + 2 * c7 * d4 + b5 * c7 * d3 + -b4 * c4 * d4 + b5 * c4 * d4
  const c = b6 * c4 * c4 + -b4 * c4 * c7 + b5 * c4 * c7 + b7 * d3 * d3 + c7 * c7 + b5 * d3 * d5 + 2 * d4 * d5 + -b4 * d3 * d5
  const d = 2 * b7 * c4 * d3 + 2 * c7 * d5 + -b4 * c4 * d5 + b5 * c4 * d5
  const e = b7 * c4 * c4 + d5 * d5

  const us = calculateEquation4(a, b, c, d, e)
  return us.map(u => {
    const v = -(c7 * u + d4 * u * u + d5) / (d3 * u + c4)
    return {
      x: u + cx1,
      y: v + cy1,
    }
  })
}

export function getEllipseArcEllipseIntersectionPoints(ellipseArc: EllipseArc, ellipse: Ellipse) {
  return getTwoEllipseIntersectionPoints(ellipseArc, ellipse).filter((p) => pointIsOnEllipseArc(p, ellipseArc))
}

export function getTwoEllipseArcIntersectionPoints(ellipseArc1: EllipseArc, ellipseArc2: EllipseArc) {
  return getEllipseArcEllipseIntersectionPoints(ellipseArc1, ellipseArc2).filter((p) => pointIsOnEllipseArc(p, ellipseArc2))
}

export function getLineQuadraticCurveIntersectionPoints(
  { x: x1, y: y1 }: Position,
  { x: x2, y: y2 }: Position,
  { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve,
  extend = false,
) {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 t t + 2 c1 t + a1
  // y = c4 t t + 2 c3 t + b1

  // (x - x1) / (x2 - x1) = (y - y1) / (y2 - y1)
  const e1 = x2 - x1, e2 = y2 - y1
  // (x - x1) e2 - (y - y1) e1 = 0
  // replace x, y, group t: (-c4 e1 + c2 e2) t t + (-2 c3 e1 + 2 c1 e2) t + -b1 e1 + a1 e2 + -e2 x1 + e1 y1
  let ts = calculateEquation2(-1 * c4 * e1 + c2 * e2, -2 * c3 * e1 + 2 * c1 * e2, -b1 * e1 + a1 * e2 + -e2 * x1 + e1 * y1)
  if (!extend) {
    ts = ts.filter(t => isValidPercent(t))
  }
  return ts.map(t => ({
    x: c2 * t * t + 2 * c1 * t + a1,
    y: c4 * t * t + 2 * c3 * t + b1,
  }))
}

export function getLineSegmentQuadraticCurveIntersectionPoints(start: Position, end: Position, curve: QuadraticCurve) {
  return getLineQuadraticCurveIntersectionPoints(start, end, curve).filter((p) => pointIsOnLineSegment(p, start, end))
}

export function getCircleQuadraticCurveIntersectionPoints(
  { x: x1, y: y1, r: r1 }: Circle,
  { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve,
  extend = false,
) {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 t t + 2 c1 t + a1
  // y = c4 t t + 2 c3 t + b1

  // (x - x1)^2 + (y - y1)^2 = r1^2
  // replace x, y, group t: (c2 c2 + c4 c4) t t t t + 4(c1 c2 + c3 c4) t t t + 2(2 c1 c1 + a1 c2 + 2 c3 c3 + b1 c4 + -c2 x1 + -c4 y1) t t + 4(a1 c1 + b1 c3 + -c1 x1 + -c3 y1) t + a1 a1 + b1 b1 + -r1 r1 + -2 a1 x1 + x1 x1 + -2 b1 y1 + y1 y1
  let ts = calculateEquation4(
    c2 * c2 + c4 * c4,
    4 * (c1 * c2 + c3 * c4),
    2 * (2 * c1 * c1 + a1 * c2 + 2 * c3 * c3 + b1 * c4 - c2 * x1 - c4 * y1),
    4 * (a1 * c1 + b1 * c3 + -1 * c1 * x1 + -1 * c3 * y1),
    a1 * a1 + b1 * b1 + -r1 * r1 + -2 * a1 * x1 + x1 * x1 + -2 * b1 * y1 + y1 * y1,
  )
  if (!extend) {
    ts = ts.filter(t => isValidPercent(t))
  }
  return ts.map(t => ({
    x: c2 * t * t + 2 * c1 * t + a1,
    y: c4 * t * t + 2 * c3 * t + b1,
  }))
}

export function getArcQuadraticCurveIntersectionPoints(arc: Arc, curve: QuadraticCurve) {
  return getCircleQuadraticCurveIntersectionPoints(arc, curve).filter((p) => pointIsOnArc(p, arc))
}

export function getEllipseQuadraticCurveIntersectionPoints(
  { rx: rx1, ry: ry1, cx: cx1, cy: cy1, angle: angle1 }: Ellipse,
  { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve,
  extend = false,
) {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 t t + 2 c1 t + a1
  // y = c4 t t + 2 c3 t + b1

  const radian1 = angleToRadian(angle1)
  const d1 = Math.sin(radian1), d2 = Math.cos(radian1), d3 = 1 / rx1 / rx1, d4 = 1 / ry1 / ry1
  // (d2(x - cx1) + d1(y - cy1))^2 d3 + (-d1(x - cx1) + d2(y - cy1))^2 d4 = 1
  const d5 = a1 - cx1, d6 = b1 - cy1
  // (d2(x + d5 - a1) + d1(y + d6 - b1))^2 d3 + (-d1(x + d5 - a1) + d2(y + d6 - b1))^2 d4 - 1 = 0
  // replace x, y, group t: (c4 c4 d1 d1 d3 + 2 c2 c4 d1 d2 d3 + c2 c2 d2 d2 d3 + c2 c2 d1 d1 d4 + -2 c2 c4 d1 d2 d4 + c4 c4 d2 d2 d4) t t t t + (4 c3 c4 d1 d1 d3 + 4 c2 c3 d1 d2 d3 + 4 c1 c4 d1 d2 d3 + 4 c1 c2 d2 d2 d3 + 4 c1 c2 d1 d1 d4 + -4 c2 c3 d1 d2 d4 + -4 c1 c4 d1 d2 d4 + 4 c3 c4 d2 d2 d4) t t t + (4 c3 c3 d1 d1 d3 + 8 c1 c3 d1 d2 d3 + 4 c1 c1 d2 d2 d3 + 4 c1 c1 d1 d1 d4 + -8 c1 c3 d1 d2 d4 + 4 c3 c3 d2 d2 d4 + 2 c4 d1 d2 d3 d5 + 2 c2 d2 d2 d3 d5 + 2 c2 d1 d1 d4 d5 + -2 c4 d1 d2 d4 d5 + 2 c4 d1 d1 d3 d6 + 2 c2 d1 d2 d3 d6 + -2 c2 d1 d2 d4 d6 + 2 c4 d2 d2 d4 d6) t t + (4 c3 d1 d2 d3 d5 + 4 c1 d2 d2 d3 d5 + 4 c1 d1 d1 d4 d5 + -4 c3 d1 d2 d4 d5 + 4 c3 d1 d1 d3 d6 + 4 c1 d1 d2 d3 d6 + -4 c1 d1 d2 d4 d6 + 4 c3 d2 d2 d4 d6) t + d2 d2 d3 d5 d5 + d1 d1 d4 d5 d5 + 2 d1 d2 d3 d5 d6 + -2 d1 d2 d4 d5 d6 + d1 d1 d3 d6 d6 + d2 d2 d4 d6 d6 + -1
  const d7 = c3 * d1 + c1 * d2, d8 = c1 * d1 - c3 * d2
  const e1 = c4 * d1 + c2 * d2, e2 = c2 * d1 - c4 * d2, e3 = d1 * d4 * d5 - d2 * d4 * d6, e4 = d2 * d3 * d5 + d1 * d3 * d6
  let ts = calculateEquation4(
    e1 ** 2 * d3 + e2 ** 2 * d4,
    4 * (d7 * e1 * d3 + d8 * e2 * d4),
    2 * (2 * d7 ** 2 * d3 + 2 * d8 ** 2 * d4 + e1 * e4 + e2 * e3),
    4 * (d7 * e4 + d8 * e3),
    (d2 * d5 + d1 * d6) ** 2 * d3 + (d1 * d5 + - d2 * d6) ** 2 * d4 + -1
  )
  if (!extend) {
    ts = ts.filter(t => isValidPercent(t))
  }
  return ts.map(t => ({
    x: c2 * t * t + 2 * c1 * t + a1,
    y: c4 * t * t + 2 * c3 * t + b1,
  }))
}

export function getEllipseArcQuadraticCurveIntersectionPoints(ellipseArc: EllipseArc, curve: QuadraticCurve) {
  return getEllipseQuadraticCurveIntersectionPoints(ellipseArc, curve).filter((p) => pointIsOnEllipseArc(p, ellipseArc))
}

export function getTwoQuadraticCurveIntersectionPoints(
  curve1: QuadraticCurve,
  { from: { x: a4, y: b4 }, cp: { x: a5, y: b5 }, to: { x: a6, y: b6 } }: QuadraticCurve,
  extend = false,
) {
  const { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } } = curve1
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 u u + 2 c1 u + a1
  // y = c4 u u + 2 c3 u + b1

  const d1 = a5 - a4, d2 = a6 - a5 - d1, d3 = b5 - b4, d4 = b6 - b5 - d3
  // x = d2 v v + 2 d1 v + a4
  // y = d4 v v + 2 d3 v + b4

  // c2 u u + 2 c1 u + a1 - d2 v v - 2 d1 v - a4 = 0
  // c4 u u + 2 c3 u + b1 - d4 v v - 2 d3 v - b4 = 0

  // u u + 2 c1/c2 u + (a1 - a4)/c2 - d2/c2 v v - 2 d1/c2 v = 0
  // u u + 2 c3/c4 u + (b1 - b4)/c4 - d4/c4 v v - 2 d3/c4 v = 0
  const e1 = (a1 - a4) / c2, e2 = (b1 - b4) / c4, e3 = 2 * c1 / c2, e4 = 2 * c3 / c4
  const e5 = d2 / c2, e6 = d4 / c4, e7 = 2 * d1 / c2, e8 = 2 * d3 / c4
  // F1: u u + e3 u + e1 - e5 v v - e7 v = 0
  // u u + e4 u + e2 - e6 v v - e8 v = 0
  // -F1, group u, v: (-e3 + e4) u + (-e6 + e5) v v + (e7 + -e8) v + -e1 + e2 = 0
  const f1 = -e3 + e4, f2 = (-e6 + e5) / f1, f3 = (e7 + -e8) / f1, f4 = (-e1 + e2) / f1
  // u = -(f2 v v + f3 v + f4)
  // F1 replace u, group v: f2 f2 v v v v + 2 f2 f3 v v v + (-e3 f2 + f3 f3 + 2 f2 f4 + -e5) v v + (-e3 f3 + 2 f3 f4 + -e7) v + e1 + -e3 f4 + f4 f4
  let vs = calculateEquation4(
    f2 * f2,
    2 * f2 * f3,
    -e3 * f2 + f3 * f3 + 2 * f2 * f4 + -e5,
    -e3 * f3 + 2 * f3 * f4 + -e7,
    e1 + -e3 * f4 + f4 * f4
  )
  if (!extend) {
    vs = vs.filter(v => isValidPercent(v))
  }
  let result = vs.map(v => ({
    x: d2 * v * v + 2 * d1 * v + a4,
    y: d4 * v * v + 2 * d3 * v + b4,
  }))
  if (!extend) {
    result = result.filter(p => isValidPercent(getQuadraticCurvePercentAtPoint(curve1, p)))
  }
  return result
}

export function getLineBezierCurveIntersectionPoints(
  { x: x1, y: y1 }: Position,
  { x: x2, y: y2 }: Position,
  { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve,
  extend = false,
) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const d1 = -b1 + 3 * b2 + -3 * b3 + b4, d2 = 3 * (b1 - 2 * b2 + b3), d3 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = d1 t t t + d2 t t + d3 t + b1

  // (x - x1) / (x2 - x1) = (y - y1) / (y2 - y1)
  const e1 = x2 - x1, e2 = y2 - y1
  // (x - x1) e2 - (y - y1) e1 = 0
  // replace x, y, group t: (-d1 e1 + c1 e2) t t t + (-d2 e1 + c2 e2) t t + (-d3 e1 + c3 e2) t + -b1 e1 + a1 e2 + -e2 x1 + e1 y1
  let ts = calculateEquation3(-d1 * e1 + c1 * e2, -d2 * e1 + c2 * e2, -d3 * e1 + c3 * e2, -b1 * e1 + a1 * e2 + -e2 * x1 + e1 * y1)
  if (!extend) {
    ts = ts.filter(t => isValidPercent(t))
  }
  return ts.map(t => ({
    x: c1 * t * t * t + c2 * t * t + c3 * t + a1,
    y: d1 * t * t * t + d2 * t * t + d3 * t + b1,
  }))
}

export function getLineSegmentBezierCurveIntersectionPoints(start: Position, end: Position, curve: BezierCurve) {
  return getLineBezierCurveIntersectionPoints(start, end, curve).filter((p) => pointIsOnLineSegment(p, start, end))
}

export function getCircleBezierCurveIntersectionPoints(
  { x: x1, y: y1, r: r1 }: Circle,
  { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve,
  delta?: number,
  extend = false,
) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const d1 = -b1 + 3 * b2 + -3 * b3 + b4, d2 = 3 * (b1 - 2 * b2 + b3), d3 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = d1 t t t + d2 t t + d3 t + b1

  // (x - x1)^2 + (y - y1)^2 = r1^2
  const e1 = a1 - x1, e2 = b1 - y1, e3 = r1 ** 2
  // (c1 t t t + c2 t t + c3 t + e1)^2 + (d1 t t t + d2 t t + d3 t + e2)^2 - e3 = 0
  // group t: (c1 c1 + d1 d1) t t t t t t + (2 c1 c2 + 2 d1 d2) t t t t t + (c2 c2 + 2 c1 c3 + d2 d2 + 2 d1 d3) t t t t + (2 c2 c3 + 2 c1 e1 + 2 d2 d3 + 2 d1 e2) t t t + (c3 c3 + 2 c2 e1 + d3 d3 + 2 d2 e2) t t + (2 c3 e1 + 2 d3 e2) t + e1 e1 + e2 e2 + -e3
  const e4 = c1 * c1 + d1 * d1, e5 = c1 * c2 + d1 * d2, e6 = c2 * c2 + 2 * c1 * c3 + d2 * d2 + 2 * d1 * d3
  const e7 = c2 * c3 + c1 * e1 + d2 * d3 + d1 * e2, e8 = c3 * c3 + 2 * c2 * e1 + d3 * d3 + 2 * d2 * e2, e9 = 2 * (c3 * e1 + d3 * e2)
  let ts = calculateEquation5([e4, 2 * e5, e6, 2 * e7, e8, e9, e1 * e1 + e2 * e2 - e3], 0.5, delta)
  if (!extend) {
    ts = ts.filter(t => isValidPercent(t))
  }
  return ts.map(t => ({
    x: c1 * t * t * t + c2 * t * t + c3 * t + a1,
    y: d1 * t * t * t + d2 * t * t + d3 * t + b1,
  }))
}

export function getArcBezierCurveIntersectionPoints(arc: Arc, curve: BezierCurve) {
  return getCircleBezierCurveIntersectionPoints(arc, curve).filter((p) => pointIsOnArc(p, arc))
}

export function getEllipseBezierCurveIntersectionPoints(
  { rx: rx1, ry: ry1, cx: cx1, cy: cy1, angle: angle1 }: Ellipse,
  { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve,
  delta?: number,
  extend = false,
) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = c4 t t t + c5 t t + c6 t + b1

  const radian1 = angleToRadian(angle1)
  const d1 = Math.sin(radian1), d2 = Math.cos(radian1), d3 = 1 / rx1 / rx1, d4 = 1 / ry1 / ry1
  // (d2(x - cx1) + d1(y - cy1))^2 d3 + (-d1(x - cx1) + d2(y - cy1))^2 d4 = 1
  const d5 = a1 - cx1, d6 = b1 - cy1
  // (d2(c1 t t t + c2 t t + c3 t + d5) + d1(c4 t t t + c5 t t + c6 t + d6))^2 d3 + (-d1(c1 t t t + c2 t t + c3 t + d5) + d2(c4 t t t + c5 t t + c6 t + d6))^2 d4 - 1 = 0
  // group t:(c4 c4 d1 d1 d3 + c1 c1 d2 d2 d3 + c4 c4 d2 d2 d4 + -2 c1 c4 d1 d2 d4 + 2 c1 c4 d1 d2 d3 + c1 c1 d1 d1 d4) t t t t t t + (2 c4 c5 d1 d1 d3 + 2 c1 c2 d2 d2 d3 + 2 c2 c4 d1 d2 d3 + 2 c1 c2 d1 d1 d4 + -2 c2 c4 d1 d2 d4 + 2 c4 c5 d2 d2 d4 + -2 c1 c5 d1 d2 d4 + 2 c1 c5 d1 d2 d3) t t t t t + (c5 c5 d1 d1 d3 + 2 c4 c6 d1 d1 d3 + c2 c2 d2 d2 d3 + 2 c1 c3 d2 d2 d3 + 2 c3 c4 d1 d2 d3 + 2 c2 c5 d1 d2 d3 + 2 c1 c6 d1 d2 d3 + c2 c2 d1 d1 d4 + 2 c1 c3 d1 d1 d4 + -2 c3 c4 d1 d2 d4 + -2 c2 c5 d1 d2 d4 + -2 c1 c6 d1 d2 d4 + c5 c5 d2 d2 d4 + 2 c4 c6 d2 d2 d4) t t t t + (2 c5 c6 d1 d1 d3 + 2 c2 c3 d2 d2 d3 + 2 c3 c5 d1 d2 d3 + 2 c2 c6 d1 d2 d3 + 2 c2 c3 d1 d1 d4 + -2 c3 c5 d1 d2 d4 + -2 c2 c6 d1 d2 d4 + 2 c5 c6 d2 d2 d4 + 2 c1 d1 d1 d4 d5 + 2 c1 d2 d2 d3 d5 + 2 c4 d1 d2 d3 d5 + -2 c4 d1 d2 d4 d5 + 2 c4 d1 d1 d3 d6 + 2 c1 d1 d2 d3 d6 + -2 c1 d1 d2 d4 d6 + 2 c4 d2 d2 d4 d6) t t t + (c6 c6 d1 d1 d3 + c3 c3 d2 d2 d3 + 2 c3 c6 d1 d2 d3 + c3 c3 d1 d1 d4 + -2 c3 c6 d1 d2 d4 + c6 c6 d2 d2 d4 + 2 c2 d1 d1 d4 d5 + -2 c5 d1 d2 d4 d5 + 2 c5 d1 d2 d3 d5 + 2 c2 d2 d2 d3 d5 + 2 c5 d1 d1 d3 d6 + 2 c2 d1 d2 d3 d6 + -2 c2 d1 d2 d4 d6 + 2 c5 d2 d2 d4 d6) t t + (2 c3 d1 d1 d4 d5 + 2 c6 d1 d2 d3 d5 + 2 c3 d2 d2 d3 d5 + -2 c6 d1 d2 d4 d5 + 2 c6 d1 d1 d3 d6 + 2 c3 d1 d2 d3 d6 + -2 c3 d1 d2 d4 d6 + 2 c6 d2 d2 d4 d6) t + d1 d1 d4 d5 d5 + d2 d2 d3 d5 d5 + 2 d1 d2 d3 d5 d6 + -2 d1 d2 d4 d5 d6 + d1 d1 d3 d6 d6 + d2 d2 d4 d6 d6 + -1
  const f1 = c4 * d1 + c1 * d2, f2 = c1 * d1 - c4 * d2, f3 = d1 * d5 - d2 * d6, f4 = d2 * d5 + d1 * d6
  const f5 = c6 * d1 + c3 * d2, f6 = c3 * d1 - c6 * d2, f7 = c5 * d1 + c2 * d2, f8 = c2 * d1 - c5 * d2
  const g1 = f7 * d3, g2 = f8 * d4, g3 = f6 * d4, g4 = f5 * d3, g5 = f4 * d3, g6 = f3 * d4
  let ts = calculateEquation5(
    [
      f1 ** 2 * d3 + f2 ** 2 * d4,
      2 * (g1 * f1 + f2 * g2),
      f7 * g1 + f8 * g2 + 2 * (g4 * f1 + g3 * f2),
      2 * (f5 * g1 + f6 * g2 + f1 * g5 + f2 * g6),
      f5 * g4 + f6 * g3 + 2 * ((g1 * d2 + g2 * d1) * d5 + (g1 * d1 - g2 * d2) * d6),
      2 * ((g4 * d2 + g3 * d1) * d5 + (g4 * d1 - g3 * d2) * d6),
      f3 * g6 + f4 * g5 - 1,
    ], 0.5, delta,
  )
  if (!extend) {
    ts = ts.filter(t => isValidPercent(t))
  }
  return ts.map(t => ({
    x: c1 * t * t * t + c2 * t * t + c3 * t + a1,
    y: c4 * t * t * t + c5 * t * t + c6 * t + b1,
  }))
}

export function getEllipseArcBezierCurveIntersectionPoints(ellipseArc: EllipseArc, curve: BezierCurve) {
  return getEllipseBezierCurveIntersectionPoints(ellipseArc, curve).filter((p) => pointIsOnEllipseArc(p, ellipseArc))
}

export function getQuadraticCurveBezierCurveIntersectionPoints(
  curve1: QuadraticCurve,
  { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve,
  delta?: number,
  extend = false,
) {
  const { from: { x: a5, y: b5 }, cp: { x: a6, y: b6 }, to: { x: a7, y: b7 } } = curve1
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = c4 t t t + c5 t t + c6 t + b1

  const d1 = a6 - a5, d2 = a7 - a6 - d1, d3 = b6 - b5, d4 = b7 - b6 - d3
  // x = d2 u u + 2 d1 u + a5
  // y = d4 u u + 2 d3 u + b5

  // d2 u u + 2 d1 u + a5 - (c1 t t t + c2 t t + c3 t + a1) = 0
  // d4 u u + 2 d3 u + b5 - (c4 t t t + c5 t t + c6 t + b1) = 0

  // u u + 2 d1/d2 u + a5/d2 - c1/d2 t t t - c2/d2 t t - c3/d2 t - a1/d2 = 0
  // u u + 2 d3/d4 u + b5/d4 - c4/d4 t t t - c5/d4 t t - c6/d4 t - b1/d4 = 0
  const e1 = 2 * d1 / d2, e2 = 2 * d3 / d4, e3 = c1 / d2, e4 = c4 / d4, e5 = c2 / d2, e6 = c5 / d4, e7 = c3 / d2, e8 = c6 / d4
  const f1 = a5 / d2 - a1 / d2, f2 = b5 / d4 - b1 / d4
  // F1: u u + e1 u + f1 - e3 t t t - e5 t t - e7 t = 0
  // u u + e2 u + f2 - e4 t t t - e6 t t - e8 t = 0
  // -F1: (e2 - e1)u  + (e3 - e4) t t t + (e5 - e6) t t + (e7 - e8) t + (f2 - f1) = 0
  const f3 = e2 - e1, f4 = e3 - e4, f5 = e5 - e6, f6 = e7 - e8, f7 = f2 - f1
  // f3 u  + f4 t t t + f5 t t + f6 t + f7 = 0
  // u = -(f4 t t t + f5 t t + f6 t + f7)/f3
  // F1 replace u, group t: f4 f4 t t t t t t + 2 f4 f5 t t t t t + (f5 f5 + 2 f4 f6) t t t t + (-e3 f3 f3 + -e1 f3 f4 + 2 f5 f6 + 2 f4 f7) t t t + (-e5 f3 f3 + -e1 f3 f5 + f6 f6 + 2 f5 f7) t t + (-e7 f3 f3 + -e1 f3 f6 + 2 f6 f7) t + f1 f3 f3 + -e1 f3 f7 + f7 f7
  let ts = calculateEquation5(
    [
      f4 * f4,
      2 * f4 * f5,
      f5 * f5 + 2 * f4 * f6,
      -e3 * f3 * f3 + -e1 * f3 * f4 + 2 * f5 * f6 + 2 * f4 * f7,
      -e5 * f3 * f3 + -e1 * f3 * f5 + f6 * f6 + 2 * f5 * f7,
      -e7 * f3 * f3 + -e1 * f3 * f6 + 2 * f6 * f7,
      f1 * f3 * f3 + -e1 * f3 * f7 + f7 * f7,
    ], 0.5, delta,
  )
  if (!extend) {
    ts = ts.filter(t => isValidPercent(t))
  }
  let result = ts.map(t => ({
    x: c1 * t * t * t + c2 * t * t + c3 * t + a1,
    y: c4 * t * t * t + c5 * t * t + c6 * t + b1,
  }))
  if (!extend) {
    result = result.filter(p => isValidPercent(getQuadraticCurvePercentAtPoint(curve1, p)))
  }
  return result
}

export function getTwoBezierCurveIntersectionPoints(
  curve1: BezierCurve,
  { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve,
  delta?: number,
  extend = false,
) {
  const { from: { x: a5, y: b5 }, cp1: { x: a6, y: b6 }, cp2: { x: a7, y: b7 }, to: { x: a8, y: b8 } } = curve1
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = c4 t t t + c5 t t + c6 t + b1

  const d1 = -a5 + 3 * a6 + -3 * a7 + a8, d2 = 3 * (a5 - 2 * a6 + a7), d3 = 3 * (a6 - a5)
  const d4 = -b5 + 3 * b6 + -3 * b7 + b8, d5 = 3 * (b5 - 2 * b6 + b7), d6 = 3 * (b6 - b5)
  // x = d1 u u u + d2 u u + d3 u + a5
  // y = d4 u u u + d5 u u + d6 u + b5

  // d1 u u u + d2 u u + d3 u + a5 - (c1 t t t + c2 t t + c3 t + a1) = 0
  // d4 u u u + d5 u u + d6 u + b5 - (c4 t t t + c5 t t + c6 t + b1) = 0

  // u u u + d2/d1 u u + d3/d1 u - c1/d1 t t t - c2/d1 t t - c3/d1 t + (a5/d1 - a1/d1) = 0
  // u u u + d5/d4 u u + d6/d4 u - c4/d4 t t t - c5/d4 t t - c6/d4 t + (b5/d4 - b1/d4) = 0
  const e1 = d2 / d1, e2 = d3 / d1, e3 = c1 / d1, e4 = c2 / d1, e5 = c3 / d1, e6 = a5 / d1 - a1 / d1
  const f1 = d5 / d4, f2 = d6 / d4, f3 = c4 / d4, f4 = c5 / d4, f5 = c6 / d4, f6 = b5 / d4 - b1 / d4
  // F1: u u u + e1 u u + e2 u - e3 t t t - e4 t t - e5 t + e6 = 0
  // u u u + f1 u u + f2 u - f3 t t t - f4 t t - f5 t + f6 = 0
  // -F1: (f1 - e1) u u + (f2 - e2) u + (e3 - f3) t t t + (e4 - f4) t t + (e5 - f5) t + (f6 - e6) = 0
  const g1 = f1 - e1, g2 = (f2 - e2) / g1 / 2, g3 = (e3 - f3) / g1, g4 = (e4 - f4) / g1, g5 = (e5 - f5) / g1, g6 = (f6 - e6) / g1
  // u u + 2 g2 u + g3 t t t + g4 t t + g5 t + g6 = 0
  // u u + 2 g2 u + g2 g2 + g3 t t t + g4 t t + g5 t + g6 - g2 g2 = 0
  // (u + g2)^2 = -g3 t t t - g4 t t - g5 t - g6 + g2 g2
  // let v = u + g2
  const g7 = - g6 + g2 * g2
  // F2: v^2 = -g3 t t t - g4 t t - g5 t + g7
  // F1 replace u: v v v + (e1 + -3 g2) v v + (-2 e1 g2 + 3 g2 g2 + e2) v - e3 t t t + -e4 t t + -e5 t + e1 g2 g2 + -e2 g2 + e6 + -g2 g2 g2 = 0
  const h1 = e1 - 3 * g2, h2 = -2 * e1 * g2 + 3 * g2 * g2 + e2, h3 = e1 * g2 * g2 + -e2 * g2 + e6 + -g2 * g2 * g2
  // v v v + h1 v v + h2 v - e3 t t t + -e4 t t + -e5 t + h3 = 0
  // replace v v: (-g3 t t t + -g4 t t + -g5 t + g7 + h2) v + (-g3 h1 + -e3) t t t + (-g4 h1 + -e4) t t + (-g5 h1 + -e5) t + g7 h1 + h3 = 0
  const h4 = g7 + h2, h5 = -g3 * h1 + -e3, h6 = -g4 * h1 + -e4, h7 = -g5 * h1 + -e5, h8 = g7 * h1 + h3
  // (-g3 t t t + -g4 t t + -g5 t + h4) v + h5 t t t + h6 t t + h7 t + h8 = 0
  // v = -(h5 t t t + h6 t t + h7 t + h8)/(-g3 t t t + -g4 t t + -g5 t + h4)
  // v^2 = (h5 t t t + h6 t t + h7 t + h8)^2/(-g3 t t t + -g4 t t + -g5 t + h4)^2
  // -F2: g3 g3 g3 t t t t t t t t t + 3 g3 g3 g4 t t t t t t t t + (3 g3 g4 g4 + 3 g3 g3 g5) t t t t t t t + (h5 h5 + g4 g4 g4 + 6 g3 g4 g5 + -g3 g3 g7 + -2 g3 g3 h4) t t t t t t + (2 h5 h6 + 3 g4 g4 g5 + 3 g3 g5 g5 + -2 g3 g4 g7 + -4 g3 g4 h4) t t t t t + (h6 h6 + 2 h5 h7 + 3 g4 g5 g5 + -g4 g4 g7 + -2 g3 g5 g7 + -2 g4 g4 h4 + -4 g3 g5 h4) t t t t + (2 h6 h7 + 2 h5 h8 + g5 g5 g5 + -2 g4 g5 g7 + -4 g4 g5 h4 + 2 g3 g7 h4 + g3 h4 h4) t t t + (h7 h7 + 2 h6 h8 + -g5 g5 g7 + -2 g5 g5 h4 + 2 g4 g7 h4 + g4 h4 h4) t t + (2 h7 h8 + 2 g5 g7 h4 + g5 h4 h4) t + h8 h8 + -g7 h4 h4 = 0
  let ts = calculateEquation5(
    [
      g3 * g3 * g3,
      3 * g3 * g3 * g4,
      3 * g3 * g4 * g4 + 3 * g3 * g3 * g5,
      h5 * h5 + g4 * g4 * g4 + 6 * g3 * g4 * g5 + -g3 * g3 * g7 + -2 * g3 * g3 * h4,
      2 * h5 * h6 + 3 * g4 * g4 * g5 + 3 * g3 * g5 * g5 + -2 * g3 * g4 * g7 + -4 * g3 * g4 * h4,
      h6 * h6 + 2 * h5 * h7 + 3 * g4 * g5 * g5 + -g4 * g4 * g7 + -2 * g3 * g5 * g7 + -2 * g4 * g4 * h4 + -4 * g3 * g5 * h4,
      2 * h6 * h7 + 2 * h5 * h8 + g5 * g5 * g5 + -2 * g4 * g5 * g7 + -4 * g4 * g5 * h4 + 2 * g3 * g7 * h4 + g3 * h4 * h4,
      h7 * h7 + 2 * h6 * h8 + -g5 * g5 * g7 + -2 * g5 * g5 * h4 + 2 * g4 * g7 * h4 + g4 * h4 * h4,
      2 * h7 * h8 + 2 * g5 * g7 * h4 + g5 * h4 * h4,
      h8 * h8 + -g7 * h4 * h4,
    ], 0.5, delta,
  )
  if (!extend) {
    ts = ts.filter(t => isValidPercent(t))
  }
  let result = ts.map(t => ({
    x: c1 * t * t * t + c2 * t * t + c3 * t + a1,
    y: c4 * t * t * t + c5 * t * t + c6 * t + b1,
  }))
  if (!extend) {
    result = result.filter(p => isValidPercent(getBezierCurvePercentAtPoint(curve1, p)))
  }
  return result
}
