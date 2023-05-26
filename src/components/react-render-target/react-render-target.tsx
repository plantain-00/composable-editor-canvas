import * as React from "react"
import { arcToPolyline, Circle, getBezierCurvePoints, getParallelLinesByDistance, getPerpendicularPoint, getPointSideOfLine, getQuadraticCurvePoints, getTwoGeneralFormLinesIntersectionPoint, getTwoPointsAngle, isSamePoint, isZero, PathCommand, pointInPolygon, Position, Region, Size, twoPointLineToGeneralFormLine } from "../../utils/geometry"
import { Matrix } from "../../utils/matrix"
import { radianToAngle } from "../../utils/radian"
import type { Align, VerticalAlign } from "../../utils/flow-layout"

export interface ReactRenderTarget<T = JSX.Element, V = JSX.Element> {
  type: string
  renderResult(
    children: T[],
    width: number,
    height: number,
    options?: Partial<{
      attributes: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
        style: React.CSSProperties
      }>,
      transform: RenderTransform
      backgroundColor: number,
      debug: boolean
      strokeWidthScale: number
    }>
  ): V
  renderEmpty(): T
  renderGroup(
    children: T[],
    options?: Partial<{
      translate: Position
      base: Position
      angle: number
      rotation: number
      matrix: Matrix
      opacity: number
    }>,
  ): T
  renderRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: Partial<PathOptions<T> & {
      angle: number
      rotation: number
    }>,
  ): T
  renderPolyline(
    points: Position[],
    options?: Partial<PathOptions<T> & {
      skippedLines: number[]
      partsStyles: readonly PartStyle[]
    }>,
  ): T
  renderPolygon(
    points: Position[],
    options?: Partial<PathOptions<T> & {
      skippedLines: number[]
      partsStyles: readonly PartStyle[]
    }>,
  ): T
  renderCircle(
    cx: number,
    cy: number,
    r: number,
    options?: Partial<PathOptions<T>>,
  ): T
  renderEllipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    options?: Partial<PathOptions<T> & {
      angle: number
      rotation: number
    }>,
  ): T
  renderArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    options?: Partial<PathOptions<T> & {
      counterclockwise: boolean
    }>,
  ): T
  renderEllipseArc(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    startAngle: number,
    endAngle: number,
    options?: Partial<PathOptions<T> & {
      angle: number
      rotation: number
      counterclockwise: boolean
    }>,
  ): T
  renderPathCommands(
    pathCommands: PathCommand[],
    options?: Partial<PathOptions<T>>,
  ): T
  renderText(
    x: number,
    y: number,
    text: string,
    fill: number | Pattern<T> | undefined,
    fontSize: number,
    fontFamily: string,
    options?: Partial<PathStrokeOptions<T> & {
      fontWeight: React.CSSProperties['fontWeight']
      fontStyle: React.CSSProperties['fontStyle']
      fillOpacity: number
      fillLinearGradient: LinearGradient
      fillRadialGradient: RadialGradient
      textAlign: Align
      textBaseline: 'alphabetic' | VerticalAlign
      cacheKey: object
    }>,
  ): T
  renderImage(
    url: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: Partial<{
      opacity: number
      crossOrigin: "anonymous" | "use-credentials" | ""
      filters: Filter[]
    }>,
  ): T
  renderPath(
    lines: Position[][],
    options?: Partial<PathOptions<T>>,
  ): T
}

export interface RenderTransform {
  x: number
  y: number
  scale: number
  rotate?: number
}

export type Filter =
  | { type: 'brightness', value: number }
  | { type: 'contrast', value: number }
  | { type: 'hue-rotate', value: number }
  | { type: 'saturate', value: number }
  | { type: 'grayscale', value: number }
  | { type: 'sepia', value: number }
  | { type: 'invert', value: number }
  | { type: 'opacity', value: number }
  | { type: 'blur', value: number }

/**
 * @public
 */
export interface PathStrokeOptions<T> {
  strokeColor: number
  strokeWidth: number
  dashArray: number[]
  dashOffset: number
  strokeOpacity: number
  strokePattern: Pattern<T>
  strokeLinearGradient: LinearGradient
  strokeRadialGradient: RadialGradient
}

/**
 * @public
 */
export interface PathLineStyleOptions {
  lineJoin: 'round' | 'bevel' | 'miter'
  miterLimit: number
  lineCap?: 'butt' | 'round' | 'square'
}

/**
 * @public
 */
export interface PathOptions<T> extends PathStrokeOptions<T>, PathLineStyleOptions, PathFillOptions<T> {
  closed: boolean
}

/**
 * @public
 */
export interface PathFillOptions<T> {
  fillColor: number
  fillOpacity: number
  fillPattern: Pattern<T>
  fillLinearGradient: LinearGradient
  fillRadialGradient: RadialGradient
  clip: () => T
}

/**
 * @public
 */
export interface LinearGradient {
  start: Position
  end: Position
  stops: GradientStop[]
}

/**
 * @public
 */
export interface GradientStop {
  offset: number
  color: number
  opacity?: number
}

/**
 * @public
 */
export interface RadialGradient {
  start: Circle
  end: Circle
  stops: GradientStop[]
}

/**
 * @public
 */
export interface Pattern<T> extends Size {
  pattern: () => T
  // rotate?: number
}

/**
 * @public
 */
export interface PartStyle {
  index: number
  color: number
  opacity?: number
}

export function renderPartStyledPolyline<T>(
  target: ReactRenderTarget<T>,
  partsStyles: readonly PartStyle[],
  points: Position[],
  options?: Partial<PathStrokeOptions<T>>,
) {
  return target.renderGroup([
    target.renderPolyline(points, { ...options, skippedLines: partsStyles.map((s) => s.index) }),
    ...partsStyles.map(({ index, color, opacity }) => target.renderPolyline([points[index], points[index + 1]], { ...options, strokeColor: color, strokeOpacity: opacity })),
  ])
}

export function getRoundedRectPoints(content: Region, radius: number, angleDelta: number): Position[] {
  return [
    ...arcToPolyline({
      x: content.x + content.width / 2 - radius,
      y: content.y - content.height / 2 + radius,
      r: radius,
      startAngle: -90,
      endAngle: 0,
    }, angleDelta),
    ...arcToPolyline({
      x: content.x + content.width / 2 - radius,
      y: content.y + content.height / 2 - radius,
      r: radius,
      startAngle: 0,
      endAngle: 90,
    }, angleDelta),
    ...arcToPolyline({
      x: content.x - content.width / 2 + radius,
      y: content.y + content.height / 2 - radius,
      r: radius,
      startAngle: 90,
      endAngle: 180,
    }, angleDelta),
    ...arcToPolyline({
      x: content.x - content.width / 2 + radius,
      y: content.y - content.height / 2 + radius,
      r: radius,
      startAngle: 180,
      endAngle: 270,
    }, angleDelta),
  ]
}

/**
 * @public
 */
export function getPathCommandsPoints(pathCommands: PathCommand[]) {
  const result: Position[][] = []
  let points: Position[] = []
  for (const command of pathCommands) {
    if (command.type === 'move') {
      if (points.length > 0) {
        if (points.length > 1) {
          result.push(points)
        }
        points = []
      }
      points.push(command.to)
    } else if (command.type === 'line') {
      points.push(command.to)
    } else if (command.type === 'arc') {
      const last = points[points.length - 1]
      if (last) {
        const p1 = command.from
        const p2 = command.to
        const line1 = twoPointLineToGeneralFormLine(last, p1)
        const line2 = twoPointLineToGeneralFormLine(p1, p2)
        const p2Direction = getPointSideOfLine(p2, line1)
        if (isZero(p2Direction)) {
          points.push(p2)
        } else {
          const index = p2Direction < 0 ? 0 : 1
          const center = getTwoGeneralFormLinesIntersectionPoint(
            getParallelLinesByDistance(line1, command.radius)[index],
            getParallelLinesByDistance(line2, command.radius)[index],
          )
          if (center) {
            const t1 = getPerpendicularPoint(center, line1)
            const t2 = getPerpendicularPoint(center, line2)
            points.push({ x: t1.x, y: t1.y })
            const startAngle = radianToAngle(getTwoPointsAngle(t1, center))
            const endAngle = radianToAngle(getTwoPointsAngle(t2, center))
            points.push(...arcToPolyline({ x: center.x, y: center.y, startAngle, endAngle, r: command.radius, counterclockwise: p2Direction > 0 }, 5))
          }
        }
      }
    } else if (command.type === 'bezierCurve') {
      const last = points[points.length - 1]
      if (last) {
        points.push(...getBezierCurvePoints(last, command.cp1, command.cp2, command.to, 100))
      }
    } else if (command.type === 'quadraticCurve') {
      const last = points[points.length - 1]
      if (last) {
        points.push(...getQuadraticCurvePoints(last, command.cp, command.to, 100))
      }
    } else if (command.type === 'close') {
      if (points.length > 0) {
        if (points.length > 1) {
          if (!isSamePoint(points[0], points[points.length - 1])) {
            points.push(points[0])
          }
          result.push(points)
        }
        points = []
      }
    }
  }
  if (points.length > 1) {
    result.push(points)
  }
  return result
}

export function pathCommandPointsToPath(points: Position[][]) {
  const result: Position[][][] = []
  let current: { polygon: Position[], holes: Position[][] } | undefined
  for (const p of points) {
    if (!current) {
      current = { polygon: p, holes: [] }
    } else if (pointInPolygon(p[0], current.polygon)) {
      current.holes.push(p)
    } else {
      if (current) {
        result.push([current.polygon, ...current.holes])
      }
      current = { polygon: p, holes: [] }
    }
  }
  if (current) {
    result.push([current.polygon, ...current.holes])
  }
  return result
}

/**
 * @public
 */
export function getPathCommandEndPoint(pathCommands: PathCommand[], index: number): Position | undefined {
  if (index >= 0) {
    const command = pathCommands[index]
    if (command.type !== 'close') {
      if (command.type !== 'arc') {
        return command.to
      }
      const last = getPathCommandEndPoint(pathCommands, index - 1)
      if (last) {
        const p1 = command.from
        const p2 = command.to
        const line1 = twoPointLineToGeneralFormLine(last, p1)
        const line2 = twoPointLineToGeneralFormLine(p1, p2)
        const p2Direction = getPointSideOfLine(p2, line1)
        if (isZero(p2Direction)) {
          return command.to
        }
        const i = p2Direction < 0 ? 0 : 1
        const center = getTwoGeneralFormLinesIntersectionPoint(
          getParallelLinesByDistance(line1, command.radius)[i],
          getParallelLinesByDistance(line2, command.radius)[i],
        )
        if (center) {
          const t2 = getPerpendicularPoint(center, line2)
          const endAngle = getTwoPointsAngle(t2, center)
          return {
            x: center.x + command.radius * Math.cos(endAngle),
            y: center.y + command.radius * Math.sin(endAngle),
          }
        }
      }
    }
  }
  return
}
