import { Expression2 as Expression } from 'expression-engine'
import { iterateItemOrArray } from '../../utils/iterator';
import { Equation } from '../equation-renderer';
import { expressionHasVariable, getReverseOperator, iterateEquation, optimizeEquation, optimizeExpression } from "./model";
import { solveQuadraticEquation } from './quadratic';

export function solveEquation(equation: Equation, variable: string): Equation[] {
  const hasVariable = (e: Expression) => expressionHasVariable(e, variable)
  const optimize = (e: Expression) => optimizeExpression(e, hasVariable)
  const solve = (equation: Equation): Equation | Equation[] => {
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
          // x ** 2 = 9 -> x = 3,-3
          const right: Expression = equation.left.operator === '**' ? {
            type: 'BinaryExpression',
            left: {
              type: 'NumericLiteral',
              value: 1,
            },
            operator: '/',
            right: equation.left.right,
          } : equation.left.right
          if (equation.left.operator === '**' && equation.left.right.type === 'NumericLiteral' && equation.left.right.value % 2 === 0) {
            return [
              ...iterateItemOrArray(solve({
                left: optimize(equation.left.left),
                right: optimize({
                  type: 'BinaryExpression',
                  left: equation.right,
                  right: optimize(right),
                  operator: getReverseOperator(equation.left.operator),
                }),
              })),
              ...iterateItemOrArray(solve({
                left: optimize(equation.left.left),
                right: optimize({
                  type: 'UnaryExpression',
                  operator: '-',
                  argument: {
                    type: 'BinaryExpression',
                    left: equation.right,
                    right: optimize(right),
                    operator: getReverseOperator(equation.left.operator),
                  },
                }),
              })),
            ]
          }
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
        // (x + 1) * x = 0
        if (equation.right.type === 'NumericLiteral' && equation.right.value === 0 && equation.left.operator === '*') {
          return [
            ...iterateItemOrArray(solve({
              left: optimize(equation.left.left),
              right: equation.right,
            })),
            ...iterateItemOrArray(solve({
              left: optimize(equation.left.right),
              right: equation.right,
            })),
          ]
        }
        // x * x + x = 6
        if (equation.left.operator === '+' || equation.left.operator === '-' || equation.left.operator === '*') {
          const result = solveQuadraticEquation(equation, variable)
          if (result) {
            return result.map(r => Array.from(iterateItemOrArray(solve({
              left: {
                type: 'Identifier',
                name: variable,
              },
              right: optimize(r),
            }))).flat()).flat()
          }
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

  return Array.from(iterateItemOrArray(solve(equation)))
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

export function solveEquations(
  equations: Equation[],
  presetVariables?: Set<string>,
  resultContext: ResultContext = {}
): ResultContext[] {
  if (!presetVariables) {
    presetVariables = new Set<string>()
    for (const equation of equations) {
      for (const v of getEquationVariables(equation)) {
        presetVariables.add(v)
      }
    }
  }
  const result: ResultContext[] = []
  const variables = presetVariables

  const collectResult = () => {
    let lastCount = equations.length
    for (; ;) {
      const remains: Equation[] = []
      for (let j = 0; j < equations.length; j++) {
        let equation = equations[j]
        const v = getEquationVariables(equation).filter(e => variables.has(e))
        if (v.length > 0) {
          if (v.length === 1) {
            optimizeEquation(equation, e => expressionHasVariable(e, v[0]))
            const [newEquation, ...rest] = solveEquation(equation, v[0])
            result.push(...rest.map(r => solveEquations([
              ...remains.map(e => cloneEquation(e)),
              r,
              ...equations.slice(j + 1).map(e => cloneEquation(e)),
            ], new Set(variables), cloneResultContext(resultContext))).flat())
            equation = newEquation
          }
          if (equation.left.type === 'Identifier' && equation.right.type === 'NumericLiteral') {
            for (const v in resultContext) {
              const ctx = resultContext[v]
              if (Array.isArray(ctx)) {
                resultContext[v] = [
                  optimizeExpression(
                    composeExpression(ctx[0], { [equation.left.name]: equation.right }),
                    e => expressionHasVariable(e, v),
                  ),
                  optimizeExpression(
                    composeExpression(ctx[1], { [equation.left.name]: equation.right }),
                    e => expressionHasVariable(e, v),
                  ),
                ]
              } else {
                resultContext[v] = optimizeExpression(
                  composeExpression(ctx, { [equation.left.name]: equation.right }),
                  e => expressionHasVariable(e, v),
                )
              }
            }
            resultContext[equation.left.name] = equation.right
            variables.delete(equation.left.name)
          } else {
            remains.push(equation)
          }
        }
      }
      const newResult = composeEquations(remains, resultContext, variables)
      equations = newResult.equations
      result.push(...newResult.result)
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
    let variable = getEquationVariables(equation).filter(e => variables.has(e))[0]
    let [newEquation, ...rest] = solveEquation(equation, variable)
    while (!getEquationVariables(newEquation).includes(variable)) {
      const newVariable = getEquationVariables(newEquation).filter(e => variables.has(e))[0]
      if (newVariable === variable) {
        break
      }
      variable = newVariable;
      [newEquation, ...rest] = solveEquation(newEquation, variable)
    }
    result.push(...rest.map(r => solveEquations([
      r,
      ...equations.map(e => cloneEquation(e)),
    ], new Set(variables), cloneResultContext(resultContext))).flat())
    if (newEquation.left.type === 'Identifier') {
      for (const v in resultContext) {
        const ctx = resultContext[v]
        if (Array.isArray(ctx)) {
          resultContext[v] = [
            optimizeExpression(
              composeExpression(ctx[0], { [variable]: newEquation.right }),
              e => expressionHasVariable(e, v),
            ),
            optimizeExpression(
              composeExpression(ctx[1], { [variable]: newEquation.right }),
              e => expressionHasVariable(e, v),
            ),
          ]
        } else {
          resultContext[v] = optimizeExpression(
            composeExpression(ctx, { [variable]: newEquation.right }),
            e => expressionHasVariable(e, v),
          )
        }
      }
      resultContext[variable] = newEquation.right
      variables.delete(variable)
      const newResult = composeEquations(equations, { [variable]: newEquation.right }, variables)
      equations = newResult.equations
      result.push(...newResult.result)
      collectResult()
    } else {
      resultContext[variable] = [newEquation.left, newEquation.right]
      variables.delete(variable)
    }
  }

  return [resultContext, ...result]
}

type ResultContext = Record<string, Expression | [Expression, Expression]>

function cloneResultContext(resultContext: ResultContext) {
  const ctx: ResultContext = {}
  for (const [key, e] of Object.entries(resultContext)) {
    if (Array.isArray(e)) {
      ctx[key] = [cloneExpression(e[0]), cloneExpression(e[1])]
    } else {
      ctx[key] = cloneExpression(e)
    }
  }
  return ctx
}

function composeEquations(equations: Equation[], context: ResultContext, variables: Set<string>) {
  const remains: Equation[] = []
  const result: ResultContext[] = []
  for (let j = 0; j < equations.length; j++) {
    let equation = equations[j]
    equation.left = composeExpression(equation.left, context)
    equation.right = composeExpression(equation.right, context)
    const v = getEquationVariables(equation).filter(e => variables.has(e))
    if (v.length > 0) {
      if (v.length === 1) {
        equation = optimizeEquation(equation, e => expressionHasVariable(e, v[0]))
        const [newEquation, ...rest] = solveEquation(equation, v[0])
        result.push(...rest.map(r => solveEquations([
          ...remains.map(e => cloneEquation(e)),
          r,
          ...equations.slice(j + 1).map(e => cloneEquation(e)),
        ], new Set(variables), cloneResultContext(context))).flat())
        remains.push(newEquation)
      } else {
        remains.push(equation)
      }
    }
  }
  return {
    equations: remains,
    result,
  }
}

export function composeExpression(
  expression: Expression,
  context: ResultContext,
): Expression {
  if (expression.type === 'BinaryExpression') {
    replaceIdentifier(expression, 'left', context)
    replaceIdentifier(expression, 'right', context)
  } else if (expression.type === 'UnaryExpression') {
    replaceIdentifier(expression, 'argument', context)
  } else if (expression.type === 'Identifier') {
    const v = context[expression.name]
    if (v && !Array.isArray(v)) {
      return v
    }
  } else if (expression.type === 'CallExpression') {
    expression.arguments.forEach((arg, i) => {
      if (arg.type !== 'SpreadElement') {
        expression.arguments[i] = composeExpression(arg, context)
      }
    })
  }
  return expression
}

function replaceIdentifier<T extends string>(
  parent: Record<T, Expression>,
  field: T,
  context: ResultContext,
): void {
  const expression = parent[field]
  if (expression.type === 'Identifier') {
    const v = context[expression.name]
    if (v && !Array.isArray(v)) {
      parent[field] = cloneExpression(v)
    }
  } else {
    composeExpression(expression, context)
  }
}

function cloneEquation(equation: Equation): Equation {
  return {
    left: cloneExpression(equation.left),
    right: cloneExpression(equation.right),
  }
}

export function cloneExpression(expression: Expression): Expression {
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
  if (expression.type === 'CallExpression') {
    return {
      ...expression,
      arguments: expression.arguments.map(arg => arg.type === 'SpreadElement' ? arg : cloneExpression(arg)),
    }
  }
  return {
    ...expression,
  }
}
