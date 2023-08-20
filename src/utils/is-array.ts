/**
 * @public
 */
export const isArray: <T>(arg: unknown) => arg is readonly T[] = Array.isArray
