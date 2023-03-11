import test, { ExecutionContext } from 'ava'
import { parseExpression, tokenizeExpression } from 'expression-engine'
import { iterateItemOrArray, printEquation, solveEquation } from '../src'

function solve(t: ExecutionContext<unknown>, e1: string, e2: string | string[], variable: string) {
  const e = e1.split('=')
  t.deepEqual(
    solveEquation({
      left: parseExpression(tokenizeExpression(e[0])),
      right: parseExpression(tokenizeExpression(e[1])),
    }, variable).map(m => printEquation(m, { keepBinaryExpressionOrder: true })),
    Array.from(iterateItemOrArray(e2)),
  )
}

test('a = x', (t) => {
  solve(t, 'a = x', 'x = a', 'x')
})

test('1 - x = 2 * x', (t) => {
  solve(t, '1 - x = 2 * x', 'x = 0.3333333333333333', 'x')
  solve(t, '1 + x = 2 * x', 'x = 1', 'x')
})

test('x = (x + 1) / a', (t) => {
  solve(t, 'x = (x + 1) / a', 'x = 1 / (a + -1)', 'x')
  solve(t, '2 * x = x - a', 'x = -a', 'x')
  solve(t, '2 * x = x + a', 'x = a', 'x')
  solve(t, 'x + 1 = 2 * x', 'x = 1', 'x')
})

test('2 * x = 3 + x', (t) => {
  solve(t, '2 * x = 3 + x', 'x = 3', 'x')
  solve(t, '2 * x = 3 - x', 'x = 1', 'x')
  solve(t, '2 * x = 3 / x', ['x = 1.224744871391589', 'x = -1.224744871391589'], 'x')
})

test('1 + 2 * x = x', (t) => {
  solve(t, '1 + 2 * x = x', 'x = -1', 'x')
  solve(t, '1 - 2 * x = x', 'x = 0.3333333333333333', 'x')
  solve(t, '1 / (2 * x) = x', ['x = 0.7071067811865476', 'x = -0.7071067811865476'], 'x')
})

test('x + a = b', (t) => {
  solve(t, 'x + a = b', 'x = b - a', 'x')
  solve(t, 'x - a = b', 'x = a + b', 'x')
  solve(t, 'x * a = b', 'x = b / a', 'x')
  solve(t, 'x / a = b', 'x = a * b', 'x')
  solve(t, 'x ** a = b', 'x = b ** (1 / a)', 'x')
  solve(t, 'x ** 2 = 9', ['x = 3', 'x = -3'], 'x')
  solve(t, '8 * I9 + 72 = 0', 'I9 = -9', 'I9')

  solve(t, 'a - x = b', 'x = a - b', 'x')
  solve(t, 'a / x = b', 'x = a / b', 'x')
  solve(t, 'a + x = b', 'x = b - a', 'x')
  solve(t, 'a * x = b', 'x = b / a', 'x')
})

test('-x = a', (t) => {
  solve(t, '-x = a', 'x = -a', 'x')
})

test('1 - x = x', (t) => {
  solve(t, '1 - x = x', 'x = 0.5', 'x')
})

test('1 + x = -x', (t) => {
  solve(t, '1 + x = -x', 'x = -0.5', 'x')
})

test('(x + 1) / x = 0', (t) => {
  solve(t, '(x + 1) / x = 0', 'x = -1', 'x')
})

test('(x + 1) * x = 0', (t) => {
  solve(t, '(x + 1) * x = 0', ['x = -1', 'x = 0'], 'x')
})

test('x * x + x = 6', (t) => {
  solve(t, 'x * x + x = 6', ['x = 2', 'x = -3'], 'x')
  solve(t, '2 * x * x = 18', ['x = 3', 'x = -3'], 'x')
  solve(t, 'a * x * x + b * x = c', ['x = (-b + (b ** 2 + (4 * a) * c) ** 0.5) / (2 * a)', 'x = (-b - (b ** 2 + (4 * a) * c) ** 0.5) / (2 * a)'], 'x')
  solve(t, 'a * x * x + b * x - d * x = c', ['x = ((-b + d) + (((b ** 2 + -((2 * b) * d)) + -d ** 2) + (4 * a) * c) ** 0.5) / (2 * a)', 'x = ((-b + d) - (((b ** 2 + -((2 * b) * d)) + -d ** 2) + (4 * a) * c) ** 0.5) / (2 * a)'], 'x')
})

test('a * x + -(b * x) = c', (t) => {
  solve(t, 'a * x + -(b * x) = c', 'x = c / (a + -b)', 'x')
})
