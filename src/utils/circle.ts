import { AngleRange, getLargeArc } from "./angle";
import { getTwoPointsRadian } from "./radian";
import { isZero, NOT_EXTENDED } from "./math";
import { getTwoPointCenter, isSamePoint } from "./position";
import { getPointByLengthAndRadian } from "./position";
import { getAngleRange } from "./angle";
import { isSameNumber } from "./math";
import { Position } from "./position";
import { getTwoPointsDistance } from "./position";
import { angleInRange } from "./angle";
import { angleToRadian, radianToAngle } from "./radian"
import { and, minimum, number } from "./validators";
import { getTwoGeneralFormLinesIntersectionPoint } from "./intersection";
import { twoPointLineToGeneralFormLine } from "./line";
import { getPerpendicularLine } from "./perpendicular";
import { Tuple3, Tuple5 } from "./types";

export function pointIsOnArc(p: Position, arc: Arc, extend = NOT_EXTENDED) {
  if (extend.head && extend.body && extend.tail) return true
  if (!extend.head && !extend.body && !extend.tail) return false
  const radian = getCircleRadian(p, arc)
  const inRange = angleInRange(radianToAngle(radian), arc)
  if (extend.body && inRange) return true
  if ((extend.head || extend.tail) && !inRange) return true
  return false
}

export function pointIsOnCircle(p: Position, circle: Circle) {
  return isSameNumber(getTwoPointsDistance(p, circle), circle.r)
}

export function getThreePointsCircle(startPosition: Position, { x: x2, y: y2 }: Position, { x: x3, y: y3 }: Position) {
  const { x: x1, y: y1 } = startPosition
  const a = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2))
  const b = x1 ** 2 + y1 ** 2
  const c = x2 ** 2 + y2 ** 2
  const d = x3 ** 2 + y3 ** 2
  const center = {
    x: (b * (y2 - y3) + c * (y3 - y1) + d * (y1 - y2)) / a,
    y: (b * (x3 - x2) + c * (x1 - x3) + d * (x2 - x1)) / a,
  }
  return {
    ...center,
    r: getTwoPointsDistance(center, startPosition),
  }
}

export interface Circle extends Position {
  r: number
}

export const Circle = /* @__PURE__ */ and(Position, {
  r: /* @__PURE__ */ minimum(0, number),
})

export interface Arc extends Circle, AngleRange {
}

export const Arc = /* @__PURE__ */ and(Circle, AngleRange)

export function isSameCircle(circle1: Circle, circle2: Circle): boolean {
  return isSamePoint(circle1, circle2) && isSameNumber(circle1.r, circle2.r)
}

export function getCircleRadian(p: Position, circle: Circle) {
  return getTwoPointsRadian(p, circle)
}

export function arcToPolyline(content: Arc, angleDelta: number) {
  return getAngleRange(content, angleDelta).map(i => getArcPointAtAngle(content, i))
}

export function getArcStartAndEnd(arc: Arc) {
  return {
    start: getArcPointAtAngle(arc, arc.startAngle),
    end: getArcPointAtAngle(arc, arc.endAngle),
  }
}

export function getArcPointAtAngle(content: Circle, angle: number) {
  return getCirclePointAtRadian(content, angleToRadian(angle))
}

export function getCirclePointAtRadian(content: Circle, radian: number) {
  return getPointByLengthAndRadian(content, content.r, radian)
}

export function circleToArc(circle: Circle): Arc {
  return {
    ...circle,
    startAngle: 0,
    endAngle: 360,
  }
}

export function getArcByStartEnd(from: Position, r: number, largeArc: boolean, sweep: boolean, to: Position): Arc | undefined {
  const c = getTwoPointCenter(from, to)
  const distance = getTwoPointsDistance(from, to) / 2
  if (isZero(distance)) return
  if (distance > r) {
    r = distance
  }
  let center: Position
  if (isSameNumber(distance, r)) {
    center = c
  } else {
    const d = Math.sqrt(r ** 2 - distance ** 2)
    const radian = getTwoPointsRadian(to, from)
    center = getPointByLengthAndRadian(c, d, radian + Math.PI / 2 * (largeArc === sweep ? -1 : 1))
  }
  const circle: Circle = { x: center.x, y: center.y, r }
  return {
    ...circle,
    startAngle: radianToAngle(getCircleRadian(from, circle)),
    endAngle: radianToAngle(getCircleRadian(to, circle)),
    counterclockwise: !sweep,
  }
}

export function getArcControlPoint(arc: Arc): Position | undefined {
  const start = getCirclePointAtRadian(arc, angleToRadian(arc.startAngle))
  const lineStart = twoPointLineToGeneralFormLine(arc, start)
  if (!lineStart) return
  const end = getCirclePointAtRadian(arc, angleToRadian(arc.endAngle))
  const lineEnd = twoPointLineToGeneralFormLine(arc, end)
  if (!lineEnd) return
  const line1 = getPerpendicularLine(start, lineStart)
  const line2 = getPerpendicularLine(end, lineEnd)
  return getTwoGeneralFormLinesIntersectionPoint(line1, line2)
}

export function getArcByStartEndBulge(start: Position, end: Position, bulge: number): Arc {
  const p = getPointByLengthAndRadian(
    getTwoPointCenter(start, end),
    bulge * getTwoPointsDistance(start, end) / 2,
    getTwoPointsRadian(end, start) - Math.PI / 2,
  )
  const circle = getThreePointsCircle(start, end, p)
  return {
    ...circle,
    startAngle: radianToAngle(getTwoPointsRadian(start, circle)),
    endAngle: radianToAngle(getTwoPointsRadian(end, circle)),
    counterclockwise: bulge < 0,
  }
}

export function getArcBulgeByStartEndRadius(start: Position, end: Position, radius: number, oldBulge?: number) {
  let radian = Math.asin(getTwoPointsDistance(start, end) / 2 / radius)
  if (oldBulge) {
    if (Math.abs(oldBulge) > 1) {
      radian = Math.PI - radian
    }
    if (oldBulge < 0) {
      radian = -radian
    }
  }
  return Math.tan(radian / 2)
}

export function getArcBulge(arc: Arc, start?: Position, end?: Position) {
  if (!start) {
    start = getArcPointAtAngle(arc, arc.startAngle)
  }
  if (!end) {
    end = getArcPointAtAngle(arc, arc.endAngle)
  }
  let bulge = getArcBulgeByStartEndRadius(start, end, arc.r)
  if (getLargeArc(arc)) {
    bulge = 1 / bulge
  }
  if (arc.counterclockwise) {
    bulge = -bulge
  }
  return bulge
}

export function getArcBulgeByStartEndPoint(start: Position, end: Position, point: Position) {
  const circle = getThreePointsCircle(start, end, point)
  const startAngle = radianToAngle(getCircleRadian(start, circle))
  const endAngle = radianToAngle(getCircleRadian(end, circle))
  const arc = [{ ...circle, startAngle, endAngle, counterclockwise: false }, { ...circle, startAngle, endAngle, counterclockwise: true }].find(a => pointIsOnArc(point, a))
  if (arc) {
    return getArcBulge(arc, start, end)
  }
  return
}

export function getCircleDerivatives({ x, y, r }: Circle): Tuple5<(t: number) => Position> {
  // x = cx + r cos(t)
  // x' = -r sin(t)
  // x'' = -r cos(t)
  // x''' = r sin(t)
  // x'''' = r cos(t)

  // y = cy + r sin(t)
  // y' = r cos(t)
  // y'' = -r sin(t)
  // y''' = -r cos(t)
  // y'''' = r sin(t)
  return [
    t => ({ x: x + r * Math.cos(t), y: y + r * Math.sin(t) }),
    t => ({ x: -r * Math.sin(t), y: r * Math.cos(t) }),
    t => ({ x: -r * Math.cos(t), y: -r * Math.sin(t) }),
    t => ({ x: r * Math.sin(t), y: -r * Math.cos(t) }),
    t => ({ x: r * Math.cos(t), y: r * Math.sin(t) }),
  ]
}

export function getArcDerivatives({ x, y, r, startAngle, endAngle }: Arc): Tuple3<(t: number) => Position> {
  const e3 = angleToRadian(endAngle - startAngle), t1 = angleToRadian(startAngle)
  // t = e3 u + t1
  // x = cx + r cos(t)
  // x' = -r sin(t) e3
  // x'' = -r cos(t) e3 e3

  // y = cy + r sin(t)
  // y' = r cos(t) e3
  // y'' = -r sin(t) e3 e3
  return [
    u => {
      const t = e3 * u + t1
      return { x: x + r * Math.cos(t), y: y + r * Math.sin(t) }
    },
    u => {
      const t = e3 * u + t1, d = r * e3
      return { x: -d * Math.sin(t), y: d * Math.cos(t) }
    },
    u => {
      const t = e3 * u + t1, d = r * e3 * e3
      return { x: -d * Math.cos(t), y: -d * Math.sin(t) }
    },
  ]
}

export function getCircleCurvature(circle: Circle): number {
  // x = cx + r cos(t)
  // x1 = -r sin(t)
  // x2 = -r cos(t)
  // y = cy + r sin(t)
  // y1 = r cos(t)
  // y2 = -r sin(t)
  // (x1 y2 - y1 x2)/(x1 ** 2 + y1 ** 2)**1.5
  // (-r sin(t)(-r sin(t)) - r cos(t)(-r cos(t)))/(r ** 2)**1.5
  // r ** 2/(r ** 2)**1.5 = 1 / r
  return 1 / circle.r
}

export function getArcCurvature(arc: Arc): number {
  const result = getCircleCurvature(arc)
  return arc.counterclockwise ? -result : result
}
