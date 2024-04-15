import { getNumberRangeIntersection, isZero } from "./math";
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

export function twoRadiansSameDirection(radian1: number, radian2: number) {
  const radian = normalizeRadian(radian1 - radian2)
  return Math.abs(radian) < Math.PI / 2
}

export function twoAnglesSameDirection(angle1: number, angle2: number) {
  const angle = normalizeAngle(angle1 - angle2)
  return Math.abs(angle) < 90
}

export function normalizeAngleRange<T extends AngleRange>(content: T) {
  if (lessThan(content.endAngle, content.startAngle)) {
    content.endAngle += 360
  } else if (largerThan(content.endAngle - content.startAngle, 360)) {
    content.endAngle -= 360
  }
  return content
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
  let endAngle = range.endAngle
  if (range.counterclockwise) {
    while (lessThan(range.startAngle, endAngle)) {
      endAngle -= 360
    }
  } else {
    while (largerThan(range.startAngle, endAngle)) {
      endAngle += 360
    }
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

export function getNormalizedAngleInRanges(range: AngleRange): [number, number][] {
  const startAngle = normalizeAngle(range.startAngle)
  const endAngle = getFormattedEndAngle({ ...range, startAngle })
  if (range.counterclockwise) {
    if (lessThan(endAngle, -180)) {
      return [[-180, startAngle], [endAngle + 360, 180]]
    }
    return [[endAngle, startAngle]]
  }
  if (largerThan(endAngle, 180)) {
    return [[startAngle, 180], [endAngle - 360, -180]]
  }
  return [[startAngle, endAngle]]
}

export function getAngleRangesIntersections(range1: AngleRange, range2: AngleRange) {
  const ranges1 = getNormalizedAngleInRanges(range1)
  const ranges2 = getNormalizedAngleInRanges(range2)
  const ranges: [number, number][] = []
  for (const r1 of ranges1) {
    for (const r2 of ranges2) {
      const r = getNumberRangeIntersection(r1, r2)
      if (r) {
        ranges.push(r)
      }
    }
  }
  return ranges
}
