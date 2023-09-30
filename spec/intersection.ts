import test from 'ava'
import { getCircleEllipseIntersectionPoints, getTwoEllipseIntersectionPoints } from '../src'

test('getCircleEllipseIntersectionPoints', (t) => {
  t.snapshot(getCircleEllipseIntersectionPoints({ x: 1412, y: 122, r: 70 }, { cx: 1404, cy: 119, rx: 104, ry: 49, angle: 30 }))
})

test('getTwoEllipseIntersectionPoints', (t) => {
  t.snapshot(getTwoEllipseIntersectionPoints({ cx: 1417, cy: 128, rx: 115, ry: 40, angle: 128 }, { cx: 1404, cy: 119, rx: 104, ry: 49, angle: 30 }))
})