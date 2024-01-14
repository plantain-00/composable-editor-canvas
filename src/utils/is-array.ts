/**
 * @public
 */
export function isArray<T>(arg: unknown): arg is readonly T[] {
  return Array.isArray(arg)
}
