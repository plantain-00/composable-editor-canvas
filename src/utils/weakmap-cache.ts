import { deepEquals } from "./math"
import { WeakValuesChangedCache } from "./weakset-cache"

/**
 * @public
 */
export class WeakmapCache<TKey extends object, TValue> {
  private cache = new WeakMap<TKey, TValue>()

  public get(key: TKey, func: () => TValue) {
    let result = this.cache.get(key)
    if (result === undefined) {
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
    if (result === undefined) {
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
export class WeakmapCache3<TKey1 extends object, TKey2 extends object, TKey3 extends object, TValue> {
  private cache = new WeakMap<TKey1, WeakMap<TKey2, WeakMap<TKey3, TValue>>>()

  public get(key1: TKey1, key2: TKey2, key3: TKey3, func: () => TValue) {
    let map = this.cache.get(key1)
    if (!map) {
      map = new WeakMap<TKey2, WeakMap<TKey3, TValue>>()
      this.cache.set(key1, map)
    }
    let map2 = map.get(key2)
    if (!map2) {
      map2 = new WeakMap<TKey3, TValue>()
      map.set(key2, map2)
    }
    let result = map2.get(key3)
    if (result === undefined) {
      result = func()
      map2.set(key3, result)
    }
    return result
  }

  public clear() {
    this.cache = new WeakMap<TKey1, WeakMap<TKey2, WeakMap<TKey3, TValue>>>()
  }
}

export class WeakmapCache4<TKey1 extends object, TKey2 extends object, TKey3 extends object, TKey4 extends object, TValue> {
  private cache = new WeakMap<TKey1, WeakmapCache3<TKey2, TKey3, TKey4, TValue>>()

  public get(key1: TKey1, key2: TKey2, key3: TKey3, key4: TKey4, func: () => TValue) {
    let map = this.cache.get(key1)
    if (!map) {
      map = new WeakmapCache3<TKey2, TKey3, TKey4, TValue>()
      this.cache.set(key1, map)
    }
    return map.get(key2, key3, key4, func)
  }

  public clear() {
    this.cache = new WeakMap<TKey1, WeakmapCache3<TKey2, TKey3, TKey4, TValue>>()
  }
}

export class WeakmapValuesCache<TTarget extends object, TKey extends object, TValue> {
  private caches = new WeakMap<TTarget, WeakValuesChangedCache<TKey, TValue>>()

  public get(target: TTarget, keys: TKey[] | Set<TKey>, func: () => TValue) {
    let cache = this.caches.get(target)
    if (!cache) {
      cache = new WeakValuesChangedCache<TKey, TValue>()
      this.caches.set(target, cache)
    }
    return cache.get(keys, func)
  }

  public clear() {
    this.caches = new WeakMap<TTarget, WeakValuesChangedCache<TKey, TValue>>()
  }
}

export class WeakmapValueCache<TTarget extends object, TKey, TValue> {
  private caches = new WeakMap<TTarget, ValueChangedCache<TKey, TValue>>()

  public get(target: TTarget, keys: TKey, func: () => TValue) {
    let cache = this.caches.get(target)
    if (!cache) {
      cache = new ValueChangedCache<TKey, TValue>()
      this.caches.set(target, cache)
    }
    return cache.get(keys, func)
  }

  public clear() {
    this.caches = new WeakMap<TTarget, ValueChangedCache<TKey, TValue>>()
  }
}

export class ValueChangedCache<TKey, TValue> {
  private cache: { key: TKey, value: TValue } | undefined

  public get(key: TKey, func: () => TValue) {
    if (this.cache === undefined || !deepEquals(this.cache.key, key)) {
      this.cache = {
        key,
        value: func(),
      }
    }
    return this.cache.value
  }

  public clear() {
    this.cache = undefined
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
    if (result === undefined) {
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
export class WeakmapMap2Cache<TKey1 extends object, TKey2, TKey3, TValue> {
  private cache = new WeakMap<TKey1, Map<TKey2, Map<TKey3, TValue>>>()

  public get(key1: TKey1, key2: TKey2, key3: TKey3, func: () => TValue) {
    let map = this.cache.get(key1)
    if (!map) {
      map = new Map<TKey2, Map<TKey3, TValue>>()
      this.cache.set(key1, map)
    }
    let map2 = map.get(key2)
    if (!map2) {
      map2 = new Map<TKey3, TValue>()
      map.set(key2, map2)
    }
    let result = map2.get(key3)
    if (result === undefined) {
      result = func()
      map2.set(key3, result)
    }
    return result
  }

  public clear() {
    this.cache = new WeakMap<TKey1, Map<TKey2, Map<TKey3, TValue>>>()
  }
}

/**
 * @public
 */
export class WeakmapMap3Cache<TKey1 extends object, TKey2, TKey3, TKey4, TValue> {
  private cache = new WeakMap<TKey1, Map<TKey2, Map<TKey3, Map<TKey4, TValue>>>>()

  public get(key1: TKey1, key2: TKey2, key3: TKey3, key4: TKey4, func: () => TValue) {
    let map = this.cache.get(key1)
    if (!map) {
      map = new Map<TKey2, Map<TKey3, Map<TKey4, TValue>>>()
      this.cache.set(key1, map)
    }
    let map2 = map.get(key2)
    if (!map2) {
      map2 = new Map<TKey3, Map<TKey4, TValue>>()
      map.set(key2, map2)
    }
    let map3 = map2.get(key3)
    if (!map3) {
      map3 = new Map<TKey4, TValue>()
      map2.set(key3, map3)
    }
    let result = map3.get(key4)
    if (result === undefined) {
      result = func()
      map3.set(key4, result)
    }
    return result
  }

  public clear() {
    this.cache = new WeakMap<TKey1, Map<TKey2, Map<TKey3, Map<TKey4, TValue>>>>()
  }
}

/**
 * @public
 */
export class WeakmapMap4Cache<TKey1 extends object, TKey2, TKey3, TKey4, TKey5, TValue> {
  private cache = new WeakMap<TKey1, Map<TKey2, Map<TKey3, Map<TKey4, Map<TKey5, TValue>>>>>()

  public get(key1: TKey1, key2: TKey2, key3: TKey3, key4: TKey4, key5: TKey5, func: () => TValue) {
    let map = this.cache.get(key1)
    if (!map) {
      map = new Map<TKey2, Map<TKey3, Map<TKey4, Map<TKey5, TValue>>>>()
      this.cache.set(key1, map)
    }
    let map2 = map.get(key2)
    if (!map2) {
      map2 = new Map<TKey3, Map<TKey4, Map<TKey5, TValue>>>()
      map.set(key2, map2)
    }
    let map3 = map2.get(key3)
    if (!map3) {
      map3 = new Map<TKey4, Map<TKey5, TValue>>()
      map2.set(key3, map3)
    }
    let map4 = map3.get(key4)
    if (!map4) {
      map4 = new Map<TKey5, TValue>()
      map3.set(key4, map4)
    }
    let result = map4.get(key5)
    if (result === undefined) {
      result = func()
      map4.set(key5, result)
    }
    return result
  }

  public clear() {
    this.cache = new WeakMap<TKey1, Map<TKey2, Map<TKey3, Map<TKey4, Map<TKey5, TValue>>>>>()
  }
}

/**
 * @public
 */
export class MapCache<TKey1, TValue> {
  private cache = new Map<TKey1, TValue>()

  public get(key1: TKey1, func: () => TValue): TValue {
    let result = this.cache.get(key1)
    if (result === undefined) {
      result = func()
      this.cache.set(key1, result)
    }
    return result
  }

  public clear() {
    this.cache.clear()
  }

  public values() {
    return this.cache.values()
  }
}

/**
 * @public
 */
export class MapCache2<TKey1, TKey2, TValue> {
  private cache = new Map<TKey1, Map<TKey2, TValue>>()

  public get(key1: TKey1, key2: TKey2): TValue | undefined
  public get(key1: TKey1, key2: TKey2, func: () => TValue): TValue
  public get(key1: TKey1, key2: TKey2, func?: () => TValue): TValue | undefined {
    let map = this.cache.get(key1)
    if (!map) {
      map = new Map<TKey2, TValue>()
      this.cache.set(key1, map)
    }
    let result = map.get(key2)
    if (result === undefined) {
      if (!func) {
        return
      }
      result = func()
      map.set(key2, result)
    }
    return result
  }
}

/**
 * @public
 */
export class MapCache3<TKey1, TKey2, TKey3, TValue> {
  private cache = new Map<TKey1, Map<TKey2, Map<TKey3, TValue>>>()

  public get(key1: TKey1, key2: TKey2, key3: TKey3): TValue | undefined
  public get(key1: TKey1, key2: TKey2, key3: TKey3, func: () => TValue): TValue
  public get(key1: TKey1, key2: TKey2, key3: TKey3, func?: () => TValue): TValue | undefined {
    let map = this.cache.get(key1)
    if (!map) {
      map = new Map<TKey2, Map<TKey3, TValue>>()
      this.cache.set(key1, map)
    }
    let map2 = map.get(key2)
    if (!map2) {
      map2 = new Map<TKey3, TValue>()
      map.set(key2, map2)
    }
    let result = map2.get(key3)
    if (result === undefined) {
      if (!func) {
        return
      }
      result = func()
      map2.set(key3, result)
    }
    return result
  }
}

export class MapCache4<TKey1, TKey2, TKey3, TKey4, TValue> {
  private cache = new Map<TKey1, Map<TKey2, Map<TKey3, Map<TKey4, TValue>>>>()

  public get(key1: TKey1, key2: TKey2, key3: TKey3, key4: TKey4): TValue | undefined
  public get(key1: TKey1, key2: TKey2, key3: TKey3, key4: TKey4, func: () => TValue): TValue
  public get(key1: TKey1, key2: TKey2, key3: TKey3, key4: TKey4, func?: () => TValue): TValue | undefined {
    let map = this.cache.get(key1)
    if (!map) {
      map = new Map<TKey2, Map<TKey3, Map<TKey4, TValue>>>()
      this.cache.set(key1, map)
    }
    let map2 = map.get(key2)
    if (!map2) {
      map2 = new Map<TKey3, Map<TKey4, TValue>>()
      map.set(key2, map2)
    }
    let map3 = map2.get(key3)
    if (!map3) {
      map3 = new Map<TKey4, TValue>()
      map2.set(key3, map3)
    }
    let result = map3.get(key4)
    if (result === undefined) {
      if (!func) {
        return
      }
      result = func()
      map3.set(key4, result)
    }
    return result
  }
}
