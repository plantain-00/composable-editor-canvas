import test from 'ava'
import { rombergIntegral } from '../src'

test('rombergIntegral', (t) => {
  t.snapshot(rombergIntegral(0.8478111820247928, 2.90107925830033, t => Math.sqrt(10000 * Math.sin(t) ** 2 + 22500 * Math.cos(t) ** 2)))
})