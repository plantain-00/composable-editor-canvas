import { isZero, largerThan, sqrt3 } from "./geometry"

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
 * a * x^2 + b x + c = 0
 */
export function calculateEquation2(a: number, b: number, c: number, delta?: number) {
  if (isZero(a, delta)) {
    return calculateEquation1(b, c, delta)
  }
  if (a !== 1) {
    b /= a
    c /= a
  }
  const f = b ** 2 - 4 * c
  if (f < 0 && !isZero(f, delta)) {
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
 * a * x^3 + b x^2 + c x + d = 0
 */
export function calculateEquation3(a: number, b: number, c: number, d: number, delta?: number) {
  if (isZero(a, delta)) {
    return calculateEquation2(b, c, d, delta)
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
 * a * x^4 + b x^3 + c x^2 + d x + e = 0
 */
export function calculateEquation4(a: number, b: number, c: number, d: number, e: number, delta?: number) {
  if (isZero(a, delta)) {
    return calculateEquation3(b, c, d, e, delta)
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
 * p[0] * x^5 + p[1] x^4 + p[2] x^3 + p[3] x^2 + p[4] x + p[5] = 0
 * p[0] * x^6 + p[1] x^5 + p[2] x^4 + p[3] x^3 + p[4] x^2 + p[5] x + p[6] = 0
 */
export function calculateEquation5(params: number[], x0: number, validate?: (v: number) => boolean, delta = 1e-5): number[] {
  if (params.length <= 5) {
    return calculateEquation4(params[params.length - 5] || 0, params[params.length - 4] || 0, params[params.length - 3] || 0, params[params.length - 2] || 0, params[params.length - 1] || 0, delta)
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
  let x = x0
  for (; ;) {
    const g = f1(x)
    if (Math.abs(g) < delta) break
    if (validate && !validate(x)) return []
    x = x - g / f2(x)
  }
  const newParams: number[] = []
  for (let i = 0; i < params.length - 1; i++) {
    if (i === 0) {
      newParams.push(params[i])
    } else {
      newParams.push(params[i] + newParams[i - 1] * x)
    }
  }
  const remains = calculateEquation5(newParams, x0, validate, delta)
  if (remains.some(r => isZero(r - x, delta))) {
    return remains
  }
  return [x, ...remains]
}
