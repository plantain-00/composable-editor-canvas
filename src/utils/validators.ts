import { isRecord } from "./is-record"
import { isArray } from "./is-array"

/**
 * @public
 */
export type Validator = { (v: unknown, path: Path): ValidationResult } | { [key: string]: Validator } | string | number | boolean | null | undefined | bigint | [Validator]

/**
 * @public
 */
export const string = (v: unknown, path: Path): ValidationResult => typeof v === 'string' ? true : { path, expect: 'string' }
/**
 * @public
 */
export const number = (v: unknown, path: Path): ValidationResult => typeof v === 'number' && !isNaN(v) ? true : { path, expect: 'number' }
/**
 * @public
 */
export const bigint = (v: unknown, path: Path): ValidationResult => typeof v === 'bigint' ? true : { path, expect: 'bigint' }
/**
 * @public
 */
export const integer = (v: unknown, path: Path): ValidationResult => Number.isInteger(v) ? true : { path, expect: 'integer' }
/**
 * @public
 */
export const boolean = (v: unknown, path: Path): ValidationResult => typeof v === 'boolean' ? true : { path, expect: 'boolean' }
/**
 * @public
 */
export const symbol = (v: unknown, path: Path): ValidationResult => typeof v === 'symbol' ? true : { path, expect: 'symbol' }
/**
 * @public
 */
export const unknown = () => true
/**
 * @public
 */
export const never = (_: unknown, path: Path): ValidationResult => ({ path, expect: 'never' })
/**
 * @public
 */
export const optional: (a: Validator) => Validator = a => (v, p) => v === undefined || validate(v, a, p)
/**
 * @public
 */
export const minItems: (num: number, a: Validator) => Validator = (n, a) => (v, p) => {
  if (!isArray(v)) return { path: p, expect: 'array' }
  return v.length >= n ? validate(v, a, p) : { path: p, expect: 'minItems', args: [n] }
}
/**
 * @public
 */
export const maxItems: (num: number, a: Validator) => Validator = (n, a) => (v, p) => {
  if (!isArray(v)) return { path: p, expect: 'array' }
  return v.length <= n ? validate(v, a, p) : { path: p, expect: 'maxItems', args: [n] }
}
/**
 * @public
 */
export const minLength: (num: number, a: Validator) => Validator = (n, a) => (v, p) => {
  if (typeof v !== 'string') return { path: p, expect: 'string' }
  return v.length >= n ? validate(v, a, p) : { path: p, expect: 'minLength', args: [n] }
}
/**
 * @public
 */
export const maxLength: (num: number, a: Validator) => Validator = (n, a) => (v, p) => {
  if (typeof v !== 'string') return { path: p, expect: 'string' }
  return v.length <= n ? validate(v, a, p) : { path: p, expect: 'maxLength', args: [n] }
}
/**
 * @public
 */
export const pattern: (regexp: RegExp, a: Validator) => Validator = (regexp, a) => (v, p) => {
  if (typeof v !== 'string') return { path: p, expect: 'string' }
  return v.match(regexp) ? validate(v, a, p) : { path: p, expect: 'pattern', args: [regexp] }
}
/**
 * @public
 */
export const minimum: (num: number, a: Validator) => Validator = (n, a) => (v, p) => {
  if (typeof v !== 'number' || isNaN(v)) return { path: p, expect: 'number' }
  return v >= n ? validate(v, a, p) : { path: p, expect: 'minimum', args: [n] }
}
/**
 * @public
 */
export const maximum: (num: number, a: Validator) => Validator = (n, a) => (v, p) => {
  if (typeof v !== 'number' || isNaN(v)) return { path: p, expect: 'number' }
  return v <= n ? validate(v, a, p) : { path: p, expect: 'maximum', args: [n] }
}
/**
 * @public
 */
export const exclusiveMinimum: (num: number, a: Validator) => Validator = (n, a) => (v, p) => {
  if (typeof v !== 'number' || isNaN(v)) return { path: p, expect: 'number' }
  return v > n ? validate(v, a, p) : { path: p, expect: 'exclusiveMinimum', args: [n] }
}
/**
 * @public
 */
export const exclusiveMaximum: (num: number, a: Validator) => Validator = (n, a) => (v, p) => {
  if (typeof v !== 'number' || isNaN(v)) return { path: p, expect: 'number' }
  return v < n ? validate(v, a, p) : { path: p, expect: 'exclusiveMaximum', args: [n] }
}
/**
 * @public
 */
export const multipleOf: (num: number, a: Validator) => Validator = (n, a) => (v, p) => {
  if (typeof v !== 'number') return { path: p, expect: 'number' }
  if (!Number.isInteger(v)) return { path: p, expect: 'integer' }
  return v % n === 0 ? validate(v, a, p) : { path: p, expect: 'multipleOf', args: [n] }
}
/**
 * @public
 */
export const or: (...items: Validator[]) => Validator = (...items) => (v, p) => items.some(a => validate(v, a, p) === true) ? true : { path: p, expect: 'or' }
/**
 * @public
 */
export const and: (...items: { [key: string]: Validator }[]) => { [key: string]: Validator } = (...items) => Object.assign({}, ...items)
/**
 * @public
 */
export const record: (a: Validator, b: Validator) => Validator = (a, b) => (v, p) => {
  if (!isRecord(v)) {
    return { path: p, expect: 'object' }
  }
  for (const [key, value] of Object.entries(v)) {
    const path = [...p, key]
    const r1 = validate(key, a, path)
    if (r1 !== true) {
      return r1
    }
    const r2 = validate(value, b, path)
    if (r2 !== true) {
      return r2
    }
  }
  return true
}
/**
 * @public
 */
export const tuple: (...items: Validator[]) => Validator = (...items) => (v, p) => {
  if (!isArray(v)) {
    return { path: p, expect: 'array' }
  }
  if (items.length !== v.length) {
    return { path: p, expect: 'length', args: [items.length] }
  }
  for (let i = 0; i < items.length; i++) {
    const a = items[i]
    const r = validate(v[i], a, [...p, i])
    if (r !== true) {
      return r
    }
  }
  return true
}

/**
 * @public
 */
export function validate(value: unknown, by: Validator, path: Path = []): ValidationResult {
  if (isArray(by)) {
    if (!isArray(value)) {
      return { path, expect: 'array' }
    }
    for (let i = 0; i < value.length; i++) {
      const r = validate(value[i], by[0], [...path, i])
      if (r !== true) {
        return r
      }
    }
    return true
  }
  if (isRecord(by)) {
    if (!isRecord(value)) {
      return { path, expect: 'object' }
    }
    for (const [key, v] of Object.entries(by)) {
      const r = validate(value[key], v, [...path, key])
      if (r !== true) {
        return r
      }
    }
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(by, key)) {
        delete value[key]
      }
    }
    return true
  }
  if (typeof by === 'function') {
    return by(value, path)
  }
  return value === by ? true : { path, expect: 'literal', args: [by] }
}

/**
 * @public
 */
export type Path = (number | string)[]

/**
 * @public
 */
export type ValidationResult = true | {
  path: Path
  expect: string
  args?: unknown[]
}
