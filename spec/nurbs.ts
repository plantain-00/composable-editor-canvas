import test from 'ava'
import { interpolateNurbs2 } from '../src'

test('interpolateNurbs2', (t) => {
  const tvalues = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  const points = [
    [-1.0, 0.0],
    [-0.5, 0.5],
    [0.5, -0.5],
    [1.0, 0.0]
  ]
  t.snapshot(tvalues.map(t => interpolateNurbs2(t, 2, points)))
  t.snapshot(tvalues.map(t => interpolateNurbs2(t, 2, points, [0, 0, 0, 1, 2, 2, 2])))
  t.snapshot(tvalues.map(t => interpolateNurbs2(t, 2, [
    [-1.0, 0.0],
    [-0.5, 0.5],
    [0.5, -0.5],
    [1.0, 0.0],
    [-1.0, 0.0],
    [-0.5, 0.5],
    [0.5, -0.5]
  ], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])))
  const w = Math.pow(0.5, 0.5)
  const points2 = [
    [0.0, -0.5],
    [-0.5, -0.5],
    [-0.5, 0.0],
    [-0.5, 0.5],
    [0.0, 0.5],
    [0.5, 0.5],
    [0.5, 0.0],
    [0.5, -0.5],
    [0.0, -0.5]
  ]
  const knots = [0, 0, 0, 1 / 4, 1 / 4, 1 / 2, 1 / 2, 3 / 4, 3 / 4, 1, 1, 1]
  t.snapshot(tvalues.map(t => interpolateNurbs2(t, 2, points2, knots, [1, w, 1, w, 1, w, 1, w, 1])))
  const boosted = 4 * w
  t.snapshot(tvalues.map(t => interpolateNurbs2(t, 2, points2, knots, [1, boosted, 1, boosted, 1, boosted, 1, boosted, 1])))
})