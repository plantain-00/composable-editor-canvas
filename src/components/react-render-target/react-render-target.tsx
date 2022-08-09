import React from "react"
import { Matrix, Position, Size } from "../../utils"

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
      partsStyles: readonly { index: number, color: number }[]
    }>,
  ): T
  renderPolygon(
    points: Position[],
    options?: Partial<PathOptions<T> & {
      skippedLines: number[]
      partsStyles: readonly { index: number, color: number }[]
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
  renderText(
    x: number,
    y: number,
    text: string,
    fill: number | Pattern<T>,
    fontSize: number,
    fontFamily: string,
    options?: Partial<{
      fontWeight: React.CSSProperties['fontWeight']
      fontStyle: React.CSSProperties['fontStyle']
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
      crossOrigin: "anonymous" | "use-credentials" | ""
    }>,
  ): T
  renderPath(
    lines: Position[][],
    options?: Partial<PathOptions<T>>,
  ): T
}

/**
 * @public
 */
export interface PathOptions<T> {
  strokeColor: number
  strokeWidth: number
  dashArray: number[]
  fillColor: number
  fillPattern: Pattern<T>
  lineJoin: 'round' | 'bevel' | 'miter'
  miterLimit: number
  closed: boolean
  lineCap?: 'butt' | 'round' | 'square'
}

/**
 * @public
 */
export interface Pattern<T> extends Size {
  pattern: () => T
  // rotate?: number
}

export function renderPartStyledPolyline<T>(
  target: ReactRenderTarget<T>,
  partsStyles: readonly { index: number, color: number }[],
  points: Position[],
  options?: Partial<{
    strokeColor: number,
    dashArray?: number[],
    strokeWidth?: number,
  }>,
) {
  return target.renderGroup([
    target.renderPolyline(points, { ...options, skippedLines: partsStyles.map((s) => s.index) }),
    ...partsStyles.map(({ index, color }) => target.renderPolyline([points[index], points[index + 1]], { ...options, strokeColor: color })),
  ])
}
