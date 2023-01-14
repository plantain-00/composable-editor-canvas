import { Expression2 } from "expression-engine";
import { Equation } from "../equation-renderer";

export function solveQuadraticEquation(equation: Equation, variable: string): Expression2[] | void {
  const factors = expressionToQuadraticFactors(equation.left, variable)
  if (factors && factors.length > 0) {
    factors.sort((a, b) => b.degree - a.degree)
    const first = factors[0]
    if (first.degree === 2) {
      const a = first.constant
      if (factors.length === 2) {
        const second = factors[1]
        if (second.degree === 1) {
          return solveQuadratic(a, second.constant, equation.right)
        }
      } else if (factors.length === 1) {
        return solveQuadratic(a, { type: 'NumericLiteral', value: 0 }, equation.right)
      }
    }
  }
}

function expressionToQuadraticFactors(e: Expression2, variable: string): QuadraticFactor[] | void {
  if (e.type === 'BinaryExpression' && (e.operator === '+' || e.operator === '-')) {
    const left = expressionToQuadraticFactors(e.left, variable)
    if (!left) return
    let right = expressionToQuadraticFactors(e.right, variable)
    if (!right) return
    if (e.operator === '-') {
      right = right.map(r => reverseQuadraticFactor(r))
    }
    const result = [...left]
    for (const r of right) {
      const v = result.find(f => f.degree === r.degree)
      if (v) {
        v.constant = {
          type: 'BinaryExpression',
          left: v.constant,
          operator: '+',
          right: r.constant,
        }
      } else {
        result.push(r)
      }
    }
    return result
  }
  const factor = expressionToQuadraticFactor(e, variable)
  if (factor) {
    return [factor]
  }
}

function expressionToQuadraticFactor(e: Expression2, variable: string): QuadraticFactor | void {
  if (e.type === 'NumericLiteral') {
    return {
      constant: e,
      degree: 0,
    }
  }
  if (e.type === 'Identifier') {
    if (e.name === variable) {
      return {
        constant: {
          type: 'NumericLiteral',
          value: 1,
        },
        degree: 1,
      }
    }
    return {
      constant: e,
      degree: 0,
    }
  }
  if (e.type === 'UnaryExpression' && e.operator === '-') {
    const argument = expressionToQuadraticFactor(e.argument, variable)
    if (!argument) return
    return reverseQuadraticFactor(argument)
  }
  if (e.type === 'BinaryExpression') {
    if (e.operator === '*') {
      const left = expressionToQuadraticFactor(e.left, variable)
      if (!left) return
      const right = expressionToQuadraticFactor(e.right, variable)
      if (!right) return
      return multiplyQuadraticFactor(left, right)
    }
    if (e.operator === '**') {
      const left = expressionToQuadraticFactor(e.left, variable)
      if (!left) return
      if (e.right.type !== 'NumericLiteral') return
      if (!Number.isInteger(e.right.value)) return
      if (e.right.value < 1) return
      return {
        constant: {
          type: 'BinaryExpression',
          left: left.constant,
          operator: '**',
          right: e.right,
        },
        degree: left.degree * e.right.value,
      }
    }
  }
}

function multiplyQuadraticFactor(...factors: QuadraticFactor[]): QuadraticFactor {
  let constant: Expression2 | undefined
  let degree = 0
  for (const f of factors) {
    if (!constant) {
      constant = f.constant
    } else {
      constant = {
        type: 'BinaryExpression',
        left: constant,
        operator: '*',
        right: f.constant,
      }
    }
    degree += f.degree
  }
  return {
    degree,
    constant: constant || {
      type: 'NumericLiteral',
      value: 1,
    },
  }
}

function reverseQuadraticFactor(factor: QuadraticFactor) {
  return multiplyQuadraticFactor(factor, { constant: { type: 'NumericLiteral', value: -1 }, degree: 0 })
}

interface QuadraticFactor {
  constant: Expression2
  degree: number
}

function solveQuadratic(a: Expression2, b: Expression2, c: Expression2): Expression2[] | void {
  return [
    {
      type: 'BinaryExpression',
      left: {
        type: 'BinaryExpression',
        left: {
          type: 'UnaryExpression',
          operator: '-',
          argument: b,
        },
        operator: '+',
        right: {
          type: 'BinaryExpression',
          left: {
            type: 'BinaryExpression',
            left: {
              type: 'BinaryExpression',
              left: b,
              operator: '**',
              right: {
                type: 'NumericLiteral',
                value: 2,
              }
            },
            operator: '+',
            right: {
              type: 'BinaryExpression',
              left: {
                type: 'BinaryExpression',
                left: {
                  type: 'NumericLiteral',
                  value: 4,
                },
                operator: '*',
                right: a,
              },
              operator: '*',
              right: c,
            },
          },
          operator: '**',
          right: {
            type: 'NumericLiteral',
            value: 0.5,
          },
        },
      },
      operator: '/',
      right: {
        type: 'BinaryExpression',
        left: {
          type: 'NumericLiteral',
          value: 2,
        },
        operator: '*',
        right: a,
      },
    },
    {
      type: 'BinaryExpression',
      left: {
        type: 'BinaryExpression',
        left: {
          type: 'UnaryExpression',
          operator: '-',
          argument: b,
        },
        operator: '-',
        right: {
          type: 'BinaryExpression',
          left: {
            type: 'BinaryExpression',
            left: {
              type: 'BinaryExpression',
              left: b,
              operator: '**',
              right: {
                type: 'NumericLiteral',
                value: 2,
              }
            },
            operator: '+',
            right: {
              type: 'BinaryExpression',
              left: {
                type: 'BinaryExpression',
                left: {
                  type: 'NumericLiteral',
                  value: 4,
                },
                operator: '*',
                right: a,
              },
              operator: '*',
              right: c,
            },
          },
          operator: '**',
          right: {
            type: 'NumericLiteral',
            value: 0.5,
          },
        },
      },
      operator: '/',
      right: {
        type: 'BinaryExpression',
        left: {
          type: 'NumericLiteral',
          value: 2,
        },
        operator: '*',
        right: a,
      },
    },
  ]
}
