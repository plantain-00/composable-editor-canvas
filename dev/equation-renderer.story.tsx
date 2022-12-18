import { parseExpression, tokenizeExpression } from "expression-engine"
import React from "react"
import { ExpressionEditor, reactSvgRenderTarget } from "../src"
import { Equation } from "./equation/model"
import { renderEquation } from "./equation/renderer"

const styles = [0x000000, 20, 'monospace', 10, 10, 5] as const

export default () => {
  const [left, setLeft] = React.useState('B')
  const [right, setRight] = React.useState('((U * R3 + U2 * R4) * (R2 + R1 + R5) - (-U * R1 - U2 * R2) * R5) / (R5 * -R5 - (R2 + R1 + R5) * -(R5 + R3 + R4 ** 2))')
  const [equation, setEquation] = React.useState<Equation>()
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
      <ExpressionEditor value={left} setValue={setLeft} />
      <ExpressionEditor value={right} setValue={setRight} />
      {equation && renderEquation(reactSvgRenderTarget, equation, ...styles)}
    </div>
  )
}
