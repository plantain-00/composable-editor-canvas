import test, { ExecutionContext } from 'ava'
import { Expression2 as Expression, parseExpression, printExpression, tokenizeExpression } from 'expression-engine'
import { expressionHasVariable, optimizeExpression } from '../src'

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

test('a * -1', (t) => {
  optimize(t, 'a * -1', '-a')
  optimize(t, 'a / -1', '-a')
})

test('-1 * a', (t) => {
  optimize(t, '-1 * a', '-a')
})

test('a + a', (t) => {
  optimize(t, 'a + a', '2 * a')
  optimize(t, 'a - a', '0')
  optimize(t, 'a * a', 'a ** 2')
  optimize(t, 'a / a', '1')
})

test('-a + a', (t) => {
  optimize(t, '-a + a', '0')
  optimize(t, '-a - a', '-2 * a')
  optimize(t, '-a / a', '-1')
})

test('a - 2', (t) => {
  optimize(t, 'a - 2', 'a + -2')
})

test('a / 2', (t) => {
  optimize(t, 'a / 2', '0.5 * a')
  optimize(t, '6 * a / 2', '3 * a')
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
  optimize(t, '(a * 2) * 3', '6 * a')
  optimize(t, '(a + 2) + 3', 'a + 5')
  optimize(t, '(1 + 2 * a) + a', '1 + 3 * a')
  optimize(t, '(1 + a) + a', '1 + 2 * a')
  optimize(t, '(1 - a) - a', '1 + -2 * a')
  optimize(t, '(1 + 3 * a) - a', '1 + 2 * a')
  optimize(t, '(1 + 2 * a) + 3 * a', '1 + 5 * a')
  optimize(t, '(1 - a) + 5 * a', '1 + 4 * a')
  optimize(t, '(a + 1) + 2', 'a + 3')
  optimize(t, '(a - 1) + 2', 'a + 1')
  optimize(t, '(a + 1) - 2', 'a + -1')
  optimize(t, '(a - 1) - 2', 'a + -3')

  optimize(t, '(a + 1) + b', '(a + b) + 1')
  optimize(t, '(a + 1) - b', '(a - b) + 1')
  optimize(t, '(a - 1) + b', '(a + b) + -1')
  optimize(t, '(a - 1) - b', '(a - b) + -1')

  optimize(t, '(3 * x + a) + x', '4 * x + a', 'x')
  optimize(t, '(3 * x + a) - x', '2 * x + a', 'x')
  optimize(t, '(3 * x - a) + x', '4 * x - a', 'x')
  optimize(t, '(3 * x - a) - x', '2 * x - a', 'x')

  optimize(t, '(a - b * x) - c * x', '(-(b * x) - c * x) + a', 'x')
  optimize(t, '(a - b * x) + c * x', '(-(b * x) + c * x) + a', 'x')

  optimize(t, '(a * c) * b', '(a * b) * c')
  optimize(t, '(a / c) * b', '(a * b) / c')
  optimize(t, '(a / b) * c', '(a * c) / b')
  optimize(t, '(a / c) / b', '(a / b) / c')

  optimize(t, '(a + c) + b', '(a + b) + c')
  optimize(t, '(a - c) + b', '(a + b) - c')
  optimize(t, '(a + c) - b', '(a - b) + c')
  optimize(t, '(a - c) - b', '(a - b) - c')
})

test('a + (b + c)', (t) => {
  optimize(t, 'a + (b + c)', '(a + b) + c')
  optimize(t, 'a + (b - c)', '(a + b) - c')
  optimize(t, 'a - (b + c)', '(a - b) - c')
  optimize(t, 'a - (b - c)', '(a - b) + c')
  optimize(t, 'a * (b * c)', '(a * b) * c')
  optimize(t, 'a * (b / c)', '(a * b) / c')
})

test('b + a', (t) => {
  optimize(t, 'b + a', 'a + b')
  optimize(t, 'b * a', 'a * b')
})

test('x * a', (t) => {
  optimize(t, 'x * a', 'a * x', 'x')
})

test('a + x', (t) => {
  optimize(t, 'a + x', 'x + a', 'x')
})

test('a * -b', (t) => {
  optimize(t, 'a * -b', '-(a * b)')
  optimize(t, 'a / -b', '-(a / b)')
})

test('(-a) * b', (t) => {
  optimize(t, '(-a) * b', '-(a * b)')
  optimize(t, '(-a) / b', '-(a / b)')
})

test('a + b / c', (t) => {
  optimize(t, 'a + b / c', '(a * c + b) / c')
  optimize(t, 'a - b / c', '(a * c - b) / c')
  optimize(t, 'a / b + c', '(a + b * c) / b')
  optimize(t, 'a / b - c', '(a - b * c) / b')
})

test('2 * (b + c)', (t) => {
  optimize(t, '(a + b) * c', 'a * c + b * c')
  optimize(t, '(a - b) * c', 'a * c - b * c')
  optimize(t, 'a * (b + c)', 'a * b + a * c')
  optimize(t, 'a * (b - c)', 'a * b - a * c')
})

test('a * x + b * x', (t) => {
  optimize(t, 'a * x + b * x', '(a + b) * x', 'x')
  optimize(t, 'a * x - b * x', '(a - b) * x', 'x')
  optimize(t, 'a * x + x', '(a + 1) * x', 'x')
  optimize(t, 'a * x - x', '(a + -1) * x', 'x')
  optimize(t, 'x + a * x', '(1 + a) * x', 'x')
  optimize(t, 'x - a * x', '(1 - a) * x', 'x')
  optimize(t, '-x + a * x', '(-1 + a) * x', 'x')
  optimize(t, '-x - a * x', '(-1 - a) * x', 'x')
})

test('-(1)', (t) => {
  optimize(t, '-(1)', '-1')
})

test('-(-a)', (t) => {
  optimize(t, '-(-a)', 'a')
})

test('-(a + b)', (t) => {
  optimize(t, '-(a + b)', '-a - b')
  optimize(t, '-(a - b)', '-a + b')
})

test('-(2 * a)', (t) => {
  optimize(t, '-(2 * a)', '-2 * a')
  optimize(t, '-(2 / a)', '-2 / a')
  optimize(t, '-(a * 2)', 'a * -2')
  optimize(t, '-(a / 2)', '-0.5 * a')
})

test('(a * b + a * c) / (b + c)', (t) => {
  optimize(t, '(a * b + a * c) / (b + c)', 'a')
  optimize(t, '(x ** 2 + 3 * x + 2) / (x + 1)', 'x + 2')
  optimize(t, '(x ** 2 - 1) / (x - 1)', 'x + 1')
  optimize(t, '((b * a ** 2 + 3 * a ** 2) ** 0.5) / a', '(b + 3) ** 0.5')
})

test('((a * b + a * c) / b) / (b + c)', (t) => {
  optimize(t, '((a * b + a * c) / b) / (b + c)', 'a / b')
})

test('((a + 2 * b) + 2 * a) + 3 * b', (t) => {
  optimize(t, '((a + 2 * b) + 2 * a) + 3 * b', '3 * a + 5 * b')
  optimize(t, '((a + 2 * b) + 2 * a) - b', '3 * a + b')
  optimize(t, '((a + 2 * b) + 2 * a) + -b', '3 * a + b')
})

test('(x / a) ** b', (t) => {
  optimize(t, '(x / a) ** b', 'x ** b / a ** b', 'x')
  optimize(t, '(x * a) ** b', 'a ** b * x ** b', 'x')
  optimize(t, '(a * x) ** b', 'a ** b * x ** b', 'x')
})

test('(a + b) ** 2', (t) => {
  optimize(t, '(a + b) ** 2', '(a ** 2 + (2 * a) * b) + b ** 2')
  optimize(t, '(a - b) ** 2', '(a ** 2 - (2 * a) * b) + b ** 2')
})

test('(b * a ** 2 + 3 * a ** 2) ** 0.5', (t) => {
  optimize(t, '(b * a ** 2 + 3 * a ** 2) ** 0.5', 'a * (b + 3) ** 0.5')
  optimize(t, '(4 * a ** 2 * r * a ** 2 + -4 * a ** 2 * c ** 2 + 4 * b * a ** 2 * b * r) ** 0.5', '(2 * a) * ((b ** 2 * r + -(c ** 2)) + r * a ** 2) ** 0.5')
})

test('1 / (2 * a + 2 * b)', (t) => {
  optimize(t, '1 / (2 * a + 2 * b)', '0.5 / (a + b)')
})
