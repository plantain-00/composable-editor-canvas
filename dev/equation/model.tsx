import { evaluateExpression, Expression } from "expression-engine"

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
  expression: Expression,
  hasVariable?: (e: Expression) => boolean,
): Expression {
  if (expression.type === 'BinaryExpression') {
    expression.left = optimizeExpression(expression.left, hasVariable)
    expression.right = optimizeExpression(expression.right, hasVariable)
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
        return {
          type: 'UnaryExpression',
          operator: expression.right.operator,
          argument: optimizeExpression({
            type: 'BinaryExpression',
            left: expression.left,
            right: expression.right.argument,
            operator: expression.operator,
            range: [0, 0],
          }, hasVariable),
          range: expression.range,
        }
      }
    }
    if (expression.operator === '-') {
      // a - -b -> a + b
      if (expression.right.type === 'UnaryExpression' && expression.right.operator === '-') {
        return {
          type: 'BinaryExpression',
          operator: '+',
          left: expression.left,
          right: expression.right.argument,
          range: expression.range,
        }
      }
    }
    if (expression.operator === '*') {
      // a * a -> a ** 2
      if (isSameExpression(expression.left, expression.right)) {
        return {
          type: 'BinaryExpression',
          left: expression.left,
          operator: '**',
          right: {
            type: 'NumericLiteral',
            value: 2,
            range: [0, 0],
          },
          range: [0, 0],
        }
      }
    }
    if (hasVariable) {
      // x * a -> a * x
      if (expression.operator === '+' || expression.operator === '*') {
        if (hasVariable(expression.left) && !hasVariable(expression.right)) {
          return {
            type: 'BinaryExpression',
            left: expression.right,
            operator: expression.operator,
            right: expression.left,
            range: expression.range,
          }
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
            return {
              type: 'BinaryExpression',
              left: {
                type: 'BinaryExpression',
                left: expression.left.left,
                right: expression.right.left,
                operator: expression.operator,
                range: [0, 0],
              },
              operator: '*',
              right: expression.left.right,
              range: [0, 0],
            }
          }
        } else if (
          expression.left.type === 'BinaryExpression' &&
          expression.left.operator === '*' &&
          !hasVariable(expression.left.left) &&
          hasVariable(expression.left.right) &&
          isSameExpression(expression.left.right, expression.right)
        ) {
          // a * x + x -> (a + 1) * x
          return {
            type: 'BinaryExpression',
            left: {
              type: 'BinaryExpression',
              left: expression.left.left,
              right: {
                type: 'NumericLiteral',
                value: 1,
                range: [0, 0],
              },
              operator: expression.operator,
              range: [0, 0],
            },
            operator: '*',
            right: expression.left.right,
            range: [0, 0],
          }
        } else if (
          expression.right.type === 'BinaryExpression' &&
          expression.right.operator === '*' &&
          !hasVariable(expression.right.left) &&
          hasVariable(expression.right.right) &&
          isSameExpression(expression.left, expression.right.right)
        ) {
          // x + a * x -> (1 + a) * x
          return {
            type: 'BinaryExpression',
            left: {
              type: 'BinaryExpression',
              left: {
                type: 'NumericLiteral',
                value: 1,
                range: [0, 0],
              },
              right: expression.right.left,
              operator: expression.operator,
              range: [0, 0],
            },
            operator: '*',
            right: expression.left,
            range: [0, 0],
          }
        }
      }
    }
  } else if (expression.type === 'UnaryExpression') {
    expression.argument = optimizeExpression(expression.argument, hasVariable)
  }
  return expression
}
