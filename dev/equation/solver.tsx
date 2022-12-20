import { Expression } from "expression-engine";
import { Equation, getReverseOperator, iterateExpression, optimizeEquation } from "./model";

export function solveEquation(equation: Equation, variable: string): Equation {
  const hasVariable = (e: Expression) => {
    for (const v of iterateExpression(e)) {
      if (v.type === 'Identifier' && v.name === variable) return true
    }
    return false
  }
  const solve = (equation: Equation): Equation => {
    optimizeEquation(equation, hasVariable)
    if (hasVariable(equation.right) && !hasVariable(equation.left)) {
      equation = {
        left: equation.right,
        right: equation.left,
      }
    }
    if (hasVariable(equation.left) && !hasVariable(equation.right)) {
      if (equation.left.type === 'BinaryExpression') {
        if (hasVariable(equation.left.left) && !hasVariable(equation.left.right)) {
          return solve({
            left: equation.left.left,
            right: {
              type: 'BinaryExpression',
              left: equation.right,
              right: equation.left.right,
              operator: getReverseOperator(equation.left.operator),
              range: [0, 0],
            }
          })
        } else if (hasVariable(equation.left.right) && !hasVariable(equation.left.left)) {
          return solve({
            left: equation.left.right,
            right: {
              type: 'BinaryExpression',
              left: equation.right,
              right: equation.left.left,
              operator: getReverseOperator(equation.left.operator),
              range: [0, 0],
            }
          })
        }
      } else if (equation.left.type === 'UnaryExpression') {
        return solve({
          left: equation.left.argument,
          right: {
            type: 'UnaryExpression',
            argument: equation.right,
            operator: equation.left.operator,
            range: [0, 0],
          }
        })
      }
    }
    return equation
  }

  return solve(equation)
}
