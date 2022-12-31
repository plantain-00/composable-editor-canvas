import { Expression } from "expression-engine";
import { Equation, expressionHasVariable, getReverseOperator, iterateExpression, optimizeEquation, optimizeExpression } from "./model";

export function solveEquation(equation: Equation): Equation {
  const hasVariable = (e: Expression) => expressionHasVariable(e, equation.variable)
  const optimize = (e: Expression) => optimizeExpression(e, hasVariable)
  const solve = (equation: Equation): Equation => {
    optimizeEquation(equation, hasVariable)
    if (!hasVariable(equation.left)) {
      if (!hasVariable(equation.right)) {
        // a = b
        return equation
      }
      // a = x -> x = a
      equation = {
        left: equation.right,
        right: equation.left,
        variable: equation.variable,
      }
    }

    // x = a
    if (!hasVariable(equation.right)) {
      if (equation.left.type === 'UnaryExpression' && equation.left.operator === '-') {
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
      if (equation.left.type === 'BinaryExpression') {
        if (hasVariable(equation.left.left) && !hasVariable(equation.left.right)) {
          // x + a = b -> x = b - a
          // x - a = b -> x = b + a
          // x * a = b -> x = b / a
          // x + / = b -> x = b * a
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
        }
        if (hasVariable(equation.left.right) && !hasVariable(equation.left.left)) {
          // a - x = b -> x = a - b
          // a / x = b -> x = a / b
          if (equation.left.operator === '-' || equation.left.operator === '/') {
            return solve({
              left: optimize(equation.left.right),
              right: optimize({
                type: 'BinaryExpression',
                left: optimize(equation.left.left),
                right: equation.right,
                operator: equation.left.operator,
                range: [0, 0],
              }),
              variable: equation.variable,
            })
          }
          // a + x = b -> x = b - a
          // a * x = b -> x = b / a
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
        // (x + 1) / x = 0
        if (equation.right.type === 'NumericLiteral' && equation.right.value === 0 && equation.left.operator === '/') {
          return solve({
            left: optimize(equation.left.left),
            right: equation.right,
            variable: equation.variable,
          })
        }
      }
      return equation
    }

    // 1 - x = 2 * x
    if (equation.right.type === 'BinaryExpression') {
      // x = (x + 1) / a -> x * a = x + 1
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
      // x + 1 = 2 * x -> x + 1 - 2 * x = 0
      return solve({
        left: {
          type: 'BinaryExpression',
          left: equation.left,
          operator: '-',
          right: equation.right,
          range: [0, 0],
        },
        right: {
          type: 'NumericLiteral',
          value: 0,
          range: [0, 0],
        },
        variable: equation.variable,
      })
    }
    // 1 - x = x
    if (equation.right.type === 'Identifier') {
      // 1 - x = x -> 1 - x - x = 0
      return solve({
        left: {
          type: 'BinaryExpression',
          left: equation.left,
          operator: '-',
          right: equation.right,
          range: [0, 0],
        },
        right: {
          type: 'NumericLiteral',
          value: 0,
          range: [0, 0],
        },
        variable: equation.variable,
      })
    }
    // 1 + x = -x
    if (equation.right.type === 'UnaryExpression') {
      // 1 + x = -x -> 1 + x + x = 0
      return solve({
        left: {
          type: 'BinaryExpression',
          left: equation.left,
          operator: '+',
          right: optimize(equation.right.argument),
          range: [0, 0],
        },
        right: {
          type: 'NumericLiteral',
          value: 0,
          range: [0, 0],
        },
        variable: equation.variable,
      })
    }
    return equation
  }

  return solve(equation)
}

export function equationHasVariable(e: Equation, variable: string) {
  return expressionHasVariable(e.left, variable) || expressionHasVariable(e.right, variable)
}

export function solveEquations(equations: Equation[]) {
  const result: Equation[] = []
  let context: Record<string, Expression> = {}
  for (let e of equations) {
    e.left = composeExpression(e.left, context)
    e.right = composeExpression(e.right, context)
    if (!e.variable) {
      for (const a of iterateExpression(e.left)) {
        if (a.type === 'Identifier') {
          e.variable = a.name
          break
        }
      }
    }
    if (!e.variable) {
      for (const a of iterateExpression(e.right)) {
        if (a.type === 'Identifier') {
          e.variable = a.name
          break
        }
      }
    }
    e = solveEquation(e)
    result.push(solveEquation(e))
    if (e.left.type === 'Identifier' && !expressionHasVariable(e.right, e.variable)) {
      context[e.left.name] = e.right
    }
  }

  context = {}
  for (let i = result.length - 1; i >= 0; i--) {
    const e = result[i]
    if (e.left.type === 'Identifier' && !expressionHasVariable(e.right, e.variable)) {
      context[e.left.name] = e.right
    } else {
      e.left = composeExpression(e.left, context)
    }
    e.right = composeExpression(e.right, context)
    result[i] = solveEquation(e)
  }

  let lastResultCount = result.filter(r => r.right.type === 'NumericLiteral').length
  for (; ;) {
    context = {}
    result.forEach(e => {
      if (e.left.type === 'Identifier' && e.right.type === 'NumericLiteral') {
        context[e.left.name] = e.right
      }
    })
    result.forEach((e, i) => {
      e.right = composeExpression(e.right, context)
      result[i] = solveEquation(e)
    })
    const resultCount = result.filter(r => r.right.type === 'NumericLiteral').length
    if (resultCount === lastResultCount) {
      break
    }
    lastResultCount = resultCount
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
  } else if (expression.type === 'Identifier') {
    const v = context[expression.name]
    if (v) {
      return v
    }
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
