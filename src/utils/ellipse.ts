import { getPointByLengthAndRadian, rotatePositionByCenter, vec2ToPosition } from "./position";
import { AngleRange } from "./angle";
import { rotatePosition } from "./position";
import { getDirectionByRadian } from "./radian";
import { getAngleRange } from "./angle";
import { NOT_EXTENDED, equals, isSameNumber } from "./math";
import { Position } from "./position";
import { angleInRange } from "./angle";
import { angleToRadian, radianToAngle } from "./radian";
import { number, minimum, optional, and } from "./validators";
import { calculateEquation2 } from "./equation-calculater";
import { getPointSideOfLine, twoPointLineToGeneralFormLine } from "./line";
import { Arc } from "./circle";
import { slice2, Tuple3, Tuple5, Vec3 } from "./types";
import { getCoordinateMatrix2D } from "./transform";
import { matrix } from "./matrix";

export function pointIsOnEllipseArc(p: Position, ellipseArc: EllipseArc, extend = NOT_EXTENDED) {
  if (extend.head && extend.body && extend.tail) return true
  if (!extend.head && !extend.body && !extend.tail) return false
  const angle = getEllipseAngle(p, ellipseArc)
  const inRange = angleInRange(angle, ellipseArc)
  if (extend.body && inRange) return true
  if ((extend.head || extend.tail) && !inRange) return true
  return false
}

export function pointIsOnEllipse({ x, y }: Position, { cx, cy, rx, ry, angle }: Ellipse) {
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian)
  const d2 = Math.cos(radian)
  // (d2(x - cx) + d1(y - cy))^2/rx/rx + (-d1(x - cx) + d2(y - cy))^2/ry/ry = 1
  return isSameNumber((d2 * (x - cx) + d1 * (y - cy)) ** 2 / rx / rx + (-d1 * (x - cx) + d2 * (y - cy)) ** 2 / ry / ry, 1)
}

export function rotatePositionByEllipseCenter(p: Position, content: Ellipse) {
  return rotatePositionByCenter(p, getEllipseCenter(content), -(content.angle ?? 0))
}

export function getEllipseRadiusOfAngle(ellipse: Ellipse, radian: number) {
  if (ellipse.angle) {
    radian -= angleToRadian(ellipse.angle)
  }
  return ellipse.rx * ellipse.ry / Math.sqrt((ellipse.rx * Math.sin(radian)) ** 2 + (ellipse.ry * Math.cos(radian)) ** 2)
}

export interface Ellipse {
  cx: number
  cy: number
  rx: number
  ry: number
  angle?: number
}

export const Ellipse = {
  cx: number,
  cy: number,
  rx: /* @__PURE__ */ minimum(0, number),
  ry: /* @__PURE__ */ minimum(0, number),
  angle: /* @__PURE__ */ optional(number),
}

export interface EllipseArc extends Ellipse, AngleRange {
}

export const EllipseArc = /* @__PURE__ */ and(Ellipse, AngleRange)

export function isSameEllipse(ellipse1: Ellipse, ellipse2: Ellipse): boolean {
  return isSameNumber(ellipse1.cx, ellipse2.cx) &&
    isSameNumber(ellipse1.cy, ellipse2.cy) &&
    isSameNumber(ellipse1.rx, ellipse2.rx) &&
    isSameNumber(ellipse1.ry, ellipse2.ry) &&
    equals(ellipse1.angle, ellipse2.angle)
}

export function getEllipseAngle(p: Position, ellipse: Ellipse) {
  return radianToAngle(getEllipseRadian(p, ellipse))
}

export function getEllipseRadian(p: Position, ellipse: Ellipse) {
  const newPosition = rotatePositionByCenter(p, getEllipseCenter(ellipse), ellipse.angle ?? 0)
  return Math.atan2((newPosition.y - ellipse.cy) / ellipse.ry, (newPosition.x - ellipse.cx) / ellipse.rx)
}

export function getEllipseCenter(ellipse: Ellipse) {
  return { x: ellipse.cx, y: ellipse.cy }
}

export function getEllipsePointAtRadian(content: Ellipse, radian: number) {
  const direction = getDirectionByRadian(radian)
  const p = {
    x: content.cx + content.rx * direction.x,
    y: content.cy + content.ry * direction.y,
  }
  if (content.angle) {
    return rotatePosition(p, getEllipseCenter(content), angleToRadian(content.angle))
  } else {
    return p
  }
}

export function ellipseToPolygon(content: Ellipse, angleDelta: number) {
  const lineSegmentCount = 360 / angleDelta
  const points: Position[] = []
  const m = getCoordinateMatrix2D(getEllipseCenter(content), angleToRadian(content.angle))
  for (let i = 0; i < lineSegmentCount; i++) {
    const radian = angleToRadian(angleDelta * i)
    const vec = getEllipseCoordinateVec2DAtRadian(content, radian)
    const p = matrix.multiplyVec(m, vec)
    points.push(vec2ToPosition(slice2(p)))
  }
  return points
}

export function ellipseArcToPolyline(content: EllipseArc, angleDelta: number): Position[] {
  const m = getCoordinateMatrix2D(getEllipseCenter(content), angleToRadian(content.angle))
  return getAngleRange(content, angleDelta).map(i => {
    const vec = getEllipseCoordinateVec2DAtRadian(content, angleToRadian(i))
    const p = matrix.multiplyVec(m, vec)
    return vec2ToPosition(slice2(p))
  })
}

export function getEllipseCoordinateVec2DAtRadian(content: Ellipse, radian: number): Vec3 {
  const direction = getDirectionByRadian(radian)
  return [content.rx * direction.x, content.ry * direction.y, 1]
}

export function getEllipseArcPointAtAngle(content: EllipseArc, angle: number) {
  return getEllipsePointAtRadian(content, angleToRadian(angle))
}

export function getEllipseArcStartAndEnd(arc: EllipseArc) {
  return {
    start: getEllipseArcPointAtAngle(arc, arc.startAngle),
    end: getEllipseArcPointAtAngle(arc, arc.endAngle),
  }
}

export function ellipseToEllipseArc(ellipse: Ellipse): EllipseArc {
  return {
    ...ellipse,
    startAngle: 0,
    endAngle: 360,
  }
}

export function arcToEllipseArc(arc: Arc): EllipseArc {
  return {
    ...arc,
    cx: arc.x,
    cy: arc.y,
    rx: arc.r,
    ry: arc.r,
  }
}

export function getEllipseArcByStartEnd(
  from: Position,
  rx: number,
  ry: number,
  angle: number,
  largeArc: boolean,
  sweep: boolean,
  to: Position
): EllipseArc | undefined {
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian), d3 = 1 / rx / rx, d4 = 1 / ry / ry
  const f1 = from.x, f2 = from.y, f3 = to.x, f4 = to.y
  // (d2(f1 - cx) + d1(f2 - cy))^2 d3 + (-d1(f1 - cx) + d2(f2 - cy))^2 d4 - 1 = 0
  // let u = f1 - cx, v = f2 - cy
  // (d2 u + d1 v)^2 d3 + (-d1 u + d2 v)^2 d4 - 1 = 0
  // group u,v F1: (d2 d2 d3 + d1 d1 d4) u u + 2 d1 d2(d3 - d4) v u + (d1 d1 d3 + d2 d2 d4) v v + -1 = 0
  // (d2(f3 - cx) + d1(f4 - cy))^2 d3 + (-d1(f3 - cx) + d2(f4 - cy))^2 d4 - 1 = 0
  const e1 = f3 - f1, e2 = f4 - f2
  // (d2(e1 + u) + d1(e2 + v))^2 d3 + (-d1(e1 + u) + d2(e2 + v))^2 d4 - 1 = 0
  // - F1: group u,v: 2((d2 d2 d3 + d1 d1 d4) e1 + (d3 - d4) d1 d2 e2) u + 2((d3 - d4)d1 d2 e1 + (d1 d1 d3 + d2 d2 d4) e2) v + (d2 d2 d3 + d1 d1 d4) e1 e1 + 2 d1 d2 (d3 - d4) e1 e2 + (d1 d1 d3 + 2 d2 d4) e2 e2 = 0
  const g1 = d2 * d2 * d3 + d1 * d1 * d4, g2 = d1 * d1 * d3 + d2 * d2 * d4, g3 = d3 - d4
  // F2: g1 u u + 2 d1 d2 g3 v u + g2 v v + -1 = 0
  // 2(g1 e1 + g3 d1 d2 e2) u + 2(g3 d1 d2 e1 + g2 e2) v + g1 e1 e1 + 2 d1 d2 g3 e1 e2 + g2 e2 e2 = 0
  const h2 = 2 * (g3 * d1 * d2 * e1 + g2 * e2), h1 = 2 * (g1 * e1 + g3 * d1 * d2 * e2) / h2, h3 = (g1 * e1 * e1 + 2 * d1 * d2 * g3 * e1 * e2 + g2 * e2 * e2) / h2
  // v = -(h1 u + h3)
  // replace F2 with v: (g1 + -2 d1 d2 g3 h1 + g2 h1 h1) u u + (-2 d1 d2 g3 h3 + 2 g2 h1 h3) u + g2 h3 h3 + -1 = 0
  const us = calculateEquation2(g1 - 2 * d1 * d2 * g3 * h1 + g2 * h1 * h1, -2 * d1 * d2 * g3 * h3 + 2 * g2 * h1 * h3, g2 * h3 * h3 - 1)
  if (us.length === 0) return
  const centers = us.map(u => ({
    x: f1 - u,
    y: f2 + h1 * u + h3,
  }))
  let index: number
  if (centers.length === 1) {
    index = 0
  } else {
    const line = twoPointLineToGeneralFormLine(from, to)
    if (!line) return
    const firstSide = getPointSideOfLine(centers[0], line)
    if (firstSide > 0) {
      index = largeArc === sweep ? 0 : 1
    } else {
      index = largeArc !== sweep ? 0 : 1
    }
  }
  const center = centers[index]
  const ellipse: Ellipse = { cx: center.x, cy: center.y, rx, ry, angle }
  return {
    ...ellipse,
    startAngle: getEllipseAngle(from, ellipse),
    endAngle: getEllipseAngle(to, ellipse),
    counterclockwise: !sweep,
  }
}

export function getEllipseDerivatives({ rx, ry, cx, cy, angle }: Ellipse): Tuple5<(t: number) => Position> {
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  // x = d2 rx cos(t) - d1 ry sin(t) + cx
  // x' = (-(d2 rx sin(t))) - d1 ry cos(t)
  // x'' = d1 ry sin(t) + (-(d2 rx cos(t)))
  // x''' = d1 ry cos(t) + d2 rx sin(t)
  // x'''' = d2 rx cos(t) - d1 ry sin(t)

  // y = d1 rx cos(t) + d2 ry sin(t) + cy
  // y' = (-(d1 rx sin(t))) + d2 ry cos(t)
  // y'' = (-(d1 rx cos(t))) + (-(d2 ry sin(t)))
  // y''' = d1 rx sin(t) + (-(d2 ry cos(t)))
  // y'''' = d1 rx cos(t) + d2 ry sin(t)
  return [
    t => ({ x: d2 * rx * Math.cos(t) - d1 * ry * Math.sin(t) + cx, y: d1 * rx * Math.cos(t) + d2 * ry * Math.sin(t) + cy }),
    t => ({ x: -(d2 * rx * Math.sin(t)) - d1 * ry * Math.cos(t), y: -(d1 * rx * Math.sin(t)) + d2 * ry * Math.cos(t) }),
    t => ({ x: d1 * ry * Math.sin(t) + -(d2 * rx * Math.cos(t)), y: -(d1 * rx * Math.cos(t)) + -(d2 * ry * Math.sin(t)) }),
    t => ({ x: d1 * ry * Math.cos(t) + d2 * rx * Math.sin(t), y: d1 * rx * Math.sin(t) + -(d2 * ry * Math.cos(t)) }),
    t => ({ x: d2 * rx * Math.cos(t) - d1 * ry * Math.sin(t), y: d1 * rx * Math.cos(t) + d2 * ry * Math.sin(t) }),
  ]
}

export function getEllipseArcDerivatives({ rx, ry, cx, cy, angle, startAngle, endAngle }: EllipseArc): Tuple3<(t: number) => Position> {
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  const e3 = angleToRadian(endAngle - startAngle), t1 = angleToRadian(startAngle)
  // t = e3 u + t1
  // x = d2 rx cos(t) - d1 ry sin(t) + cx
  // x' = ((-(d2 rx sin(t))) - d1 ry cos(t)) e3
  // x'' = (d1 ry sin(t) + (-(d2 rx cos(t)))) e3 e3

  // y = d1 rx cos(t) + d2 ry sin(t) + cy
  // y' = ((-(d1 rx sin(t))) + d2 ry cos(t)) e3
  // y'' = ((-(d1 rx cos(t))) + (-(d2 ry sin(t)))) e3 e3
  return [
    u => {
      const t = e3 * u + t1
      return { x: d2 * rx * Math.cos(t) - d1 * ry * Math.sin(t) + cx, y: d1 * rx * Math.cos(t) + d2 * ry * Math.sin(t) + cy }
    },
    u => {
      const t = e3 * u + t1
      return { x: (-(d2 * rx * Math.sin(t)) - d1 * ry * Math.cos(t)) * e3, y: (-(d1 * rx * Math.sin(t)) + d2 * ry * Math.cos(t)) * e3 }
    },
    u => {
      const t = e3 * u + t1
      return { x: (d1 * ry * Math.sin(t) + -(d2 * rx * Math.cos(t))) * e3 * e3, y: (-(d1 * rx * Math.cos(t)) + -(d2 * ry * Math.sin(t))) * e3 * e3 }
    },
  ]
}

export function getEllipseCurvatureAtRadian({ rx, ry }: Ellipse, t: number): number {
  // const radian = angleToRadian(angle)
  // const d1 = Math.sin(radian), d2 = Math.cos(radian)
  // x = d2 rx cos(t) - d1 ry sin(t) + cx
  // x1 = (-(d2 rx sin(t))) - d1 ry cos(t)
  // x2 = d1 ry sin(t) + (-(d2 rx cos(t)))
  // y = d1 rx cos(t) + d2 ry sin(t) + cy
  // y1 = (-(d1 rx sin(t))) + d2 ry cos(t)
  // y2 = (-(d1 rx cos(t))) + (-(d2 ry sin(t)))
  // (x1 y2 - y1 x2)/(x1 ** 2 + y1 ** 2)**1.5
  // rx ry/(cos(t) cos(t) ry ry + rx rx sin(t) sin(t))**1.5
  return rx * ry / ((rx * Math.sin(t)) ** 2 + (ry * Math.cos(t)) ** 2) ** 1.5
}

export function getEllipseArcCurvatureAtRadian(ellipse: EllipseArc, t: number): number {
  const result = getEllipseCurvatureAtRadian(ellipse, t)
  return ellipse.counterclockwise ? -result : result
}

export function getEllipseFocus(ellipse: Ellipse): Position[] {
  const center = getEllipseCenter(ellipse)
  if (isSameNumber(ellipse.rx, ellipse.ry)) {
    return [center]
  }
  const c = Math.sqrt(Math.abs(ellipse.rx ** 2 - ellipse.ry ** 2))
  const radian = angleToRadian((ellipse.angle || 0) + (ellipse.rx < ellipse.ry ? 90 : 0))
  return [
    getPointByLengthAndRadian(center, c, radian),
    getPointByLengthAndRadian(center, -c, radian),
  ]
}
