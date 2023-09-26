import test from 'ava'
import { getCircleEllipseIntersectionPoints } from '../src'

test('getCircleEllipseIntersectionPoints', (t) => {
  t.snapshot(getCircleEllipseIntersectionPoints({ x: 1412, y: 122, r: 70 }, { cx: 1404, cy: 119, rx: 104, ry: 49, angle: 30 }))
})