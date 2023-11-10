import React from "react"
import { ArrayEditor, Button, NumberEditor, Position, StringEditor, SvgDraw, getLineChart, mathStyleExpressionToExpression, reactSvgRenderTarget, renderChartTooltip, useJsonEditorData, useWindowSize } from "../src"
import { evaluateExpression, parseExpression, tokenizeExpression } from "expression-engine"

export default () => {
  const { value, update, getArrayProps } = useJsonEditorData(['sin(x)'])
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
      if (value.length === 0) return
      const points: Position[][] = []
      const step = (max - min) / 100
      for (const v of value) {
        if (!v) continue
        const p: Position[] = []
        const e = parseInputExpression(v)
        for (let x = min; x <= max; x += step) {
          const y = evaluateExpression(e, {
            sin: Math.sin,
            cos: Math.cos,
            tan: Math.tan,
            x,
          })
          if (typeof y === 'number' && !isNaN(y)) {
            p.push({ x, y })
          }
        }
        if (p.length > 0) {
          points.push(p)
        }
      }
      const r = getLineChart([[{ x: min, y: 0 }, { x: max, y: 0 }], ...points], target, { x: 0.01, y: 0.01 }, { width, height }, { left: 25, right: 25, top: 10, bottom: 20 }, { xLabelDisabled: true, yLabelDisabled: true })
      if (!r) return
      const { points: [axis, ...p], children, select } = r
      children.push(target.renderPolyline(axis, { strokeColor: 0x00ff00 }))
      for (const f of p) {
        children.push(target.renderPolyline(f, { strokeColor: 0xff0000 }))
      }
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
        <ArrayEditor
          {...getArrayProps(v => v, '')}
          inline
          style={{ width: 'calc(50% - 30px)' }}
          items={value.map((f, i) => <StringEditor style={{ height: '50px' }} textarea value={f} setValue={update((draft, v) => draft[i] = v)} />)}
        />
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
        <Button disabled={value.length === 0} onClick={drawChart}>draw chart</Button>
        {error && <div>{error}</div>}
      </div>
    </div>
  )
}