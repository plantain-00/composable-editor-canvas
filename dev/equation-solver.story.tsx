import { parseExpression, tokenizeExpression } from "expression-engine"
import React from "react"
import { renderEquation, ExpressionEditor, ObjectArrayEditor, reactSvgRenderTarget, StringEditor, useJsonEditorData, Equation, printEquation, solveEquations } from "../src"

export default () => {
  const { value, update, getArrayProps } = useJsonEditorData([
    { equation: '(U - A) * R1 + (B - A) * R5 = (A - U2) * R2', variable: 'A' },
    { equation: '(U - B) * R3 = (B - A) * R5 + (B - U2) * R4', variable: 'B' },
  ])
  const [equations, setEquations] = React.useState<Equation[][]>([])
  const [keepBinaryExpressionOrder, setKeepBinaryExpressionOrder] = React.useState(false)
  const [showText, setShowText] = React.useState(false)
  React.useEffect(() => {
    try {
      const result = solveEquations(value.map(e => {
        const equation = e.equation.split('=')
        return {
          left: parseExpression(tokenizeExpression(equation[0])),
          right: parseExpression(tokenizeExpression(equation[1])),
        }
      }), new Set(value.map(e => e.variable)))
      setEquations(result.map(e => Object.entries(e).map(([key, e]) => {
        return !Array.isArray(e) ? { left: { type: 'Identifier', name: key }, right: e } : { left: e[0], right: e[1] }
      })))
    } catch (error) {
      console.info(error)
    }
  }, [value])
  return (
    <div>
      <ObjectArrayEditor
        {...getArrayProps(v => v, { equation: 'x = 1', variable: 'x' })}
        properties={value.map((f, i) => ({
          equation: <ExpressionEditor value={f.equation} setValue={update((draft, v) => draft[i].equation = v)} height={20} width={400} autoHeight />,
          variable: <StringEditor style={{ width: '30px' }} value={f.variable} setValue={update((draft, v) => draft[i].variable = v)} />
        }))}
      />
      <label>
        <input type='checkbox' checked={keepBinaryExpressionOrder} onChange={() => setKeepBinaryExpressionOrder(!keepBinaryExpressionOrder)} />
        keep binary expression order
      </label>
      <label>
        <input type='checkbox' checked={showText} onChange={() => setShowText(!showText)} />
        show text
      </label>
      {equations.map((a, j) => (
        <div key={j} style={{ borderBottom: '1px solid black', display: 'flex', flexDirection: 'column' }}>
          {a.map((e, i) => (
            <React.Fragment key={i}>
              {!showText && renderEquation(reactSvgRenderTarget, e, { keepBinaryExpressionOrder })}
              {showText && <div><code>{printEquation(e, { keepBinaryExpressionOrder })}</code></div>}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  )
}
