import test from 'ava'
import { toQuadraticCurves, toBezierCurves, equals, interpolate3, interpolate4, interpolateNurbs, interpolateNurbs2, Vec2 } from '../src'

test('interpolateNurbs2', (t) => {
  const tvalues = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  const points: Vec2[] = [
    [-1.0, 0.0],
    [-0.5, 0.5],
    [0.5, -0.5],
    [1.0, 0.0]
  ]
  t.snapshot(tvalues.map(t => interpolateNurbs2(t, 2, points, [0, 1, 2, 3, 4, 5, 6])))
  t.snapshot(tvalues.map(t => interpolateNurbs2(t, 2, points)))
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
  const points2: Vec2[] = [
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

test('toBezierCurves', (t) => {
  const interpolate = (t: number, x: number[]) => {
    const a = t * (x.length - 3)
    const b = Math.floor(a)
    const { from, cp1, cp2, to } = toBezierCurves(x, b + 1)
    return interpolate4(
      from,
      cp1,
      cp2,
      to,
      a - b,
    )
  }
  const count = 32
  let p = [1, 2, 3, 4]
  for (let i = 0; i < count; i++) {
    t.true(equals(interpolate(i / count, p), interpolateNurbs(i / count, 3, p)))
  }

  p = [1, 2, 3, 4, 5]
  for (let i = 0; i < count; i++) {
    t.true(equals(interpolate(i / count, p), interpolateNurbs(i / count, 3, p)))
  }

  p = [1, 2, 3, 4, 5, 6]
  for (let i = 0; i < count; i++) {
    t.true(equals(interpolate(i / count, p), interpolateNurbs(i / count, 3, p)))
  }

  p = [1, 2, 3, 4, 5, 7]
  for (let i = 0; i < count; i++) {
    t.true(equals(interpolate(i / count, p), interpolateNurbs(i / count, 3, p)))
  }
})

test('toQuadraticCurves', (t) => {
  const interpolate = (t: number, x: number[]) => {
    const a = t * (x.length - 2)
    const b = Math.floor(a)
    const { from, cp, to } = toQuadraticCurves(x, b + 1)
    return interpolate3(
      from,
      cp,
      to,
      a - b,
    )
  }
  const count = 32
  let p = [1, 2, 3]
  for (let i = 0; i < count; i++) {
    t.true(equals(interpolate(i / count, p), interpolateNurbs(i / count, 2, p)))
  }

  p = [1, 2, 3, 4]
  for (let i = 0; i < count; i++) {
    t.true(equals(interpolate(i / count, p), interpolateNurbs(i / count, 2, p)))
  }

  p = [1, 2, 3, 4, 5]
  for (let i = 0; i < count; i++) {
    t.true(equals(interpolate(i / count, p), interpolateNurbs(i / count, 2, p)))
  }

  p = [1, 2, 3, 4, 5, 6]
  for (let i = 0; i < count; i++) {
    t.true(equals(interpolate(i / count, p), interpolateNurbs(i / count, 2, p)))
  }
})