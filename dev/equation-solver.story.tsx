import { parseExpression, tokenizeExpression } from "expression-engine"
import React from "react"
import { ExpressionEditor, reactSvgRenderTarget } from "../src"
import { Equation, equationRenderStyles } from "./equation/model"
import { renderEquation } from "./equation/renderer"
import { solveEquation } from "./equation/solver"
import { validateExpression } from "./expression/validator"

export default () => {
  const [left, setLeft] = React.useState('a * x - x * 2 + b * x + x')
  const [right, setRight] = React.useState('2')
  const [equation, setEquation] = React.useState<Equation>()
  const [keepBinaryExpressionOrder, setKeepBinaryExpressionOrder] = React.useState(false)
  React.useEffect(() => {
    try {
      setEquation(solveEquation({
        left: parseExpression(tokenizeExpression(left)),
        right: parseExpression(tokenizeExpression(right)),
      }, 'x'))
    } catch (error) {
      console.info(error)
    }
  }, [left, right])
  return (
    <div>
      <ExpressionEditor value={left} setValue={setLeft} validate={validateExpression} />
      <ExpressionEditor value={right} setValue={setRight} validate={validateExpression} />
      <label>
        <input type='checkbox' checked={keepBinaryExpressionOrder} onChange={() => setKeepBinaryExpressionOrder(!keepBinaryExpressionOrder)} />
        keep binary expression order
      </label>
      {equation && renderEquation(reactSvgRenderTarget, equation, ...equationRenderStyles, { keepBinaryExpressionOrder })}
    </div>
  )
}
