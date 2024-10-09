import { BezierCurve, QuadraticCurve, getBezierCurveDerivatives, getBezierCurvePointAtPercent, getQuadraticCurveDerivatives, getQuadraticCurvePointAtPercent } from "./bezier"
import { Circle, getCirclePointAtRadian, getCircleRadian } from "./circle"
import { Ellipse, getEllipseDerivatives, getEllipsePointAtRadian } from "./ellipse"
import { calculateEquation2, calculateEquation5, newtonIterate2 } from "./equation-calculater"
import { GeometryLine, getGeometryLineStartAndEnd, getLineSegmentOrRayPoint, lineSegmentOrRayToGeneralFormLine, pointIsOnGeometryLine } from "./geometry-line"
import { getBezierCurveAndHyperbolaExtremumPoints, getCircleAndHyperbolaExtremumPoints, getEllipseAndHyperbolaExtremumPoints, getLineAndHyperbolaExtremumPoint, getQuadraticCurveAndHyperbolaExtremumPoints, getTwoHyperbolaExtremumPoints } from "./hyperbola"
import { getTwoGeometryLinesIntersectionPoint } from "./intersection"
import { iterateItemOrArray } from "./iterator"
import { GeneralFormLine, getGeneralFormLineRadian } from "./line"
import { deduplicate, deepEquals, delta2, isSameNumber, isValidPercent, isZero, minimumBy } from "./math"
import { Matrix2 } from "./matrix"
import { getBezierCurveAndNurbsCurveExtremumPoints, getCircleAndNurbsCurveExtremumPoints, getEllipseAndNurbsCurveExtremumPoints, getHyperbolaAndNurbsCurveExtremumPoints, getLineAndNurbsCurveExtremumPoints, getQuadraticCurveAndNurbsCurveExtremumPoints, getTwoNurbsCurveExtremumPoints } from "./nurbs"
import { getPerpendicularPercentToBezierCurve, getPerpendicularPercentToQuadraticCurve, getPerpendicularPoint, getPerpendicularPointRadiansToEllipse, getPointAndGeometryLineNearestPointAndDistance } from "./perpendicular"
import { Position, getPointByLengthAndDirection, getPointByLengthAndRadian, getTwoPointsDistance, isSamePoint } from "./position"
import { angleToRadian } from "./radian"
import { reverseRadian } from "./reverse"
import { Tuple2, Vec2 } from "./types"

export function getShortestDistanceOfTwoGeometryLine(line1: GeometryLine, line2: GeometryLine): { points: Tuple2<Position>, distance: number } {
  const point = getTwoGeometryLinesIntersectionPoint(line1, line2)[0]
  if (point) {
    return { points: [point, point], distance: 0 }
  }
  return getShortestDistanceOfTwoDisjointGeometryLine(line1, line2)
}

export function getShortestDistanceOfTwoDisjointGeometryLine(line1: GeometryLine, line2: GeometryLine): { points: Tuple2<Position>, distance: number } {
  let results: { points: Tuple2<Position>, distance: number }[] = []
  if (Array.isArray(line1) || line1.type === 'ray') {
    const line = lineSegmentOrRayToGeneralFormLine(line1)
    if (!line) {
      const p1 = getLineSegmentOrRayPoint(line1)
      const nearest = getPointAndGeometryLineNearestPointAndDistance(p1, line2)
      results = [{ points: [p1, nearest.point], distance: nearest.distance }]
    } else if (Array.isArray(line2) || line2.type === 'ray') {
      results = []
    } else if (line2.type === 'arc') {
      results = getLineAndCircleExtremumPoints(line, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'ellipse arc') {
      results = getLineAndEllipseExtremumPoints(line, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'quadratic curve') {
      const p = getLineAndQuadraticCurveExtremumPoint(line, line2.curve)
      results = [{ points: p, distance: getTwoPointsDistance(...p) }]
    } else if (line2.type === 'bezier curve') {
      results = getLineAndBezierCurveExtremumPoints(line, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'hyperbola curve') {
      results = getLineAndHyperbolaExtremumPoint(line, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'nurbs curve') {
      results = getLineAndNurbsCurveExtremumPoints(line, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    }
  } else if (Array.isArray(line2) || line2.type === 'ray') {
    return getShortestDistanceOfTwoDisjointGeometryLine(line2, line1)
  } else if (line1.type === 'arc') {
    if (line2.type === 'arc') {
      results = getTwoCircleExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'ellipse arc') {
      results = getCircleAndEllipseExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'quadratic curve') {
      results = getCircleAndQuadraticCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'bezier curve') {
      results = getCircleAndBezierCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'hyperbola curve') {
      results = getCircleAndHyperbolaExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'nurbs curve') {
      results = getCircleAndNurbsCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    }
  } else if (line2.type === 'arc') {
    return getShortestDistanceOfTwoDisjointGeometryLine(line2, line1)
  } else if (line1.type === 'ellipse arc') {
    if (line2.type === 'ellipse arc') {
      results = getTwoEllipseExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'quadratic curve') {
      results = getEllipseQuadraticCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'bezier curve') {
      results = getEllipseBezierCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'hyperbola curve') {
      results = getEllipseAndHyperbolaExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'nurbs curve') {
      results = getEllipseAndNurbsCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    }
  } else if (line2.type === 'ellipse arc') {
    return getShortestDistanceOfTwoDisjointGeometryLine(line2, line1)
  } else if (line1.type === 'quadratic curve') {
    if (line2.type === 'quadratic curve') {
      results = getTwoQuadraticCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'bezier curve') {
      results = getQuadraticCurveAndBezierCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'hyperbola curve') {
      results = getQuadraticCurveAndHyperbolaExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'nurbs curve') {
      results = getQuadraticCurveAndNurbsCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    }
  } else if (line2.type === 'quadratic curve') {
    return getShortestDistanceOfTwoDisjointGeometryLine(line2, line1)
  } else if (line1.type === 'bezier curve') {
    if (line2.type === 'bezier curve') {
      results = getTwoBezierCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'hyperbola curve') {
      results = getBezierCurveAndHyperbolaExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'nurbs curve') {
      results = getBezierCurveAndNurbsCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    }
  } else if (line2.type === 'bezier curve') {
    return getShortestDistanceOfTwoDisjointGeometryLine(line2, line1)
  } else if (line1.type === 'hyperbola curve') {
    if (line2.type === 'hyperbola curve') {
      results = getTwoHyperbolaExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    } else if (line2.type === 'nurbs curve') {
      results = getHyperbolaAndNurbsCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    }
  } else if (line2.type === 'hyperbola curve') {
    return getShortestDistanceOfTwoDisjointGeometryLine(line2, line1)
  } else if (line1.type === 'nurbs curve') {
    if (line2.type === 'nurbs curve') {
      results = getTwoNurbsCurveExtremumPoints(line1.curve, line2.curve).map(p => ({ points: p, distance: getTwoPointsDistance(...p) }))
    }
  } else if (line2.type === 'nurbs curve') {
    return getShortestDistanceOfTwoDisjointGeometryLine(line2, line1)
  }
  results = results.filter(r => pointIsOnGeometryLine(r.points[0], line1) && pointIsOnGeometryLine(r.points[1], line2))
  const { start: start1, end: end1 } = getGeometryLineStartAndEnd(line1)
  results.push(...Array.from(iterateItemOrArray([start1, end1])).map(p => {
    const r = getPointAndGeometryLineNearestPointAndDistance(p, line2)
    return { points: [p, r.point] as Tuple2<Position>, distance: r.distance }
  }))

  const { start: start2, end: end2 } = getGeometryLineStartAndEnd(line2)
  results.push(...Array.from(iterateItemOrArray([start2, end2])).map(p => {
    const r = getPointAndGeometryLineNearestPointAndDistance(p, line1)
    return { points: [p, r.point] as Tuple2<Position>, distance: r.distance }
  }))
  return minimumBy(results, n => n.distance)
}

export function getShortestDistanceOfTwoGeometryLines(lines1: GeometryLine[], lines2: GeometryLine[]): { points: [Position, Position], distance: number } {
  return minimumBy(lines1.map(n1 => minimumBy(lines2.map(n2 => getShortestDistanceOfTwoGeometryLine(n1, n2)), n => n.distance, isZero)), n => n.distance, isZero)
}

export function getLineAndCircleExtremumPoints(line: GeneralFormLine, circle: Circle): Tuple2<Position>[] {
  const p1 = getPerpendicularPoint(circle, line)
  if (isSamePoint(p1, circle)) {
    const radian = getGeneralFormLineRadian(line)
    const p21 = getPointByLengthAndRadian(circle, circle.r, radian + Math.PI / 2)
    const p22 = getPointByLengthAndRadian(circle, -circle.r, radian - Math.PI / 2)
    return [[p1, p21], [p1, p22]]
  }
  const p21 = getPointByLengthAndDirection(circle, circle.r, p1)
  const p22 = getPointByLengthAndDirection(circle, -circle.r, p1)
  return [[p1, p21], [p1, p22]]
}

export function getLineAndEllipseExtremumPoints(line: GeneralFormLine, ellipse: Ellipse): Tuple2<Position>[] {
  const { a, b } = line
  const { rx, ry, angle } = ellipse
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  // x = d2 rx cos(t) - d1 ry sin(t) + cx
  // y = d1 rx cos(t) + d2 ry sin(t) + cy
  // dx/dt = (-(d2 rx sin(t))) - d1 ry cos(t)
  // dy/dt = (-(d1 rx sin(t))) + d2 ry cos(t)
  // a x + b y + c = 0
  // dy / dx = -a/ b
  // a dx + b dy = 0
  // a((-(d2 rx sin(t))) - d1 ry cos(t)) + b((-(d1 rx sin(t))) + d2 ry cos(t)) = 0
  // /cos(t): a((-(d2 rx tan(t))) - d1 ry) + b((-(d1 rx tan(t))) + d2 ry) = 0
  // let u = tan(t)
  // a((-(d2 rx u)) - d1 ry) + b((-(d1 rx u)) + d2 ry) = 0
  // (-b d1 rx - a d2 rx) u - a d1 ry + b d2 ry = 0
  // u = (a d1 - b d2) ry / (-b d1 - a d2) / rx
  const t1 = Math.atan2((a * d1 - b * d2) * ry, (-b * d1 - a * d2) * rx)
  const t2 = reverseRadian(t1)
  return ([t1, t2]).map(t => {
    const p2 = getEllipsePointAtRadian(ellipse, t)
    const p1 = getPerpendicularPoint(p2, line)
    return [p1, p2]
  })
}

export function getLineAndQuadraticCurveExtremumPoint(line: GeneralFormLine, curve: QuadraticCurve): Tuple2<Position> {
  const { a, b } = line
  const { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } } = curve
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 t t + 2 c1 t + a1
  // y = c4 t t + 2 c3 t + b1
  // dx/dt = 2 c2 t + 2 c1
  // dy/dt = 2 c4 t + 2 c3
  // a x + b y + c = 0
  // dy / dx = -a/ b
  // a dx + b dy = 0
  // a(2 c2 t + 2 c1) + b(2 c4 t + 2 c3) = 0
  // /2: a(c2 t + c1) + b(c4 t + c3) = 0
  // (a c2 + b c4) t + a c1 + b c3 = 0
  // t = -(a c1 + b c3)/(a c2 + b c4)
  const t = -(a * c1 + b * c3) / (a * c2 + b * c4)
  const p2 = getQuadraticCurvePointAtPercent(curve.from, curve.cp, curve.to, t)
  const p1 = getPerpendicularPoint(p2, line)
  return [p1, p2]
}

export function getLineAndBezierCurveExtremumPoints(line: GeneralFormLine, curve: BezierCurve): Tuple2<Position>[] {
  const { a, b } = line
  const { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } } = curve
  const c1 = -a1 + 3 * a2 - 3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 - 3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = c4 t t t + c5 t t + c6 t + b1
  // dx/dt = 3 c1 t^2 + 2 c2 t + c3
  // dy/dt = 3 c4 t^2 + 2 c5 t + c6
  // a x + b y + c = 0
  // dy / dx = -a/ b
  // a dx + b dy = 0
  // a(3 c1 t^2 + 2 c2 t + c3) + b(3 c4 t^2 + 2 c5 t + c6) = 0
  // (3 a c1 + 3 b c4) t t + (2 a c2 + 2 b c5) t + a c3 + b c6 = 0
  const ts = calculateEquation2(3 * a * c1 + 3 * b * c4, 2 * a * c2 + 2 * b * c5, a * c3 + b * c6)
  return ts.map(t => {
    const p2 = getBezierCurvePointAtPercent(curve.from, curve.cp1, curve.cp2, curve.to, t)
    const p1 = getPerpendicularPoint(p2, line)
    return [p1, p2]
  })
}

export function getTwoCircleExtremumPoints(circle1: Circle, circle2: Circle): Tuple2<Position>[] {
  if (isSamePoint(circle1, circle2)) return []
  const t1 = Math.atan2(circle1.y - circle2.y, circle1.x - circle2.x)
  const t2 = reverseRadian(t1)
  const p11 = getCirclePointAtRadian(circle1, t1)
  const p12 = getCirclePointAtRadian(circle1, t2)
  const p21 = getCirclePointAtRadian(circle2, t1)
  const p22 = getCirclePointAtRadian(circle2, t2)
  return [[p11, p21], [p12, p21], [p11, p22], [p12, p22]]
}

export function getCircleAndEllipseExtremumPoints(circle: Circle, ellipse: Ellipse): Tuple2<Position>[] {
  if (isSameNumber(ellipse.rx, ellipse.ry)) {
    return getTwoCircleExtremumPoints(circle, { x: ellipse.cx, y: ellipse.cy, r: ellipse.rx })
  }
  const ts = getPerpendicularPointRadiansToEllipse(circle, ellipse)
  return ts.map(t => {
    const p = getEllipsePointAtRadian(ellipse, t)
    const t1 = getCircleRadian(p, circle)
    return [[getCirclePointAtRadian(circle, t1), p], [getCirclePointAtRadian(circle, reverseRadian(t1)), p]] as Tuple2<Position>[]
  }).flat()
}

export function getCircleAndQuadraticCurveExtremumPoints(circle: Circle, curve: QuadraticCurve): Tuple2<Position>[] {
  const ts = getPerpendicularPercentToQuadraticCurve(circle, curve)
  return ts.map(t => {
    const p = getQuadraticCurvePointAtPercent(curve.from, curve.cp, curve.to, t)
    const t1 = getCircleRadian(p, circle)
    return [[getCirclePointAtRadian(circle, t1), p], [getCirclePointAtRadian(circle, reverseRadian(t1)), p]] as Tuple2<Position>[]
  }).flat()
}

export function getCircleAndBezierCurveExtremumPoints(circle: Circle, curve: BezierCurve): Tuple2<Position>[] {
  const ts = getPerpendicularPercentToBezierCurve(circle, curve)
  return ts.map(t => {
    const p = getBezierCurvePointAtPercent(curve.from, curve.cp1, curve.cp2, curve.to, t)
    const t1 = getCircleRadian(p, circle)
    return [[getCirclePointAtRadian(circle, t1), p], [getCirclePointAtRadian(circle, reverseRadian(t1)), p]] as Tuple2<Position>[]
  }).flat()
}

export function getTwoEllipseExtremumPoints(ellipse1: Ellipse, ellipse2: Ellipse): Tuple2<Position>[] {
  const [p1, d1, d2] = getEllipseDerivatives(ellipse1)
  const [p2, e1, e2] = getEllipseDerivatives(ellipse2)
  const f1 = (t: Vec2): Vec2 => {
    // z = (x1 - x2)^2 + (y1 - y2)^2
    // dz/dt1/2: z1 = (x1 - x2)x1' + (y1 - y2)y1'
    // dz/dt2/2: z2 = (x2 - x1)x2' + (y2 - y1)y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    return [(x1 - x2) * x11 + (y1 - y2) * y11, (x2 - x1) * x21 + (y2 - y1) * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    const { x: x22, y: y22 } = e2(t[1])
    // dz1/dt1 = x1'x1' + (x1 - x2)x1'' + y1'y1' + (y1 - y2)y1''
    // dz1/dt2 = -x2' x1' - y2' y1'
    // dz2/dt1 = -x1' x2' - y1' y2'
    // dz2/dt2 = x2'x2' + (x2 - x1)x2'' + y2'y2' + (y2 - y1)y2''
    return [
      x11 * x11 + (x1 - x2) * x12 + y11 * y11 + (y1 - y2) * y12,
      -x21 * x11 - y21 * y11,
      -x11 * x21 - y11 * y21,
      x21 * x21 + (x2 - x1) * x22 + y21 * y21 + (y2 - y1) * y22,
    ]
  }
  let ts: Vec2[] = []
  for (const t1 of [-Math.PI / 2, Math.PI / 2]) {
    for (const t2 of [-Math.PI / 2, Math.PI / 2]) {
      const t = newtonIterate2([t1, t2], f1, f2, delta2)
      if (t !== undefined) {
        ts.push(t)
      }
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.map(t => [p1(t[0]), p2(t[1])])
}

export function getEllipseQuadraticCurveExtremumPoints(ellipse: Ellipse, curve: QuadraticCurve): Tuple2<Position>[] {
  const [p1, d1, d2] = getEllipseDerivatives(ellipse)
  const [p2, e1, e2] = getQuadraticCurveDerivatives(curve)
  const f1 = (t: Vec2): Vec2 => {
    // z = (x1 - x2)^2 + (y1 - y2)^2
    // dz/dt1/2: z1 = (x1 - x2)x1' + (y1 - y2)y1'
    // dz/dt2/2: z2 = (x2 - x1)x2' + (y2 - y1)y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    return [(x1 - x2) * x11 + (y1 - y2) * y11, (x2 - x1) * x21 + (y2 - y1) * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    const { x: x22, y: y22 } = e2(t[1])
    // dz1/dt1 = x1'x1' + (x1 - x2)x1'' + y1'y1' + (y1 - y2)y1''
    // dz1/dt2 = -x2' x1' - y2' y1'
    // dz2/dt1 = -x1' x2' - y1' y2'
    // dz2/dt2 = x2'x2' + (x2 - x1)x2'' + y2'y2' + (y2 - y1)y2''
    return [
      x11 * x11 + (x1 - x2) * x12 + y11 * y11 + (y1 - y2) * y12,
      -x21 * x11 - y21 * y11,
      -x11 * x21 - y11 * y21,
      x21 * x21 + (x2 - x1) * x22 + y21 * y21 + (y2 - y1) * y22,
    ]
  }
  let ts: Vec2[] = []
  for (const t1 of [-Math.PI / 2, Math.PI / 2]) {
    for (const t2 of [0.25, 0.75]) {
      const t = newtonIterate2([t1, t2], f1, f2, delta2)
      if (t !== undefined) {
        ts.push(t)
      }
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isValidPercent(v[1])).map(t => [p1(t[0]), p2(t[1])])
}

export function getEllipseBezierCurveExtremumPoints(ellipse: Ellipse, curve: BezierCurve): Tuple2<Position>[] {
  const [p1, d1, d2] = getEllipseDerivatives(ellipse)
  const [p2, e1, e2] = getBezierCurveDerivatives(curve)
  const f1 = (t: Vec2): Vec2 => {
    // z = (x1 - x2)^2 + (y1 - y2)^2
    // dz/dt1/2: z1 = (x1 - x2)x1' + (y1 - y2)y1'
    // dz/dt2/2: z2 = (x2 - x1)x2' + (y2 - y1)y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    return [(x1 - x2) * x11 + (y1 - y2) * y11, (x2 - x1) * x21 + (y2 - y1) * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    const { x: x22, y: y22 } = e2(t[1])
    // dz1/dt1 = x1'x1' + (x1 - x2)x1'' + y1'y1' + (y1 - y2)y1''
    // dz1/dt2 = -x2' x1' - y2' y1'
    // dz2/dt1 = -x1' x2' - y1' y2'
    // dz2/dt2 = x2'x2' + (x2 - x1)x2'' + y2'y2' + (y2 - y1)y2''
    return [
      x11 * x11 + (x1 - x2) * x12 + y11 * y11 + (y1 - y2) * y12,
      -x21 * x11 - y21 * y11,
      -x11 * x21 - y11 * y21,
      x21 * x21 + (x2 - x1) * x22 + y21 * y21 + (y2 - y1) * y22,
    ]
  }
  let ts: Vec2[] = []
  for (const t1 of [-Math.PI / 2, Math.PI / 2]) {
    for (const t2 of [0.25, 0.75]) {
      const t = newtonIterate2([t1, t2], f1, f2, delta2)
      if (t !== undefined) {
        ts.push(t)
      }
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isValidPercent(v[1])).map(t => [p1(t[0]), p2(t[1])])
}

export function getTwoQuadraticCurveExtremumPoints(curve1: QuadraticCurve, curve2: QuadraticCurve): Tuple2<Position>[] {
  const { from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } } = curve1
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x1 = c2 u u + 2 c1 u + a1
  // y1 = c4 u u + 2 c3 u + b1
  const { from: { x: a4, y: b4 }, cp: { x: a5, y: b5 }, to: { x: a6, y: b6 } } = curve2
  const d1 = a5 - a4, d2 = a6 - a5 - d1, d3 = b5 - b4, d4 = b6 - b5 - d3
  // x2 = d2 v v + 2 d1 v + a4
  // y2 = d4 v v + 2 d3 v + b4
  // dx1/du = 2 c2 u + 2 c1
  // dy1/du = 2 c4 u + 2 c3
  // dx2/dv = 2 d2 v + 2 d1
  // dy2/dv = 2 d4 v + 2 d3
  // dy1/du dx2/dv = dy2/dv dx1/du
  // (c4 u + c3) (d2 v + d1) = (d4 v + d3) (c2 u + c1)
  // ((c4 d2 - c2 d4) v + c4 d1 - c2 d3) u + (c3 d2 - c1 d4) v + c3 d1 - c1 d3 = 0
  const h1 = c4 * d2 - c2 * d4, h2 = c4 * d1 - c2 * d3, h3 = c3 * d2 - c1 * d4, h4 = c3 * d1 - c1 * d3
  // (h1 v + h2) u + h3 v + h4 = 0
  // u = -(h3 v + h4)/(h1 v + h2)

  // dy1/du/(dx1/du)(y2 - y1)/(x2 - x1) = -1
  // (c4 u + c3)(d4 v v + 2 d3 v + b4 - (c4 u u + 2 c3 u + b1)) + (c2 u + c1)(d2 v v + 2 d1 v + a4 - (c2 u u + 2 c1 u + a1)) = 0
  const e1 = a1 - a4, e2 = b1 - b4
  // (c4 u + c3)(d4 v v + 2 d3 v - c4 u u - 2 c3 u - e2) + (c2 u + c1)(d2 v v + 2 d1 v - c2 u u - 2 c1 u - e1) = 0
  // (-c2 c2 - c4 c4) u u u + (-3 c1 c2 - 3 c3 c4) u u + ((c2 d2 + c4 d4) v v + (2 c2 d1 + 2 c4 d3) v - 2 c1 c1 - 2 c3 c3 - c2 e1 - c4 e2) u + (c1 d2 + c3 d4) v v + (2 c1 d1 + 2 c3 d3) v - c1 e1 - c3 e2 = 0
  const f1 = -c2 * c2 - c4 * c4, f2 = -3 * c1 * c2 - 3 * c3 * c4, f3 = c2 * d2 + c4 * d4, f4 = 2 * c2 * d1 + 2 * c4 * d3
  const f5 = -2 * c1 * c1 - 2 * c3 * c3 - c2 * e1 - c4 * e2, f6 = c1 * d2 + c3 * d4, f7 = 2 * c1 * d1 + 2 * c3 * d3, f8 = -c1 * e1 - c3 * e2
  // f1 u u u + f2 u u + (f3 v v + f4 v + f5) u + f6 v v + f7 v + f8 = 0
  // replace u, group by v: (f6 h1 h1 h1 - f3 h1 h1 h3) v v v v v + (f7 h1 h1 h1 + 3 f6 h1 h1 h2 - f4 h1 h1 h3 - 2 f3 h1 h2 h3 - f3 h1 h1 h4) v v v v + (f8 h1 h1 h1 + 3 f7 h1 h1 h2 + 3 f6 h1 h2 h2 + f2 h1 h3 h3 - f5 h1 h1 h3 - 2 f4 h1 h2 h3 - f3 h2 h2 h3 - f1 h3 h3 h3 - f4 h1 h1 h4 - 2 f3 h1 h2 h4) v v v + (3 f8 h1 h1 h2 + 3 f7 h1 h2 h2 + f6 h2 h2 h2 + f2 h2 h3 h3 - 2 f5 h1 h2 h3 - f4 h2 h2 h3 - f5 h1 h1 h4 - 2 f4 h1 h2 h4 - f3 h2 h2 h4 + 2 f2 h1 h3 h4 - 3 f1 h3 h3 h4) v v + (3 f8 h1 h2 h2 + f7 h2 h2 h2 - f5 h2 h2 h3 - 2 f5 h1 h2 h4 - f4 h2 h2 h4 + 2 f2 h2 h3 h4 + f2 h1 h4 h4 - 3 f1 h3 h4 h4) v + f8 h2 h2 h2 - f5 h2 h2 h4 + f2 h2 h4 h4 - f1 h4 h4 h4 = 0
  let vs = calculateEquation5([
    f6 * h1 * h1 * h1 - f3 * h1 * h1 * h3,
    f7 * h1 * h1 * h1 + 3 * f6 * h1 * h1 * h2 - f4 * h1 * h1 * h3 - 2 * f3 * h1 * h2 * h3 - f3 * h1 * h1 * h4,
    f8 * h1 * h1 * h1 + 3 * f7 * h1 * h1 * h2 + 3 * f6 * h1 * h2 * h2 + f2 * h1 * h3 * h3 - f5 * h1 * h1 * h3 - 2 * f4 * h1 * h2 * h3 - f3 * h2 * h2 * h3 - f1 * h3 * h3 * h3 - f4 * h1 * h1 * h4 - 2 * f3 * h1 * h2 * h4,
    3 * f8 * h1 * h1 * h2 + 3 * f7 * h1 * h2 * h2 + f6 * h2 * h2 * h2 + f2 * h2 * h3 * h3 - 2 * f5 * h1 * h2 * h3 - f4 * h2 * h2 * h3 - f5 * h1 * h1 * h4 - 2 * f4 * h1 * h2 * h4 - f3 * h2 * h2 * h4 + 2 * f2 * h1 * h3 * h4 - 3 * f1 * h3 * h3 * h4,
    3 * f8 * h1 * h2 * h2 + f7 * h2 * h2 * h2 - f5 * h2 * h2 * h3 - 2 * f5 * h1 * h2 * h4 - f4 * h2 * h2 * h4 + 2 * f2 * h2 * h3 * h4 + f2 * h1 * h4 * h4 - 3 * f1 * h3 * h4 * h4,
    f8 * h2 * h2 * h2 - f5 * h2 * h2 * h4 + f2 * h2 * h4 * h4 - f1 * h4 * h4 * h4,
  ], 0.5)
  vs = vs.filter(v => isValidPercent(v))
  const result: Tuple2<Position>[] = []
  for (const v of vs) {
    const u = -(h3 * v + h4) / (h1 * v + h2)
    if (isValidPercent(u)) {
      result.push([
        getQuadraticCurvePointAtPercent(curve1.from, curve1.cp, curve1.to, u),
        getQuadraticCurvePointAtPercent(curve2.from, curve2.cp, curve2.to, v),
      ])
    }
  }
  return result
}

export function getQuadraticCurveAndBezierCurveExtremumPoints(curve1: QuadraticCurve, curve2: BezierCurve): Tuple2<Position>[] {
  const { from: { x: a5, y: b5 }, cp: { x: a6, y: b6 }, to: { x: a7, y: b7 } } = curve1
  const d1 = a6 - a5, d2 = a7 - a6 - d1, d3 = b6 - b5, d4 = b7 - b6 - d3
  // x1 = d2 u u + 2 d1 u + a5
  // y1 = d4 u u + 2 d3 u + b5
  // x1' = 2 d2 u + 2 d1
  // y1' = 2 d4 u + 2 d3

  const { from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } } = curve2
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x2 = c1 v v v + c2 v v + c3 v + a1
  // y2 = c4 v v v + c5 v v + c6 v + b1
  // x2' = 3 c1 v v + 2 c2 v + c3
  // y2' = 3 c4 v v + 2 c5 v + c6

  // y1'/x1' = y2'/x2'
  // (d4 u + d3)(3 c1 v v + 2 c2 v + c3) - (3 c4 v v + 2 c5 v + c6)(d2 u + d1) = 0
  // expand, group by u v: ((3 c1 d4 + -3 c4 d2) v v + (-2 c5 d2 + 2 c2 d4) v + -c6 d2 + c3 d4) u + (-3 c4 d1 + 3 c1 d3) v v + (-2 c5 d1 + 2 c2 d3) v + -c6 d1 + c3 d3 = 0
  const e1 = 3 * c1 * d4 - 3 * c4 * d2, e2 = -2 * c5 * d2 + 2 * c2 * d4, e3 = -c6 * d2 + c3 * d4
  const e4 = 3 * c4 * d1 - 3 * c1 * d3, e5 = 2 * c5 * d1 - 2 * c2 * d3, e6 = c6 * d1 - c3 * d3
  // (e1 v v + e2 v + e3) u - e4 v v - e5 v - e6 = 0
  // u = (e4 v v + e5 v + e6)/(e1 v v + e2 v + e3)

  // y1'/x1'(y2 - y1)/(x2 - x1) = -1
  // y1'(y2 - y1) + x1'(x2 - x1) = 0
  // (d4 u + d3)(c4 v v v + c5 v v + c6 v + b1 - (d4 u u + 2 d3 u + b5)) + (d2 u + d1)(c1 v v v + c2 v v + c3 v + a1 - (d2 u u + 2 d1 u + a5)) = 0
  // expand, group by u v: (-d2 d2 + -d4 d4) u u u + (-3 d1 d2 + -3 d3 d4) u u + ((c1 d2 + c4 d4) v v v + (c2 d2 + c5 d4) v v + (c3 d2 + c6 d4) v + -2 d1 d1 + a1 d2 + -a5 d2 + -2 d3 d3 + b1 d4 + -b5 d4) u + (c1 d1 + c4 d3) v v v + (c2 d1 + c5 d3) v v + (c3 d1 + c6 d3) v + a1 d1 + -a5 d1 + b1 d3 + -b5 d3 = 0
  const f1 = -d2 * d2 - d4 * d4, f2 = -3 * d1 * d2 - 3 * d3 * d4, f3 = c1 * d2 + c4 * d4, f4 = c2 * d2 + c5 * d4, f5 = c3 * d2 + c6 * d4
  const f6 = -2 * d1 * d1 + a1 * d2 - a5 * d2 - 2 * d3 * d3 + b1 * d4 - b5 * d4, f7 = c1 * d1 + c4 * d3, f8 = c2 * d1 + c5 * d3, f9 = c3 * d1 + c6 * d3, f0 = a1 * d1 - a5 * d1 + b1 * d3 - b5 * d3
  // f1 u u u + f2 u u + (f3 v v v + f4 v v + f5 v + f6) u + f7 v v v + f8 v v + f9 v + f0 = 0
  // replace u, group by v: (e1 e1 e4 f3 + e1 e1 e1 f7) v v v v v v v v v + (2 e1 e2 e4 f3 + e1 e1 e5 f3 + e1 e1 e4 f4 + 3 e1 e1 e2 f7 + e1 e1 e1 f8) v v v v v v v v + (e2 e2 e4 f3 + 2 e1 e3 e4 f3 + 2 e1 e2 e5 f3 + e1 e1 e6 f3 + 2 e1 e2 e4 f4 + e1 e1 e5 f4 + e1 e1 e4 f5 + 3 e1 e2 e2 f7 + 3 e1 e1 e3 f7 + 3 e1 e1 e2 f8 + e1 e1 e1 f9) v v v v v v v + (e1 e1 e1 f0 + e4 e4 e4 f1 + e1 e4 e4 f2 + 2 e2 e3 e4 f3 + e2 e2 e5 f3 + 2 e1 e3 e5 f3 + 2 e1 e2 e6 f3 + e2 e2 e4 f4 + 2 e1 e3 e4 f4 + 2 e1 e2 e5 f4 + e1 e1 e6 f4 + 2 e1 e2 e4 f5 + e1 e1 e5 f5 + e1 e1 e4 f6 + e2 e2 e2 f7 + 6 e1 e2 e3 f7 + 3 e1 e2 e2 f8 + 3 e1 e1 e3 f8 + 3 e1 e1 e2 f9) v v v v v v + (3 e1 e1 e2 f0 + 3 e4 e4 e5 f1 + e2 e4 e4 f2 + 2 e1 e4 e5 f2 + e3 e3 e4 f3 + 2 e2 e3 e5 f3 + e2 e2 e6 f3 + 2 e1 e3 e6 f3 + 2 e2 e3 e4 f4 + e2 e2 e5 f4 + 2 e1 e3 e5 f4 + 2 e1 e2 e6 f4 + e2 e2 e4 f5 + 2 e1 e3 e4 f5 + 2 e1 e2 e5 f5 + e1 e1 e6 f5 + 2 e1 e2 e4 f6 + e1 e1 e5 f6 + 3 e2 e2 e3 f7 + 3 e1 e3 e3 f7 + e2 e2 e2 f8 + 6 e1 e2 e3 f8 + 3 e1 e2 e2 f9 + 3 e1 e1 e3 f9) v v v v v + (3 e1 e2 e2 f0 + 3 e1 e1 e3 f0 + 3 e4 e5 e5 f1 + 3 e4 e4 e6 f1 + e3 e4 e4 f2 + 2 e2 e4 e5 f2 + e1 e5 e5 f2 + 2 e1 e4 e6 f2 + e3 e3 e5 f3 + 2 e2 e3 e6 f3 + e3 e3 e4 f4 + 2 e2 e3 e5 f4 + e2 e2 e6 f4 + 2 e1 e3 e6 f4 + 2 e2 e3 e4 f5 + e2 e2 e5 f5 + 2 e1 e3 e5 f5 + 2 e1 e2 e6 f5 + e2 e2 e4 f6 + 2 e1 e3 e4 f6 + 2 e1 e2 e5 f6 + e1 e1 e6 f6 + 3 e2 e3 e3 f7 + 3 e2 e2 e3 f8 + 3 e1 e3 e3 f8 + e2 e2 e2 f9 + 6 e1 e2 e3 f9) v v v v + (e2 e2 e2 f0 + 6 e1 e2 e3 f0 + e5 e5 e5 f1 + 6 e4 e5 e6 f1 + 2 e3 e4 e5 f2 + e2 e5 e5 f2 + 2 e2 e4 e6 f2 + 2 e1 e5 e6 f2 + e3 e3 e6 f3 + e3 e3 e5 f4 + 2 e2 e3 e6 f4 + e3 e3 e4 f5 + 2 e2 e3 e5 f5 + e2 e2 e6 f5 + 2 e1 e3 e6 f5 + 2 e2 e3 e4 f6 + e2 e2 e5 f6 + 2 e1 e3 e5 f6 + 2 e1 e2 e6 f6 + e3 e3 e3 f7 + 3 e2 e3 e3 f8 + 3 e2 e2 e3 f9 + 3 e1 e3 e3 f9) v v v + (3 e2 e2 e3 f0 + 3 e1 e3 e3 f0 + 3 e5 e5 e6 f1 + 3 e4 e6 e6 f1 + e3 e5 e5 f2 + 2 e3 e4 e6 f2 + 2 e2 e5 e6 f2 + e1 e6 e6 f2 + e3 e3 e6 f4 + e3 e3 e5 f5 + 2 e2 e3 e6 f5 + e3 e3 e4 f6 + 2 e2 e3 e5 f6 + e2 e2 e6 f6 + 2 e1 e3 e6 f6 + e3 e3 e3 f8 + 3 e2 e3 e3 f9) v v + (3 e2 e3 e3 f0 + 3 e5 e6 e6 f1 + 2 e3 e5 e6 f2 + e2 e6 e6 f2 + e3 e3 e6 f5 + e3 e3 e5 f6 + 2 e2 e3 e6 f6 + e3 e3 e3 f9) v + e3 e3 e3 f0 + e6 e6 e6 f1 + e3 e6 e6 f2 + e3 e3 e6 f6 = 0
  let vs = calculateEquation5([
    e1 * e1 * e4 * f3 + e1 * e1 * e1 * f7,
    2 * e1 * e2 * e4 * f3 + e1 * e1 * e5 * f3 + e1 * e1 * e4 * f4 + 3 * e1 * e1 * e2 * f7 + e1 * e1 * e1 * f8,
    e2 * e2 * e4 * f3 + 2 * e1 * e3 * e4 * f3 + 2 * e1 * e2 * e5 * f3 + e1 * e1 * e6 * f3 + 2 * e1 * e2 * e4 * f4 + e1 * e1 * e5 * f4 + e1 * e1 * e4 * f5 + 3 * e1 * e2 * e2 * f7 + 3 * e1 * e1 * e3 * f7 + 3 * e1 * e1 * e2 * f8 + e1 * e1 * e1 * f9,
    e1 * e1 * e1 * f0 + e4 * e4 * e4 * f1 + e1 * e4 * e4 * f2 + 2 * e2 * e3 * e4 * f3 + e2 * e2 * e5 * f3 + 2 * e1 * e3 * e5 * f3 + 2 * e1 * e2 * e6 * f3 + e2 * e2 * e4 * f4 + 2 * e1 * e3 * e4 * f4 + 2 * e1 * e2 * e5 * f4 + e1 * e1 * e6 * f4 + 2 * e1 * e2 * e4 * f5 + e1 * e1 * e5 * f5 + e1 * e1 * e4 * f6 + e2 * e2 * e2 * f7 + 6 * e1 * e2 * e3 * f7 + 3 * e1 * e2 * e2 * f8 + 3 * e1 * e1 * e3 * f8 + 3 * e1 * e1 * e2 * f9,
    3 * e1 * e1 * e2 * f0 + 3 * e4 * e4 * e5 * f1 + e2 * e4 * e4 * f2 + 2 * e1 * e4 * e5 * f2 + e3 * e3 * e4 * f3 + 2 * e2 * e3 * e5 * f3 + e2 * e2 * e6 * f3 + 2 * e1 * e3 * e6 * f3 + 2 * e2 * e3 * e4 * f4 + e2 * e2 * e5 * f4 + 2 * e1 * e3 * e5 * f4 + 2 * e1 * e2 * e6 * f4 + e2 * e2 * e4 * f5 + 2 * e1 * e3 * e4 * f5 + 2 * e1 * e2 * e5 * f5 + e1 * e1 * e6 * f5 + 2 * e1 * e2 * e4 * f6 + e1 * e1 * e5 * f6 + 3 * e2 * e2 * e3 * f7 + 3 * e1 * e3 * e3 * f7 + e2 * e2 * e2 * f8 + 6 * e1 * e2 * e3 * f8 + 3 * e1 * e2 * e2 * f9 + 3 * e1 * e1 * e3 * f9,
    3 * e1 * e2 * e2 * f0 + 3 * e1 * e1 * e3 * f0 + 3 * e4 * e5 * e5 * f1 + 3 * e4 * e4 * e6 * f1 + e3 * e4 * e4 * f2 + 2 * e2 * e4 * e5 * f2 + e1 * e5 * e5 * f2 + 2 * e1 * e4 * e6 * f2 + e3 * e3 * e5 * f3 + 2 * e2 * e3 * e6 * f3 + e3 * e3 * e4 * f4 + 2 * e2 * e3 * e5 * f4 + e2 * e2 * e6 * f4 + 2 * e1 * e3 * e6 * f4 + 2 * e2 * e3 * e4 * f5 + e2 * e2 * e5 * f5 + 2 * e1 * e3 * e5 * f5 + 2 * e1 * e2 * e6 * f5 + e2 * e2 * e4 * f6 + 2 * e1 * e3 * e4 * f6 + 2 * e1 * e2 * e5 * f6 + e1 * e1 * e6 * f6 + 3 * e2 * e3 * e3 * f7 + 3 * e2 * e2 * e3 * f8 + 3 * e1 * e3 * e3 * f8 + e2 * e2 * e2 * f9 + 6 * e1 * e2 * e3 * f9,
    e2 * e2 * e2 * f0 + 6 * e1 * e2 * e3 * f0 + e5 * e5 * e5 * f1 + 6 * e4 * e5 * e6 * f1 + 2 * e3 * e4 * e5 * f2 + e2 * e5 * e5 * f2 + 2 * e2 * e4 * e6 * f2 + 2 * e1 * e5 * e6 * f2 + e3 * e3 * e6 * f3 + e3 * e3 * e5 * f4 + 2 * e2 * e3 * e6 * f4 + e3 * e3 * e4 * f5 + 2 * e2 * e3 * e5 * f5 + e2 * e2 * e6 * f5 + 2 * e1 * e3 * e6 * f5 + 2 * e2 * e3 * e4 * f6 + e2 * e2 * e5 * f6 + 2 * e1 * e3 * e5 * f6 + 2 * e1 * e2 * e6 * f6 + e3 * e3 * e3 * f7 + 3 * e2 * e3 * e3 * f8 + 3 * e2 * e2 * e3 * f9 + 3 * e1 * e3 * e3 * f9,
    3 * e2 * e2 * e3 * f0 + 3 * e1 * e3 * e3 * f0 + 3 * e5 * e5 * e6 * f1 + 3 * e4 * e6 * e6 * f1 + e3 * e5 * e5 * f2 + 2 * e3 * e4 * e6 * f2 + 2 * e2 * e5 * e6 * f2 + e1 * e6 * e6 * f2 + e3 * e3 * e6 * f4 + e3 * e3 * e5 * f5 + 2 * e2 * e3 * e6 * f5 + e3 * e3 * e4 * f6 + 2 * e2 * e3 * e5 * f6 + e2 * e2 * e6 * f6 + 2 * e1 * e3 * e6 * f6 + e3 * e3 * e3 * f8 + 3 * e2 * e3 * e3 * f9,
    3 * e2 * e3 * e3 * f0 + 3 * e5 * e6 * e6 * f1 + 2 * e3 * e5 * e6 * f2 + e2 * e6 * e6 * f2 + e3 * e3 * e6 * f5 + e3 * e3 * e5 * f6 + 2 * e2 * e3 * e6 * f6 + e3 * e3 * e3 * f9,
    e3 * e3 * e3 * f0 + e6 * e6 * e6 * f1 + e3 * e6 * e6 * f2 + e3 * e3 * e6 * f6,
  ], 0.5)
  vs = vs.filter(v => isValidPercent(v))
  const result: Tuple2<Position>[] = []
  for (const v of vs) {
    const u = (e4 * v * v + e5 * v + e6) / (e1 * v * v + e2 * v + e3)
    if (isValidPercent(u)) {
      result.push([
        getQuadraticCurvePointAtPercent(curve1.from, curve1.cp, curve1.to, u),
        getBezierCurvePointAtPercent(curve2.from, curve2.cp1, curve2.cp2, curve2.to, v),
      ])
    }
  }
  return result
}

export function getTwoBezierCurveExtremumPoints(curve1: BezierCurve, curve2: BezierCurve): Tuple2<Position>[] {
  const [p1, d1, d2] = getBezierCurveDerivatives(curve1)
  const [p2, e1, e2] = getBezierCurveDerivatives(curve2)
  const f1 = (t: Vec2): Vec2 => {
    // z = (x1 - x2)^2 + (y1 - y2)^2
    // dz/dt1/2: z1 = (x1 - x2)x1' + (y1 - y2)y1'
    // dz/dt2/2: z2 = (x2 - x1)x2' + (y2 - y1)y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    return [(x1 - x2) * x11 + (y1 - y2) * y11, (x2 - x1) * x21 + (y2 - y1) * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const { x: x2, y: y2 } = p2(t[1])
    const { x: x21, y: y21 } = e1(t[1])
    const { x: x22, y: y22 } = e2(t[1])
    // dz1/dt1 = x1'x1' + (x1 - x2)x1'' + y1'y1' + (y1 - y2)y1''
    // dz1/dt2 = -x2' x1' - y2' y1'
    // dz2/dt1 = -x1' x2' - y1' y2'
    // dz2/dt2 = x2'x2' + (x2 - x1)x2'' + y2'y2' + (y2 - y1)y2''
    return [
      x11 * x11 + (x1 - x2) * x12 + y11 * y11 + (y1 - y2) * y12,
      -x21 * x11 - y21 * y11,
      -x11 * x21 - y11 * y21,
      x21 * x21 + (x2 - x1) * x22 + y21 * y21 + (y2 - y1) * y22,
    ]
  }
  let ts: Vec2[] = []
  for (const t1 of [0.25, 0.75]) {
    for (const t2 of [0.25, 0.75]) {
      const t = newtonIterate2([t1, t2], f1, f2, delta2)
      if (t !== undefined) {
        ts.push(t)
      }
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isValidPercent(v[0]) && isValidPercent(v[1])).map(t => {
    return [p1(t[0]), p2(t[1])]
  })
}
