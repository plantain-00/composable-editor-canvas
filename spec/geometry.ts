import test from 'ava'
import { Arc, angleInRange, angleToRadian, deepEquals, getArcByStartEnd, getCirclePointAtRadian, getLargeArc } from '../src'

test('angleInRange', (t) => {
  t.is(angleInRange(30, { startAngle: 20, endAngle: 40 }), true)
  t.is(angleInRange(50, { startAngle: 20, endAngle: 40 }), false)
  t.is(angleInRange(10, { startAngle: 20, endAngle: 40 }), false)

  t.is(angleInRange(30, { startAngle: 40, endAngle: 20, counterclockwise: true }), true)

  t.is(angleInRange(-140, { startAngle: 120, endAngle: 40 }), true)
  t.is(angleInRange(30, { startAngle: -140, endAngle: -60, counterclockwise: true }), true)
})

test('getArcByStartEnd', (t) => {
  const testArc = (arc: Arc) => {
    const start = getCirclePointAtRadian(arc, angleToRadian(arc.startAngle))
    const end = getCirclePointAtRadian(arc, angleToRadian(arc.endAngle))
    const largeArc = getLargeArc(arc)
    t.true(deepEquals(getArcByStartEnd(start, arc.r, largeArc, !arc.counterclockwise, end), arc))
  }
  testArc({
    "x": 454.74183259025295,
    "y": -393.7805730922323,
    "r": 109.97370162635477,
    "startAngle": -63.43494882292201,
    "endAngle": 68.1985905136482,
    "counterclockwise": false,
  })
  testArc({
    "x": 454.74183259025295,
    "y": -393.7805730922323,
    "r": 109.97370162635477,
    "startAngle": -120,
    "endAngle": -60,
    "counterclockwise": false,
  })
})
