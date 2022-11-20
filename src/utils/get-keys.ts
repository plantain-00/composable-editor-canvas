/**
 * @public
 */
export const getKeys: <T>(obj: T) => (keyof T)[] = Object.keys
