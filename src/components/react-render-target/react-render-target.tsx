import { Position } from "../../utils"

export interface ReactRenderTarget<T = JSX.Element> {
  type: string
  renderResult(
    children: T[],
    width: number,
    height: number,
    attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
      style: React.CSSProperties
    }>,
    transform?: {
      x: number
      y: number
      scale: number
    }
  ): JSX.Element
  renderEmpty(): T
  renderGroup(children: T[], x: number, y: number, base: Position, angle?: number): T
  renderRect(x: number, y: number, width: number, height: number, strokeColor: number, angle?: number, strokeWidth?: number, fillColor?: number): T
  renderPolyline(points: Position[], strokeColor: number, dashArray?: number[], strokeWidth?: number, skippedLines?: number[]): T
  renderCircle(cx: number, cy: number, r: number, strokeColor: number, strokeWidth?: number): T
  renderEllipse(cx: number, cy: number, rx: number, ry: number, strokeColor: number, angle?: number, strokeWidth?: number): T
  renderArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, strokeColor: number, strokeWidth?: number): T
  renderText(x: number, y: number, text: string, strokeColor: number, fontSize: number): T
}
