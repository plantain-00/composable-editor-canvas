import { Expression2, priorizedBinaryOperators } from "expression-engine";
import { Factor, FactorVariable, divideFactors, factorToExpression, factorsToExpression, getReverseOperator, isLetter, isNumber, powerFactor } from "../components";

export function expandExpression(e: Expression2): Expression2 {
  if (e.type === 'BinaryExpression') {
    if (e.operator === '**') {
      if (e.right.type === 'NumericLiteral') {
        if (e.right.value === 2) {
          if (e.left.type === 'BinaryExpression') {
            if (e.left.operator === '+') {
              // (a + b) ** 2 -> (a * a + 2 * (a * b)) + b ** 2
              return expandExpression({
                type: 'BinaryExpression',
                operator: '+',
                left: {
                  type: 'BinaryExpression',
                  operator: '+',
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
      e.argument
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

export function printMathStyleExpression(e: Expression2) {
  const print = (expression: Expression2, priority = Number.MAX_SAFE_INTEGER): string => {
    if (expression.type === 'NumericLiteral') {
      return expression.value.toString()
    }
    if (expression.type === 'Identifier') {
      return expression.name
    }
    if (expression.type === 'UnaryExpression') {
      const argument = print(expression.argument, -1)
      return `(${expression.operator + argument})`
    }
    if (expression.type === 'BinaryExpression') {
      const index = priorizedBinaryOperators.findIndex(p => p.includes(expression.operator))
      const rightIndex = expression.operator === '+' || expression.operator === '*' ? index : index - 0.1
      const operator = expression.operator === '*' ? ' ' : expression.operator === '**' ? '^' : ' ' + expression.operator + ' '
      const left = print(expression.left, index)
      const right = print(expression.right, rightIndex)
      const result = left === '-1' && operator == ' ' ? '-' + right : left + operator + right
      if (index > priority) {
        return `(${result})`
      }
      return result
    }
    return ''
  };
  return print(e)
}

export function mathStyleExpressionToExpression(e: string) {
  let result = ''
  for (let i = 0; i < e.length; i++) {
    const c = e[i]
    if (c === ' ' && i > 0 && i < e.length - 1) {
      if ((isLetter(e[i - 1]) || isNumber(e[i - 1]) || e[i - 1] === ')') && (isLetter(e[i + 1]) || isNumber(e[i + 1]) || e[i + 1] === '(')) {
        result += '*'
        continue
      }
    }
    if (c === '^') {
      result += '**'
      continue
    }
    if (c === '(' && i > 0) {
      if (isLetter(e[i - 1]) || isNumber(e[i - 1]) || e[i - 1] === ')') {
        result += '*('
        continue
      }
    }
    if (c === ')' && i < e.length - 1) {
      if (isLetter(e[i + 1]) || isNumber(e[i + 1])) {
        result += ')*'
        continue
      }
    }
    result += c
  }
  return result
}

export function groupFactorsBy(factors: Factor[], by: Factor): Expression2 | undefined {
  const result: { count: number, factors: Factor[][] }[] = []
  for (const factor of factors) {
    let count = 0
    let input = [factor]
    while (true) {
      const f = divideFactors(input, [by])
      if (!f) break
      count++
      input = f
    }
    const t = result.find(f => f.count === count)
    if (t) {
      t.factors.push(input)
    } else {
      result.push({
        count,
        factors: [input],
      })
    }
  }
  result.sort((a, b) => b.count - a.count)
  let expression: Expression2 | undefined
  for (const r of result) {
    let g: Expression2 | undefined
    for (const f of r.factors) {
      const e = factorsToExpression(f)
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
