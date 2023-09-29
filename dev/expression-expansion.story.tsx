import React from "react"
import { Button, Factor, StringEditor, composeExpression, divideFactors, expandExpression, expressionToFactors, factorToExpression, factorsToExpression, groupAllFactors, groupFactorsBy, mathStyleExpressionToExpression, optimizeFactors, printMathStyleExpression, reactSvgRenderTarget, renderExpression, sortFactors } from "../src"
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
  const expandAll = () => {
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
  const divideBy = () => {
    try {
      if (!secondValue) return
      if (!factors) return
      const r = parseInputExpression(secondValue)
      const f = expressionToFactors(r)
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
  const groupBy = () => {
    try {
      if (!secondValue) return
      if (!factors) return
      const r = parseInputExpression(secondValue)
      const f = expressionToFactors(r)
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
  const replaceWith = () => {
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
  const formatStyle = () => {
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
  const groupAll = () => {
    if (!factors) return
    setExpression(groupAllFactors(factors))
  }

  return (
    <div>
      <StringEditor style={{ width: 'calc(100% - 30px)', height: '150px' }} textarea value={value} setValue={setValue} />
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
        <StringEditor style={{ width: 'calc(100% - 115px)' }} value={thirdValue} setValue={setThirdValue} />
      </div>
      <Button onClick={expandAll}>expand all</Button>
      <Button onClick={divideBy}>divide by</Button>
      <Button onClick={groupBy}>group by</Button>
      <Button onClick={replaceWith}>replace with</Button>
      <Button onClick={formatStyle}>format style</Button>
      <Button onClick={groupAll}>group all</Button>
      {factors && factors.length > 0 && <div style={{ border: '1px solid black', maxHeight: '150px', overflowY: 'auto', marginBottom: '5px' }}>
        {factors.map((f, i) => <div key={i}><code>{outputExpression(factorToExpression(f))}</code></div>)}
      </div>}
      {factors && <div style={{ border: '1px solid black', maxHeight: '150px', overflowY: 'auto', marginBottom: '5px', position: 'relative' }}>
        <code>{outputExpression(factorsToExpression(factors))}</code>
        <Button style={{ position: 'absolute', right: 0, top: 0, background: 'wheat' }} onClick={() => navigator.clipboard.writeText(outputExpression(factorsToExpression(factors)))}>copy</Button>
      </div>}
      {expression && <div style={{ border: '1px solid black', maxHeight: '150px', overflowY: 'auto', position: 'relative' }}>
        <code>{outputExpression(expression)}</code>
        <Button style={{ position: 'absolute', right: 0, top: 0, background: 'wheat' }} onClick={() => navigator.clipboard.writeText(outputExpression(expression))}>copy</Button>
      </div>}
      {expression && renderExpression(reactSvgRenderTarget, expression)}
      {error && <div>{error}</div>}
    </div>
  )
}