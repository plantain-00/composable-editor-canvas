import { Expression2 as Expression } from 'expression-engine'
import { Equation, expressionHasVariable, getReverseOperator, iterateEquation, optimizeEquation, optimizeExpression } from "./model";

export function solveEquation(equation: Equation, variable: string): Equation {
  const hasVariable = (e: Expression) => expressionHasVariable(e, variable)
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
          }),
        })
      }
      if (equation.left.type === 'BinaryExpression') {
        if (hasVariable(equation.left.left) && !hasVariable(equation.left.right)) {
          // x + a = b -> x = b - a
          // x - a = b -> x = b + a
          // x * a = b -> x = b / a
          // x / a = b -> x = b * a
          // x ** a = b -> x = b ** (1 / a)
          const right: Expression = equation.left.operator === '**' ? {
            type: 'BinaryExpression',
            left: {
              type: 'NumericLiteral',
              value: 1,
            },
            operator: '/',
            right: equation.left.right,
          } : equation.left.right
          return solve({
            left: optimize(equation.left.left),
            right: optimize({
              type: 'BinaryExpression',
              left: equation.right,
              right: optimize(right),
              operator: getReverseOperator(equation.left.operator),
            }),
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
              }),
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
            }),
          })
        }
        // (x + 1) / x = 0
        if (equation.right.type === 'NumericLiteral' && equation.right.value === 0 && equation.left.operator === '/') {
          return solve({
            left: optimize(equation.left.left),
            right: equation.right,
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
          }),
          right: optimize(equation.right.left),
        })
      }
      // x + 1 = 2 * x -> x + 1 - 2 * x = 0
      return solve({
        left: {
          type: 'BinaryExpression',
          left: equation.left,
          operator: '-',
          right: equation.right,
        },
        right: {
          type: 'NumericLiteral',
          value: 0,
        },
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
        },
        right: {
          type: 'NumericLiteral',
          value: 0,
        },
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
        },
        right: {
          type: 'NumericLiteral',
          value: 0,
        },
      })
    }
    return equation
  }

  return solve(equation)
}

export function equationHasVariable(e: Equation, variable: string) {
  return expressionHasVariable(e.left, variable) || expressionHasVariable(e.right, variable)
}

function getEquationVariables(equation: Equation) {
  const variables = new Set<string>()
  for (const expression of iterateEquation(equation)) {
    if (expression.type === 'Identifier') {
      variables.add(expression.name)
    }
  }
  return Array.from(variables)
}

export function solveEquations(equations: Equation[], presetVariables?: Set<string>) {
  if (!presetVariables) {
    presetVariables = new Set<string>()
    for (const equation of equations) {
      for (const v of getEquationVariables(equation)) {
        presetVariables.add(v)
      }
    }
  }
  const variables = presetVariables
  const resultContext: Record<string, Expression> = {}

  const collectResult = () => {
    let lastCount = equations.length
    for (; ;) {
      const remains: Equation[] = []
      for (let equation of equations) {
        const v = getEquationVariables(equation).filter(e => variables.has(e))
        if (v.length > 0) {
          if (v.length === 1) {
            optimizeEquation(equation, e => expressionHasVariable(e, v[0]))
            equation = solveEquation(equation, v[0])
          }
          if (equation.left.type === 'Identifier' && equation.right.type === 'NumericLiteral') {
            for (const v in resultContext) {
              resultContext[v] = optimizeExpression(
                composeExpression(resultContext[v], { [equation.left.name]: equation.right }),
                e => expressionHasVariable(e, v),
              )
            }
            resultContext[equation.left.name] = equation.right
            variables.delete(equation.left.name)
          } else {
            remains.push(equation)
          }
        }
      }
      equations = composeEquations(remains, resultContext, variables)
      if (equations.length === lastCount) {
        break
      }
      lastCount = equations.length
    }
  }
  collectResult()

  for (; ;) {
    const equation = equations.shift()
    if (!equation) {
      break
    }
    const variable = getEquationVariables(equation).filter(e => variables.has(e))[0]
    const newEquation = solveEquation(equation, variable)
    for (const v in resultContext) {
      resultContext[v] = optimizeExpression(
        composeExpression(resultContext[v], { [variable]: newEquation.right }),
        e => expressionHasVariable(e, v),
      )
    }
    resultContext[variable] = newEquation.right
    variables.delete(variable)
    equations = composeEquations(equations, { [variable]: newEquation.right }, variables)
    collectResult()
  }

  return resultContext
}

function composeEquations(equations: Equation[], context: Record<string, Expression>, variables: Set<string>) {
  const remains: Equation[] = []
  for (let equation of equations) {
    equation.left = composeExpression(equation.left, context)
    equation.right = composeExpression(equation.right, context)
    const v = getEquationVariables(equation).filter(e => variables.has(e))
    if (v.length > 0) {
      if (v.length === 1) {
        equation = optimizeEquation(equation, e => expressionHasVariable(e, v[0]))
        remains.push(solveEquation(equation, v[0]))
      } else {
        remains.push(equation)
      }
    }
  }
  return remains
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
      parent[field] = cloneExpression(v)
    }
  } else {
    composeExpression(expression, context)
  }
}

function cloneExpression(expression: Expression): Expression {
  if (expression.type === 'BinaryExpression') {
    return {
      ...expression,
      left: cloneExpression(expression.left),
      right: cloneExpression(expression.right),
    }
  }
  if (expression.type === 'UnaryExpression') {
    return {
      ...expression,
      argument: cloneExpression(expression.argument),
    }
  }
  return {
    ...expression,
  }
}
