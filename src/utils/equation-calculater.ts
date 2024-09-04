import { delta2, isSameNumber, isZero, largerThan, lessThan, sqrt3 } from "./math"
import { Matrix2, m2, matrix, v2, vector } from "./matrix"
import { Vec2 } from "./types"

/**
 * a x + b = 0
 */
export function calculateEquation1(a: number, b: number, delta?: number) {
  if (isZero(a, delta)) {
    return []
  }
  return [-b / a]
}

/**
 * a x^2 + b x + c = 0
 */
export function calculateEquation2(a: number, b: number, c: number, delta?: number) {
  if (isZero(a, delta)) {
    return calculateEquation1(b, c, delta)
  }
  if (isZero(c, delta)) {
    const remains = calculateEquation1(a, b, delta)
    if (remains.some(r => isZero(r, delta))) {
      return remains
    }
    return [0, ...remains]
  }
  if (a !== 1) {
    b /= a
    c /= a
  }
  const f = b ** 2 - 4 * c
  if (lessThan(f, 0, delta)) {
    return []
  }
  if (isZero(f, delta)) {
    return [-b / 2]
  }
  const h = Math.sqrt(f)
  return [
    (-b + h) / 2,
    (-b - h) / 2
  ]
}

/**
 * a x^3 + b x^2 + c x + d = 0
 */
export function calculateEquation3(a: number, b: number, c: number, d: number, delta?: number) {
  if (isZero(a, delta)) {
    return calculateEquation2(b, c, d, delta)
  }
  if (isZero(d, delta)) {
    const remains = calculateEquation2(a, b, c, delta)
    if (remains.some(r => isZero(r, delta))) {
      return remains
    }
    return [0, ...remains]
  }
  if (a !== 1) {
    b /= a
    c /= a
    d /= a
  }
  const A = b * b - 3 * c
  const B = b * c - 9 * d
  const C = c * c - 3 * b * d
  if (isZero(A, delta) && isZero(B, delta)) {
    return [-b / 3]
  }
  const f = B * B - 4 * A * C
  if (isZero(f, delta)) {
    const K = B / A
    return [
      -b + K,
      -K / 2,
    ]
  }
  const t = A * b
  if (f > 0) {
    const s = Math.sqrt(f)
    const Y1 = t + 1.5 * (-B + s)
    const Y2 = t + 1.5 * (-B - s)
    return [(-b - sqrt3(Y1) - sqrt3(Y2)) / 3]
  }
  const p = Math.sqrt(A)
  const T = (t - 1.5 * B) / A / p
  const radian = Math.acos(T) / 3
  const m = Math.cos(radian)
  const q = Math.sqrt(3) * Math.sin(radian)
  return [
    (-b - 2 * p * m) / 3,
    (-b + p * (m + q)) / 3,
    (-b + p * (m - q)) / 3,
  ]
}

/**
 * a x^4 + b x^3 + c x^2 + d x + e = 0
 */
export function calculateEquation4(a: number, b: number, c: number, d: number, e: number, delta?: number) {
  if (isZero(a, delta)) {
    return calculateEquation3(b, c, d, e, delta)
  }
  if (isZero(e, delta)) {
    const remains = calculateEquation3(a, b, c, d, delta)
    if (remains.some(r => isZero(r, delta))) {
      return remains
    }
    return [0, ...remains]
  }
  if (a !== 1) {
    b /= a
    c /= a
    d /= a
    e /= a
  }
  const b2 = b ** 2
  const b3 = b2 * b
  const D = 3 * b2 - 8 * c
  const E = -b3 + 4 * c * b - 8 * d
  const F = 3 * b3 * b + 16 * c ** 2 - 16 * c * b2 + 16 * b * d - 64 * e
  if (isZero(E, delta) && isZero(F, delta)) {
    if (isZero(D, delta)) {
      return [-b / 4]
    }
    if (D < 0) {
      return []
    }
    const h = Math.sqrt(D)
    return [
      (-b + h) / 4,
      (-b - h) / 4,
    ]
  }
  const E2 = E ** 2
  const D2 = D ** 2
  const A = D2 - 3 * F
  const B = D * F - 9 * E2
  const C = F ** 2 - 3 * D * E2
  if (isZero(A, delta) && isZero(B, delta) && isZero(C, delta)) {
    const h = b * D
    const g2 = 4 * D
    return [
      (-h + 9 * E) / g2,
      (-h - 3 * E) / g2,
    ]
  }
  const f = B ** 2 - 4 * A * C
  if (isZero(f, delta)) {
    const h = 2 * A * E / B
    const j = -(b + h) / 4
    if (Math.sign(B) !== Math.sign(A)) {
      return [j]
    }
    const i = Math.sqrt(2 * B / A)
    const k = -b + h
    return [
      (k + i) / 4,
      (k - i) / 4,
      j,
    ]
  } else if (f > 0) {
    const h = Math.sqrt(f)
    const i = A * D
    const z1 = i - 1.5 * (B - h)
    const z2 = i - 1.5 * (B + h)
    const j = sqrt3(z1) + sqrt3(z2)
    const z = D2 - D * j + j ** 2 - 3 * A
    const k = -b + Math.sign(E) * Math.sqrt((D + j) / 3)
    const m = Math.sqrt((2 * D - j + 2 * Math.sqrt(z)) / 3)
    return [
      (k + m) / 4,
      (k - m) / 4,
    ]
  } else {
    if (largerThan(D, 0, delta) && largerThan(F, 0, delta)) {
      if (isZero(E, delta)) {
        const h = 2 * Math.sqrt(F)
        const i = Math.sqrt(D + h)
        const j = Math.sqrt(D - h)
        return [
          (-b + i) / 4,
          (-b - i) / 4,
          (-b + j) / 4,
          (-b - j) / 4,
        ]
      }
      const j = Math.sqrt(A)
      const s = Math.acos((3 * B - 2 * A * D) / 2 / A / j)
      const h = Math.cos(s / 3)
      const y1 = Math.sign(E) * Math.sqrt((D - 2 * j * h) / 3)
      const i = Math.sqrt(3) * Math.sin(s / 3)
      const y2 = Math.sqrt((D + j * (h + i)) / 3)
      const y3 = Math.sqrt((D + j * (h - i)) / 3)
      const k1 = y2 + y3
      const k2 = y2 - y3
      return [
        (-b + y1 + k1) / 4,
        (-b + y1 - k1) / 4,
        (-b - y1 + k2) / 4,
        (-b - y1 - k2) / 4,
      ]
    }
    return []
  }
}

/**
 * p[0] x^5 + p[1] x^4 + p[2] x^3 + p[3] x^2 + p[4] x + p[5] = 0
 * p[0] x^6 + p[1] x^5 + p[2] x^4 + p[3] x^3 + p[4] x^2 + p[5] x + p[6] = 0
 */
export function calculateEquation5(params: number[], x0: number, delta = delta2, maxIteratorCount?: number): number[] {
  if (params.length <= 5) {
    return calculateEquation4(params[params.length - 5] || 0, params[params.length - 4] || 0, params[params.length - 3] || 0, params[params.length - 2] || 0, params[params.length - 1] || 0, delta)
  }
  if (Math.abs(params[0]) > 1 / delta) {
    params = params.map(p => p / params[0])
  }
  if (isZero(params[0], delta)) {
    return calculateEquation5(params.slice(1), x0, delta, maxIteratorCount)
  }
  if (isZero(params[params.length - 1], delta)) {
    const remains = calculateEquation5(params.slice(0, params.length - 1), delta)
    if (remains.some(r => isZero(r, delta))) {
      return remains
    }
    return [0, ...remains]
  }
  const f1 = (x: number) => {
    let result = 0
    for (const p of params) {
      result = result * x + p
    }
    return result
  }
  const f2 = (x: number) => {
    let result = 0
    for (let i = 0; i < params.length - 1; i++) {
      result = result * x + params[i] * (params.length - 1 - i)
    }
    return result
  }
  const x = newtonIterate(x0, f1, f2, delta, maxIteratorCount)
  if (x === undefined) return []
  const newParams: number[] = []
  for (let i = 0; i < params.length - 1; i++) {
    if (i === 0) {
      newParams.push(params[i])
    } else {
      newParams.push(params[i] + newParams[i - 1] * x)
    }
  }
  const remains = calculateEquation5(newParams, x0, delta, maxIteratorCount)
  if (remains.some(r => isSameNumber(r, x, delta))) {
    return remains
  }
  return [x, ...remains]
}

export function newtonIterate(
  x0: number,
  f1: (x: number) => number,
  f2: (x: number) => number,
  delta: number,
  maxIteratorCount = 100,
) {
  let x = x0
  let count = 0
  for (; ;) {
    const g = f1(x)
    if (isNaN(g)) break
    if (Math.abs(g) < delta) break
    if (count > maxIteratorCount) {
      return
    }
    const m = f2(x)
    if (isZero(m)) return
    x = x - g / m
    count++
  }
  return x
}

export function newtonIterate2(
  x0: Vec2,
  f1: (x: Vec2) => Vec2,
  f2: (x: Vec2) => Matrix2,
  delta: number,
  maxIteratorCount = 100,
) {
  let x = x0
  let count = 0
  for (; ;) {
    const g = f1(x)
    if (g.every(d => Math.abs(d) < delta)) break
    if (count > maxIteratorCount) {
      return
    }
    const m = m2.inverse(f2(x))
    if (!m) return
    x = v2.substract(x, m2.multiplyVec2(m, g))
    count++
  }
  return x
}

export function newtonIterates(
  x0: number[],
  f1: (x: number[]) => number[],
  f2: (x: number[]) => number[][],
  delta: number,
  maxIteratorCount = 100,
) {
  let x = x0
  let count = 0
  for (; ;) {
    const g = f1(x)
    if (g.every(d => Math.abs(d) < delta)) break
    if (count > maxIteratorCount) {
      return
    }
    const m = matrix.inverse(f2(x))
    if (!m) return
    x = vector.substract(x, matrix.multiplyVec(m, g))
    count++
  }
  return x
}

export function equationParamsToExpression(params: number[], variableName = 'x'): string {
  let result = ''
  for (let i = 0; i < params.length; i++) {
    if (params[i] === 0) continue
    if (i !== 0) {
      result += ' + '
    }
    result += params[i]
    const power = params.length - i - 1
    if (power === 1) {
      result += ' ' + variableName
    } else if (power > 1) {
      result += ' ' + variableName + '^' + power
    }
  }
  return result
}

/**
 * a[1,1] x1 + a[1,2] x2 + ... + a[1,n] xn + a[1,n+1] = 0
 * ...
 * a[n,1] x1 + a[n,2] x2 + ... + a[n,n] xn + a[n,n+1] = 0
 */
export function calculateEquationSet(params: number[][], delta?: number): number[] | undefined {
  if (params.length === 0) return
  if (params.length === 1) {
    const param = params[0]
    return calculateEquation1(param[0], param[1], delta)
  }
  params = params.map(param => ({
    param,
    count: param.reduce((p, c, i) => p + (i < params.length && isZero(c, delta) ? 1 : 0), 0),
  })).sort((a, b) => b.count - a.count).map(p => p.param)
  const index = params[0].findIndex(p => !isZero(p, delta))
  if (index < 0) return
  const b0 = params[0][index]
  const b = [...params[0].slice(0, index), ...params[0].slice(index + 1)]
  // F1: b0 x1 + b[1] x2 + ... + b[n - 1] xn + b[n] = 0
  const newParams: number[][] = []
  for (let i = 0; i < params.length; i++) {
    if (i > 0) {
      const c0 = params[i][index]
      const c = [...params[i].slice(0, index), ...params[i].slice(index + 1)]
      // F2: c0 x1 + c[1] x2 + ... + c[2] xn + c[n] = 0
      if (isZero(c0, delta)) {
        newParams.push(c)
      } else {
        // F1*c0-F2*b0: (b[1] c - c[1] b) x2 + ... + (b[n-1] c - c[n-1] b) xn + (b[n] c - c[n] b) = 0
        newParams.push(c.map((p, j) => b[j] * c0 - p * b0))
      }
    }
  }
  const newResult = calculateEquationSet(newParams, delta)
  if (!newResult) return
  // x1 = -(b[1] x2 + ... + b[n - 1] xn + b[n])/b0
  return [
    ...newResult.slice(0, index),
    -b.reduce((p, c, i) => p + c * (newResult[i] || 1), 0) / b0,
    ...newResult.slice(index),
  ]
}
