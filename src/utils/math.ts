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

export function shallowEquals(a: unknown, b: unknown) {
  return a === b
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

export function getNumberRangeIntersection(range1: [number, number], range2: [number, number]): [number, number] | undefined {
  const start = Math.max(Math.min(...range1), Math.min(...range2))
  const end = Math.min(Math.max(...range1), Math.max(...range2))
  return largerThan(end, start) ? [start, end] : undefined
}

export function getNumberRangeUnion(range1: [number, number], range2: [number, number]): [number, number] | undefined {
  const start1 = Math.min(...range1)
  const start2 = Math.min(...range2)
  const end1 = Math.max(...range1)
  const end2 = Math.max(...range2)
  return lessOrEqual(Math.max(start1, start2), Math.min(end1, end2)) ? [Math.min(start1, start2), Math.max(end1, end2)] : undefined
}

export function getNumberRangeDifference(range1: [number, number], range2: [number, number]): [number, number][] {
  const start1 = Math.min(...range1)
  const start2 = Math.min(...range2)
  const end1 = Math.max(...range1)
  const end2 = Math.max(...range2)
  if (lessOrEqual(end2, start1) || largerOrEqual(start2, end1)) {
    return [[start1, end1]]
  }
  const result: [number, number][] = []
  if (lessThan(start1, start2)) {
    result.push([start1, start2])
  }
  if (lessThan(end2, end1)) {
    result.push([end2, end1])
  }
  return result
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

export function minimumBy<T>(values: T[], by: (value: T) => number, isFinalResult?: (r: number) => boolean) {
  let result = values[0]
  let byResult: number | undefined
  for (let i = 1; i < values.length; i++) {
    const value = values[i]
    if (byResult === undefined) {
      byResult = by(result)
      if (isFinalResult?.(byResult)) return result
    }
    const newByResult = by(value)
    if (lessThan(newByResult, byResult)) {
      result = value
      byResult = newByResult
      if (isFinalResult?.(newByResult)) return result
    }
  }
  return result
}

export function maximumBy<T>(values: T[], by: (value: T) => number, isFinalResult?: (r: number) => boolean) {
  let result = values[0]
  let byResult: number | undefined
  for (let i = 1; i < values.length; i++) {
    const value = values[i]
    if (byResult === undefined) {
      byResult = by(result)
      if (isFinalResult?.(byResult)) return result
    }
    const newByResult = by(value)
    if (largerThan(newByResult, byResult)) {
      result = value
      byResult = newByResult
      if (isFinalResult?.(newByResult)) return result
    }
  }
  return result
}

export function minimumsBy<T>(values: T[], by: (value: T) => number): T[] {
  if (values.length === 0) return []
  if (values.length === 1) return [values[0]]
  let result = [{ value: values[0], byValue: by(values[0]) }]
  for (let i = 1; i < values.length; i++) {
    const value = values[i]
    const byValue = by(value)
    if (isSameNumber(byValue, result[0].byValue)) {
      result.push({ value, byValue })
    } else if (lessThan(byValue, result[0].byValue)) {
      result = [{ value, byValue }]
    }
  }
  return result.map(r => r.value)
}

export function maximumsBy<T>(values: T[], by: (value: T) => number): T[] {
  if (values.length === 0) return []
  if (values.length === 1) return [values[0]]
  let result = [{ value: values[0], byValue: by(values[0]) }]
  for (let i = 1; i < values.length; i++) {
    const value = values[i]
    const byValue = by(value)
    if (isSameNumber(byValue, result[0].byValue)) {
      result.push({ value, byValue })
    } else if (largerThan(byValue, result[0].byValue)) {
      result = [{ value, byValue }]
    }
  }
  return result.map(r => r.value)
}

export function first<T>(generator: IterableIterator<T>) {
  for (const item of generator) {
    return item
  }
  return
}

export function multiplyOpacity(a?: number, b?: number) {
  if (a === undefined) return b
  if (b === undefined) return a
  return a * b
}

export function findIndexFrom<T>(
  items: T[],
  index: number,
  predicate: (value: T) => boolean,
  options: Partial<{
    reverse: boolean
    closed: boolean
  }>,
): number | undefined {
  if (options?.reverse) {
    for (let i = index; i >= 0; i--) {
      const item = items[i]
      if (predicate(item)) return i
    }
    if (options?.closed) {
      for (let i = items.length - 1; i > index; i--) {
        const item = items[i]
        if (predicate(item)) return i
      }
    }
    return
  }
  for (let i = index; i < items.length; i++) {
    const item = items[i]
    if (predicate(item)) return i
  }
  if (options?.closed) {
    for (let i = 0; i < index; i++) {
      const item = items[i]
      if (predicate(item)) return i
    }
  }
  return
}

export function findFrom<T>(
  items: T[],
  index: number,
  predicate: (value: T) => boolean,
  options: Partial<{
    reverse: boolean
    closed: boolean
  }>,
): T | undefined {
  const result = findIndexFrom(items, index, predicate, options)
  if (result !== undefined) {
    return items[result]
  }
  return
}

export function mergeItems<T>(items: T[], mergeTwo: (item1: T, item2: T) => T | undefined | void): T[] {
  if (items.length < 2) return items
  if (items.length === 2) {
    const result = mergeTwo(items[0], items[1])
    return result ? [result] : items
  }
  const first = items[0]
  for (let i = 1; i < items.length; i++) {
    const result = mergeTwo(first, items[i])
    if (result) {
      return mergeItems([result, ...items.slice(1, i), ...items.slice(i + 1)], mergeTwo)
    }
  }
  return [first, ...mergeItems(items.slice(1), mergeTwo)]
}

export function applyToItems<T>(item1: T, items2: T[], operate: (item1: T, item2: T) => T[]): T[] {
  let result = [item1]
  for (const item2 of items2) {
    result = result.map(r => operate(r, item2)).flat()
  }
  return result
}

export function mirrorNumber(value: number, by: number) {
  return 2 * by - value
}

export function getContinuedFraction(n: number, max = 10): number[] {
  const result: number[] = []
  while (result.length < max) {
    let a = Math.floor(n)
    let b = n - a
    if (isSameNumber(b, 1)) {
      a++
      b = 0
    }
    result.push(a)
    if (isZero(b)) break
    n = 1 / b
  }
  return result
}

/**
 * PI -> 1146408/364913
 * 0.14285714285714285 -> 1/7
 * 0.30000000000000004 -> 3/10
 */
export function continuedFractionToFraction(fraction: number[]): [number, number] {
  let result: [number, number] = [fraction[fraction.length - 1], 1]
  for (let i = fraction.length - 2; i >= 0; i--) {
    // f + 1 / (r0 / r1)
    // f + r1 / r0
    // (f r0 + r1) / r0
    result = [fraction[i] * result[0] + result[1], result[0]]
  }
  return result
}

export function getCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : getCommonDivisor(b, a % b)
}

export function getLeastCommonMultiple(a: number, b: number): number {
  return a * b / getCommonDivisor(a, b)
}
