import { isZero } from "./math";
import { lessOrEqual, largerOrEqual } from "./math";
import { largerThan, lessThan, isSameNumber } from "./math";
import { number, optional, boolean } from "./validators";

export function normalizeAngleInRange(angle: number, range: AngleRange) {
  while (largerThan(angle, range.endAngle)) {
    angle -= 360
  }
  while (lessThan(angle, range.startAngle)) {
    angle += 360
  }
  return angle
}

export function normalizeRadian(radian: number) {
  while (largerThan(radian, Math.PI)) {
    radian -= Math.PI * 2
  }
  while (lessThan(radian, -Math.PI)) {
    radian += Math.PI * 2
  }
  return radian
}

export function normalizeAngle(angle: number) {
  while (largerThan(angle, 180)) {
    angle -= 360
  }
  while (lessThan(angle, -180)) {
    angle += 360
  }
  return angle
}

export function normalizeAngleRange(content: AngleRange) {
  if (lessThan(content.endAngle, content.startAngle)) {
    content.endAngle += 360
  } else if (largerThan(content.endAngle - content.startAngle, 360)) {
    content.endAngle -= 360
  }
}

export function getFormattedStartAngle(range: AngleRange) {
  let startAngle: number
  if (range.counterclockwise) {
    startAngle = lessThan(range.startAngle, range.endAngle) ? range.startAngle + 360 : range.startAngle
  } else {
    startAngle = largerThan(range.startAngle, range.endAngle) ? range.startAngle - 360 : range.startAngle
  }
  return startAngle
}

export function getFormattedEndAngle(range: AngleRange) {
  let endAngle: number
  if (range.counterclockwise) {
    endAngle = lessThan(range.startAngle, range.endAngle) ? range.endAngle - 360 : range.endAngle
  } else {
    endAngle = largerThan(range.startAngle, range.endAngle) ? range.endAngle + 360 : range.endAngle
  }
  return endAngle
}

export function getLargeArc(range: AngleRange) {
  const endAngle = getFormattedEndAngle(range)
  return largerThan(Math.abs(endAngle - range.startAngle), 180)
}

export function getAngleRange(range: AngleRange, angleDelta: number) {
  const endAngle = getFormattedEndAngle(range)
  const angles: number[] = []
  for (let i = range.startAngle; ;) {
    if (isSameNumber(i, endAngle)) {
      break
    }
    if (range.counterclockwise ? lessThan(i, endAngle) : largerThan(i, endAngle)) {
      break
    }
    angles.push(i)
    if (range.counterclockwise) {
      i -= angleDelta
    } else {
      i += angleDelta
    }
  }
  if (angles.length === 0 || !isSameNumber(angles[angles.length - 1], endAngle)) {
    angles.push(endAngle)
  }
  return angles
}

export function isAngleRangeClosed(angleRange: AngleRange) {
  return isZero((angleRange.endAngle - angleRange.startAngle) % 360)
}

export const AngleRange = {
  startAngle: number,
  endAngle: number,
  counterclockwise: /* @__PURE__ */ optional(boolean),
}

export interface AngleRange {
  startAngle: number
  endAngle: number
  counterclockwise?: boolean
}

export function getAngleInRange(angle: number, range: AngleRange) {
  if (range.counterclockwise) {
    while (lessThan(angle, range.endAngle) && lessOrEqual(angle, range.startAngle - 360)) {
      angle += 360
    }
    while (largerThan(angle, range.startAngle)) {
      angle -= 360
    }
    return angle
  }
  while (largerThan(angle, range.endAngle) && largerOrEqual(angle, range.startAngle + 360)) {
    angle -= 360
  }
  while (lessThan(angle, range.startAngle)) {
    angle += 360
  }
  return angle
}

export function angleInRange(angle: number, range: AngleRange) {
  angle = getAngleInRange(angle, range)
  if (range.counterclockwise) {
    if (largerThan(range.endAngle, range.startAngle)) {
      return largerOrEqual(angle, range.endAngle - 360)
    }
    return largerOrEqual(angle, range.endAngle)
  }
  if (lessThan(range.endAngle, range.startAngle)) {
    return lessOrEqual(angle, range.endAngle + 360)
  }
  return lessOrEqual(angle, range.endAngle)
}
