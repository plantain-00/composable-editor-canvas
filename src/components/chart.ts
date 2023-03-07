import { arcToPolyline, getPointsBounding, getTwoPointsAngle, getTwoPointsDistance, Position, Region, Size, TwoPointsFormRegion } from "../utils/geometry"
import { getRoundedRectPoints, ReactRenderTarget } from "./react-render-target/react-render-target"

export function getChartAxis<T>(
  target: ReactRenderTarget<T>,
  bounding: TwoPointsFormRegion,
  step: { x?: number, y: number },
  { width, height }: Size,
  padding: ChartAxisPadding,
  options?: Partial<ChartAxisOptions>,
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

interface ChartAxisOptions {
  type: 'line' | 'bar'
  axisColor: number
  textColor: number
  textSize: number
  fontFamily: string
  textLineLength: number
  getXLabel: (x: number) => string
  getYLabel: (y: number) => string
  ySecondary: boolean
}

interface ChartAxisPadding {
  left: number
  right: number
  top: number
  bottom: number
}

export function renderChartTooltip<T, V extends number | number[]>(
  target: ReactRenderTarget<T>,
  { x, y }: Position,
  value: {
    x: number
    y: V
  },
  options?: Partial<{
    getXLabel: (x: number) => string
    getYLabel: (y: V) => string
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
  const getYLabel = (y: V) => options?.getYLabel?.(y) ?? y.toString()
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

interface BarChartOptions {
  barPadding: number
  barSpacing: number
  bounding: TwoPointsFormRegion
}

export function getBarChart<T>(
  datas: number[][][],
  colors: number[][],
  render: (region: Region, color: number) => T,
  target: ReactRenderTarget<T>,
  step: { x?: number, y: number },
  size: Size,
  padding: ChartAxisPadding,
  options?: Partial<ChartAxisOptions & BarChartOptions>,
) {
  let bounding = {
    start: {
      x: 0,
      y: 0,
    },
    end: {
      x: Math.max(...datas.map(d => d.length)),
      y: 0,
    },
  }
  for (const y of datas.flat(2)) {
    if (y < bounding.start.y) {
      bounding.start.y = y
    }
    if (y > bounding.end.y) {
      bounding.end.y = y
    }
  }
  if (options?.bounding) {
    bounding = getPointsBounding([options.bounding.start, options.bounding.end, bounding.start, bounding.end]) || bounding
  }
  const { axis: children, tx, ty, reverseTransform, unitWidth } = getChartAxis(target, bounding, step, size, padding, {
    type: 'bar',
    ...options,
  })

  const barPadding = options?.barPadding ?? 0.1
  const barSpacing = options?.barSpacing ?? 0.05
  const barRate = (1 - barPadding * 2 - (datas.length - 1) * barSpacing) / datas.length
  const barWidth = barRate * unitWidth
  const barTotal = barRate + barSpacing
  datas.forEach((d, i) => {
    d.forEach((c, j) => {
      if (c.length === 1) c = [0, ...c]
      const x = tx(j) + unitWidth * (barPadding + i * barTotal) + barWidth / 2
      const y = c.map(b => ty(b))
      for (let k = 1; k < y.length; k++) {
        children.push(render({ x, y: (y[k - 1] + y[k]) / 2, width: barWidth, height: Math.abs(y[k - 1] - y[k]) }, colors[i][k - 1]))
      }
    })
  })

  const select = (point: Position) => {
    const p = reverseTransform(point)
    const j = Math.floor(p.x)
    const offset = p.x - j
    if (offset >= barPadding && offset <= 1 - barPadding) {
      const i = Math.floor((offset - barPadding) / barTotal)
      if (offset - barPadding - i * barTotal <= barRate && i >= 0 && i < datas.length && datas[i][j]) {
        const data = datas[i][j].length === 1 ? [0, ...datas[i][j]] : datas[i][j]
        for (let k = 1; k < data.length; k++) {
          if (p.y >= data[k - 1] && p.y <= data[k]) {
            const value = datas[i][j]
            return { ...point, value: { x: j, y: value.length > 2 ? Math.abs(value[k - 1] - value[k]) : value } }
          }
        }
      }
    }
    return
  }

  return { children, select, tx, ty }
}

export function getPieChart<T>(
  datas: number[][],
  colors: number[],
  target: ReactRenderTarget<T>,
  { width, height }: Size,
  padding: ChartAxisPadding,
  options?: Partial<{
    type: 'pie' | 'doughnut'
    startAngle: number
  }>
) {
  const type = options?.type ?? 'pie'
  const startAngleInDegree = options?.startAngle ?? -90
  const sums = datas.map(d => d.reduce((p, c) => p + c, 0))
  const circle = {
    x: (width + padding.left - padding.right) / 2,
    y: (height + padding.top - padding.bottom) / 2,
    r: Math.min((width - padding.left - padding.right) / 2, (height - padding.top - padding.bottom) / 2),
  }
  const holeRadius = circle.r * (type === 'doughnut' ? 0.5 : 0)
  const ringRadius = circle.r - holeRadius
  const children: T[] = []
  const allAngles: number[][] = []
  datas.forEach((data, i) => {
    let startAngle = startAngleInDegree
    const angles: number[] = []
    const startRadius = holeRadius + ringRadius * i / datas.length
    const endRadius = holeRadius + ringRadius * (i + 1) / datas.length
    data.forEach((d, j) => {
      angles.push(startAngle)
      const endAngle = startAngle + d / sums[i] * 360
      children.push(target.renderPolygon([...arcToPolyline({ ...circle, r: startRadius, startAngle, endAngle }, 5), ...arcToPolyline({ ...circle, r: endRadius, startAngle: endAngle, endAngle: startAngle, counterclockwise: true }, 5)], { fillColor: colors[j], strokeColor: 0xffffff, strokeWidth: 2 }))
      startAngle = endAngle
    })
    allAngles.push(angles)
  })

  const select = (point: Position) => {
    const distance = getTwoPointsDistance(point, circle)
    const i = Math.floor((distance - holeRadius) / ringRadius * datas.length)
    if (i >= 0 && i < datas.length) {
      const angles = allAngles[i]
      let angle = getTwoPointsAngle(point, circle) / Math.PI * 180
      if (angle < startAngleInDegree) {
        angle += 360
      }
      let j = angles.findIndex(a => a >= angle)
      if (j === -1) {
        j = angles.length - 1
      }
      return { ...point, value: { x: j, y: datas[i][j] } }
    }
    return undefined
  }

  return { children, select }
}
