import { parseExpression, tokenizeExpression } from "expression-engine"
import React from "react"
import { ExpressionEditor, ObjectArrayEditor, reactSvgRenderTarget, StringEditor, useJsonEditorData } from "../src"
import { Equation, equationRenderStyles } from "./equation/model"
import { renderEquation } from "./equation/renderer"
import { solveEquations } from "./equation/solver"
import { validateExpression } from "./expression/validator"

export default () => {
  const { value, update, getArrayProps } = useJsonEditorData([
    { left: '(U - A) * R1 + (B - A) * R5', right: '(A - U2) * R2', variable: 'A' },
    { left: '(U - B) * R3', right: '(B - A) * R5 + (B - U2) * R4', variable: 'B' },
  ])
  const [equations, setEquations] = React.useState<Equation[]>([])
  const [keepBinaryExpressionOrder, setKeepBinaryExpressionOrder] = React.useState(false)
  React.useEffect(() => {
    try {
      setEquations(solveEquations(value.map(e => ({
        left: parseExpression(tokenizeExpression(e.left)),
        right: parseExpression(tokenizeExpression(e.right)),
        variable: e.variable,
      }))))
    } catch (error) {
      console.info(error)
    }
  }, [value])
  return (
    <div>
      <ObjectArrayEditor
        {...getArrayProps(v => v, { left: 'x', right: '1', variable: 'x' })}
        properties={value.map((f, i) => ({
          left: <ExpressionEditor value={f.left} setValue={update((draft, v) => draft[i].left = v)} validate={validateExpression} height={20} autoHeight />,
          right: <ExpressionEditor value={f.right} setValue={update((draft, v) => draft[i].right = v)} validate={validateExpression} height={20} autoHeight />,
          variable: <StringEditor style={{ width: '30px' }} value={f.variable} setValue={update((draft, v) => draft[i].variable = v)} />
        }))}
      />
      <label>
        <input type='checkbox' checked={keepBinaryExpressionOrder} onChange={() => setKeepBinaryExpressionOrder(!keepBinaryExpressionOrder)} />
        keep binary expression order
      </label>
      {equations.map((e, i) => (
        <React.Fragment key={i}>
          {renderEquation(reactSvgRenderTarget, e, ...equationRenderStyles, { keepBinaryExpressionOrder })}
        </React.Fragment>
      ))}
    </div>
  )
}
