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
