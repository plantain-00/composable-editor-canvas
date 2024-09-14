import { calculateEquation2 } from "./equation-calculater"
import { isValidPercent, isZero } from "./math"
import { Position } from "./position"
import { TwoPointsFormRegion } from "./region"
import { angleInRange } from "./angle"
import { getEllipseArcStartAndEnd } from "./ellipse"
import { getEllipsePointAtRadian } from "./ellipse"
import { getArcStartAndEnd } from "./circle"
import { EllipseArc } from "./ellipse"
import { Arc, Circle } from "./circle"
import { Ellipse } from "./ellipse"
import { pointIsOnArc } from "./circle"
import { GeometryLine } from "./geometry-line"
import { QuadraticCurve } from "./bezier"
import { BezierCurve } from "./bezier"
import { getNurbsPoints } from "./nurbs"
import { angleToRadian, radianToAngle } from "./radian"
import { number } from "./validators"
import { getHyperbolaBounding } from "./hyperbola"

export interface Bounding {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export const Bounding = {
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
}

export function getPointsBounding(points: Position[]): TwoPointsFormRegion | undefined {
  if (points.length === 0) {
    return;
  }
  return getPointsBoundingUnsafe(points);
}

export function mergeBoundingsUnsafe(boundings: TwoPointsFormRegion[]): TwoPointsFormRegion {
  return getPointsBoundingUnsafe(boundings.map(b => [b.start, b.end]).flat());
}

export function mergeBoundings(boundings: (TwoPointsFormRegion | undefined)[]): TwoPointsFormRegion | undefined {
  const points: Position[] = []
  for (const b of boundings) {
    if (b) {
      points.push(b.start, b.end)
    }
  }
  if (points.length === 0) return
  return getPointsBoundingUnsafe(points)
}

export function getPointsBoundingUnsafe(points: Position[]): TwoPointsFormRegion {
  const result = {
    start: {
      x: points[0].x,
      y: points[0].y,
    },
    end: {
      x: points[0].x,
      y: points[0].y,
    },
  };
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.x < result.start.x) {
      result.start.x = p.x;
    }
    if (p.y < result.start.y) {
      result.start.y = p.y;
    }
    if (p.x > result.end.x) {
      result.end.x = p.x;
    }
    if (p.y > result.end.y) {
      result.end.y = p.y;
    }
  }
  return result;
}

export function getCircleQuadrantPoints(circle: Circle): (Position & { radian: number })[] {
  return [
    { x: circle.x - circle.r, y: circle.y, radian: Math.PI },
    { x: circle.x, y: circle.y - circle.r, radian: -Math.PI / 2 },
    { x: circle.x + circle.r, y: circle.y, radian: 0 },
    { x: circle.x, y: circle.y + circle.r, radian: Math.PI / 2 },
  ]
}

export function getCircleBounding(circle: Circle) {
  const points = getCircleQuadrantPoints(circle)
  return getPointsBoundingUnsafe(points)
}

export function getArcBounding(arc: Arc) {
  const points = getCircleQuadrantPoints(arc).filter(p => pointIsOnArc(p, arc))
  const { start, end } = getArcStartAndEnd(arc)
  return getPointsBoundingUnsafe([...points, start, end])
}

export function getEllipseBoundingRadians(ellipse: Ellipse): number[] {
  const { rx, ry, angle } = ellipse
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  // x = d2 rx cos(t) - d1 ry sin(t) + cx
  // y = d1 rx cos(t) + d2 ry sin(t) + cy
  // x' = -cos(t) d1 ry - d2 rx sin(t) = 0
  // y' = cos(t) d2 ry - d1 rx sin(t) = 0
  // tan(t) = -d1 ry / d2 / rx
  // tan(t) = d2 ry / d1 / rx
  const t1 = Math.atan2(-d1 * ry, d2 * rx)
  const t2 = Math.atan2(d2 * ry, d1 * rx)
  return [t1, t2, t1 + Math.PI, t2 + Math.PI]
}

export function getEllipseBounding(ellipse: Ellipse) {
  return getPointsBoundingUnsafe(getEllipseBoundingRadians(ellipse).map(t => getEllipsePointAtRadian(ellipse, t)))
}

export function getEllipseArcBounding(ellipseArc: EllipseArc) {
  const { start, end } = getEllipseArcStartAndEnd(ellipseArc)
  const points = [start, end]
  for (const t of getEllipseBoundingRadians(ellipseArc)) {
    if (angleInRange(radianToAngle(t), ellipseArc)) {
      points.push(getEllipsePointAtRadian(ellipseArc, t))
    }
  }
  return getPointsBoundingUnsafe([...points, start, end])
}

export function getQuadraticCurveBounding({ from: { x: a1, y: b1 }, cp: { x: a2, y: b2 }, to: { x: a3, y: b3 } }: QuadraticCurve) {
  const c1 = a2 - a1, c2 = a3 - a2 - c1, c3 = b2 - b1, c4 = b3 - b2 - c3
  // x = c2 t t + 2 c1 t + a1
  // y = c4 t t + 2 c3 t + b1
  // x' = 2 c2 t + 2 c1 = 0
  // y' = 2 c4 t + 2 c3 = 0
  const points = [{ x: a1, y: b1 }, { x: a3, y: b3 }]
  if (!isZero(c2)) {
    const t = -c1 / c2
    if (isValidPercent(t)) {
      points.push({
        x: c2 * t * t + 2 * c1 * t + a1,
        y: c4 * t * t + 2 * c3 * t + b1,
      })
    }
  }
  if (!isZero(c4)) {
    const t = -c3 / c4
    if (isValidPercent(t)) {
      points.push({
        x: c2 * t * t + 2 * c1 * t + a1,
        y: c4 * t * t + 2 * c3 * t + b1,
      })
    }
  }
  return getPointsBoundingUnsafe(points)
}

export function getBezierCurveBounding({ from: { x: a1, y: b1 }, cp1: { x: a2, y: b2 }, cp2: { x: a3, y: b3 }, to: { x: a4, y: b4 } }: BezierCurve) {
  const c1 = -a1 + 3 * a2 + -3 * a3 + a4, c2 = 3 * (a1 - 2 * a2 + a3), c3 = 3 * (a2 - a1)
  const c4 = -b1 + 3 * b2 + -3 * b3 + b4, c5 = 3 * (b1 - 2 * b2 + b3), c6 = 3 * (b2 - b1)
  // x = c1 t t t + c2 t t + c3 t + a1
  // y = c4 t t t + c5 t t + c6 t + b1
  // x' = 3 c1 t t + 2 c2 t + c3 = 0
  // y' = 3 c4 t t + 2 c5 t + c6 = 0
  const points = [{ x: a1, y: b1 }, { x: a4, y: b4 }]
  for (const t of calculateEquation2(3 * c1, 2 * c2, c3)) {
    if (isValidPercent(t)) {
      points.push({
        x: c1 * t * t * t + c2 * t * t + c3 * t + a1,
        y: c4 * t * t * t + c5 * t * t + c6 * t + b1,
      })
    }
  }
  for (const t of calculateEquation2(3 * c4, 2 * c5, c6)) {
    if (isValidPercent(t)) {
      points.push({
        x: c1 * t * t * t + c2 * t * t + c3 * t + a1,
        y: c4 * t * t * t + c5 * t * t + c6 * t + b1,
      })
    }
  }
  return getPointsBoundingUnsafe(points)
}

export function getGeometryLinesBounding(lines: GeometryLine[], segmentCount = 100): TwoPointsFormRegion | undefined {
  const boundings: TwoPointsFormRegion[] = []
  for (const line of lines) {
    const bounding = getGeometryLineBounding(line, segmentCount)
    if (!bounding) return
    boundings.push(bounding)
  }
  return mergeBoundings(boundings)
}

export function getGeometryLineBounding(line: GeometryLine, segmentCount = 100): TwoPointsFormRegion | undefined {
  if (Array.isArray(line)) {
    return getPointsBoundingUnsafe(line)
  }
  if (line.type === 'arc') {
    return getArcBounding(line.curve)
  }
  if (line.type === 'ellipse arc') {
    return getEllipseArcBounding(line.curve)
  }
  if (line.type === 'quadratic curve') {
    return getQuadraticCurveBounding(line.curve)
  }
  if (line.type === 'bezier curve') {
    return getBezierCurveBounding(line.curve)
  }
  if (line.type === 'hyperbola curve') {
    return getHyperbolaBounding(line.curve)
  }
  if (line.type === 'ray') {
    return
  }
  return getPointsBounding(getNurbsPoints(line.curve.degree, line.curve.points, line.curve.knots, line.curve.weights, segmentCount))
}
