import React from "react"
import { Button, Factor, StringEditor, composeExpression, deriveExpressionWith, divideFactors, expandExpression, expressionToFactors, factorToExpression, factorsToExpression, groupAllFactors, groupFactorsBy, mathStyleExpressionToExpression, optimizeExpression, optimizeFactors, printMathStyleExpression, reactSvgRenderTarget, renderExpression, sortFactors } from "../src"
import { Expression2, parseExpression, printExpression, tokenizeExpression } from "expression-engine"

export default () => {
  const [value, setValue] = React.useState('(x + a)^2')
  const [secondValue, setSecondValue] = React.useState('x')
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
  const deriveWith = () => {
    try {
      if (!secondValue) return
      if (!value) return
      const r = parseInputExpression(value)
      const g = deriveExpressionWith(r, secondValue)
      setExpression(g)
      setError(undefined)
    } catch (error) {
      setError(String(error))
      setExpression(undefined)
    }
  }
  const optimize = () => {
    try {
      if (!value) return
      const r = parseInputExpression(value)
      const g = optimizeExpression(r)
      setExpression(g)
      setError(undefined)
    } catch (error) {
      setError(String(error))
      setExpression(undefined)
    }
  }
  const setText = (text: string) => {
    setValue(text)
    setError(undefined)
    setFactors(undefined)
    setExpression(undefined)
  }

  return (
    <div>
      <StringEditor style={{ width: 'calc(100% - 30px)', height: '150px' }} textarea value={value} setValue={setText} />
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
      <Button disabled={!value} onClick={expandAll}>expand all</Button>
      <Button disabled={!secondValue || !factors} onClick={divideBy}>divide by</Button>
      <Button disabled={!secondValue || !factors} onClick={groupBy}>group by</Button>
      <Button disabled={!value || !secondValue || !thirdValue} onClick={replaceWith}>replace with</Button>
      <Button disabled={!value} onClick={formatStyle}>format style</Button>
      <Button disabled={!factors} onClick={groupAll}>group all</Button>
      <Button disabled={!value || !secondValue} onClick={deriveWith}>derive with</Button>
      <Button disabled={!value} onClick={optimize}>optimize</Button>
      {factors && factors.length > 0 && <div style={{ border: '1px solid black', maxHeight: '150px', overflowY: 'auto', marginBottom: '5px' }}>
        {factors.map((f, i) => <div key={i}><code>{outputExpression(factorToExpression(f))}</code></div>)}
      </div>}
      {factors && <div style={{ border: '1px solid black', maxHeight: '150px', overflowY: 'auto', marginBottom: '5px', position: 'relative' }}>
        <code>{outputExpression(factorsToExpression(factors))}</code>
        <Button style={{ position: 'absolute', right: 0, top: 0, background: 'wheat' }} onClick={() => navigator.clipboard.writeText(outputExpression(factorsToExpression(factors)))}>copy</Button>
        <Button style={{ position: 'absolute', right: 65, top: 0, background: 'wheat' }} onClick={() => setText(outputExpression(factorsToExpression(factors)))}>edit</Button>
      </div>}
      {expression && <div style={{ border: '1px solid black', maxHeight: '150px', overflowY: 'auto', position: 'relative' }}>
        <code>{outputExpression(expression)}</code>
        <Button style={{ position: 'absolute', right: 0, top: 0, background: 'wheat' }} onClick={() => navigator.clipboard.writeText(outputExpression(expression))}>copy</Button>
        <Button style={{ position: 'absolute', right: 65, top: 0, background: 'wheat' }} onClick={() => setText(outputExpression(expression))}>edit</Button>
      </div>}
      {expression && renderExpression(reactSvgRenderTarget, expression)}
      {error && <div>{error}</div>}
    </div>
  )
}