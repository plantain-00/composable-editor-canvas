import { BinaryOperator, evaluateExpression, Expression } from "expression-engine"

export interface Equation {
  left: Expression
  right: Expression
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

export function optimizeEquation(equation: Equation, hasVariable?: (e: Expression) => boolean) {
  equation.left = optimizeExpression(equation.left, hasVariable)
  equation.right = optimizeExpression(equation.right, hasVariable)
  return equation
}

function isSameExpression(e1: Expression, e2: Expression): boolean {
  if (e1.type !== e2.type) return false
  if (e1.type === 'BinaryExpression' && e2.type === 'BinaryExpression') {
    return isSameExpression(e1.left, e2.left) && isSameExpression(e1.right, e2.right)
  }
  if (e1.type === 'UnaryExpression' && e2.type === 'UnaryExpression') {
    return isSameExpression(e1.argument, e2.argument)
  }
  if (e1.type === 'NumericLiteral' && e2.type === 'NumericLiteral') {
    return e1.value === e2.value
  }
  if (e1.type === 'Identifier' && e2.type === 'Identifier') {
    return e1.name === e2.name
  }
  return true
}

function optimizeExpression(
  e: Expression,
  hasVariable?: (e: Expression) => boolean,
): Expression {
  const optimize = (expression: Expression): Expression => {
    if (expression.type === 'BinaryExpression') {
      expression.left = optimize(expression.left)
      expression.right = optimize(expression.right)
      if (expression.left.type === 'NumericLiteral' && expression.right.type === 'NumericLiteral') {
        // 1 + 2 -> 3
        return {
          type: 'NumericLiteral',
          // type-coverage:ignore-next-line
          value: evaluateExpression(expression, {}) as number,
          range: expression.range,
        }
      }
      if (expression.operator === '*' || expression.operator === '/') {
        // a * -b -> - a * b
        if (expression.right.type === 'UnaryExpression' && expression.right.operator === '-') {
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
        if (expression.left.type === 'UnaryExpression' && expression.left.operator === '-') {
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
      }
      if (expression.operator === '-') {
        // a - -b -> a + b
        if (expression.right.type === 'UnaryExpression' && expression.right.operator === '-') {
          return optimize({
            type: 'BinaryExpression',
            operator: '+',
            left: expression.left,
            right: optimize(expression.right.argument),
            range: expression.range,
          })
        }
        // a - (b + c) -> (a - b) - c
        if (expression.right.type === 'BinaryExpression' && (expression.right.operator === '+' || expression.right.operator === '-')) {
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
      }
      if (expression.operator === '+') {
        // a + (b + c) -> (a + b) + c
        if (expression.right.type === 'BinaryExpression' && (expression.right.operator === '+' || expression.right.operator === '-')) {
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
      }
      if (expression.operator === '*') {
        // a * a -> a ** 2
        if (isSameExpression(expression.left, expression.right)) {
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
        if (!hasVariable || !hasVariable(expression)) {
          // (a + b) * c -> a * c + b * c
          if (expression.left.type === 'BinaryExpression' && (expression.left.operator === '+' || expression.left.operator === '-')) {
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
          if (expression.right.type === 'BinaryExpression' && (expression.right.operator === '+' || expression.right.operator === '-')) {
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
      }
      if (expression.operator === '+' || expression.operator === '-') {

        if (
          expression.left.type === 'BinaryExpression' &&
          (expression.left.operator === '+' || expression.left.operator === '-') &&
          expression.left.right.type === 'NumericLiteral'
        ) {
          // (a + 1) + 2 -> a + 3
          if (expression.right.type === 'NumericLiteral') {
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
          // (a + 1) + b -> (a + b) + 1
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
            right: optimize(expression.left.right),
            range: [0, 0],
          })
        }
      }
      if (hasVariable) {
        // x * a -> a * x
        if (expression.operator === '+' || expression.operator === '*') {
          if (hasVariable(expression.left) && !hasVariable(expression.right)) {
            return optimize({
              type: 'BinaryExpression',
              left: expression.right,
              operator: expression.operator,
              right: expression.left,
              range: expression.range,
            })
          }
        }
        if (expression.operator === '+' || expression.operator === '-') {
          if (
            expression.left.type === 'BinaryExpression' &&
            expression.left.operator === '*' &&
            expression.right.type === 'BinaryExpression' &&
            expression.right.operator === '*'
          ) {
            // a * x + b * x -> (a + b) * x
            if (
              !hasVariable(expression.left.left) &&
              hasVariable(expression.left.right) &&
              !hasVariable(expression.right.left) &&
              hasVariable(expression.right.right) &&
              isSameExpression(expression.left.right, expression.right.right)
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
          } else if (
            expression.left.type === 'BinaryExpression' &&
            expression.left.operator === '*' &&
            !hasVariable(expression.left.left) &&
            hasVariable(expression.left.right) &&
            isSameExpression(expression.left.right, expression.right)
          ) {
            // a * x + x -> (a + 1) * x
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
          } else if (
            expression.right.type === 'BinaryExpression' &&
            expression.right.operator === '*' &&
            !hasVariable(expression.right.left) &&
            hasVariable(expression.right.right) &&
            isSameExpression(expression.left, expression.right.right)
          ) {
            // x + a * x -> (1 + a) * x
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
      }
    } else if (expression.type === 'UnaryExpression') {
      expression.argument = optimize(expression.argument)
      if (expression.operator === '-') {
        // -(-a) -> a
        if (expression.argument.type === 'UnaryExpression' && expression.argument.operator === '-') {
          return optimize(expression.argument.argument)
        }
        // -(a + b) -> -a - b
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
