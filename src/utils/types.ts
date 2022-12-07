import { or, Validator } from "./validators"

/**
 * @public
 */
export type Nullable<T> = T | undefined | null

/**
 * @public
 */
export const Nullable = (a: Validator) => or(a, undefined, null)

/**
 * @public
 */
export type RequiredField<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
}
