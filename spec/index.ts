import test from 'ava'
import { getTwoCircleIntersectionPoints } from '../src'

test('getTwoCircleIntersectionPoints', (t) => {
  t.deepEqual(
    getTwoCircleIntersectionPoints(
      { x: 399.0390930374209, y: 232.63014688432042, r: 43.362423040922884 },
      { x: 349.88754218653895, y: 178.1675894398844, r: 30 }
    ),
    [{ x: 369.9870217893859, y: 200.43889204423914 }],
  )
  t.deepEqual(
    getTwoCircleIntersectionPoints(
      { x: 312.8428238206585, y: 219.36965673196238, r: 25.406872389156927 },
      { x: 349.88754218653895, y: 178.1675894398844, r: 30 }
    ),
    [{ x: 329.8297135624872, y: 200.47641080920312 }],
  )
})
