import React from "react"
import { Position, reactSvgRenderTarget, useWindowSize, SvgDraw, renderChartTooltip, getPieChart } from "../src"

export default () => {
  const size = useWindowSize()
  const width = size.width / 2
  const height = 350
  const target = reactSvgRenderTarget
  const [hovering, setHovering] = React.useState<Position & { value: { x: number, y: number } }>()
  const [hovering2, setHovering2] = React.useState<Position & { value: { x: number, y: number } }>()
  const [result, setResult] = React.useState<{ children: SvgDraw[], select: (p: Position) => Position & { value: { x: number, y: number } } | undefined }>()
  const [result2, setResult2] = React.useState<{ children: SvgDraw[], select: (p: Position) => Position & { value: { x: number, y: number } } | undefined }>()
  const getXLabel = (x: number) => Intl.DateTimeFormat('zh', { month: 'long' }).format(new Date(x.toString()))

  React.useEffect(() => {
    const datas = [
      [65, 59, 80, 81, 56, 55, 40],
      [75, 49, 70, 71, 46, 45, 30],
      [85, 39, 60, 61, 36, 35, 20],
    ]
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff0000, 0x00ff00, 0x0000ff, 0x000000]
    setResult(getPieChart(datas, colors, target, { width, height }, { left: 10, right: 10, top: 10, bottom: 10 }))
    setResult2(getPieChart(datas, colors, target, { width, height }, { left: 10, right: 10, top: 10, bottom: 10 }, { type: 'doughnut' }))
  }, [width])

  if (!result || !result2) {
    return null
  }
  let children = result.children
  if (hovering) {
    children = [
      ...result.children,
      ...renderChartTooltip(target, hovering, hovering.value, { getXLabel }),
    ]
  }
  let children2 = result2.children
  if (hovering2) {
    children2 = [
      ...result2.children,
      ...renderChartTooltip(target, hovering2, hovering2.value, { getXLabel }),
    ]
  }
  return (
    <div style={{ position: 'absolute', inset: '0px', display: 'flex', flexDirection: 'column' }}>
      {target.renderResult(children, width, height, { attributes: { onMouseMove: e => setHovering(result.select({ x: e.clientX, y: e.clientY })) } })}
      {target.renderResult(children2, width, height, { attributes: { onMouseMove: e => setHovering2(result2.select({ x: e.clientX, y: e.clientY - height })) } })}
    </div>
  )
}
