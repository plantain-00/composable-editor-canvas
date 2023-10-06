import { Position, Circle, getTwoPointsRadian, getPointSideOfLine, getCirclePointAtRadian, getTwoPointsDistance, Ellipse, getEllipseRadian, Arc, pointIsOnLineSegment, twoPointLineToGeneralFormLine, EllipseArc, angleInRange, getArcPointAtAngle, getEllipseArcPointAtAngle, getEllipsePointAtRadian, TwoPointsFormRegion, getPolygonFromTwoPointsFormRegion, getPolygonLine, GeneralFormLine } from "./geometry"
import { GeometryLine } from "./intersection"
import { angleToRadian, radianToAngle } from "./radian"

export function getPerpendicular(point: Position, line: GeneralFormLine) {
  return {
    a: -line.b,
    b: line.a,
    c: point.x * line.b - line.a * point.y,
  }
}

export function getPerpendicularPoint(p: Position, { a, b, c }: GeneralFormLine): Position {
  const d = a ** 2
  const e = b ** 2
  const f = d + e
  const g = -a * b
  return {
    x: (e * p.x + g * p.y - a * c) / f,
    y: (g * p.x + d * p.y - b * c) / f,
  }
}

export function getPerpendicularPointToCircle(position: Position, circle: Circle, near = position) {
  let radian = getTwoPointsRadian(position, circle)
  if (position !== near) {
    // (y - cy)/(x - cx)(cy - y0)/(cx - x0) = -1
    const a1 = circle.x - position.x, a2 = circle.y - position.y
    // (y - cy)a2 + (x - cx)a1 = 0
    // a1 x + a2 y + -a2 cy - a1 cx = 0
    const line = { a: a1, b: a2, c: -a2 * circle.y - a1 * circle.x }
    if (Math.sign(getPointSideOfLine(position, line)) !== Math.sign(getPointSideOfLine(near, line))) {
      radian += Math.PI
    }
  }
  const point = getCirclePointAtRadian(circle, radian)
  return {
    point,
    distance: getTwoPointsDistance(position, point),
    radian,
  }
}

export function getPerpendicularPointRadianToEllipse(position: Position, ellipse: Ellipse, near = position, delta = 1e-5) {
  const { rx, ry, cx, cy, angle } = ellipse
  const r0 = getEllipseRadian(near, ellipse)
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  const a0 = position.x - cx, a1 = position.y - cy
  // x = d2 rx cos - d1 ry sin + cx
  // y = d1 rx cos + d2 ry sin + cy
  // d = (x - a0 - cx)^2 + (y - a1 - cy)^2
  // replace x, y, group sin: d = ry ry sin sin + 2(a0 d1 + -d2 a1) ry sin + rx rx cos cos - 2(a0 d2 + d1 a1) rx cos + a0 a0 + a1 a1
  // d' = (2 ry ry sin + 2(a0 d1 + -d2 a1) ry) cos + (2 rx rx cos - 2(a0 d2 + d1 a1) rx)(-sin)
  // d' = 2((a0 d1 - d2 a1) ry cos + (ry ry - rx rx) sin cos + (a0 d2 + d1 a1)rx sin)
  // (d'/2)' = (a0 d1 - d2 a1) ry(-sin) + (ry ry - rx rx)(cos cos - sin sin) + (a0 d2 + d1 a1)rx cos
  const b1 = (a0 * d1 - d2 * a1) * ry, b2 = ry * ry - rx * rx, b3 = (a0 * d2 + d1 * a1) * rx
  const f1 = (cos: number, sin: number) => b1 * cos + b2 * sin * cos + b3 * sin
  const f2 = (cos: number, sin: number) => b1 * -sin + b2 * (cos * cos - sin * sin) + b3 * cos
  let r = r0
  for (; ;) {
    if (Math.abs(f1(Math.cos(r), Math.sin(r))) < delta) break
    const cos = Math.cos(r)
    const sin = Math.sin(r)
    r = r - f1(cos, sin) / f2(cos, sin)
  }
  return r
}

export function getPointAndLineSegmentNearestPointAndDistance(position: Position, point1: Position, point2: Position) {
  const perpendicularPoint = getPerpendicularPoint(position, twoPointLineToGeneralFormLine(point1, point2))
  if (pointIsOnLineSegment(perpendicularPoint, point1, point2)) {
    return {
      point: perpendicularPoint,
      distance: getTwoPointsDistance(position, perpendicularPoint),
    }
  }
  const d1 = getTwoPointsDistance(position, point1)
  const d2 = getTwoPointsDistance(position, point2)
  if (d1 < d2) {
    return {
      point: point1,
      distance: d1,
    }
  }
  return {
    point: point2,
    distance: d2,
  }
}

export function getPointAndGeometryLineNearestPointAndDistance(p: Position, line: GeometryLine) {
  if (Array.isArray(line)) {
    return getPointAndLineSegmentNearestPointAndDistance(p, ...line)
  }
  if (line.type === 'ellipse arc') {
    return getPointAndEllipseArcNearestPointAndDistance(p, line.ellipseArc)
  }
  return getPointAndArcNearestPointAndDistance(p, line.arc)
}

export function getPointAndArcNearestPointAndDistance(position: Position, arc: Arc) {
  const { point, distance, radian } = getPerpendicularPointToCircle(position, arc)
  if (angleInRange(radianToAngle(radian), arc)) {
    return { point, distance }
  }
  const point3 = getArcPointAtAngle(arc, arc.startAngle)
  const point4 = getArcPointAtAngle(arc, arc.endAngle)
  const d3 = getTwoPointsDistance(position, point3)
  const d4 = getTwoPointsDistance(position, point4)
  if (d3 < d4) {
    return {
      point: point3,
      distance: d3,
    }
  }
  return {
    point: point4,
    distance: d4,
  }
}

export function getPointAndEllipseArcNearestPointAndDistance(position: Position, ellipseArc: EllipseArc) {
  const radian = getPerpendicularPointRadianToEllipse(position, ellipseArc)
  if (angleInRange(radianToAngle(radian), ellipseArc)) {
    const point = getEllipsePointAtRadian(ellipseArc, radian)
    return {
      point,
      distance: getTwoPointsDistance(position, point),
    }
  }
  const point3 = getEllipseArcPointAtAngle(ellipseArc, ellipseArc.startAngle)
  const point4 = getEllipseArcPointAtAngle(ellipseArc, ellipseArc.endAngle)
  const d3 = getTwoPointsDistance(position, point3)
  const d4 = getTwoPointsDistance(position, point4)
  if (d3 < d4) {
    return {
      point: point3,
      distance: d3,
    }
  }
  return {
    point: point4,
    distance: d4,
  }
}

export function getPointAndGeometryLineMinimumDistance(p: Position, line: GeometryLine) {
  if (Array.isArray(line)) {
    return getPointAndLineSegmentMinimumDistance(p, ...line)
  }
  if (line.type === 'ellipse arc') {
    return getPointAndGeometryLineNearestPointAndDistance(p, line).distance
  }
  return getPointAndArcMinimumDistance(p, line.arc)
}

export function getPointAndLineSegmentMinimumDistance(position: Position, point1: Position, point2: Position) {
  const { distance } = getPointAndLineSegmentNearestPointAndDistance(position, point1, point2)
  return distance
}

export function getPointAndRegionMinimumDistance(position: Position, region: TwoPointsFormRegion) {
  return getPointAndPolygonMinimumDistance(position, getPolygonFromTwoPointsFormRegion(region))
}

export function getPointAndPolygonMinimumDistance(position: Position, polygon: Position[]) {
  const polygonLine = Array.from(getPolygonLine(polygon))
  return Math.min(...polygonLine.map((r) => getPointAndLineSegmentMinimumDistance(position, ...r)))
}

export function getPointAndArcMinimumDistance(position: Position, arc: Arc) {
  const { distance } = getPointAndArcNearestPointAndDistance(position, arc)
  return distance
}
