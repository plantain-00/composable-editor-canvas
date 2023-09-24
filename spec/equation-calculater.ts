import test from 'ava'
import { calculateEquation2, calculateEquation4, isZero } from '../src'

test('calculate2', (t) => {
  function calculate(b: number, c: number) {
    const sx = calculateEquation2(b, c)
    for (const x of sx) {
      t.true(isZero(x ** 2 + b * x + c))
    }
  }
  calculate(5, 6)
})

test('calculate4', (t) => {
  function calculate(b: number, c: number, d: number, x0: number) {
    const e = -(x0 ** 4 + b * x0 ** 3 + c * x0 ** 2 + d * x0)
    const sx = calculateEquation4(b, c, d, e)
    t.true(sx.some(x => isZero(x - x0)))
    for (const x of sx) {
      t.true(isZero(x ** 4 + b * x ** 3 + c * x ** 2 + d * x + e, 0.000001))
    }
  }
  calculate(2, 3, 4, 5)
  calculate(-91.9109137181446, -3883.2794987528127, 338909.5212583375, 1382.1028009808458 - 1404)
})