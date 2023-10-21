import test from 'ava'
import { angleInRange } from '../src'

test('angleInRange', (t) => {
  t.is(angleInRange(30, { startAngle: 20, endAngle: 40 }), true)
  t.is(angleInRange(50, { startAngle: 20, endAngle: 40 }), false)
  t.is(angleInRange(10, { startAngle: 20, endAngle: 40 }), false)

  t.is(angleInRange(30, { startAngle: 40, endAngle: 20, counterclockwise: true }), true)

  t.is(angleInRange(-140, { startAngle: 120, endAngle: 40 }), true)
  t.is(angleInRange(30, { startAngle: -140, endAngle: -60, counterclockwise: true }), true)
})