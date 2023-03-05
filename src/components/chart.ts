import { Position, Size, TwoPointsFormRegion } from "../utils/geometry"
import { getRoundedRectPoints, ReactRenderTarget } from "./react-render-target/react-render-target"

export function getChartAxis<T>(
  target: ReactRenderTarget<T>,
  bounding: TwoPointsFormRegion,
  step: { x?: number, y: number },
  { width, height }: Size,
  padding: {
    left: number
    right: number
    top: number
    bottom: number
  },
  options?: Partial<{
    type?: 'line' | 'bar'
    axisColor: number
    textColor: number
    textSize: number
    fontFamily: string
    textLineLength: number
    getXLabel: (x: number) => string
    getYLabel: (y: number) => string
    ySecondary: boolean
  }>,
) {
  const axisColor = options?.axisColor ?? 0xcccccc
  const axisTextColor = options?.textColor ?? 0x000000
  const axisTextSize = options?.textSize ?? 12
  const axisTextFontFamily = options?.fontFamily ?? 'monospace'
  const textLineLength = options?.textLineLength ?? 5
  const getXLabel = (x: number) => options?.getXLabel?.(x) ?? x.toString()
  const getYLabel = (y: number) => options?.getYLabel?.(y) ?? y.toString()
  const stepX = step.x ?? 1
  const stepY = step.y
  const type = options?.type ?? 'line'

  const startX = Math.floor(bounding.start.x / stepX) * stepX
  const endX = Math.ceil(bounding.end.x / stepX) * stepX
  const startY = Math.floor(bounding.start.y / stepY) * stepY
  const endY = Math.ceil(bounding.end.y / stepY) * stepY
  const scaleX = (width - padding.left - padding.right) / (endX - startX)
  const scaleY = (height - padding.top - padding.bottom) / (endY - startY)
  const tx = (x: number) => (x - startX) * scaleX + padding.left
  const ty = (y: number) => (endY - y) * scaleY + padding.top

  const x1 = tx(startX) - textLineLength
  const x2 = tx(endX) + (options?.ySecondary ? textLineLength : 0)
  const minY = ty(startY)
  const y1 = minY + textLineLength
  const y2 = ty(endY)
  const unitWidth = stepX * scaleX

  const children: T[] = []
  for (let x = startX; x <= endX; x += stepX) {
    const x0 = tx(x)
    children.push(target.renderPolyline([{ x: x0, y: y1 }, { x: x0, y: y2 }], { strokeColor: axisColor }))
    children.push(target.renderText(x0 + (type === 'bar' ? unitWidth / 2 : 0), y1, getXLabel(x), axisTextColor, axisTextSize, axisTextFontFamily, { textBaseline: 'top', textAlign: 'center' }))
  }
  for (let y = startY; y <= endY; y += stepY) {
    const y0 = ty(y)
    children.push(target.renderPolyline([{ x: x1, y: y0 }, { x: x2, y: y0 }], { strokeColor: axisColor }))
    children.push(target.renderText(x1, y0, getYLabel(y), axisTextColor, axisTextSize, axisTextFontFamily, { textBaseline: 'middle', textAlign: 'right' }))
    if (options?.ySecondary) {
      children.push(target.renderText(x2, y0, getYLabel(y), axisTextColor, axisTextSize, axisTextFontFamily, { textBaseline: 'middle', textAlign: 'left' }))
    }
  }
  return {
    axis: children,
    minY,
    tx,
    ty,
    unitWidth,
    reverseTransform(p: Position) {
      return {
        x: (p.x - padding.left) / scaleX + startX,
        y: endY - (p.y - padding.top) / scaleY,
      }
    },
  }
}

export function renderChartTooltip<T>(
  target: ReactRenderTarget<T>,
  { x, y }: Position,
  value: {
    x: number
    y: number | readonly [number, number]
  },
  options?: Partial<{
    getXLabel: (x: number) => string
    getYLabel: (y: number | readonly [number, number]) => string
    width: number
    height: number
    textColor: number
    textSize: number
    fontFamily: string
    radius: number
    backgroundColor: number
  }>
) {
  const width = options?.width ?? 40
  const height = options?.height ?? 30
  const getXLabel = (x: number) => options?.getXLabel?.(x) ?? x.toString()
  const getYLabel = (y: number | readonly [number, number]) => options?.getYLabel?.(y) ?? y.toString()
  const textColor = options?.textColor ?? 0xffffff
  const textSize = options?.textSize ?? 12
  const fontFamily = options?.fontFamily ?? 'monospace'
  const radius = options?.radius ?? 5
  const backgroundColor = options?.backgroundColor ?? 0x000000
  x += width / 2
  y -= height / 2
  return [
    target.renderPolygon(getRoundedRectPoints({ x, y, width, height }, radius, 30), { fillColor: backgroundColor }),
    target.renderText(x, y, getXLabel(value.x), textColor, textSize, fontFamily, { textBaseline: 'bottom', textAlign: 'center' }),
    target.renderText(x, y, getYLabel(value.y), textColor, textSize, fontFamily, { textBaseline: 'top', textAlign: 'center' }),
  ]
}
