export function* iterateItemOrArray<T>(item: T | (T | undefined)[]): Generator<T, void, unknown> {
  if (Array.isArray(item)) {
    for (const t of item) {
      if (t) {
        yield t
      }
    }
  } else {
    yield item
  }
}

export function itemToArray<T>(item?: T | T[]): T[] {
  return item === undefined ? [] : Array.isArray(item) ? item : [item]
}
