import { BinaryOperator, evaluateExpression, Expression, printExpression } from "expression-engine"

export interface Equation {
  left: Expression
  right: Expression
  variable: string
}

export const equationRenderStyles = [0x000000, 20, 'monospace', 10, 10, 5] as const

export function* iterateExpression(e: Expression): Generator<Expression, void, unknown> {
  yield e
  if (e.type === 'BinaryExpression') {
    yield* iterateExpression(e.left)
    yield* iterateExpression(e.right)
  } else if (e.type === 'UnaryExpression') {
    yield* iterateExpression(e.argument)
  }
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

function isSameExpression(e1: Expression, e2: Expression): boolean {
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
  return true
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
        return {
          type: 'NumericLiteral',
          // type-coverage:ignore-next-line
          value: evaluateExpression(expression, {}) as number,
          range: expression.range,
        }
      }

      // 0 + a
      if (expression.left.type === 'NumericLiteral' && expression.left.value === 0) {
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
            range: [0, 0],
          })
        }
        // 0 * a -> 0
        // 0 / a -> 0
        if (expression.operator === '*' || expression.operator === '/') {
          return expression.left
        }
      }
      // a + 0
      if (expression.right.type === 'NumericLiteral' && expression.right.value === 0) {
        // a + 0 -> a
        // a - 0 -> a
        if (expression.operator === '+' || expression.operator === '-') {
          return expression.left
        }
        // a * 0 -> 0
        if (expression.operator === '*') {
          return expression.right
        }
      }

      // a * 1
      if (expression.right.type === 'NumericLiteral' && expression.right.value === 1) {
        // a * 1 -> a
        // a / 1 -> a
        if (expression.operator === '*' || expression.operator === '/') {
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
            range: [0, 0],
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
            range: [0, 0],
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
              range: [0, 0],
            },
            operator: '*',
            right: expression.left,
            range: [0, 0],
          })
        }
        // a - a -> 0
        if (expression.operator === '-') {
          return {
            type: 'NumericLiteral',
            value: 0,
            range: [0, 0],
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
              range: [0, 0],
            },
            range: [0, 0],
          })
        }
        // a / a -> 1
        if (expression.operator === '/') {
          return {
            type: 'NumericLiteral',
            value: 1,
            range: [0, 0],
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
            range: [0, 0],
          },
          range: [0, 0],
        })
      }
      // a / 2 -> a * 0.5
      if (expression.operator === '/' && expression.right.type === 'NumericLiteral') {
        return {
          type: 'BinaryExpression',
          left: expression.left,
          operator: '*',
          right: {
            type: 'NumericLiteral',
            value: 1 / expression.right.value,
            range: [0, 0],
          },
          range: [0, 0],
        }
      }
      // a - -b -> a + b
      if (expression.operator === '-' && expression.right.type === 'UnaryExpression' && expression.right.operator === '-') {
        return optimize({
          type: 'BinaryExpression',
          operator: '+',
          left: expression.left,
          right: optimize(expression.right.argument),
          range: expression.range,
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
              range: [0, 0],
            },
            operator: expression.right.operator,
            right: optimize(expression.right.right),
            range: [0, 0],
          }),
          range: [0, 0],
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
            range: [0, 0],
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
              range: [0, 0],
            },
            range: [0, 0],
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
              range: [0, 0],
            },
            right: optimize(expression.left.right),
            range: [0, 0],
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
                range: [0, 0],
              },
              operator: '*',
              right: optimize(expression.left.right.right),
              range: [0, 0],
            }),
            range: [0, 0],
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
                range: [0, 0],
              },
              operator: '*',
              right: optimize(expression.left.right),
              range: [0, 0],
            }),
            range: [0, 0],
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
                range: [0, 0],
              },
              operator: '*',
              right: expression.right,
              range: [0, 0],
            }),
            range: [0, 0],
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
                range: [0, 0],
              },
              operator: '*',
              right: optimize(expression.left.right.right),
              range: [0, 0],
            }),
            range: [0, 0],
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
                range: [0, 0],
              },
              operator: '*',
              right: optimize(expression.right.right),
              range: [0, 0],
            }),
            range: [0, 0],
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
              range: [0, 0],
            }),
            operator: expression.left.operator,
            right: expression.left.right,
            range: [0, 0],
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
              range: [0, 0],
            }),
            right: optimize(expression.left.right),
            range: expression.range,
          })
        }

        // (a - b * x) - c * x -> a - (b * x + c * x)
        // (a - b * x) + c * x -> a - (b * x - c * x)
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
            left: optimize(expression.left.left),
            operator: '-',
            right: optimize({
              type: 'BinaryExpression',
              left: optimize(expression.left.right),
              operator: getReverseOperator(expression.operator),
              right: expression.right,
              range: [0, 0],
            }),
            range: expression.range,
          })
        }

        // (a * c) * b -> (a * b) * c
        // (a / c) * b -> (a * b) / c
        // (a * c) / b -> (a / b) * c
        // (a / c) / b -> (a / b) / c
        if (
          (expression.operator === '*' || expression.operator === '/') &&
          expression.left.type === 'BinaryExpression' &&
          (expression.left.operator === '*' || expression.left.operator === '/') &&
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
              range: [0, 0],
            },
            operator: expression.left.operator,
            right: optimize(expression.left.right),
            range: [0, 0],
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
              range: [0, 0],
            },
            operator: expression.left.operator,
            right: optimize(expression.left.right),
            range: [0, 0],
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
              range: [0, 0],
            }),
            right: optimize(expression.right.right),
            range: expression.range,
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
              range: [0, 0],
            }),
            right: optimize(expression.right.right),
            range: expression.range,
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
              range: [0, 0],
            }),
            right: optimize(expression.right.right),
            range: expression.range,
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
          range: expression.range,
        })
      }
      // x * a -> a * x
      if (expression.operator === '*' && hasVariable && hasVariable(expression.left) && !hasVariable(expression.right)) {
        return optimize({
          type: 'BinaryExpression',
          left: expression.right,
          operator: expression.operator,
          right: expression.left,
          range: expression.range,
        })
      }
      // a + x -> x + a
      if (expression.operator === '+' && hasVariable && !hasVariable(expression.left) && hasVariable(expression.right)) {
        return optimize({
          type: 'BinaryExpression',
          left: expression.right,
          operator: expression.operator,
          right: expression.left,
          range: expression.range,
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
            range: [0, 0],
          }),
          range: expression.range,
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
            range: [0, 0],
          }),
          range: expression.range,
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
                range: [0, 0],
              }),
              operator: expression.operator,
              right: optimize(expression.right.left),
              range: [0, 0],
            }),
            operator: '/',
            right: optimize(expression.right.right),
            range: [0, 0],
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
                range: [0, 0],
              }),
              range: [0, 0],
            }),
            operator: '/',
            right: optimize(expression.left.right),
            range: [0, 0],
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
              range: [0, 0],
            }),
            operator: expression.left.operator,
            right: optimize({
              type: 'BinaryExpression',
              left: optimize(expression.left.right),
              operator: '*',
              right: expression.right,
              range: [0, 0],
            }),
            range: [0, 0],
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
              range: [0, 0],
            }),
            operator: expression.right.operator,
            right: optimize({
              type: 'BinaryExpression',
              left: expression.left,
              operator: '*',
              right: optimize(expression.right.right),
              range: [0, 0],
            }),
            range: [0, 0],
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
              range: [0, 0],
            }),
            operator: '*',
            right: optimize(expression.left.right),
            range: [0, 0],
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
                range: [0, 0],
              },
              operator: expression.operator,
              range: [0, 0],
            }),
            operator: '*',
            right: optimize(expression.left.right),
            range: [0, 0],
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
                range: [0, 0],
              },
              right: optimize(expression.right.left),
              operator: expression.operator,
              range: [0, 0],
            }),
            operator: '*',
            right: expression.left,
            range: [0, 0],
          })
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
            range: [0, 0],
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
              range: [0, 0],
            }),
            operator: getReverseOperator(expression.argument.operator),
            right: optimize(expression.argument.right),
            range: [0, 0],
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
                range: [0, 0],
              }),
              operator: expression.argument.operator,
              right: optimize(expression.argument.right),
              range: [0, 0],
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
                range: [0, 0],
              }),
              range: [0, 0],
            })
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
