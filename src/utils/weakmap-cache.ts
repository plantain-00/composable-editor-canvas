/**
 * @public
 */
export class WeakmapCache<TKey extends object, TValue> {
  private cache = new WeakMap<TKey, TValue>()

  public get(key: TKey, func: () => TValue) {
    let result = this.cache.get(key)
    if (!result) {
      result = func()
      this.cache.set(key, result)
    }
    return result
  }

  public clear() {
    this.cache = new WeakMap<TKey, TValue>()
  }
}

/**
 * @public
 */
export class WeakmapCache2<TKey1 extends object, TKey2 extends object, TValue> {
  private cache = new WeakMap<TKey1, WeakMap<TKey2, TValue>>()

  public get(key1: TKey1, key2: TKey2, func: () => TValue) {
    let map = this.cache.get(key1)
    if (!map) {
      map = new WeakMap<TKey2, TValue>()
      this.cache.set(key1, map)
    }
    let result = map.get(key2)
    if (!result) {
      result = func()
      map.set(key2, result)
    }
    return result
  }

  public clear() {
    this.cache = new WeakMap<TKey1, WeakMap<TKey2, TValue>>()
  }
}

/**
 * @public
 */
export class WeakmapMapCache<TKey1 extends object, TKey2, TValue> {
  private cache = new WeakMap<TKey1, Map<TKey2, TValue>>()

  public get(key1: TKey1, key2: TKey2, func: () => TValue) {
    let map = this.cache.get(key1)
    if (!map) {
      map = new Map<TKey2, TValue>()
      this.cache.set(key1, map)
    }
    let result = map.get(key2)
    if (!result) {
      result = func()
      map.set(key2, result)
    }
    return result
  }

  public clear() {
    this.cache = new WeakMap<TKey1, Map<TKey2, TValue>>()
  }
}

/**
 * @public
 */
export class MapCache2<TKey1, TKey2, TValue> {
  private cache = new Map<TKey1, Map<TKey2, TValue>>()

  public get(key1: TKey1, key2: TKey2, func: () => TValue) {
    let map = this.cache.get(key1)
    if (!map) {
      map = new Map<TKey2, TValue>()
      this.cache.set(key1, map)
    }
    let result = map.get(key2)
    if (!result) {
      result = func()
      map.set(key2, result)
    }
    return result
  }
}
