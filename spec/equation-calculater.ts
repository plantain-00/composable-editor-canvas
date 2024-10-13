import test from 'ava'
import { calculateEquation2, calculateEquation3, calculateEquation4, calculateEquation5, isSameNumber, isZero } from '../src'

test('calculate2', (t) => {
  function calculate(b: number, c: number) {
    const sx = calculateEquation2(1, b, c)
    for (const x of sx) {
      t.true(isZero(x ** 2 + b * x + c))
    }
  }
  calculate(5, 6)
})

test('calculate3', (t) => {
  function calculate(b: number, c: number, d: number) {
    const sx = calculateEquation3(1, b, c, d)
    for (const x of sx) {
      t.true(isZero(x ** 3 + b * x ** 2 + c * x + d))
    }
  }
  calculate(5, 6, -40)
})

test('calculate4', (t) => {
  function calculate(b: number, c: number, d: number, x0: number) {
    const e = -(x0 ** 4 + b * x0 ** 3 + c * x0 ** 2 + d * x0)
    const sx = calculateEquation4(1, b, c, d, e)
    t.true(sx.some(x => isSameNumber(x, x0)))
    for (const x of sx) {
      t.true(isZero(x ** 4 + b * x ** 3 + c * x ** 2 + d * x + e, 0.000001))
    }
  }
  calculate(2, 3, 4, 5)
  calculate(-91.9109137181446, -3883.2794987528127, 338909.5212583375, 1382.1028009808458 - 1404)
})

test('calculate5', (t) => {
  t.snapshot(calculateEquation5([7.071056120832166, -23.262358240508846, 30.960350917062048, -14.07113243539834, -2.7073208816199905, 4.197849310408487, -0.044600854567165005], 0.5))
  t.snapshot(calculateEquation5([7.0567150091369735, -24.17843958459045, 33.346089135242096, -16.62301668732119, -1.938654426185055, 4.3413557871976245, -0.08361877325786682], 0.5))
  t.snapshot(calculateEquation5([7.0567150091369735, -24.17843958459045, 33.346089135242096, -16.62301668732119, -1.938654426185055, 4.3413557871976245, -0.08361877325786682], 0.5))
  t.snapshot(calculateEquation5([
    -256,
    309245738943797250,
    -2796961916512181000,
    3852618702975520300,
    -3578194970889746400,
    3011949553537483000,
    -1483969868984700400,
    327048673477533400
  ], 0.5))
})