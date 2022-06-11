import { Position } from "../../utils"

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
    }>,
  ): T
  renderRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: Partial<{
      strokeColor: number
      angle: number
      rotation: number
      strokeWidth: number
      fillColor: number
    }>,
  ): T
  renderPolyline(
    points: Position[],
    options?: Partial<{
      strokeColor: number
      dashArray: number[]
      strokeWidth: number
      skippedLines: number[]
      fillColor: number
    }>,
  ): T
  renderCircle(
    cx: number,
    cy: number,
    r: number,
    options?: Partial<{
      strokeColor: number
      strokeWidth: number
    }>,
  ): T
  renderEllipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    options?: Partial<{
      strokeColor: number
      angle: number
      rotation: number
      strokeWidth: number
    }>,
  ): T
  renderArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    options?: Partial<{
      strokeColor: number
      strokeWidth: number
    }>,
  ): T
  renderText(
    x: number,
    y: number,
    text: string,
    fillColor: number,
    fontSize: number,
    fontFamily: string,
  ): T
}
