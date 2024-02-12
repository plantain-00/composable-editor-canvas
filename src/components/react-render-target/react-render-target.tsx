import * as React from "react"
import type { PathCommand } from "../../utils/path"
import { Position } from "../../utils/position"
import { Size } from "../../utils/region"
import { Circle } from "../../utils/circle"
import { Matrix, RotationOptions, ScaleOptions } from "../../utils/matrix"
import type { Align, VerticalAlign } from "../../utils/flow-layout"
import { LineCap, LineJoin } from "../../utils/triangles"
import { RenderTransform } from "../../utils/transform"

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
      backgroundColor: number
      debug: boolean
      strokeWidthFixed: boolean
    }>
  ): V
  renderEmpty(): T
  renderGroup(
    children: T[],
    options?: Partial<RotationOptions & ScaleOptions & {
      translate: Position
      base: Position
      matrix: Matrix
      opacity: number
    }>,
  ): T
  renderRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: Partial<PathOptions<T> & RotationOptions>,
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
    options?: Partial<PathOptions<T> & RotationOptions>,
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
    options?: Partial<PathOptions<T> & RotationOptions & {
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
  renderRay(
    x: number,
    y: number,
    angle: number,
    options?: Partial<PathOptions<T> & {
      bidirectional: boolean
    }>,
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
  lineJoin: LineJoin
  miterLimit: number
  lineCap?: LineCap
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
