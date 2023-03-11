import React from "react"
import { getBezierSplinePoints, getLineChart, Position, reactSvgRenderTarget, useWindowSize, SvgDraw, renderChartTooltip, getTwoNumberCenter } from "../src"

export default () => {
  const size = useWindowSize()
  const width = size.width / 2
  const height = 300
  const target = reactSvgRenderTarget
  const [hovering, setHovering] = React.useState<Position & { value: Position }>()
  const [result, setResult] = React.useState<{ children: SvgDraw[], select: (p: Position) => Position & { value: Position } | undefined }>()
  const getXLabel = (x: number) => Intl.DateTimeFormat('zh', { month: 'long' }).format(new Date(x.toString()))

  React.useEffect(() => {
    const data1 = [65, 59, 80, 81, 56, 55, 40].map((s, i) => ({ x: i + 1, y: s }))
    const data2 = [55, 49, 70, 71, 46, 45, 30].map((s, i) => ({ x: i + 1, y: s }))
    const data3 = [45, 39, 60, 61, 36, 35, 20].map((s, i) => ({ x: i + 1, y: s }))
    const data4 = [35, 29, 50, 51, 26, 25, 10].map((s, i) => ({ x: i + 1, y: s }))
    const data5 = [75, 69, 90, 91, 66, 65, 50].map((s, i) => ({ x: i + 1, y: s, r: i * 3 + 5 }))
    const r = getLineChart([data1, data2, data3, data4, data5], target, { x: 1, y: 5 }, { width, height }, { left: 25, right: 25, top: 10, bottom: 20 }, {
      getXLabel,
      ySecondary: true,
    })
    if (!r) return
    const { points: [points1, points2, points3, points4, points5], children, select, minY } = r

    children.push(target.renderPolyline(points1, { strokeColor: 0xff0000 }))
    children.push(...points1.map(c => target.renderCircle(c.x, c.y, 3, { fillColor: 0xff0000, strokeWidth: 0 })))
    children.push(target.renderPolyline(getBezierSplinePoints(points2, 50), { strokeColor: 0x00ff00 }))
    children.push(...points2.map(c => target.renderCircle(c.x, c.y, 3, { fillColor: 0x00ff00, strokeWidth: 0 })))
    children.push(target.renderPolyline(points3.map((p, i) => {
      const r = [p]
      if (i !== 0) r.unshift({ x: getTwoNumberCenter(p.x, points3[i - 1].x), y: p.y })
      if (i !== points3.length - 1) r.push({ x: getTwoNumberCenter(p.x, points3[i + 1].x), y: p.y })
      return r
    }).flat(), { strokeColor: 0x0000ff }))
    children.push(...points3.map(c => target.renderCircle(c.x, c.y, 3, { fillColor: 0x0000ff, strokeWidth: 0 })))
    children.push(target.renderPolygon([...points4, { x: points4[points4.length - 1].x, y: minY }, { x: points4[0].x, y: minY }], { fillColor: 0xff0000, strokeWidth: 0 }))
    children.push(...points4.map(c => target.renderCircle(c.x, c.y, 3, { fillColor: 0xff0000, strokeWidth: 0 })))
    children.push(...points5.map(c => target.renderCircle(c.x, c.y, c.r ?? 5, { fillColor: 0x00ff00, strokeWidth: 0 })))

    setResult({ children, select })
  }, [width])

  if (!result) {
    return null
  }
  let children = result.children
  if (hovering) {
    children = [
      ...result.children,
      ...renderChartTooltip(target, hovering, hovering.value, { getXLabel }),
    ]
  }
  return (
    <div style={{ position: 'absolute', inset: '0px' }}>
      {target.renderResult(children, width, height, { attributes: { onMouseMove: e => setHovering(result.select({ x: e.clientX, y: e.clientY })) } })}
    </div>
  )
}
