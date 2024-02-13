import { rotatePositionByCenter } from "./position";
import { AngleRange } from "./angle";
import { rotatePosition } from "./position";
import { getDirectionByRadian } from "./radian";
import { getAngleRange } from "./angle";
import { isSameNumber } from "./math";
import { Position } from "./position";
import { angleInRange } from "./angle";
import { angleToRadian, radianToAngle } from "./radian";
import { number, minimum, optional, and } from "./validators";
import { calculateEquation2 } from "./equation-calculater";
import { getPointSideOfLine, twoPointLineToGeneralFormLine } from "./line";
import { Arc } from "./circle";

export function pointIsOnEllipseArc(p: Position, ellipseArc: EllipseArc) {
  const angle = getEllipseAngle(p, ellipseArc)
  return angleInRange(angle, ellipseArc)
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
  for (let i = 0; i < lineSegmentCount; i++) {
    const radian = angleToRadian(angleDelta * i)
    points.push(getEllipsePointAtRadian(content, radian))
  }
  return points
}

export function ellipseArcToPolyline(content: EllipseArc, angleDelta: number) {
  return getAngleRange(content, angleDelta).map(i => getEllipseArcPointAtAngle(content, i))
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
    const firstSide = getPointSideOfLine(centers[0], twoPointLineToGeneralFormLine(from, to))
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
