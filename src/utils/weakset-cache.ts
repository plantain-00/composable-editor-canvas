/**
 * @public
 */
export class WeaksetCache<T extends object> {
  private cache = new WeakSet<T>()

  public clear() {
    this.cache = new WeakSet<T>()
  }
  public add(...values: T[]) {
    for (const value of values) {
      this.cache.add(value)
    }
  }
  public has(value: T) {
    return this.cache.has(value)
  }
  public delete(value: T) {
    return this.cache.delete(value)
  }
}
