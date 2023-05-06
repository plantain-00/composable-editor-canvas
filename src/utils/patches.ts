import { produce, Patch } from "immer"
import { getByPath } from ".."

/**
 * @public
 */
export function applyImmutablePatches<T>(base: T, patches: Patch[]): {
  patches: Patch[]
  reversePatches: Patch[]
  result: T
} {
  const newPatches: Patch[] = []
  const reversePatches: Patch[] = []
  patches.forEach((patch, i) => {
    // type-coverage:ignore-next-line
    const value = patch.value as unknown
    base = produce(base, (draft) => {
      const parentPath = patch.path.slice(0, patch.path.length - 1)
      const tail = patch.path[patch.path.length - 1]
      const parent = getByPath(draft, parentPath)
      if (Array.isArray(parent)) {
        if (patch.op === 'add') {
          const path = [...parentPath, parent.length]
          newPatches.push({
            op: 'replace',
            path,
            value,
          })
          reversePatches.unshift({
            op: 'replace',
            path,
            value: undefined,
          })
          parent.push(value)
        } else if (patch.op === 'replace' && typeof tail === 'number') {
          newPatches.push(patch)
          reversePatches.unshift({
            op: 'replace',
            path: patch.path,
            value: getByPath(base, patch.path),
          })
          if (tail === parent.length - 1 && (value === undefined || value === null)) {
            parent.pop()
          } else {
            parent[tail] = value
          }
        } else {
          console.info(patch)
          throw new Error(`Operation not supported for patch at index ${i}`)
        }
      } else if (typeof parent === 'object' && parent !== null) {
        // type-coverage:ignore-next-line
        const object = parent as Record<string | number, unknown>
        newPatches.push(patch)
        reversePatches.unshift({
          op: 'replace',
          path: patch.path,
          value: getByPath(base, patch.path),
        })
        if (value === undefined) {
          delete object[tail]
        } else {
          object[tail] = value
        }
      } else {
        console.info(patch)
        throw new Error(`Invalid path for patch at index ${i}`)
      }
    })
  })

  return {
    patches: newPatches,
    reversePatches,
    result: base,
  }
}
