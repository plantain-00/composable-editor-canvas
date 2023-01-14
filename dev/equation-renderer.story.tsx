import { parseExpression, tokenizeExpression } from "expression-engine"
import React from "react"
import { ExpressionEditor, reactSvgRenderTarget, Equation, printEquation, renderEquation, validateExpression } from "../src"

export default () => {
  const [left, setLeft] = React.useState('X1 ** 2 + X2 * X3')
  const [right, setRight] = React.useState('(-X6) ** 0.5 / (X4 - X5 ** 3)')
  const [equation, setEquation] = React.useState<Equation>()
  const [keepBinaryExpressionOrder, setKeepBinaryExpressionOrder] = React.useState(false)
  React.useEffect(() => {
    try {
      setEquation({
        left: parseExpression(tokenizeExpression(left)),
        right: parseExpression(tokenizeExpression(right)),
      })
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
      {equation && renderEquation(reactSvgRenderTarget, equation, { keepBinaryExpressionOrder })}
      {equation && <code>{printEquation(equation, { keepBinaryExpressionOrder })}</code>}
    </div>
  )
}
