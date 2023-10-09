import React from "react"
import { Button, NumberEditor, Position, StringEditor, SvgDraw, getLineChart, mathStyleExpressionToExpression, reactSvgRenderTarget, renderChartTooltip, useWindowSize } from "../src"
import { evaluateExpression, parseExpression, tokenizeExpression } from "expression-engine"

export default () => {
  const [value, setValue] = React.useState('sin(x)')
  const [hovering, setHovering] = React.useState<Position & { value: Position }>()
  const [min, setMin] = React.useState(0)
  const [max, setMax] = React.useState(10)
  const [isMath, setIsMath] = React.useState(true)
  const [error, setError] = React.useState<string>()

  const size = useWindowSize()
  const width = size.width / 2
  const height = 300
  const target = reactSvgRenderTarget
  const [result, setResult] = React.useState<{ children: SvgDraw[], select: (p: Position) => Position & { value: Position } | undefined }>()
  const parseInputExpression = (v: string) => parseExpression(tokenizeExpression(isMath ? mathStyleExpressionToExpression(v) : v))

  const drawChart = () => {
    try {
      if (!value) return
      const e = parseInputExpression(value)
      const points: Position[] = []
      const step = (max - min) / 100
      for (let x = min; x <= max; x += step) {
        const y = evaluateExpression(e, {
          sin: Math.sin,
          cos: Math.cos,
          tan: Math.tan,
          x,
        })
        if (typeof y === 'number' && !isNaN(y)) {
          points.push({ x, y })
        }
      }
      const r = getLineChart([points, [{ x: min, y: 0 }, { x: max, y: 0 }]], target, { x: 0.01, y: 0.01 }, { width, height }, { left: 25, right: 25, top: 10, bottom: 20 }, { xLabelDisabled: true, yLabelDisabled: true })
      if (!r) return
      const { points: [points1, points2], children, select } = r
      children.push(target.renderPolyline(points2, { strokeColor: 0x00ff00 }))
      children.push(target.renderPolyline(points1, { strokeColor: 0xff0000 }))
      setResult({ children, select })
      setError(undefined)
    } catch (error) {
      console.info(error)
      setError(String(error))
    }
  }
  let children: SvgDraw[] | undefined
  if (result) {
    children = result.children
    if (hovering) {
      children = [
        ...result.children,
        ...renderChartTooltip(target, hovering, hovering.value),
      ]
    }
  }
  return (
    <div style={{ position: 'absolute', inset: '0px' }}>
      {result && children && <div>
        {target.renderResult(children, width, height, { attributes: { onMouseMove: e => setHovering(result.select({ x: e.clientX, y: e.clientY })) } })}
      </div>}
      <div style={{ margin: '10px' }}>
        <StringEditor style={{ width: 'calc(50% - 30px)', height: '150px' }} textarea value={value} setValue={setValue} />
        <div>
          <label>
            <input type='checkbox' checked={isMath} onChange={() => setIsMath(!isMath)} />
            input math style expression
          </label>
        </div>
        <div>
          <NumberEditor style={{ width: '50px' }} value={min} setValue={setMin} />
          ~
          <NumberEditor style={{ width: '50px' }} value={max} setValue={setMax} />
        </div>
        <Button disabled={!value} onClick={drawChart}>draw chart</Button>
        {error && <div>{error}</div>}
      </div>
    </div>
  )
}