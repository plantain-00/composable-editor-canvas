import test from 'ava'

import { QuadraticCurve, deepEquals, getQuadraticCurvePercentAtPoint, getQuadraticCurvePointAtPercent } from '../src'

test('getQuadraticCurvePercentAtPoint', t => {
  const curve1: QuadraticCurve = { from: { x: 0, y: 0 }, cp: { x: 0, y: 0 }, to: { x: 100, y: 100 } }
  for (const p of [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 100 }, { x: 200, y: 200 }]) {
    const param = getQuadraticCurvePercentAtPoint(curve1, p)
    t.true(!isNaN(param))
    t.true(deepEquals(getQuadraticCurvePointAtPercent(curve1.from, curve1.cp, curve1.to, param), p))
  }

  const curve2: QuadraticCurve = { from: { x: 0, y: 0 }, cp: { x: 100, y: 100 }, to: { x: 100, y: 100 } }
  for (const p of [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 100 }, { x: -100, y: -100 }]) {
    const param = getQuadraticCurvePercentAtPoint(curve2, p)
    t.true(!isNaN(param))
    t.true(deepEquals(getQuadraticCurvePointAtPercent(curve2.from, curve2.cp, curve2.to, param), p))
  }
})