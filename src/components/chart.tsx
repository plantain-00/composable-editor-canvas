import React from "react"
import { arcToPolyline, getArcPointAtAngle, getPointsBounding, getTwoNumberCenter, getTwoPointsAngle, getTwoPointsDistance, Position, Region, Size, TwoPointsFormRegion } from "../utils/geometry"
import { Vec3 } from "../utils/types"
import { getRoundedRectPoints, ReactRenderTarget } from "./react-render-target/react-render-target"
import { Graphic3d } from "./webgl-3d-renderer"
import { radianToAngle } from "../utils/radian"

export function getLineChart<T>(
  datas: (Position & { r?: number })[][],
  target: ReactRenderTarget<T>,
  step: { x?: number, y: number },
  size: Size,
  padding: ChartAxisPadding,
  options?: Partial<ChartAxisOptions>,
) {
  const bounding = getPointsBounding(datas.flat())
  if (!bounding) return
  const { axis: children, tx, ty, minY } = getChartAxis(target, bounding, step, size, padding, options)
  const points = datas.map(d => d.map(c => ({ x: tx(c.x), y: ty(c.y), r: c.r } as Position & { r?: number })))
  const select = (p: Position) => {
    for (let i = 0; i < points.length; i++) {
      const j = points[i].findIndex(n => getTwoPointsDistance(n, p) <= (n.r ?? 5))
      if (j >= 0) {
        return { ...points[i][j], value: datas[i][j] }
      }
    }
    return
  }
  return { children, points, select, minY }
}

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
      let angle = radianToAngle(getTwoPointsAngle(point, circle))
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

export function getPolarAreaChart<T>(
  data: number[],
  colors: number[],
  target: ReactRenderTarget<T>,
  { width, height }: Size,
  step: number,
  padding: ChartAxisPadding,
  options?: Partial<{
    opacity: number
    axisColor: number
  }>,
) {
  const startAngleInDegree = -90
  const opacity = options?.opacity ?? 0.5
  const axisColor = options?.axisColor ?? 0xcccccc
  const max = Math.ceil(Math.max(...data) / step) * step
  const circle = {
    x: (width + padding.left - padding.right) / 2,
    y: (height + padding.top - padding.bottom) / 2,
    r: Math.min((width - padding.left - padding.right) / 2, (height - padding.top - padding.bottom) / 2),
  }
  const t = (v: number) => circle.r * v / max
  const children: T[] = []
  for (let radius = step; radius <= max; radius += step) {
    const r = t(radius)
    children.push(target.renderCircle(circle.x, circle.y, r, { strokeColor: axisColor }))
    children.push(target.renderCircle(circle.x, circle.y - r, 8, { fillColor: 0xffffff, strokeWidth: 0 }))
    children.push(target.renderText(circle.x, circle.y - r, radius.toString(), axisColor, 12, 'monospace', { textAlign: 'center', textBaseline: 'middle' }))
  }
  let startAngle = startAngleInDegree
  const angles: number[] = []
  data.forEach((d, j) => {
    const endAngle = startAngle + 360 / data.length
    angles.push(getTwoNumberCenter(startAngle, endAngle))
    children.push(target.renderPolygon([circle, ...arcToPolyline({ ...circle, r: t(d), startAngle, endAngle }, 5)], { fillColor: colors[j], strokeColor: 0xffffff, strokeWidth: 2, fillOpacity: opacity }))
    startAngle = endAngle
  })

  const select = (point: Position) => {
    const distance = getTwoPointsDistance(point, circle)
    let angle = radianToAngle(getTwoPointsAngle(point, circle)) - startAngleInDegree
    if (angle < 0) {
      angle += 360
    }
    const i = Math.floor(angle * data.length / 360)
    if (i >= 0 && i < data.length && distance <= t(data[i])) {
      return { ...point, value: { x: i, y: data[i] } }
    }
    return undefined
  }

  return { children, select, circle, angles }
}

export function getRadarChart<T>(
  datas: number[][],
  colors: number[],
  target: ReactRenderTarget<T>,
  { width, height }: Size,
  step: number,
  padding: ChartAxisPadding,
  options?: Partial<{
    opacity: number
    axisColor: number
  }>,
) {
  const startAngleInDegree = -90
  const opacity = options?.opacity ?? 0.5
  const axisColor = options?.axisColor ?? 0xcccccc
  const pointRadius = 3
  const max = Math.ceil(Math.max(...datas.flat()) / step) * step
  const circle = {
    x: (width + padding.left - padding.right) / 2,
    y: (height + padding.top - padding.bottom) / 2,
    r: Math.min((width - padding.left - padding.right) / 2, (height - padding.top - padding.bottom) / 2),
  }
  const t = (v: number) => circle.r * v / max
  const angles = datas[0].map((_, i) => startAngleInDegree + i * 360 / datas[0].length)
  const children: T[] = []
  const maxRadius = t(max)
  for (const angle of angles) {
    const p = getArcPointAtAngle({ ...circle, r: maxRadius }, angle)
    children.push(target.renderPolyline([circle, p], { strokeColor: axisColor }))
  }
  for (let radius = step; radius <= max; radius += step) {
    const r = t(radius)
    const points: Position[] = []
    for (const angle of angles) {
      points.push(getArcPointAtAngle({ ...circle, r: r }, angle))
    }
    children.push(target.renderPolygon(points, { strokeColor: axisColor }))
    children.push(target.renderRect(circle.x - 10, circle.y - r - 6, 20, 12, { fillColor: 0xffffff, strokeWidth: 0 }))
    children.push(target.renderText(circle.x, circle.y - r, radius.toString(), axisColor, 12, 'monospace', { textAlign: 'center', textBaseline: 'middle' }))
  }
  const points = datas.map(d => d.map((e, i) => getArcPointAtAngle({ ...circle, r: t(e) }, angles[i])))
  points.forEach((p, i) => {
    children.push(target.renderPolygon(p, { fillColor: colors[i], strokeWidth: 0, fillOpacity: opacity }))
    children.push(target.renderPolygon(p, { strokeColor: colors[i], strokeWidth: 2 }))
    for (const e of p) {
      children.push(target.renderCircle(e.x, e.y, pointRadius, { fillColor: colors[i], strokeWidth: 0 }))
    }
  })

  const select = (point: Position) => {
    for (let i = 0; i < points.length; i++) {
      const j = points[i].findIndex(n => getTwoPointsDistance(n, point) <= pointRadius)
      if (j >= 0) {
        return { ...points[i][j], value: { x: j, y: datas[i][j] } }
      }
    }
    return undefined
  }

  return { children, select, circle, angles }
}

export function ChartTooltip(props: Position & {
  label: string
  value: number
}) {
  return (
    <div style={{
      position: 'absolute',
      top: `${props.y - 35}px`,
      left: `${props.x}px`,
      display: 'flex',
      flexDirection: 'column',
      background: 'black',
      color: 'white',
      width: '40px',
      textAlign: 'center',
      fontSize: '12px',
      borderRadius: '5px',
      pointerEvents: 'none',
    }}>
      <span>{props.label}</span>
      <span>{props.value}</span>
    </div>
  )
}

export function getChartAxis3D(
  datas: Vec3[][],
  step: { x: number, y: number, z: number },
) {
  const { minX, minY, minZ, maxX, maxY, maxZ } = getVec3Bounding(datas.flat(), { min: 0, max: 0 })
  const startX = Math.floor(minX / step.x) * step.x
  const endX = Math.ceil(maxX / step.x) * step.x
  const startY = Math.floor(minY / step.y) * step.y
  const endY = Math.ceil(maxY / step.y) * step.y
  const startZ = Math.floor(minZ / step.z) * step.z
  const endZ = Math.ceil(maxZ / step.z) * step.z
  const graphics: Graphic3d[] = []
  for (let x = minX; x <= endX; x += step.x) {
    graphics.push({ geometry: { type: 'lines', points: [x, startY, 0, x, endY, 0] }, color: [0, 1, 0, 1] })
    graphics.push({ geometry: { type: 'lines', points: [x, 0, startZ, x, 0, endZ] }, color: [0, 0, 1, 1] })
  }
  for (let y = minY; y <= endY; y += step.y) {
    graphics.push({ geometry: { type: 'lines', points: [startX, y, 0, endX, y, 0] }, color: [1, 0, 0, 1] })
    graphics.push({ geometry: { type: 'lines', points: [0, y, startZ, 0, y, endZ] }, color: [0, 0, 1, 1] })
  }
  for (let z = minZ; z <= endZ; z += step.z) {
    graphics.push({ geometry: { type: 'lines', points: [startX, 0, z, endX, 0, z] }, color: [1, 0, 0, 1] })
    graphics.push({ geometry: { type: 'lines', points: [0, startY, z, 0, endY, z] }, color: [0, 1, 0, 1] })
  }
  return graphics
}

function getVec3Bounding(vecs: Vec3[], defaultValue = { min: Infinity, max: -Infinity }) {
  let minX = defaultValue.min
  let minY = defaultValue.min
  let minZ = defaultValue.min
  let maxX = defaultValue.max
  let maxY = defaultValue.max
  let maxZ = defaultValue.max
  for (const vec of vecs) {
    const x = vec[0]
    const y = vec[1]
    const z = vec[2]
    if (x < minX) {
      minX = x
    }
    if (x > maxX) {
      maxX = x
    }
    if (y < minY) {
      minY = y
    }
    if (y > maxY) {
      maxY = y
    }
    if (z < minZ) {
      minZ = z
    }
    if (z > maxZ) {
      maxZ = z
    }
  }
  return {
    maxX,
    minX,
    minY,
    maxY,
    minZ,
    maxZ,
  }
}
