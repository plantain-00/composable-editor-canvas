import test, { ExecutionContext } from 'ava'
import { Expression, parseExpression, printExpression, tokenizeExpression } from 'expression-engine'
import { expressionHasVariable, optimizeExpression } from '../dev/equation/model'

function optimize(t: ExecutionContext<unknown>, e1: string, e2: string, variable?: string) {
  t.deepEqual(
    printExpression(optimizeExpression(
      parseExpression(tokenizeExpression(e1)),
      variable ? (e: Expression) => expressionHasVariable(e, variable) : undefined
    ), { keepBinaryExpressionOrder: true }),
    e2,
  )
}

test('1 + 2', (t) => {
  optimize(t, '1 + 2', '3')
  optimize(t, '1 - 2', '-1')
  optimize(t, '1 * 2', '2')
  optimize(t, '1 / 2', '0.5')
  optimize(t, '1 ** 2', '1')
})

test('0 + a', (t) => {
  optimize(t, '0 + a', 'a')
  optimize(t, '0 - a', '-a')
  optimize(t, '0 * a', '0')
  optimize(t, '0 / a', '0')
})

test('a + 0', (t) => {
  optimize(t, 'a + 0', 'a')
  optimize(t, 'a - 0', 'a')
  optimize(t, 'a * 0', '0')
})

test('a * 1', (t) => {
  optimize(t, 'a * 1', 'a')
  optimize(t, 'a / 1', 'a')
})

test('1 * a', (t) => {
  optimize(t, '1 * a', 'a')
})

test('a + a', (t) => {
  optimize(t, 'a + a', '2 * a')
  optimize(t, 'a - a', '0')
  optimize(t, 'a * a', 'a ** 2')
  optimize(t, 'a / a', '1')
})

test('a - 2', (t) => {
  optimize(t, 'a - 2', 'a + -2')
})

test('a / 2', (t) => {
  optimize(t, 'a / 2', 'a * 0.5')
})

test('a - -b', (t) => {
  optimize(t, 'a - -b', 'a + b')
})

test('a - 2 * b', (t) => {
  optimize(t, 'a - 2 * b', 'a + -2 * b')
})

test('(a + b) - b', (t) => {
  optimize(t, '(a + b) - b', 'a')
  optimize(t, '(a - b) - a', '-b')
  optimize(t, '(a + -b) + b', 'a')
  optimize(t, '(a - b) + b', 'a')
  optimize(t, '(a + b) + -b', 'a')
  optimize(t, '(2 * a) * 3', '6 * a')
  optimize(t, '(2 + a) + 3', '5 + a')
  optimize(t, '(1 + 2 * a) + a', '1 + 3 * a')
  optimize(t, '(1 + a) + a', '1 + 2 * a')
  optimize(t, '(1 + 3 * a) - a', '1 + 2 * a')
  optimize(t, '(1 + 2 * a) + 3 * a', '1 + 5 * a')
  optimize(t, '(1 - a) + 5 * a', '1 + 4 * a')
  optimize(t, '(a + 1) + 2', 'a + 3')
  optimize(t, '(a - 1) + 2', 'a + 1')
  optimize(t, '(a + 1) - 2', 'a + -1')
  optimize(t, '(a - 1) - 2', 'a + -3')
})

test('a + (b + c)', (t) => {
  optimize(t, 'a + (b + c)', '(a + b) + c')
  optimize(t, 'a + (b - c)', '(a + b) - c')
  optimize(t, 'a - (b + c)', '(a - b) - c')
  optimize(t, 'a - (b - c)', '(a - b) + c')
  optimize(t, 'a * (b * c)', '(a * b) * c')
  optimize(t, 'a * (b / c)', '(a * b) / c')
})
