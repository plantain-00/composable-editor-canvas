import { isSameNumber, getTwoNumberCenter } from "./math"
import { Position, rotatePosition } from "./position"
import { getPointsBoundingUnsafe } from "./bounding"
import { Size, TwoPointsFormRegion, getTwoPointsFormRegionSize } from "./region"
import { getTwoPointCenter } from "./position"

/**
 * @public
 */
export interface Transform extends Position {
  center: Position
  scale: number
  rotate?: number
}

/**
 * @public
 */
export function reverseTransformPosition(position: Position, transform: Transform | undefined) {
  if (!transform) {
    return position
  }
  position = {
    x: (position.x - transform.center.x - transform.x) / transform.scale + transform.center.x,
    y: (position.y - transform.center.y - transform.y) / transform.scale + transform.center.y,
  }
  if (transform.rotate) {
    position = rotatePosition(position, { x: 0, y: 0 }, -transform.rotate)
  }
  return position
}

export function transformPosition(position: Position, transform: Transform | undefined) {
  if (!transform) {
    return position
  }
  if (transform.rotate) {
    position = rotatePosition(position, { x: 0, y: 0 }, transform.rotate)
  }
  return {
    x: (position.x - transform.center.x) * transform.scale + transform.center.x + transform.x,
    y: (position.y - transform.center.y) * transform.scale + transform.center.y + transform.y,
  }
}

/**
 * @public
 */
export function zoomToFit(
  bounding: TwoPointsFormRegion | undefined,
  { width, height }: Size,
  center: Position,
  paddingScale = 0.8,
) {
  if (bounding && !isSameNumber(bounding.start.x, bounding.end.x) && !isSameNumber(bounding.start.y, bounding.end.y)) {
    const size = getTwoPointsFormRegionSize(bounding)
    const scale = Math.min(width / size.width, height / size.height) * paddingScale
    return {
      scale,
      x: (center.x - getTwoNumberCenter(bounding.start.x, bounding.end.x)) * scale,
      y: (center.y - getTwoNumberCenter(bounding.start.y, bounding.end.y)) * scale,
    }
  }
  return
}

export function zoomToFitPoints(
  points: Position[],
  { width, height }: Size,
  center: Position,
  paddingScale = 0.8,
  rotate?: number,
) {
  const bounding = getPointsBoundingUnsafe(points)
  if (bounding && !isSameNumber(bounding.start.x, bounding.end.x) && !isSameNumber(bounding.start.y, bounding.end.y)) {
    let boundingSize: Size
    if (rotate) {
      const region = getPointsBoundingUnsafe(points.map(p => rotatePosition(p, { x: 0, y: 0 }, rotate)))
      boundingSize = getTwoPointsFormRegionSize(region)
    } else {
      boundingSize = getTwoPointsFormRegionSize(bounding)
    }
    const scale = Math.min(width / boundingSize.width, height / boundingSize.height) * paddingScale
    let boundingCenter = getTwoPointCenter(bounding.start, bounding.end)
    if (rotate) {
      boundingCenter = rotatePosition(boundingCenter, { x: 0, y: 0 }, rotate)
    }
    return {
      scale,
      x: (center.x - boundingCenter.x) * scale,
      y: (center.y - boundingCenter.y) * scale,
    }
  }
  return
}

/**
 * @public
 */
export function scaleByCursorPosition({ width, height }: Size, scale: number, cursor: Position) {
  return {
    setX: (x: number) => cursor.x - width / 2 - (cursor.x - width / 2 - x) * scale,
    setY: (y: number) => cursor.y - height / 2 - (cursor.y - height / 2 - y) * scale,
  }
}

export interface RenderTransform {
  x: number
  y: number
  scale: number
  rotate?: number
}
