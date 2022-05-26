import { Position } from "../../utils"

export interface ReactRenderTarget<T = JSX.Element> {
  type: string
  getResult(
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
  getEmpty(): T
  getGroup(children: T[], x: number, y: number, base: Position, angle?: number): T
  strokeRect(x: number, y: number, width: number, height: number, color: number, angle?: number, strokeWidth?: number): T
  strokePolyline(points: Position[], color: number, dashArray?: number[], strokeWidth?: number, skippedLines?: number[]): T
  strokeCircle(cx: number, cy: number, r: number, color: number, strokeWidth?: number): T
  strokeEllipse(cx: number, cy: number, rx: number, ry: number, color: number, angle?: number, strokeWidth?: number): T
  strokeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, color: number, strokeWidth?: number): T
  fillText(x: number, y: number, text: string, color: number, fontSize: number): T
}
