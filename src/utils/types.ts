import { number, or, tuple, Validator } from "./validators"

/**
 * @public
 */
export type Nullable<T> = T | undefined | null

/**
 * @public
 */
export const Nullable = (a: Validator) => or(undefined, null, a)

/**
 * @public
 */
export type RequiredField<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
}

/**
 * @public
 */
export type OptionalField<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P];
}

export type Vec2 = [number, number]
export type Vec3 = [number, number, number]
export type Vec4 = [number, number, number, number]

export const Vec2 = tuple(number, number)
export const Vec3 = tuple(number, number, number)
export const Vec4 = tuple(number, number, number, number)

export type Primitive = string | number | boolean

export type Tuple2<T> = [T, T]
export type Tuple3<T> = [T, T, T]
export type Tuple4<T> = [T, T, T, T]
export type Tuple5<T> = [T, T, T, T, T]

export function slice3<T>(array: { [index: number]: T }, start = 0): Tuple3<T> {
  return [array[start], array[start + 1], array[start + 2]]
}
