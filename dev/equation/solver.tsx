import { Expression } from "expression-engine";
import { Equation, getReverseOperator, iterateExpression, optimizeEquation, optimizeExpression } from "./model";

export function solveEquation(equation: Equation): Equation {
  const hasVariable = (e: Expression) => expressionHasVariable(e, equation.variable)
  const optimize = (e: Expression) => optimizeExpression(e, hasVariable)
  const solve = (equation: Equation): Equation => {
    optimizeEquation(equation, hasVariable)
    if (hasVariable(equation.right) && !hasVariable(equation.left)) {
      // a = x -> x = a
      equation = {
        left: equation.right,
        right: equation.left,
        variable: equation.variable,
      }
    }
    if (hasVariable(equation.left)) {
      if (hasVariable(equation.right)) {
        if (equation.right.type === 'BinaryExpression') {
          if (hasVariable(equation.right.left) && !hasVariable(equation.right.right)) {
            // x = y / a -> x * a = y
            if (equation.right.operator === '/') {
              return solve({
                left: optimize({
                  type: 'BinaryExpression',
                  left: equation.left,
                  right: optimize(equation.right.right),
                  operator: '*',
                  range: [0, 0],
                }),
                right: optimize(equation.right.left),
                variable: equation.variable,
              })
            }
            // 2 * x = x - 1 -> x - 2 * x = 1
            return solve({
              left: optimize({
                type: 'BinaryExpression',
                left: optimize(equation.right.left),
                right: equation.left,
                operator: equation.right.operator,
                range: [0, 0],
              }),
              right: optimize(equation.right.right),
              variable: equation.variable,
            })
          }
        }
      } else {
        if (equation.left.type === 'BinaryExpression') {
          if (hasVariable(equation.left.left) && !hasVariable(equation.left.right)) {
            // x + a = b -> x = b - a
            return solve({
              left: optimize(equation.left.left),
              right: optimize({
                type: 'BinaryExpression',
                left: equation.right,
                right: optimize(equation.left.right),
                operator: getReverseOperator(equation.left.operator),
                range: [0, 0],
              }),
              variable: equation.variable,
            })
          } else if (hasVariable(equation.left.right) && !hasVariable(equation.left.left)) {
            // a + x = b -> x = b - a
            return solve({
              left: optimize(equation.left.right),
              right: optimize({
                type: 'BinaryExpression',
                left: equation.right,
                right: optimize(equation.left.left),
                operator: getReverseOperator(equation.left.operator),
                range: [0, 0],
              }),
              variable: equation.variable,
            })
          }
        } else if (equation.left.type === 'UnaryExpression') {
          // -x = a -> x = -a
          return solve({
            left: optimize(equation.left.argument),
            right: optimize({
              type: 'UnaryExpression',
              argument: equation.right,
              operator: equation.left.operator,
              range: [0, 0],
            }),
            variable: equation.variable,
          })
        }
      }
    }
    return equation
  }

  return solve(equation)
}

function expressionHasVariable(e: Expression, variable: string) {
  for (const v of iterateExpression(e)) {
    if (v.type === 'Identifier' && v.name === variable) return true
  }
  return false
}

export function solveEquations(equations: Equation[]) {
  const result: Equation[] = []
  let context: Record<string, Expression> = {}
  for (let e of equations) {
    e.left = composeExpression(e.left, context)
    e.right = composeExpression(e.right, context)
    e = solveEquation(e)
    result.push(solveEquation(e))
    if (e.left.type === 'Identifier') {
      context[e.left.name] = e.right
    }
  }
  context = {}
  for (let i = result.length - 1; i >= 0; i--) {
    const e = result[i]
    if (e.left.type === 'Identifier') {
      context[e.left.name] = e.right
    }
    e.left = composeExpression(e.left, context)
    e.right = composeExpression(e.right, context)
    result[i] = solveEquation(e)
  }
  return result
}


function composeExpression(
  expression: Expression,
  context: Record<string, Expression>,
): Expression {
  if (expression.type === 'BinaryExpression') {
    replaceIdentifier(expression, 'left', context)
    replaceIdentifier(expression, 'right', context)
  } else if (expression.type === 'UnaryExpression') {
    replaceIdentifier(expression, 'argument', context)
  }
  return expression
}

function replaceIdentifier<T extends string>(
  parent: Record<T, Expression>,
  field: T,
  context: Record<string, Expression>,
): void {
  const expression = parent[field]
  if (expression.type === 'Identifier') {
    const v = context[expression.name]
    if (v) {
      parent[field] = v
    }
  } else {
    composeExpression(expression, context)
  }
}
