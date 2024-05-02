import { Expression2 } from "expression-engine";
import { factorial } from "../utils/factorial";
import { Factor, FactorVariable, divideFactors, factorToExpression, powerFactor } from "./equation-solver/factorization";
import { expressionHasVariable, getReverseOperator, optimizeExpression } from "./equation-solver/model";
import { cloneExpression, composeExpression } from "./equation-solver/solver";

export function expandExpression(e: Expression2): Expression2 {
  if (e.type === 'BinaryExpression') {
    if (e.operator === '**') {
      if (e.right.type === 'NumericLiteral') {
        if (e.right.value === 2) {
          if (e.left.type === 'BinaryExpression') {
            if (e.left.operator === '+' || e.left.operator === '-') {
              // (a + b) ** 2 -> (a * a + 2 * (a * b)) + b ** 2
              // (a - b) ** 2 -> (a * a - 2 * (a * b)) + b ** 2
              return expandExpression({
                type: 'BinaryExpression',
                operator: '+',
                left: {
                  type: 'BinaryExpression',
                  operator: e.left.operator,
                  left: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: e.left.left,
                    right: e.left.left,
                  },
                  right: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {
                      type: 'NumericLiteral',
                      value: 2,
                    },
                    right: {
                      type: 'BinaryExpression',
                      operator: '*',
                      left: e.left.left,
                      right: e.left.right,
                    },
                  },
                },
                right: {
                  type: 'BinaryExpression',
                  operator: '*',
                  left: e.left.right,
                  right: e.left.right,
                }
              })
            }
            if (e.left.operator === '*' || e.left.operator === '/') {
              // (a * b) ** 2 -> ((a * a) * b) * b
              // (a / b) ** 2 -> ((a * a) / b) / b
              return expandExpression({
                type: 'BinaryExpression',
                operator: e.left.operator,
                left: {
                  type: 'BinaryExpression',
                  operator: e.left.operator,
                  left: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: e.left.left,
                    right: e.left.left,
                  },
                  right: e.left.right,
                },
                right: e.left.right
              })
            }
          }
        }
        if (Number.isInteger(e.right.value) && e.right.value >= 3) {
          if (e.left.type !== 'Identifier') {
            // (a + b)^3 -> (a + b)^2 (a + b)
            return expandExpression({
              type: 'BinaryExpression',
              operator: '*',
              left: {
                type: 'BinaryExpression',
                operator: '**',
                left: e.left,
                right: {
                  type: 'NumericLiteral',
                  value: e.right.value - 1,
                },
              },
              right: e.left
            })
          }
        }
      }
    }
    if (e.operator === '*') {
      if (e.right.type === 'BinaryExpression') {
        if (e.right.operator === '+' || e.right.operator === '-') {
          // a * (b + c) -> a * b + a * c
          return expandExpression({
            type: 'BinaryExpression',
            operator: e.right.operator,
            left: {
              type: 'BinaryExpression',
              operator: '*',
              left: e.left,
              right: e.right.left,
            },
            right: {
              type: 'BinaryExpression',
              operator: '*',
              left: e.left,
              right: e.right.right,
            },
          })
        }
      }
      if (e.left.type === 'BinaryExpression') {
        if (e.left.operator === '+' || e.left.operator === '-') {
          // (a + b) * c -> a * c + b * c
          return expandExpression({
            type: 'BinaryExpression',
            operator: e.left.operator,
            left: {
              type: 'BinaryExpression',
              operator: '*',
              left: e.left.left,
              right: e.right,
            },
            right: {
              type: 'BinaryExpression',
              operator: '*',
              left: e.left.right,
              right: e.right,
            },
          })
        }
        if (e.left.operator === '/') {
          if (e.left.right.type === 'Identifier') {
            if (e.right.type === 'Identifier') {
              if (e.left.right.name === e.right.name) {
                // (a / b) * b -> a
                return expandExpression(e.left.left)
              }
            } else {
              // ((...) / a) * (...) -> ((...) * (...)) / a
              return expandExpression({
                type: 'BinaryExpression',
                operator: '/',
                left: {
                  type: 'BinaryExpression',
                  operator: '*',
                  left: e.left.left,
                  right: e.right,
                },
                right: e.left.right,
              })
            }
          }
        }
      }
    }
    if (e.operator === '/') {
      if (e.left.type === 'BinaryExpression') {
        if (e.left.operator === '+' || e.left.operator === '-') {
          // (a + b) / c -> a / c + b / c
          return expandExpression({
            type: 'BinaryExpression',
            operator: e.left.operator,
            left: {
              type: 'BinaryExpression',
              operator: '/',
              left: e.left.left,
              right: e.right,
            },
            right: {
              type: 'BinaryExpression',
              operator: '/',
              left: e.left.right,
              right: e.right,
            },
          })
        }
      }
    }
    const left = expandExpression(e.left)
    const right = expandExpression(e.right)
    if (left === e.left && right === e.right) {
      return e
    }
    return expandExpression({
      type: 'BinaryExpression',
      operator: e.operator,
      left,
      right,
    })
  }
  if (e.type === 'UnaryExpression') {
    if (e.operator === '-') {
      if (e.argument.type === 'BinaryExpression') {
        if (e.argument.operator === '+' || e.argument.operator === '-') {
          // -(a + b) -> -a - b
          return expandExpression({
            type: 'BinaryExpression',
            left: {
              type: 'UnaryExpression',
              operator: '-',
              argument: e.argument.left,
            },
            operator: getReverseOperator(e.argument.operator),
            right: e.argument.right,
          })
        }
      }
    }
    const argument = expandExpression(e.argument)
    if (argument === e.argument) {
      return e
    }
    return expandExpression({
      type: 'UnaryExpression',
      operator: e.operator,
      argument,
    })
  }
  return e
}

export function sortFactors(factors: Factor[]) {
  factors.forEach(f => {
    f.variables.sort(compareFactorVariable)
  })
  factors.sort((a, b) => {
    for (let i = 0; i < a.variables.length && i < b.variables.length; i++) {
      const c = compareFactorVariable(a.variables[a.variables.length - i - 1], b.variables[a.variables.length - i - 1])
      if (c !== 0) return c
    }
    return 0
  })
}

function compareFactorVariable(a: string | FactorVariable, b: string | FactorVariable) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b)
  }
  return 0
}

interface GroupedFactors {
  count: number
  factors: Factor[]
}

function getGroupedFactors(factors: Factor[], by: Factor) {
  const result: GroupedFactors[] = []
  for (const factor of factors) {
    let count = 0
    let input = [factor]
    for (; ;) {
      const f = divideFactors(input, [by])
      if (!f) break
      count++
      input = f
    }
    const t = result.find(f => f.count === count)
    if (t) {
      t.factors.push(...input)
    } else {
      result.push({
        count,
        factors: input,
      })
    }
  }
  result.sort((a, b) => b.count - a.count)
  return result
}

function groupedFactorsToExpression(factors: GroupedFactors[], by: Factor) {
  let expression: Expression2 | undefined
  for (const r of factors) {
    let g: Expression2 | undefined
    for (const f of r.factors) {
      const e = factorToExpression(f)
      if (!g) {
        g = e
      } else {
        g = {
          type: 'BinaryExpression',
          operator: '+',
          left: g,
          right: e,
        }
      }
    }
    if (r.count > 0) {
      const e = factorToExpression(powerFactor(by, r.count))
      if (!g) {
        g = e
      } else {
        g = {
          type: 'BinaryExpression',
          operator: '*',
          left: g,
          right: e,
        }
      }
    }
    if (g) {
      if (!expression) {
        expression = g
      } else {
        expression = {
          type: 'BinaryExpression',
          operator: '+',
          left: expression,
          right: g,
        }
      }
    }
  }
  return expression
}

export function groupFactorsBy(factors: Factor[], by: Factor): Expression2 | undefined {
  const result = getGroupedFactors(factors, by)
  return groupedFactorsToExpression(result, by)
}

export function groupAllFactors(factors: Factor[]): Expression2 | undefined {
  const variables: { name: string, count: number }[] = []
  for (const factor of factors) {
    for (const v of factor.variables) {
      if (typeof v === 'string') {
        const variable = variables.find(a => a.name === v)
        if (variable) {
          variable.count++
        } else {
          variables.push({ name: v, count: 1 })
        }
      }
    }
  }
  variables.sort((a, b) => b.count - a.count)

  return groupFactorsByVariables(factors, variables.map(v => v.name))
}

export function groupFactorsByVariables(factors: Factor[], variables: string[]) {
  const group = (factors: Factor[], level: number): Expression2 | undefined => {
    if (factors.length <= 1) return
    const v = variables[level]
    if (!v) return
    const by = { variables: [variables[level]] }
    const result = getGroupedFactors(factors, by)
    let expression: Expression2 | undefined
    for (const r of result) {
      let g = group(r.factors, level + 1)
      if (!g) {
        for (const f of r.factors) {
          const e = factorToExpression(f)
          if (!g) {
            g = e
          } else {
            g = {
              type: 'BinaryExpression',
              operator: '+',
              left: g,
              right: e,
            }
          }
        }
      }
      if (r.count > 0) {
        const e = factorToExpression(powerFactor(by, r.count))
        if (!g) {
          g = e
        } else {
          g = {
            type: 'BinaryExpression',
            operator: '*',
            left: g,
            right: e,
          }
        }
      }
      if (g) {
        if (!expression) {
          expression = g
        } else {
          expression = {
            type: 'BinaryExpression',
            operator: '+',
            left: expression,
            right: g,
          }
        }
      }
    }
    return expression
  }

  return group(factors, 0)
}

export function deriveExpressionWith(e: Expression2, by: string): Expression2 {
  if (e.type === 'BinaryExpression') {
    if (e.operator === '+' || e.operator === '-') {
      return {
        type: 'BinaryExpression',
        operator: e.operator,
        left: deriveExpressionWith(e.left, by),
        right: deriveExpressionWith(e.right, by),
      }
    }
    if (e.operator === '*') {
      return {
        type: 'BinaryExpression',
        operator: '+',
        left: {
          type: 'BinaryExpression',
          operator: '*',
          left: deriveExpressionWith(e.left, by),
          right: e.right,
        },
        right: {
          type: 'BinaryExpression',
          operator: '*',
          left: e.left,
          right: deriveExpressionWith(e.right, by),
        },
      }
    }
    if (e.operator === '/') {
      return {
        type: 'BinaryExpression',
        operator: '/',
        left: {
          type: 'BinaryExpression',
          operator: '/',
          left: {
            type: 'BinaryExpression',
            operator: '-',
            left: {
              type: 'BinaryExpression',
              operator: '*',
              left: deriveExpressionWith(e.left, by),
              right: e.right,
            },
            right: {
              type: 'BinaryExpression',
              operator: '*',
              left: e.left,
              right: deriveExpressionWith(e.right, by),
            },
          },
          right: e.right,
        },
        right: e.right,
      }
    }
    if (e.operator === '**') {
      if (expressionHasVariable(e.left, by)) {
        if (!expressionHasVariable(e.right, by)) {
          return {
            type: 'BinaryExpression',
            operator: '*',
            left: {
              type: 'BinaryExpression',
              operator: '*',
              left: deriveExpressionWith(e.left, by),
              right: e.right,
            },
            right: {
              type: 'BinaryExpression',
              operator: '**',
              left: e.left,
              right: {
                type: 'BinaryExpression',
                operator: '-',
                left: e.right,
                right: {
                  type: 'NumericLiteral',
                  value: 1,
                },
              },
            },
          }
        }
      } else if (!expressionHasVariable(e.right, by)) {
        return {
          type: 'NumericLiteral',
          value: 0,
        }
      } else {
        return {
          type: 'BinaryExpression',
          operator: '*',
          left: {
            type: 'BinaryExpression',
            operator: '*',
            left: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'ln',
              },
              arguments: [e.left],
            },
            right: e,
          },
          right: deriveExpressionWith(e.right, by),
        }
      }
    }
  }
  if (e.type === 'UnaryExpression') {
    return {
      type: 'UnaryExpression',
      operator: e.operator,
      argument: deriveExpressionWith(e.argument, by),
    }
  }
  if (e.type === 'CallExpression') {
    let functionName: string | undefined
    if (e.callee.type === 'Identifier') {
      functionName = e.callee.name
    } else if (e.callee.type === 'MemberExpression' && e.callee.object.type === 'Identifier' && e.callee.object.name === 'Math' && e.callee.property.type === 'Identifier') {
      functionName === e.callee.property.name
    }
    const a = e.arguments[0]
    if (functionName && a && a.type !== 'SpreadElement' && expressionHasVariable(a, by)) {
      if (functionName === 'sin') {
        return {
          type: 'BinaryExpression',
          operator: '*',
          left: {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'cos',
            },
            arguments: e.arguments,
          },
          right: deriveExpressionWith(a, by),
        }
      } else if (functionName === 'cos') {
        return {
          type: 'UnaryExpression',
          operator: '-',
          argument: {
            type: 'BinaryExpression',
            operator: '*',
            left: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'sin',
              },
              arguments: e.arguments,
            },
            right: deriveExpressionWith(a, by),
          }
        }
      } else if (functionName === 'tan') {
        return {
          type: 'BinaryExpression',
          operator: '/',
          left: {
            type: 'BinaryExpression',
            operator: '/',
            left: deriveExpressionWith(a, by),
            right: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'cos',
              },
              arguments: e.arguments,
            },
          },
          right: {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'cos',
            },
            arguments: e.arguments,
          },
        }
      } else if (functionName === 'ln') {
        return {
          type: 'BinaryExpression',
          operator: '/',
          left: deriveExpressionWith(a, by),
          right: a,
        }
      }
    }
  }
  if (e.type === 'NumericLiteral') {
    return {
      type: 'NumericLiteral',
      value: 0,
    }
  }
  if (e.type === 'Identifier') {
    return {
      type: 'NumericLiteral',
      value: e.name === by ? 1 : 0,
    }
  }
  return e
}

export function taylorExpandExpressionWith(e: Expression2, by: string, num: number, toPrimaryFunction?: boolean): Expression2 {
  const hasVariable = (v: Expression2) => expressionHasVariable(v, by)
  let result = optimizeExpression(composeExpression(cloneExpression(e), { [by]: { type: 'NumericLiteral', value: 0 } }), hasVariable)
  if (toPrimaryFunction) {
    result = optimizeExpression({
      type: 'BinaryExpression',
      operator: '*',
      left: result,
      right: {
        type: 'Identifier',
        name: by,
      }
    }, hasVariable)
  }
  for (let i = 1; i < num; i++) {
    e = optimizeExpression(deriveExpressionWith(e, by), hasVariable)
    const c = optimizeExpression(composeExpression(cloneExpression(e), { [by]: { type: 'NumericLiteral', value: 0 } }), hasVariable)
    let d: Expression2 = {
      type: 'NumericLiteral',
      value: factorial(i)
    }
    if (toPrimaryFunction) {
      d = {
        type: 'BinaryExpression',
        operator: '*',
        left: d,
        right: {
          type: 'NumericLiteral',
          value: i + 1,
        },
      }
    }
    result = optimizeExpression({
      type: 'BinaryExpression',
      left: {
        type: 'BinaryExpression',
        operator: '*',
        left: {
          type: 'BinaryExpression',
          operator: '/',
          left: c,
          right: d,
        },
        right: {
          type: 'BinaryExpression',
          operator: '**',
          left: {
            type: 'Identifier',
            name: by,
          },
          right: {
            type: 'NumericLiteral',
            value: toPrimaryFunction ? i + 1 : i,
          },
        }
      },
      operator: '+',
      right: result,
    }, hasVariable)
  }
  return result
}
