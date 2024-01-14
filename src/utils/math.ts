import { isRecord } from "./is-record"

export const delta1 = 0.00000001
export const delta2 = 0.00001
export const delta3 = 0.001

export function isZero(value: number, delta = delta1) {
  return Math.abs(value) < delta
}

export function lessThan(value1: number, value2: number, delta?: number) {
  return value1 < value2 && !isSameNumber(value1, value2, delta)
}

export function largerThan(value1: number, value2: number, delta?: number) {
  return value1 > value2 && !isSameNumber(value1, value2, delta)
}

export function largerOrEqual(value1: number, value2: number, delta?: number) {
  return value1 > value2 || isSameNumber(value1, value2, delta)
}

export function lessOrEqual(value1: number, value2: number, delta?: number) {
  return value1 < value2 || isSameNumber(value1, value2, delta)
}

export function isValidPercent(t: number) {
  return largerOrEqual(t, 0) && lessOrEqual(t, 1)
}

export function sqrt3(value: number) {
  if (value < 0) {
    return -(Math.pow(-value, 1 / 3))
  }
  return Math.pow(value, 1 / 3)
}

export function deepEquals<T>(a: T, b: T): boolean {
  if (a === b) return true

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) {
        return false
      }
    }
    return true
  }

  if (isRecord(a)) {
    if (!isRecord(b)) return false
    const keys = Object.keys(a)
    if (keys.length !== Object.keys(b).length) return false
    for (const key of keys) {
      if (!deepEquals(a[key], b[key])) {
        return false
      }
    }
    return true
  }

  if (typeof a === 'number') {
    if (typeof b !== 'number') return false
    if (isNaN(a) && isNaN(b)) return true
    return isSameNumber(a, b)
  }

  return false
}

export function getTwoNumbersDistance(n1: number, n2: number) {
  return Math.abs(n1 - n2)
}

export function getTwoNumberCenter(p1: number, p2: number) {
  return (p1 + p2) / 2
}

export function isBetween(target: number, a: number, b: number) {
  return lessOrEqual(target, Math.max(a, b)) && largerOrEqual(target, Math.min(a, b))
}

export function deduplicate<T>(array: T[], isSameValue: (a: T, b: T) => boolean) {
  const result: T[] = []
  for (const item of array) {
    if (result.every((r) => !isSameValue(r, item))) {
      result.push(item)
    }
  }
  return result
}

export function equals(a: number | undefined, b: number | undefined) {
  if (a === undefined && b === undefined) return true
  if (a === undefined || b === undefined) return false
  return isSameNumber(a, b)
}

export function isSameNumber(a: number, b: number, delta?: number) {
  return isZero(a - b, delta)
}

export function formatNumber(n: number, precision = 100) {
  return Math.round(n * precision) / precision
}

export function minimumBy<T>(values: T[], by: (value: T) => number) {
  let result = values[0]
  for (let i = 1; i < values.length; i++) {
    const value = values[i]
    if (lessThan(by(value), by(result))) {
      result = value
    }
  }
  return result
}

export function maxmiumBy<T>(values: T[], by: (value: T) => number) {
  let result = values[0]
  for (let i = 1; i < values.length; i++) {
    const value = values[i]
    if (largerThan(by(value), by(result))) {
      result = value
    }
  }
  return result
}

export function minimumsBy<T>(values: T[], by: (value: T) => number) {
  let result = [values[0]]
  for (let i = 1; i < values.length; i++) {
    const value = values[i]
    if (isSameNumber(by(value), by(result[0]))) {
      result.push(value)
    } else if (lessThan(by(value), by(result[0]))) {
      result = [value]
    }
  }
  return result
}

export function maxmiumsBy<T>(values: T[], by: (value: T) => number) {
  let result = [values[0]]
  for (let i = 1; i < values.length; i++) {
    const value = values[i]
    if (isSameNumber(by(value), by(result[0]))) {
      result.push(value)
    } else if (largerThan(by(value), by(result[0]))) {
      result = [value]
    }
  }
  return result
}

export function multiplyOpacity(a?: number, b?: number) {
  if (a === undefined) return b
  if (b === undefined) return a
  return a * b
}
