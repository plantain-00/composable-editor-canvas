/**
 * @public
 */
export class WeaksetCache<T extends object> {
  private cache = new WeakSet<T>()
  private count = 0

  public clear() {
    this.cache = new WeakSet<T>()
    this.count = 0
  }
  public add(...values: T[]) {
    for (const value of values) {
      this.cache.add(value)
    }
    this.count += values.length
  }
  public has(value: T) {
    return this.cache.has(value)
  }
  public delete(value: T) {
    this.count--
    return this.cache.delete(value)
  }
  public get size() {
    return this.count
  }
}

export class WeakValuesChangedCache<TKey extends object, TValue> {
  private cache: { keys: WeakSet<TKey>, value: TValue } | undefined

  public get(keys: TKey[], func: () => TValue) {
    if (this.cache === undefined) {
      this.cache = {
        keys: new WeakSet(keys),
        value: func(),
      }
      return this.cache.value
    }
    for (const key of keys) {
      if (!this.cache.keys.has(key)) {
        this.cache = {
          keys: new WeakSet(keys),
          value: func(),
        }
        return this.cache.value
      }
    }
    return this.cache.value
  }

  public clear() {
    this.cache = undefined
  }
}
