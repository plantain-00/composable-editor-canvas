import React from "react"
import { getBarChart, Position, reactSvgRenderTarget, useWindowSize, SvgDraw, renderChartTooltip, getRoundedRectPoints, getPointsBounding, getTwoPointsDistance } from "../src"

export default () => {
  const size = useWindowSize()
  const width = size.width / 2
  const height = 500
  const target = reactSvgRenderTarget
  const [hovering, setHovering] = React.useState<Position & { value: { x: number, y: number | number[] } }>()
  const [result, setResult] = React.useState<{ children: SvgDraw[], select: (p: Position) => Position & { value: { x: number, y: number | number[] } } | undefined }>()
  const getXLabel = (x: number) => Intl.DateTimeFormat('zh', { month: 'long' }).format(new Date((x + 1).toString()))

  React.useEffect(() => {
    const datas = [
      [65, 59, 80, 81, 56, 55, 40].map(x => [x]),
      [55, 49, 70, 71, 46, 45, 30].map(x => [x]),
      [45, 39, 60, 61, 36, 35, 30].map(x => [x - 20, x]),
      [65, 59, 80, 81, 56, 55, 40].map(x => [x - 30, x - 15, x - 5, x]),
    ]
    const data1 = [35, 29, 50, 51, 26, 25, 10].map((s, i) => ({ x: i, y: s }))
    const colors = [[0xff0000], [0x00ff00], [0x0000ff], [0xff0000, 0x00ff00, 0x0000ff]]
    const { children, select, tx, ty } = getBarChart(datas, colors, (region, color) => target.renderPolygon(getRoundedRectPoints(region, 5, 30), { fillColor: color, strokeWidth: 0 }), target, { y: 5 }, { width, height }, { left: 25, right: 10, top: 10, bottom: 20 }, {
      getXLabel,
      bounding: getPointsBounding(data1)
    })

    const points1 = data1.map(c => ({ x: tx(c.x + 0.5), y: ty(c.y) }))
    children.push(target.renderPolyline(points1, { strokeColor: 0x000000 }))
    children.push(...points1.map(c => target.renderCircle(c.x, c.y, 3, { fillColor: 0x000000, strokeWidth: 0 })))

    setResult({
      children,
      select: (p) => {
        const j = points1.findIndex(n => getTwoPointsDistance(n, p) <= 5)
        if (j >= 0) {
          return { ...points1[j], value: data1[j] }
        }
        return select(p)
      }
    })
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
