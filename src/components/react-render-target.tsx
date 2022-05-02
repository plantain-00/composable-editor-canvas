import { Position } from "../utils"

export interface ReactRenderTarget {
  type: string
  getResult(
    children: JSX.Element[],
    width: number,
    height: number,
    attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
      style: React.CSSProperties
    }>,
  ): JSX.Element
  strokeRect(x: number, y: number, width: number, height: number, color: number, angle?: number): JSX.Element
  strokePolyline(points: Position[], color: number): JSX.Element
  strokeCircle(cx: number, cy: number, r: number, color: number): JSX.Element
}
