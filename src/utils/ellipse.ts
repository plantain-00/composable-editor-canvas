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
  rx: minimum(0, number),
  ry: minimum(0, number),
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
