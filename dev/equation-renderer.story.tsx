import { parseExpression, tokenizeExpression } from "expression-engine"
import React from "react"
import { ExpressionEditor, reactSvgRenderTarget } from "../src"
import { Equation, equationRenderStyles, optimizeEquation, printEquation } from "./equation/model"
import { renderEquation } from "./equation/renderer"
import { validateExpression } from "./expression/validator"

export default () => {
  const [left, setLeft] = React.useState('B')
  const [right, setRight] = React.useState('((-U * R1 - U2 * R2) * -(R5 + R3 + R4) - -R5 * (U * R3 + U2 * R4)) / (R5 * -R5 - (R2 + R1 + R5) * -(R5 + R3 + R4))')
  const [equation, setEquation] = React.useState<Equation>()
  const [keepBinaryExpressionOrder, setKeepBinaryExpressionOrder] = React.useState(false)
  React.useEffect(() => {
    try {
      setEquation(optimizeEquation({
        left: parseExpression(tokenizeExpression(left)),
        right: parseExpression(tokenizeExpression(right)),
      }))
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
      {equation && <code>{printEquation(equation, { keepBinaryExpressionOrder })}</code>}
    </div>
  )
}
