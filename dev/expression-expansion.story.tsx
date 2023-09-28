import React from "react"
import { Button, ExpressionEditor, Factor, StringEditor, composeExpression, divideFactors, expandExpression, expressionToFactors, factorToExpression, factorsToExpression, groupFactorsBy, mathStyleExpressionToExpression, optimizeFactors, printMathStyleExpression, reactSvgRenderTarget, renderExpression, sortFactors } from "../src"
import { Expression2, parseExpression, printExpression, tokenizeExpression } from "expression-engine"

export default () => {
  const [value, setValue] = React.useState('(e1 i2 u + i2 u u + e2 i1 (-(d2 d2 e1 i1 i2 u + d1 d1 e1 i2 i2 u + (-d1) d1 i1 i1 u u + d1 d1 i2 i2 u u + i1 i1 i2)) / i1 / w + i1 (-(d2 d2 e1 i1 i2 u + d1 d1 e1 i2 i2 u + (-d1) d1 i1 i1 u u + d1 d1 i2 i2 u u + i1 i1 i2)) / i1 / w (-(d2 d2 e1 i1 i2 u + d1 d1 e1 i2 i2 u + (-d1) d1 i1 i1 u u + d1 d1 i2 i2 u u + i1 i1 i2)) / i1 / w) w i1 w i1')
  const [secondValue, setSecondValue] = React.useState('')
  const [thirdValue, setThirdValue] = React.useState('')
  const [isMath, setIsMath] = React.useState(true)
  const [outputMath, setOutputMath] = React.useState(true)
  const [error, setError] = React.useState<string>()
  const [factors, setFactors] = React.useState<Factor[]>()
  const [expression, setExpression] = React.useState<Expression2>()

  const parseInputExpression = (v: string) => parseExpression(tokenizeExpression(isMath ? mathStyleExpressionToExpression(v) : v))
  const outputExpression = (e: Expression2) => outputMath ? printMathStyleExpression(e) : printExpression(e)
  const expand = () => {
    try {
      if (!value) return
      const r = expandExpression(parseInputExpression(value))
      let f = expressionToFactors(r)
      if (f) {
        f = optimizeFactors(f)
        sortFactors(f)
        setFactors(f)
        setExpression(undefined)
      } else {
        setExpression(r)
        setFactors(undefined)
      }
      setError(undefined)
    } catch (error) {
      console.info(error)
      setError(String(error))
      setFactors(undefined)
      setExpression(undefined)
    }
  }
  const divide = () => {
    try {
      if (!secondValue) return
      if (!factors) return
      const r = parseInputExpression(secondValue)
      let f = expressionToFactors(r)
      if (f) {
        const g = divideFactors(factors, f)
        if (g) {
          setFactors(g)
        }
      }
      setError(undefined)
    } catch (error) {
      setError(String(error))
    }
  }
  const group = () => {
    try {
      if (!secondValue) return
      if (!factors) return
      const r = parseInputExpression(secondValue)
      let f = expressionToFactors(r)
      if (f && f.length === 1) {
        const g = groupFactorsBy(factors, f[0])
        if (g) {
          setExpression(g)
        }
      }
      setError(undefined)
    } catch (error) {
      setError(String(error))
    }
  }
  const compose = () => {
    try {
      if (!secondValue) return
      if (!thirdValue) return
      if (!value) return
      const r1 = parseInputExpression(value)
      const r3 = parseInputExpression(thirdValue)
      const g = composeExpression(r1, { [secondValue]: r3 })
      if (g) {
        setExpression(g)
      }
      setError(undefined)
    } catch (error) {
      setError(String(error))
    }
  }
  const output = () => {
    try {
      if (!value) return
      const r = parseInputExpression(value)
      setExpression(r)
      setError(undefined)
    } catch (error) {
      setError(String(error))
      setExpression(undefined)
    }
  }

  return (
    <div>
      <ExpressionEditor height={200} value={value} setValue={setValue} />
      <div>
        <label>
          <input type='checkbox' checked={isMath} onChange={() => setIsMath(!isMath)} />
          input math style expression
        </label>
        <label>
          <input type='checkbox' checked={outputMath} onChange={() => setOutputMath(!outputMath)} />
          output math style expression
        </label>
      </div>
      <div>
        <StringEditor style={{ width: '50px' }} value={secondValue} setValue={setSecondValue} />
        =
        <StringEditor value={thirdValue} setValue={setThirdValue} />
      </div>
      <Button onClick={expand}>expand</Button>
      <Button onClick={divide}>divide</Button>
      <Button onClick={group}>group</Button>
      <Button onClick={compose}>compose</Button>
      <Button onClick={output}>output</Button>
      {factors && factors.map((f, i) => <div key={i}><code>{outputExpression(factorToExpression(f))}</code></div>)}
      {factors && <div><code>{outputExpression(factorsToExpression(factors))}</code></div>}
      {expression && <div><code>{outputExpression(expression)}</code></div>}
      {expression && renderExpression(reactSvgRenderTarget, expression)}
      {error && <div>{error}</div>}
    </div>
  )
}