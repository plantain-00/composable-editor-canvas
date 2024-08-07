import { isSameNumber, getTwoNumberCenter } from "./math"
import { Position, rotatePosition } from "./position"
import { getPointsBoundingUnsafe } from "./bounding"
import { Size, TwoPointsFormRegion, getTwoPointsFormRegionSize } from "./region"
import { getTwoPointCenter } from "./position"
import { slice3, Tuple4, Vec3 } from "./types"
import { matrix, v3 } from "./matrix"

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

export function transformPointToCoordinate(p: Vec3, [start, ...axis]: Tuple4<Vec3>): Vec3 {
  /**
   * @see getPerpendicularParamToLine
   */
  // (axis[0],axis[1],axis[2])(p - start))
  return slice3(matrix.multiplyVec(axis, v3.substract(p, start)))
}

export function transformPointFromCoordinate(p: Vec3, coordinate: Tuple4<Vec3>): Vec3 | undefined {
  const vec = getCoordinateVec(p, coordinate)
  // (a1,b1,c1)(x) = (vec0)
  // (a2,b2,c2)(y) = (vec1)
  // (a3,b3,c3)(z) = (vec2)
  const m = getCoordinateMatrix(coordinate)
  if (!m) return
  return slice3(matrix.multiplyVec(m, vec))
}

export function getCoordinateVec(p: Vec3, [start, ...axis]: Tuple4<Vec3>): Vec3 {
  // a x + b y + c z = (a,b,c)(x,y,z)
  // d1 = axis[0] * (start + axis[0] * p[0])
  // d2 = axis[1] * (start + axis[1] * p[1])
  // d3 = axis[2] * (start + axis[2] * p[2])
  return v3.dots(
    axis,
    v3.addToVecs(start, v3.multiplyScalars(axis, p))
  )
}

export function getCoordinateMatrix(coordinate: Tuple4<Vec3>): number[][] | undefined {
  return matrix.inverse(slice3(coordinate, 1))
}

export function rotateToDirection(direction: Vec3, from: Vec3 = [0, 1, 0]) {
  direction = v3.normalize(direction)
  const axis = v3.cross(from, direction)
  if (v3.lengthSquare(axis) > 0) {
    const radian = Math.acos(v3.dot(from, direction))
    return {
      axis,
      radian,
    }
  }
  return
}

export function transformPointFromCoordinate2D(p: Position, coordinateBase: Position, xAxisRadian: number): Position {
  // let { x: x0, y: y0 } = coordinateBase
  const { x: x1, y: y1 } = p
  /**
   * @see getPerpendicularParamToLine2D
   */
  // x1 = sin(xAxisRadian) (y - y0) + cos(xAxisRadian) (x - x0)
  // y1 = sin(xAxisRadian + PI / 2) (y - y0) + cos(xAxisRadian + PI / 2) (x - x0)
  // y1 = cos(xAxisRadian) (y - y0) - sin(xAxisRadian) (x - x0)
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  // let u = x - x0, v = y - y0
  // F1: e1 v + e2 u - x1 = 0
  // F2: e2 v - e1 u - y1 = 0
  // F1 e2 - F2 e1: (e1 e1 + e2 e2) u + -e2 x1 + e1 y1 = 0
  // u = e2 x1 - e1 y1
  // F1 e1 + F2 e2: (e1 e1 + e2 e2) v + -e1 x1 + -e2 y1 = 0
  // v = e1 x1 + e2 y1
  return {
    x: coordinateBase.x + e2 * x1 - e1 * y1,
    y: coordinateBase.y + e1 * x1 + e2 * y1,
  }
}

export function getCoordinateVec2D(p: Position): Vec3 {
  return [p.x, p.y, 1]
}

export function getCoordinateMatrix2D(coordinateBase: Position, xAxisRadian: number): number[][] {
  const e1 = Math.sin(xAxisRadian), e2 = Math.cos(xAxisRadian)
  return [
    [e2, -e1, coordinateBase.x],
    [e1, e2, coordinateBase.y],
  ]
}
