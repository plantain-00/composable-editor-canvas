import { isRecord } from "./is-record"
import { isArray } from "./is-array"

/**
 * @public
 */
export type Validator = { (v: unknown, path: Path): true | Path } | { [key: string]: Validator } | string | number | boolean | null | undefined | bigint | [Validator]

/**
 * @public
 */
export const string = (v: unknown, path: Path) => typeof v === 'string' ? true : path
/**
 * @public
 */
export const number = (v: unknown, path: Path) => typeof v === 'number' && !isNaN(v) ? true : path
/**
 * @public
 */
export const bigint = (v: unknown, path: Path) => typeof v === 'bigint' ? true : path
/**
 * @public
 */
export const integer = (v: unknown, path: Path) => Number.isInteger(v) ? true : path
/**
 * @public
 */
export const boolean = (v: unknown, path: Path) => typeof v === 'boolean' ? true : path
/**
 * @public
 */
export const symbol = (v: unknown, path: Path) => typeof v === 'symbol' ? true : path
/**
 * @public
 */
export const unknown = () => true
/**
 * @public
 */
export const never = () => false
/**
 * @public
 */
export const optional: (a: Validator) => Validator = a => (v, p) => v === undefined || validate(v, a, p)
/**
 * @public
 */
export const minItems: (num: number, a: Validator) => Validator = (n, a) => (v, p) => isArray(v) && v.length >= n ? validate(v, a, p) : p
/**
 * @public
 */
export const maxItems: (num: number, a: Validator) => Validator = (n, a) => (v, p) => isArray(v) && v.length <= n ? validate(v, a, p) : p
/**
 * @public
 */
export const or: (...items: Validator[]) => Validator = (...items) => (v, p) => items.some(a => validate(v, a, p)) ? true : p
/**
 * @public
 */
export const and: (...items: { [key: string]: Validator }[]) => { [key: string]: Validator } = (...items) => Object.assign({}, ...items)
/**
 * @public
 */
export const record: (a: Validator, b: Validator) => Validator = (a, b) => (v, p) => {
  if (!isRecord(v)) {
    return p
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
  if (!isArray(v) || items.length !== v.length) {
    return p
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
export function validate(value: unknown, by: Validator, path: Path = []): true | Path {
  if (isArray(by)) {
    if (!isArray(value)) {
      return path
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
      return path
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
  return value === by ? true : path
}

/**
 * @public
 */
export type Path = (number | string)[]
