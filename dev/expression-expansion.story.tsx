import React from "react"
import { Button, ExpressionEditor, Factor, StringEditor, divideFactors, expandExpression, expressionToFactors, factorToExpression, factorsToExpression, mathStyleExpressionToExpression, optimizeFactors, printMathStyleExpression, sortFactors } from "../src"
import { parseExpression, tokenizeExpression } from "expression-engine"

export default () => {
  const [value, setValue] = React.useState('d2 d2 e1 i1 i2 u + d1 d1 e1 i2 i2 u + -d1 d1 i1 i1 u u + d1 d1 i2 i2 u u + d2 d2 e2 i1 i1 v + d1 d1 e2 i1 i2 v + 2 d1 d2 i1 i1 u v + -2 d1 d2 i1 i2 u v + i1 i1 i2')
  const [secondValue, setSecondValue] = React.useState('')
  const [isMath, setIsMath] = React.useState(true)
  const [error, setError] = React.useState<string>()
  const [factors, setFactors] = React.useState<Factor[]>()

  const expand = () => {
    try {
      if (!value) return
      const expression = isMath ? mathStyleExpressionToExpression(value) : value
      const e = parseExpression(tokenizeExpression(expression))
      const r = expandExpression(e)
      let f = expressionToFactors(r)
      if (f) {
        f = optimizeFactors(f)
        sortFactors(f)
      }
      setError(undefined)
      setFactors(f)
    } catch (error) {
      setError(String(error))
      setFactors(undefined)
    }
  }
  const divide = () => {
    try {
      if (!secondValue) return
      if (!factors) return
      const expression = isMath ? mathStyleExpressionToExpression(secondValue) : secondValue
      const e = parseExpression(tokenizeExpression(expression))
      const r = expandExpression(e)
      let f = expressionToFactors(r)
      if (f) {
        const g = divideFactors(factors, f)
        if (g) {
          f = g
        }
      }
      setError(undefined)
      setFactors(f)
    } catch (error) {
      setError(String(error))
      setFactors(undefined)
    }
  }

  return (
    <div>
      <ExpressionEditor height={200} value={value} setValue={setValue} />
      <div>
        <label>
          <input type='checkbox' checked={isMath} onChange={() => setIsMath(!isMath)} />
          math style expression
        </label>
        <StringEditor value={secondValue} setValue={setSecondValue} />
      </div>
      <Button onClick={expand}>expand</Button>
      <Button onClick={divide}>divide</Button>
      {factors && factors.map((f, i) => <div key={i}><code>{printMathStyleExpression(factorToExpression(f))}</code></div>)}
      {factors && <div><code>{printMathStyleExpression(factorsToExpression(factors))}</code></div>}
      {error && <div>{error}</div>}
    </div>
  )
}