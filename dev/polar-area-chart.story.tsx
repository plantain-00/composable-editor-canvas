import React from "react"
import { Position, reactSvgRenderTarget, useWindowSize, SvgDraw, renderChartTooltip, getPolarAreaChart, getArcPointAtAngle } from "../src"

export default () => {
  const size = useWindowSize()
  const width = size.width / 2
  const height = 350
  const target = reactSvgRenderTarget
  const [hovering, setHovering] = React.useState<Position & { value: { x: number, y: number } }>()
  const [result, setResult] = React.useState<{ children: SvgDraw[], select: (p: Position) => Position & { value: { x: number, y: number } } | undefined }>()
  const getXLabel = (x: number) => Intl.DateTimeFormat('zh', { month: 'long' }).format(new Date((x + 1).toString()))

  React.useEffect(() => {
    const datas = [65, 59, 80, 81, 56, 55, 40]
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff0000, 0x00ff00, 0x0000ff, 0x000000]
    const r = getPolarAreaChart(datas, colors, target, { width, height }, 10, { left: 10, right: 10, top: 30, bottom: 10 })
    r.angles.forEach((angle, i) => {
      const p = getArcPointAtAngle({ ...r.circle, r: r.circle.r + 30 }, angle)
      r.children.push(target.renderText(p.x, p.y, getXLabel(i), 0xcccccc, 20, 'monospace', { textAlign: 'center', textBaseline: 'middle' }))
    })
    setResult(r)
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
    <div style={{ position: 'absolute', inset: '0px', display: 'flex', flexDirection: 'column' }}>
      {target.renderResult(children, width, height, { attributes: { onMouseMove: e => setHovering(result.select({ x: e.clientX, y: e.clientY })) } })}
    </div>
  )
}
