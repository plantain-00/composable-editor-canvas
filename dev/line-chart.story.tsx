import React from "react"
import { getBezierSplinePoints, getChartAxis, getPointsBounding, getTwoNumbersDistance, Position, reactSvgRenderTarget, useWindowSize, SvgDraw, renderChartTooltip } from "../src"

export default () => {
  const size = useWindowSize()
  const width = size.width / 2
  const height = 300
  const target = reactSvgRenderTarget
  const [hovering, setHovering] = React.useState<Position>()
  const [result, setResult] = React.useState<{ reverseTransform: (p: Position) => Position, children: SvgDraw[], points: Position[][] }>()
  const getXLabel = (x: number) => Intl.DateTimeFormat('zh', { month: 'long' }).format(new Date(x.toString()))

  React.useEffect(() => {
    const data1 = [65, 59, 80, 81, 56, 55, 40].map((s, i) => ({ x: i + 1, y: s }))
    const data2 = [55, 49, 70, 71, 46, 45, 30].map((s, i) => ({ x: i + 1, y: s }))
    const data3 = [45, 39, 60, 61, 36, 35, 20].map((s, i) => ({ x: i + 1, y: s }))
    const data4 = [35, 29, 50, 51, 26, 25, 10].map((s, i) => ({ x: i + 1, y: s }))
    const bounding = getPointsBounding([...data1, ...data2, ...data3, ...data4])
    if (!bounding) {
      return
    }

    const { axis: children, tx, ty, reverseTransform, minY } = getChartAxis(target, bounding, { x: 1, y: 5 }, { width, height }, { left: 25, right: 25, top: 10, bottom: 20 }, {
      getXLabel,
      ySecondary: true,
    })
    const points1 = data1.map(c => ({ x: tx(c.x), y: ty(c.y) }))
    children.push(target.renderPolyline(points1, { strokeColor: 0xff0000 }))
    children.push(...points1.map(c => target.renderCircle(c.x, c.y, 3, { fillColor: 0xff0000, strokeWidth: 0 })))

    const points2 = data2.map(c => ({ x: tx(c.x), y: ty(c.y) }))
    const results2 = getBezierSplinePoints(points2, 50)
    children.push(target.renderPolyline(results2, { strokeColor: 0x00ff00 }))
    children.push(...points2.map(c => target.renderCircle(c.x, c.y, 3, { fillColor: 0x00ff00, strokeWidth: 0 })))

    const points3 = data3.map(c => ({ x: tx(c.x), y: ty(c.y) }))
    const results3 = points3.map((p, i) => {
      const r = [p]
      if (i !== 0) r.unshift({ x: (p.x + points3[i - 1].x) / 2, y: p.y })
      if (i !== points3.length - 1) r.push({ x: (p.x + points3[i + 1].x) / 2, y: p.y })
      return r
    }).flat()
    children.push(target.renderPolyline(results3, { strokeColor: 0x0000ff }))
    children.push(...points3.map(c => target.renderCircle(c.x, c.y, 3, { fillColor: 0x0000ff, strokeWidth: 0 })))

    const points4 = data4.map(c => ({ x: tx(c.x), y: ty(c.y) }))
    children.push(target.renderPolygon([...points4, { x: points4[points4.length - 1].x, y: minY }, { x: points4[0].x, y: minY }], { fillColor: 0xff0000, strokeWidth: 0 }))
    children.push(...points4.map(c => target.renderCircle(c.x, c.y, 3, { fillColor: 0xff0000, strokeWidth: 0 })))

    setResult({ reverseTransform, children, points: [points1, points2, points3, points4] })
  }, [width])

  if (!result) {
    return null
  }
  let children = result.children
  if (hovering) {
    children = [
      ...result.children,
      ...renderChartTooltip(target, hovering, result.reverseTransform(hovering), { getXLabel }),
    ]
  }

  const onMouseMove = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    for (const points of result.points) {
      const point = points.find(n => getTwoNumbersDistance(n.x, e.clientX) < 5 && getTwoNumbersDistance(n.y, e.clientY) < 5)
      if (point) {
        setHovering(point)
        return
      }
    }
    setHovering(undefined)
  }

  return (
    <div style={{ position: 'absolute', inset: '0px' }}>
      {target.renderResult(children, width, height, { attributes: { onMouseMove } })}
    </div>
  )
}
