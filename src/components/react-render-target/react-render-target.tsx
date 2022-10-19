import * as React from "react"
import { arcToPolyline, Circle, getBezierCurvePoints, getParallelLinesByDistance, getPerpendicularPoint, getPointSideOfLine, getQuadraticCurvePoints, getTwoGeneralFormLinesIntersectionPoint, isSamePoint, isZero, Matrix, PathCommand, Position, Size, twoPointLineToGeneralFormLine } from "../../utils"

export interface ReactRenderTarget<T = JSX.Element> {
  type: string
  renderResult(
    children: T[],
    width: number,
    height: number,
    options?: Partial<{
      attributes: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
        style: React.CSSProperties
      }>,
      transform: {
        x: number
        y: number
        scale: number
      },
      backgroundColor: number,
      debug: boolean
      strokeWidthScale: number
    }>
  ): JSX.Element
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
      textAlign: 'left' | 'center' | 'right'
      textBaseline: 'alphabetic' | 'top' | 'middle' | 'bottom'
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
            const startAngle = Math.atan2(t1.y - center.y, t1.x - center.x) * 180 / Math.PI
            const endAngle = Math.atan2(t2.y - center.y, t2.x - center.x) * 180 / Math.PI
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
          const endAngle = Math.atan2(t2.y - center.y, t2.x - center.x)
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
