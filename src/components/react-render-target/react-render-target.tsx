import * as React from "react"
import { arcToPolyline, Circle, ellipseArcToPolyline, getParallelLinesByDistance, getPointSideOfLine, getTwoPointsRadian, isSamePoint, isZero, PathCommand, pointInPolygon, Position, Region, Size, twoPointLineToGeneralFormLine } from "../../utils/geometry"
import { Matrix } from "../../utils/matrix"
import { radianToAngle } from "../../utils/radian"
import type { Align, VerticalAlign } from "../../utils/flow-layout"
import { GeometryLine, getTwoGeneralFormLinesIntersectionPoint } from "../../utils/intersection"
import { getPerpendicularPoint } from "../../utils/perpendicular"
import { getBezierCurvePoints, getQuadraticCurvePoints } from "../../utils/bezier"

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
  const lines = pathCommandsToGeometryLines(pathCommands)
  for (const line of lines) {
    result.push(getGeometryLinesPoints(line))
  }
  return result
}

export function getGeometryLinesPoints(lines: GeometryLine[], segmentCount = 100, angleDelta = 5) {
  const points: Position[] = []
  for (const n of lines) {
    if (Array.isArray(n)) {
      if (points.length === 0) {
        points.push(n[0])
      }
      points.push(n[1])
    } else if (n.type === 'arc') {
      points.push(...arcToPolyline(n.curve, angleDelta))
    } else if (n.type === 'ellipse arc') {
      points.push(...ellipseArcToPolyline(n.curve, angleDelta))
    } else if (n.type === 'quadratic curve') {
      points.push(...getQuadraticCurvePoints(n.curve.from, n.curve.cp, n.curve.to, segmentCount))
    } else if (n.type === 'bezier curve') {
      points.push(...getBezierCurvePoints(n.curve.from, n.curve.cp1, n.curve.cp2, n.curve.to, segmentCount))
    }
  }
  return points
}

export function pathCommandsToGeometryLines(pathCommands: PathCommand[]): GeometryLine[][] {
  const result: GeometryLine[][] = []
  let lines: GeometryLine[] = []
  let lineStartPoint: Position | undefined
  let last: Position | undefined
  for (const command of pathCommands) {
    if (command.type === 'move') {
      if (lines.length > 0) {
        if (lines.length > 1) {
          result.push(lines)
        }
        lines = []
        lineStartPoint = undefined
      }
      last = command.to
      if (!lineStartPoint) {
        lineStartPoint = command.to
      }
    } else if (command.type === 'line') {
      if (last) {
        lines.push([last, command.to])
      }
      last = command.to
    } else if (command.type === 'arc') {
      if (last) {
        const p1 = command.from
        const p2 = command.to
        const line1 = twoPointLineToGeneralFormLine(last, p1)
        const line2 = twoPointLineToGeneralFormLine(p1, p2)
        const p2Direction = getPointSideOfLine(p2, line1)
        if (isZero(p2Direction)) {
          if (last) {
            lines.push([last, p2])
          }
        } else {
          const index = p2Direction < 0 ? 0 : 1
          const center = getTwoGeneralFormLinesIntersectionPoint(
            getParallelLinesByDistance(line1, command.radius)[index],
            getParallelLinesByDistance(line2, command.radius)[index],
          )
          if (center) {
            const t1 = getPerpendicularPoint(center, line1)
            const t2 = getPerpendicularPoint(center, line2)
            if (last) {
              lines.push([last, { x: t1.x, y: t1.y }])
            }
            const startAngle = radianToAngle(getTwoPointsRadian(t1, center))
            const endAngle = radianToAngle(getTwoPointsRadian(t2, center))
            lines.push({
              type: 'arc',
              curve: {
                x: center.x,
                y: center.y,
                startAngle,
                endAngle,
                r: command.radius,
                counterclockwise: p2Direction > 0,
              }
            })
          }
        }
      }
    } else if (command.type === 'bezierCurve') {
      if (last) {
        lines.push({
          type: 'bezier curve',
          curve: {
            from: last,
            cp1: command.cp1,
            cp2: command.cp2,
            to: command.to,
          }
        })
      }
      last = command.to
    } else if (command.type === 'quadraticCurve') {
      if (last) {
        lines.push({
          type: 'quadratic curve',
          curve: {
            from: last,
            cp: command.cp,
            to: command.to,
          }
        })
      }
      last = command.to
    } else if (command.type === 'close') {
      if (lines.length > 0) {
        if (lines.length > 1) {
          if (lineStartPoint && last && !isSamePoint(lineStartPoint, last)) {
            lines.push([last, lineStartPoint])
          }
          result.push(lines)
        }
        lines = []
        lineStartPoint = undefined
      }
    }
  }
  if (lines.length > 0) {
    result.push(lines)
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
          const endRadian = getTwoPointsRadian(t2, center)
          return {
            x: center.x + command.radius * Math.cos(endRadian),
            y: center.y + command.radius * Math.sin(endRadian),
          }
        }
      }
    }
  }
  return
}
