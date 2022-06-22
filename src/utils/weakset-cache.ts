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
