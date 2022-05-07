import { Position } from "../utils"

export interface ReactRenderTarget<T = JSX.Element> {
  type: string
  getResult(
    children: T[],
    width: number,
    height: number,
    attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
      style: React.CSSProperties
    }>,
  ): JSX.Element
  strokeRect(x: number, y: number, width: number, height: number, color: number, angle?: number): T
  strokePolyline(points: Position[], color: number, dashArray?: number[]): T
  strokeCircle(cx: number, cy: number, r: number, color: number): T
  strokeEllipse(cx: number, cy: number, rx: number, ry: number, color: number, angle?: number): T
  strokeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, color: number): T
}
