import test from 'ava'
import { Patch } from 'immer'
import { applyImmutablePatches, getTwoCircleIntersectionPoints } from '../src'

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

test('applyImmutablePatches', (t) => {
  function testPatches<T>(base: T, patches: Patch[]) {
    const result = applyImmutablePatches(base, patches)
    t.snapshot(result)
    t.deepEqual(applyImmutablePatches(base, result.patches), result)
    t.deepEqual(applyImmutablePatches(result.result, result.reversePatches).result, base)
  }

  testPatches(
    { biscuits: [{ name: "a" }, { name: "b" },] },
    [{ op: 'add', path: ['biscuits', '-'], value: { name: 'c' } }],
  )
  testPatches(
    { biscuits: [{ name: "a" }, { name: "b" },] },
    [
      { op: 'add', path: ['biscuits', '-'], value: { name: 'c' } },
      { op: 'add', path: ['biscuits', '-'], value: { name: 'd' } },
    ],
  )
  testPatches(
    { biscuits: [{ name: "a" }, { name: "b" },] },
    [{ op: 'replace', path: ['biscuits', 0], value: { name: "a1" } }],
  )
  testPatches(
    { biscuits: [{ name: "a" }, { name: "b" },] },
    [{ op: 'replace', path: ['biscuits', 0], value: undefined }],
  )
  testPatches(
    { biscuits: [{ name: "a" }, { name: "b" },] },
    [{ op: 'replace', path: ['biscuits', 0, 'name1'], value: 'c' }],
  )
  testPatches(
    { biscuits: [{ name: "a" }, { name: "b" },] },
    [{ op: 'replace', path: ['biscuits', 0, 'name'], value: 'a1' }],
  )
  testPatches(
    { biscuits: [{ name: "a" }, { name: "b" },] },
    [{ op: 'replace', path: ['biscuits', 0, 'name'], value: undefined }],
  )
})
