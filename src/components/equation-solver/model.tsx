import { BinaryOperator, Expression2 as Expression, SpreadElement2, printExpression } from "expression-engine"
import { isZero } from "../../utils/math"
import { Equation } from "../equation-renderer"
import { divide, expressionToFactors, extractFactors, factorsToExpression, factorToExpression, optimizeFactors } from "./factorization"

export function* iterateExpression(e: Expression): Generator<Expression, void, unknown> {
  yield e
  if (e.type === 'BinaryExpression') {
    yield* iterateExpression(e.left)
    yield* iterateExpression(e.right)
  } else if (e.type === 'UnaryExpression') {
    yield* iterateExpression(e.argument)
  } else if (e.type === 'CallExpression') {
    for (const arg of e.arguments) {
      if (arg.type !== 'SpreadElement') {
        yield* iterateExpression(arg)
      }
    }
  }
}

export function* iterateEquation(e: Equation): Generator<Expression, void, unknown> {
  yield* iterateExpression(e.left)
  yield* iterateExpression(e.right)
}

export function expressionHasVariable(e: Expression, variable: string) {
  for (const v of iterateExpression(e)) {
    if (v.type === 'Identifier' && v.name === variable) return true
  }
  return false
}

export function optimizeEquation(equation: Equation, hasVariable?: (e: Expression) => boolean) {
  equation.left = optimizeExpression(equation.left, hasVariable)
  equation.right = optimizeExpression(equation.right, hasVariable)
  return equation
}

export function printEquation(equation: Equation, options?: Partial<{ keepBinaryExpressionOrder: boolean }>) {
  return printExpression(equation.left, options) + ' = ' + printExpression(equation.right, options)
}

function isSameExpression(e1: Expression | SpreadElement2<Expression>, e2: Expression | SpreadElement2<Expression>): boolean {
  if (e1.type !== e2.type) return false
  if (e1.type === 'BinaryExpression' && e2.type === 'BinaryExpression') {
    return e1.operator === e2.operator && isSameExpression(e1.left, e2.left) && isSameExpression(e1.right, e2.right)
  }
  if (e1.type === 'UnaryExpression' && e2.type === 'UnaryExpression') {
    return e1.operator === e2.operator && isSameExpression(e1.argument, e2.argument)
  }
  if (e1.type === 'NumericLiteral' && e2.type === 'NumericLiteral') {
    return e1.value === e2.value
  }
  if (e1.type === 'Identifier' && e2.type === 'Identifier') {
    return e1.name === e2.name
  }
  if (e1.type === 'CallExpression' && e2.type === 'CallExpression') {
    return isSameExpression(e1.callee, e2.callee) &&
      e1.arguments.length === e2.arguments.length &&
      e1.arguments.every((e, i) => isSameExpression(e, e2.arguments[i]))
  }
  return false
}

function shouldBeAfterExpression(e1: Expression, e2: Expression): boolean {
  if (e1.type === 'UnaryExpression') {
    return shouldBeAfterExpression(e1.argument, e2)
  }
  if (e2.type === 'UnaryExpression') {
    return shouldBeAfterExpression(e1, e2.argument)
  }
  if (e1.type === 'BinaryExpression' && e2.type === 'BinaryExpression') {
    if (shouldBeAfterExpression(e1.left, e2.left)) return true
    if (isSameExpression(e1, e2)) {
      return shouldBeAfterExpression(e1.right, e2.right)
    }
    return false
  }
  if (e1.type === 'Identifier' && e2.type === 'Identifier') {
    return e1.name > e2.name
  }
  return false
}

function isNumericExpression(expression: Expression) {
  return (expression.type === 'UnaryExpression' && expression.argument.type === 'NumericLiteral') || expression.type === 'NumericLiteral'
}

export function optimizeExpression(
  e: Expression,
  hasVariable?: (e: Expression) => boolean,
): Expression {
  const optimize = (expression: Expression): Expression => {
    if (expression.type === 'BinaryExpression') {
      expression.left = optimize(expression.left)
      expression.right = optimize(expression.right)

      // 1 + 1
      if (expression.left.type === 'NumericLiteral' && expression.right.type === 'NumericLiteral') {
        // 1 + 2 -> 3
        let result: number
        if (expression.operator === '+') {
          result = expression.left.value + expression.right.value
        } else if (expression.operator === '-') {
          result = expression.left.value - expression.right.value
        } else if (expression.operator === '*') {
          result = expression.left.value * expression.right.value
        } else if (expression.operator === '/') {
          result = expression.left.value / expression.right.value
        } else if (expression.operator === '**') {
          result = expression.left.value ** expression.right.value
        } else {
          throw new Error(`Unsupported operator: ${expression.operator}`)
        }
        return {
          type: 'NumericLiteral',
          value: result,
        }
      }

      // 0 + a
      if (expression.left.type === 'NumericLiteral' && isZero(expression.left.value)) {
        // 0 + a -> a
        if (expression.operator === '+') {
          return expression.right
        }
        // 0 - a -> -a
        if (expression.operator === '-') {
          return optimize({
            type: 'UnaryExpression',
            operator: '-',
            argument: expression.right,
          })
        }
        // 0 * a -> 0
        // 0 / a -> 0
        if (expression.operator === '*' || expression.operator === '/') {
          return expression.left
        }
      }
      // a + 0
      if (expression.right.type === 'NumericLiteral' && isZero(expression.right.value)) {
        // a + 0 -> a
        // a - 0 -> a
        if (expression.operator === '+' || expression.operator === '-') {
          return expression.left
        }
        // a * 0 -> 0
        if (expression.operator === '*') {
          return expression.right
        }
        // a ** 0 -> 1
        if (expression.operator === '**') {
          return {
            type: 'NumericLiteral',
            value: 1,
          }
        }
      }

      // a * 1
      if (expression.right.type === 'NumericLiteral' && expression.right.value === 1) {
        // a * 1 -> a
        // a / 1 -> a
        // a ** 1 -> a
        if (expression.operator === '*' || expression.operator === '/' || expression.operator === '**') {
          return expression.left
        }
      }
      // 1 * a
      if (expression.left.type === 'NumericLiteral' && expression.left.value === 1) {
        // 1 * a -> a
        if (expression.operator === '*') {
          return expression.right
        }
      }

      // a * -1
      if (expression.right.type === 'NumericLiteral' && expression.right.value === -1) {
        // a * -1 -> -a
        // a / -1 -> -a
        if (expression.operator === '*' || expression.operator === '/') {
          return {
            type: 'UnaryExpression',
            argument: expression.left,
            operator: '-',
          }
        }
      }
      // -1 * a
      if (expression.left.type === 'NumericLiteral' && expression.left.value === -1) {
        // -1 * a -> -a
        if (expression.operator === '*') {
          return {
            type: 'UnaryExpression',
            argument: expression.right,
            operator: '-',
          }
        }
      }

      // a + a
      if (isSameExpression(expression.left, expression.right)) {
        // a + a -> 2 * a
        if (expression.operator === '+') {
          return optimize({
            type: 'BinaryExpression',
            left: {
              type: 'NumericLiteral',
              value: 2,
            },
            operator: '*',
            right: expression.left,
          })
        }
        // a - a -> 0
        if (expression.operator === '-') {
          return {
            type: 'NumericLiteral',
            value: 0,
          }
        }
        if (expression.operator === '*') {
          // a * a -> a ** 2
          return optimize({
            type: 'BinaryExpression',
            left: expression.left,
            operator: '**',
            right: {
              type: 'NumericLiteral',
              value: 2,
            },
          })
        }
        // a / a -> 1
        if (expression.operator === '/') {
          return {
            type: 'NumericLiteral',
            value: 1,
          }
        }
      }

      // -a + a
      if (
        expression.left.type === 'UnaryExpression' &&
        expression.left.operator === '-' &&
        isSameExpression(expression.left.argument, expression.right)
      ) {
        // -a + a -> 0
        if (expression.operator === '+') {
          return {
            type: 'NumericLiteral',
            value: 0,
          }
        }
        // -a - a -> -2 * a
        if (expression.operator === '-') {
          return optimize({
            type: 'BinaryExpression',
            left: {
              type: 'NumericLiteral',
              value: -2,
            },
            operator: '*',
            right: optimize(expression.left.argument),
          })
        }
        // -a / a -> -1
        if (expression.operator === '/') {
          return {
            type: 'NumericLiteral',
            value: -1,
          }
        }
      }

      // a - 2 -> a + (-2)
      if (expression.operator === '-' && expression.right.type === 'NumericLiteral') {
        return optimize({
          type: 'BinaryExpression',
          left: expression.left,
          operator: '+',
          right: {
            type: 'NumericLiteral',
            value: -expression.right.value,
          },
        })
      }
      // a / 2 -> a * 0.5
      if (expression.operator === '/' && expression.right.type === 'NumericLiteral') {
        // 6 * a / 2 => 2 * a
        const factors = expressionToFactors(expression.left)
        if (factors) {
          const value = expression.right.value
          factors.forEach(f => {
            f.constant = (f.constant ?? 1) / value
          })
          return optimize(factorsToExpression(factors))
        }
        return {
          type: 'BinaryExpression',
          left: expression.left,
          operator: '*',
          right: {
            type: 'NumericLiteral',
            value: 1 / expression.right.value,
          },
        }
      }
      // a - -b -> a + b
      if (expression.operator === '-' && expression.right.type === 'UnaryExpression' && expression.right.operator === '-') {
        return optimize({
          type: 'BinaryExpression',
          operator: '+',
          left: expression.left,
          right: optimize(expression.right.argument),
        })
      }
      // a - 2 * b -> a + -2 * b
      if (
        expression.operator === '-' &&
        expression.right.type === 'BinaryExpression' &&
        expression.right.operator === '*' &&
        expression.right.left.type === 'NumericLiteral'
      ) {
        return optimize({
          type: 'BinaryExpression',
          left: expression.left,
          operator: '+',
          right: optimize({
            type: 'BinaryExpression',
            left: {
              type: 'NumericLiteral',
              value: -expression.right.left.value,
            },
            operator: expression.right.operator,
            right: optimize(expression.right.right),
          }),
        })
      }

      // (a + b) - b
      if (expression.left.type === 'BinaryExpression') {
        // (a + b) - b -> a
        if (
          expression.operator === '-' &&
          expression.left.operator === '+' &&
          isSameExpression(expression.left.right, expression.right)
        ) {
          return optimize(expression.left.left)
        }
        // (a - b) - a -> -b
        if (
          expression.operator === '-' &&
          expression.left.operator === '-' &&
          isSameExpression(expression.left.left, expression.right)
        ) {
          return optimize({
            type: 'UnaryExpression',
            operator: '-',
            argument: optimize(expression.left.right),
          })
        }
        // (a + (-b)) + b -> a
        if (
          expression.operator === '+' &&
          expression.left.operator === '+' &&
          expression.left.right.type === 'UnaryExpression' &&
          expression.left.right.operator === '-' &&
          isSameExpression(expression.left.right.argument, expression.right)
        ) {
          return optimize(expression.left.left)
        }
        // (a - b) + b -> a
        if (
          expression.operator === '+' &&
          expression.left.operator === '-' &&
          isSameExpression(expression.left.right, expression.right)
        ) {
          return optimize(expression.left.left)
        }
        // (a + b) + (-b) -> a
        if (
          expression.operator === '+' &&
          expression.left.operator === '+' &&
          expression.right.type === 'UnaryExpression' &&
          expression.right.operator === '-' &&
          isSameExpression(expression.left.right, expression.right.argument)
        ) {
          return optimize(expression.left.left)
        }
        // (a + 1) + 2 -> a + 3
        // (a - 1) + 2 -> a + 1
        // (a + 1) - 2 -> a - 1
        // (a - 1) - 2 -> a - 3
        if (
          (expression.operator === '+' || expression.operator === '-') &&
          (expression.left.operator === '+' || expression.left.operator === '-') &&
          expression.left.right.type === 'NumericLiteral' &&
          expression.right.type === 'NumericLiteral'
        ) {
          const v = expression.left.right.value * (expression.left.operator === '-' ? -1 : 1) +
            expression.right.value * (expression.operator === '-' ? -1 : 1)
          if (v === 0) {
            return optimize(expression.left.left)
          }
          return optimize({
            type: 'BinaryExpression',
            left: optimize(expression.left.left),
            operator: v > 0 ? '+' : '-',
            right: {
              type: 'NumericLiteral',
              value: v > 0 ? v : -v,
            },
          })
        }
        // (2 * a) * 3 -> (2 * 3) * a
        // (2 + a) + 3 -> (2 + 3) + a
        if (
          (expression.operator === '+' || expression.operator === '*') &&
          expression.left.operator === expression.operator &&
          expression.left.left.type === 'NumericLiteral' &&
          expression.right.type === 'NumericLiteral'
        ) {
          return optimize({
            type: 'BinaryExpression',
            operator: expression.operator,
            left: {
              type: 'NumericLiteral',
              value: expression.operator === '*' ? expression.left.left.value * expression.right.value : expression.left.left.value + expression.right.value,
            },
            right: optimize(expression.left.right),
          })
        }
        // (a * 2) * 3 -> (2 * 3) * a
        // (a + 2) + 3 -> (2 + 3) + a
        if (
          (expression.operator === '+' || expression.operator === '*') &&
          expression.left.operator === expression.operator &&
          expression.left.right.type === 'NumericLiteral' &&
          expression.right.type === 'NumericLiteral'
        ) {
          return optimize({
            type: 'BinaryExpression',
            operator: expression.operator,
            left: {
              type: 'NumericLiteral',
              value: expression.operator === '*' ? expression.left.right.value * expression.right.value : expression.left.right.value + expression.right.value,
            },
            right: optimize(expression.left.left),
          })
        }

        // (1 + 2 * a) + a -> 1 + 3 * a
        if (
          expression.operator === '+' &&
          expression.left.operator === '+' &&
          expression.left.left.type === 'NumericLiteral' &&
          expression.left.right.type === 'BinaryExpression' &&
          expression.left.right.operator === '*' &&
          expression.left.right.left.type === 'NumericLiteral' &&
          isSameExpression(expression.left.right.right, expression.right)
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: expression.left.left,
            operator: '+',
            right: optimize({
              type: 'BinaryExpression',
              left: {
                type: 'NumericLiteral',
                value: expression.left.right.left.value + 1,
              },
              operator: '*',
              right: optimize(expression.left.right.right),
            }),
          })
        }
        // (1 + a) + a -> 1 + 2 * a
        // (1 - a) - a -> 1 - 2 * a
        if (
          (expression.operator === '+' || expression.operator === '-') &&
          expression.left.operator === expression.operator &&
          isSameExpression(expression.left.right, expression.right)
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize(expression.left.left),
            operator: expression.operator,
            right: optimize({
              type: 'BinaryExpression',
              left: {
                type: 'NumericLiteral',
                value: 2,
              },
              operator: '*',
              right: optimize(expression.left.right),
            }),
          })
        }

        // (1 + 3 * a) - a -> 1 + 2 * a
        if (
          expression.operator === '-' &&
          expression.left.operator === '+' &&
          expression.left.left.type === 'NumericLiteral' &&
          expression.left.right.type === 'BinaryExpression' &&
          expression.left.right.operator === '*' &&
          expression.left.right.left.type === 'NumericLiteral' &&
          isSameExpression(expression.left.right.right, expression.right)
        ) {
          return optimize({
            type: 'BinaryExpression',
            operator: '+',
            left: expression.left.left,
            right: optimize({
              type: 'BinaryExpression',
              left: {
                type: 'NumericLiteral',
                value: expression.left.right.left.value - 1,
              },
              operator: '*',
              right: expression.right,
            }),
          })
        }
        // (1 + 2 * a) + 3 * a -> 1 + 5 * a
        if (
          expression.operator === '+' &&
          expression.left.operator === '+' &&
          expression.left.left.type === 'NumericLiteral' &&
          expression.left.right.type === 'BinaryExpression' &&
          expression.left.right.operator === '*' &&
          expression.left.right.left.type === 'NumericLiteral' &&
          expression.right.type === 'BinaryExpression' &&
          expression.right.operator === '*' &&
          expression.right.left.type === 'NumericLiteral' &&
          isSameExpression(expression.left.right.right, expression.right.right)
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: expression.left.left,
            operator: '+',
            right: optimize({
              type: 'BinaryExpression',
              left: {
                type: 'NumericLiteral',
                value: expression.left.right.left.value + expression.right.left.value,
              },
              operator: '*',
              right: optimize(expression.left.right.right),
            }),
          })
        }
        // (1 - a) + 5 * a -> 1 + 4 * a
        if (
          expression.operator === '+' &&
          expression.left.operator === '-' &&
          expression.left.left.type === 'NumericLiteral' &&
          expression.right.type === 'BinaryExpression' &&
          expression.right.operator === '*' &&
          expression.right.left.type === 'NumericLiteral' &&
          isSameExpression(expression.left.right, expression.right.right)
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: expression.left.left,
            operator: '+',
            right: optimize({
              type: 'BinaryExpression',
              left: {
                type: 'NumericLiteral',
                value: -1 + expression.right.left.value,
              },
              operator: '*',
              right: optimize(expression.right.right),
            }),
          })
        }

        if (
          (expression.operator === '+' || expression.operator === '-') &&
          (expression.left.operator === '+' || expression.left.operator === '-') &&
          expression.left.right.type === 'NumericLiteral'
        ) {
          // (a + 1) + b -> (a + b) + 1
          // (a + 1) - b -> (a - b) + 1
          // (a - 1) + b -> (a + b) - 1
          // (a - 1) - b -> (a - b) - 1
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: optimize(expression.left.left),
              operator: expression.operator,
              right: expression.right,
            }),
            operator: expression.left.operator,
            right: expression.left.right,
          })
        }

        // (3 * x - a) + x -> (3 * x + x) - a
        // (3 * x - a) - x -> (3 * x - x) - a
        // (3 * x + a) + x -> (3 * x + x) + a
        // (3 * x + a) - x -> (3 * x - x) + a
        if (
          (expression.operator === '+' || expression.operator === '-') &&
          hasVariable &&
          (expression.left.operator === '+' || expression.left.operator === '-') &&
          hasVariable(expression.right) &&
          hasVariable(expression.left.left) &&
          !hasVariable(expression.left.right)
        ) {
          return optimize({
            type: 'BinaryExpression',
            operator: expression.left.operator,
            left: optimize({
              type: 'BinaryExpression',
              operator: expression.operator,
              left: optimize(expression.left.left),
              right: expression.right,
            }),
            right: optimize(expression.left.right),
          })
        }

        // (a - b * x) - c * x -> (-b * x - c * x) + a
        // (a - b * x) + c * x -> (-b * x + c * x) + a
        if (
          (expression.operator === '+' || expression.operator === '-') &&
          hasVariable &&
          expression.left.operator === '-' &&
          hasVariable(expression.right) &&
          hasVariable(expression.left.right) &&
          !hasVariable(expression.left.left)
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: optimize({
                type: 'UnaryExpression',
                operator: '-',
                argument: optimize(expression.left.right),
              }),
              operator: expression.operator,
              right: expression.right,
            }),
            operator: '+',
            right: optimize(expression.left.left),
          })
        }

        // (a * c) * b -> (a * b) * c
        // (a / c) / b -> (a / b) / c
        if (
          (expression.operator === '*' || expression.operator === '/') &&
          expression.left.type === 'BinaryExpression' &&
          expression.left.operator === expression.operator &&
          (!hasVariable || !hasVariable(expression.left.right)) &&
          shouldBeAfterExpression(expression.left.right, expression.right)
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: {
              type: 'BinaryExpression',
              left: optimize(expression.left.left),
              operator: expression.operator,
              right: expression.right,
            },
            operator: expression.left.operator,
            right: optimize(expression.left.right),
          })
        }
        // (a / c) * b -> (a * b) / c
        if (
          expression.operator === '*' &&
          expression.left.type === 'BinaryExpression' &&
          expression.left.operator === '/' &&
          (!hasVariable || !hasVariable(expression.left.right))
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: {
              type: 'BinaryExpression',
              left: optimize(expression.left.left),
              operator: expression.operator,
              right: expression.right,
            },
            operator: expression.left.operator,
            right: optimize(expression.left.right),
          })
        }
        // (a + c) + b -> (a + b) + c
        // (a - c) + b -> (a + b) - c
        // (a + c) - b -> (a - b) + c
        // (a - c) - b -> (a - b) - c
        if (
          (expression.operator === '+' || expression.operator === '-') &&
          expression.left.type === 'BinaryExpression' &&
          (expression.left.operator === '+' || expression.left.operator === '-') &&
          (!hasVariable || !hasVariable(expression.left.right)) &&
          shouldBeAfterExpression(expression.left.right, expression.right)
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: {
              type: 'BinaryExpression',
              left: optimize(expression.left.left),
              operator: expression.operator,
              right: expression.right,
            },
            operator: expression.left.operator,
            right: optimize(expression.left.right),
          })
        }
      }

      // a + (b + c) -> (a + b) + c
      if (expression.right.type === 'BinaryExpression') {
        // a + (b + c) -> (a + b) + c
        // a + (b - c) -> (a + b) - c
        if (expression.operator === '+' && (expression.right.operator === '+' || expression.right.operator === '-')) {
          return optimize({
            type: 'BinaryExpression',
            operator: expression.right.operator,
            left: optimize({
              type: 'BinaryExpression',
              operator: '+',
              left: expression.left,
              right: optimize(expression.right.left),
            }),
            right: optimize(expression.right.right),
          })
        }
        // a - (b + c) -> (a - b) - c
        // a - (b - c) -> (a - b) + c
        if (expression.operator === '-' && (expression.right.operator === '+' || expression.right.operator === '-')) {
          return optimize({
            type: 'BinaryExpression',
            operator: getReverseOperator(expression.right.operator),
            left: optimize({
              type: 'BinaryExpression',
              operator: '-',
              left: expression.left,
              right: optimize(expression.right.left),
            }),
            right: optimize(expression.right.right),
          })
        }
        // a * (b * c) -> (a * b) * c
        // a * (b / c) -> (a * b) / c
        if (expression.operator === '*' && (expression.right.operator === '*' || expression.right.operator === '/')) {
          return optimize({
            type: 'BinaryExpression',
            operator: expression.right.operator,
            left: optimize({
              type: 'BinaryExpression',
              operator: '*',
              left: expression.left,
              right: optimize(expression.right.left),
            }),
            right: optimize(expression.right.right),
          })
        }
      }

      // b + a -> a + b
      // b * a -> a * b
      if (
        (expression.operator === '+' || expression.operator === '*') &&
        (!hasVariable ||
          (hasVariable(expression.left) && hasVariable(expression.right)) ||
          (!hasVariable(expression.left) && !hasVariable(expression.right))) &&
        shouldBeAfterExpression(expression.left, expression.right)
      ) {
        return optimize({
          type: 'BinaryExpression',
          operator: expression.operator,
          left: expression.right,
          right: expression.left,
        })
      }
      // x * a -> a * x
      if (expression.operator === '*' && hasVariable && hasVariable(expression.left) && !hasVariable(expression.right)) {
        return optimize({
          type: 'BinaryExpression',
          left: expression.right,
          operator: expression.operator,
          right: expression.left,
        })
      }
      // a + x -> x + a
      if (expression.operator === '+' && hasVariable && !hasVariable(expression.left) && hasVariable(expression.right)) {
        return optimize({
          type: 'BinaryExpression',
          left: expression.right,
          operator: expression.operator,
          right: expression.left,
        })
      }

      // a * -b -> - a * b
      // a / -b -> - a / b
      if (expression.right.type === 'UnaryExpression' && (expression.operator === '*' || expression.operator === '/') && expression.right.operator === '-') {
        return optimize({
          type: 'UnaryExpression',
          operator: expression.right.operator,
          argument: optimize({
            type: 'BinaryExpression',
            left: expression.left,
            right: optimize(expression.right.argument),
            operator: expression.operator,
          }),
        })
      }
      // (-a) * b -> -(a * b)
      // (-a) / b -> -(a / b)
      if (expression.left.type === 'UnaryExpression' && (expression.operator === '*' || expression.operator === '/') && expression.left.operator === '-') {
        return optimize({
          type: 'UnaryExpression',
          operator: expression.left.operator,
          argument: optimize({
            type: 'BinaryExpression',
            left: optimize(expression.left.argument),
            right: expression.right,
            operator: expression.operator,
          }),
        })
      }

      // a + b / c
      if (expression.operator === '+' || expression.operator === '-') {
        // a + b / c -> (a * c + b) / c
        // a - b / c -> (a * c - b) / c
        if (expression.right.type === 'BinaryExpression' && expression.right.operator === '/' && !isNumericExpression(expression.right.right)) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: optimize({
                type: 'BinaryExpression',
                left: expression.left,
                operator: '*',
                right: optimize(expression.right.right),
              }),
              operator: expression.operator,
              right: optimize(expression.right.left),
            }),
            operator: '/',
            right: optimize(expression.right.right),
          })
        }
        // a / b + c -> (a + b * c) / b
        // a / b - c -> (a - b * c) / b
        if (expression.left.type === 'BinaryExpression' && expression.left.operator === '/' && !isNumericExpression(expression.left.right)) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: optimize(expression.left.left),
              operator: expression.operator,
              right: optimize({
                type: 'BinaryExpression',
                left: optimize(expression.left.right),
                operator: '*',
                right: expression.right,
              }),
            }),
            operator: '/',
            right: optimize(expression.left.right),
          })
        }
      }

      // 2 * (b + c)
      if (expression.operator === '*') {
        // (a + b) * c -> a * c + b * c
        // (a - b) * c -> a * c - b * c
        if (
          (!hasVariable || !hasVariable(expression.right)) &&
          expression.left.type === 'BinaryExpression' &&
          (expression.left.operator === '+' || expression.left.operator === '-')
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: optimize(expression.left.left),
              operator: '*',
              right: expression.right,
            }),
            operator: expression.left.operator,
            right: optimize({
              type: 'BinaryExpression',
              left: optimize(expression.left.right),
              operator: '*',
              right: expression.right,
            }),
          })
        }

        // a * (b + c) -> a * b + a * c
        // a * (b - c) -> a * b - a * c
        if (
          (!hasVariable || !hasVariable(expression.left)) &&
          expression.right.type === 'BinaryExpression' &&
          (expression.right.operator === '+' || expression.right.operator === '-')
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: expression.left,
              operator: '*',
              right: optimize(expression.right.left),
            }),
            operator: expression.right.operator,
            right: optimize({
              type: 'BinaryExpression',
              left: expression.left,
              operator: '*',
              right: optimize(expression.right.right),
            }),
          })
        }
      }

      // a * x + b * x
      if (hasVariable && (expression.operator === '+' || expression.operator === '-')) {
        // a * x + b * x -> (a + b) * x
        // a * x - b * x -> (a - b) * x
        if (
          expression.left.type === 'BinaryExpression' &&
          expression.left.operator === '*' &&
          expression.right.type === 'BinaryExpression' &&
          expression.right.operator === '*' &&
          isSameExpression(expression.left.right, expression.right.right) &&
          !hasVariable(expression.left.left) &&
          hasVariable(expression.left.right) &&
          !hasVariable(expression.right.left)
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: optimize(expression.left.left),
              right: optimize(expression.right.left),
              operator: expression.operator,
            }),
            operator: '*',
            right: optimize(expression.left.right),
          })
        }
        // a * x + x -> (a + 1) * x
        // a * x - x -> (a - 1) * x
        if (
          expression.left.type === 'BinaryExpression' &&
          expression.left.operator === '*' &&
          !hasVariable(expression.left.left) &&
          hasVariable(expression.left.right) &&
          isSameExpression(expression.left.right, expression.right)
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: optimize(expression.left.left),
              right: {
                type: 'NumericLiteral',
                value: 1,
              },
              operator: expression.operator,
            }),
            operator: '*',
            right: optimize(expression.left.right),
          })
        }
        // x + a * x -> (1 + a) * x
        // x - a * x -> (1 - a) * x
        if (
          expression.right.type === 'BinaryExpression' &&
          expression.right.operator === '*' &&
          !hasVariable(expression.right.left) &&
          hasVariable(expression.right.right) &&
          isSameExpression(expression.left, expression.right.right)
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: {
                type: 'NumericLiteral',
                value: 1,
              },
              right: optimize(expression.right.left),
              operator: expression.operator,
            }),
            operator: '*',
            right: expression.left,
          })
        }
        // -x + a * x -> (-1 + a) * x
        // -x - a * x -> (-1 - a) * x
        if (
          expression.right.type === 'BinaryExpression' &&
          expression.right.operator === '*' &&
          expression.left.type === 'UnaryExpression' &&
          expression.left.operator === '-' &&
          !hasVariable(expression.right.left) &&
          hasVariable(expression.right.right) &&
          isSameExpression(expression.left.argument, expression.right.right)
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: {
                type: 'NumericLiteral',
                value: -1,
              },
              right: optimize(expression.right.left),
              operator: expression.operator,
            }),
            operator: '*',
            right: optimize(expression.left.argument),
          })
        }
      }

      // (x / a) ** b
      if (hasVariable && expression.operator === '**' && !hasVariable(expression.right) && expression.left.type === 'BinaryExpression' && (expression.left.operator === '*' || expression.left.operator === '/')) {
        // (x / a) ** b -> x ** b / a ** b
        // (x * a) ** b -> x ** b * a ** b
        // (a * x) ** b -> a ** b * x ** b
        // (a / x) ** b -> a ** b / x ** b
        if (
          (hasVariable(expression.left.left) && !hasVariable(expression.left.right)) ||
          (!hasVariable(expression.left.left) && hasVariable(expression.left.right))
        ) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: optimize(expression.left.left),
              operator: '**',
              right: expression.right,
            }),
            operator: expression.left.operator,
            right: optimize({
              type: 'BinaryExpression',
              left: optimize(expression.left.right),
              operator: '**',
              right: expression.right,
            }),
          })
        }
      }

      // (a + b) ** 2
      if (expression.operator === '**' && expression.right.type === 'NumericLiteral' && expression.right.value === 2) {
        // (a + b) ** 2 -> a ** 2 + 2 * a * b + b ** 2
        // (a - b) ** 2 -> a ** 2 - 2 * a * b + b ** 2
        if (expression.left.type === 'BinaryExpression' && (expression.left.operator === '+' || expression.left.operator === '-')) {
          const left = optimize(expression.left.left)
          const right = optimize(expression.left.right)
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'BinaryExpression',
              left: optimize({
                type: 'BinaryExpression',
                left,
                operator: '**',
                right: expression.right,
              }),
              operator: expression.left.operator,
              right: optimize({
                type: 'BinaryExpression',
                left: optimize({
                  type: 'BinaryExpression',
                  left: expression.right,
                  operator: '*',
                  right: left,
                }),
                operator: '*',
                right,
              })
            }),
            operator: '+',
            right: optimize({
              type: 'BinaryExpression',
              left: right,
              operator: '**',
              right: expression.right,
            })
          })
        }
      }

      // (a * b + a * c) / (b + c) -> a
      if (expression.operator === '/') {
        const result = divide(expression.left, expression.right)
        if (result) {
          return optimize(result)
        }
      }

      // ((a * b + a * c) / b) / (b + c) -> a / b
      if (expression.operator === '/' && expression.left.type === 'BinaryExpression' && expression.left.operator === '/') {
        const result = divide(expression.left.left, expression.right)
        if (result) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize(result),
            operator: '/',
            right: optimize(expression.left.right),
          })
        }
      }

      // ((a + 2 * b) + 2 * a) + 3 * b -> 3 * a + 5 * b
      if (expression.operator === '+' || expression.operator === '-') {
        const factors = expressionToFactors(expression)
        if (factors) {
          const newFactors = optimizeFactors(factors)
          if (newFactors.length < factors.length) {
            return optimize(factorsToExpression(newFactors))
          }
        }
      }

      // (b * a ** 2 + 3 * a ** 2) ** 0.5 -> a * (b + 3) ** 0.5
      if (expression.operator === '**' && expression.right.type === 'NumericLiteral' && expression.right.value > 0 && expression.right.value < 1) {
        const power = 1 / expression.right.value
        if (Number.isInteger(power)) {
          const factors = expressionToFactors(expression.left)
          if (factors) {
            const newFactors = extractFactors(factors, power)
            if (newFactors) {
              return optimize({
                type: 'BinaryExpression',
                left: factorToExpression(newFactors.base),
                operator: '*',
                right: optimize({
                  type: 'BinaryExpression',
                  left: factorsToExpression(newFactors.factors),
                  operator: '**',
                  right: expression.right,
                }),
              })
            }
          }
        }
      }

      // 1 / (2 * a + 2 * b) => 1 / (2 * (a + b))
      if (expression.operator === '/' && expression.right.type === 'BinaryExpression' && (expression.right.operator === '+' || expression.right.operator === '-')) {
        const factors = expressionToFactors(expression.right)
        if (factors) {
          const newFactors = extractFactors(factors, 1)
          if (newFactors) {
            return optimize({
              type: 'BinaryExpression',
              left: optimize({
                type: 'BinaryExpression',
                left: expression.left,
                operator: '/',
                right: factorToExpression(newFactors.base),
              }),
              operator: '/',
              right: factorsToExpression(newFactors.factors),
            })
          }
        }
      }
    } else if (expression.type === 'UnaryExpression') {
      expression.argument = optimize(expression.argument)
      if (expression.operator === '-') {
        // -(1) -> (-1)
        if (expression.argument.type === 'NumericLiteral') {
          return {
            type: 'NumericLiteral',
            value: -expression.argument.value,
          }
        }

        // -(-a) -> a
        if (expression.argument.type === 'UnaryExpression' && expression.argument.operator === '-') {
          return optimize(expression.argument.argument)
        }

        // -(a + b) -> -a - b
        // -(a - b) -> -a + b
        if (expression.argument.type === 'BinaryExpression' && (expression.argument.operator === '+' || expression.argument.operator === '-')) {
          return optimize({
            type: 'BinaryExpression',
            left: optimize({
              type: 'UnaryExpression',
              operator: '-',
              argument: optimize(expression.argument.left),
            }),
            operator: getReverseOperator(expression.argument.operator),
            right: optimize(expression.argument.right),
          })
        }

        // -(2 * a) -> -2 * a
        // -(2 / a) -> -2 / a
        // -(a * 2) -> a * -2
        // -(a / 2) -> a / -2
        if (expression.argument.type === 'BinaryExpression' && (expression.argument.operator === '*' || expression.argument.operator === '/')) {
          if (expression.argument.left.type === 'NumericLiteral') {
            return optimize({
              type: 'BinaryExpression',
              left: optimize({
                type: 'NumericLiteral',
                value: -expression.argument.left.value,
              }),
              operator: expression.argument.operator,
              right: optimize(expression.argument.right),
            })
          }
          if (expression.argument.right.type === 'NumericLiteral') {
            return optimize({
              type: 'BinaryExpression',
              left: optimize(expression.argument.left),
              operator: '*',
              right: optimize({
                type: 'NumericLiteral',
                value: -expression.argument.right.value,
              }),
            })
          }
        }
      }
    } else if (expression.type === 'CallExpression') {
      expression.arguments = expression.arguments.map(arg => arg.type === 'SpreadElement' ? arg : optimize(arg))
      if (expression.callee.type === 'Identifier') {
        if (expression.callee.name === 'sin') {
          if (expression.arguments.length === 1) {
            const arg = expression.arguments[0]
            if (arg.type === 'NumericLiteral') {
              return {
                type: 'NumericLiteral',
                value: Math.sin(arg.value),
              }
            }
          }
        } else if (expression.callee.name === 'cos') {
          if (expression.arguments.length === 1) {
            const arg = expression.arguments[0]
            if (arg.type === 'NumericLiteral') {
              return {
                type: 'NumericLiteral',
                value: Math.cos(arg.value),
              }
            }
          }
        } else if (expression.callee.name === 'tan') {
          if (expression.arguments.length === 1) {
            const arg = expression.arguments[0]
            if (arg.type === 'NumericLiteral') {
              return {
                type: 'NumericLiteral',
                value: Math.tan(arg.value),
              }
            }
          }
        } else if (expression.callee.name === 'ln') {
          if (expression.arguments.length === 1) {
            const arg = expression.arguments[0]
            if (arg.type === 'NumericLiteral') {
              return {
                type: 'NumericLiteral',
                value: Math.log(arg.value),
              }
            }
          }
        } else if (expression.callee.name === 'exp') {
          if (expression.arguments.length === 1) {
            const arg = expression.arguments[0]
            if (arg.type === 'NumericLiteral') {
              return {
                type: 'NumericLiteral',
                value: Math.exp(arg.value),
              }
            }
          }
        }
      }
    }
    return expression
  }
  return optimize(e)
}

export function getReverseOperator(operator: BinaryOperator): BinaryOperator {
  if (operator === '+') {
    return '-'
  }
  if (operator === '-') {
    return '+'
  }
  if (operator === '*') {
    return '/'
  }
  if (operator === '/') {
    return '*'
  }
  return operator
}
