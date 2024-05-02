import React from "react"
import { ArrayEditor, Button, NumberEditor, Position, StringEditor, SvgDraw, calculateEquation5, delta1, deriveExpressionWith, expressionHasVariable, expressionToFactors, factorsToEquationParams, getLineChart, getTwoNumberCenter, isBetween, isSameNumber, mathStyleExpressionToExpression, newtonIterate, optimizeExpression, reactSvgRenderTarget, renderChartTooltip, useJsonEditorData, useWindowSize } from "../src"
import { evaluateExpression, parseExpression, printExpression, tokenizeExpression } from "expression-engine"

export default () => {
  const { value, update, getArrayProps } = useJsonEditorData(['sin(x)'])
  const [hovering, setHovering] = React.useState<Position & { value: Position }>()
  const [min, setMin] = React.useState(0)
  const [max, setMax] = React.useState(10)
  const [isMath, setIsMath] = React.useState(true)
  const [equationResult, setEquationResult] = React.useState<number[]>([])
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
      const x0 = getTwoNumberCenter(min, max)
      const ctx = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        ln: Math.log,
      }
      const newEquationResult: number[] = []
      for (const v of value) {
        if (!v) continue
        const p: Position[] = []
        const e = parseInputExpression(v)

        const factors = expressionToFactors(e)
        if (factors) {
          const params = factorsToEquationParams(factors, 'x')
          if (params) {
            newEquationResult.push(...calculateEquation5(params, x0, delta1))
          }
        }
        const g = parseInputExpression(printExpression(optimizeExpression(deriveExpressionWith(e, 'x'), v => expressionHasVariable(v, 'x'))))
        const r1 = newtonIterate(x0, x => {
          const y = evaluateExpression(e, { ...ctx, x })
          return typeof y === 'number' ? y : NaN
        }, x => {
          const y = evaluateExpression(g, { ...ctx, x })
          return typeof y === 'number' ? y : NaN
        }, delta1)
        if (r1 !== undefined && newEquationResult.every(n => !isSameNumber(n, r1))) {
          newEquationResult.push(r1)
        }

        for (let x = min; x <= max; x += step) {
          const y = evaluateExpression(e, { ...ctx, x })
          if (typeof y === 'number' && !isNaN(y)) {
            p.push({ x, y })
          }
        }
        if (p.length > 0) {
          points.push(p)
        }
      }
      setEquationResult(newEquationResult)
      const ys = points.flat().map(p => p.y)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const equationResultPoints = newEquationResult.filter(n => isBetween(n, min, max)).map(x => [{ x, y: minY }, { x, y: maxY }])
      const r = getLineChart([[{ x: min, y: 0 }, { x: max, y: 0 }], ...equationResultPoints, ...points], target, { x: 0.01, y: 0.01 }, { width, height }, { left: 25, right: 25, top: 10, bottom: 20 }, { xLabelDisabled: true, yLabelDisabled: true })
      if (!r) return
      const { points: [axis, ...p], children, select } = r
      children.push(target.renderPolyline(axis, { strokeColor: 0x00ff00 }))
      for (let i = 0; i < p.length; i++) {
        children.push(target.renderPolyline(p[i], { strokeColor: i < equationResultPoints.length ? 0x0000ff : 0xff0000 }))
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
        {equationResult.map((r, i) => <div key={i} style={{ border: '1px solid black', maxHeight: '150px', overflowY: 'auto', position: 'relative' }}>
          <code key={i}>x = {r}</code>
        </div>)}
        {error && <div>{error}</div>}
      </div>
    </div>
  )
}