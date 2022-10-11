import type { Patch } from "immer/dist/types/types-external"
import * as React from "react"
import { SelectPath } from "./use-selected"

/**
 * @public
 */
export function usePartialEdit<T>(content: T, options?: Partial<{
  onEditingContentPathChange: (content: T) => void
}>) {
  const [editingContentPath, setEditingContentPath] = React.useState<SelectPath>()
  const editingContent = getByPath(content, editingContentPath)
  return {
    editingContent,
    setEditingContentPath: (path: SelectPath | undefined) => {
      options?.onEditingContentPathChange?.(getByPath(content, path))
      setEditingContentPath(path)
    },
    prependPatchPath: (patches: Patch[]) => prependPatchPath(patches, editingContentPath),
    trimPatchPath: (patches: Patch[]) => trimPatchPath(patches, editingContentPath),
    getContentByPath<V>(content: V) {
      return getByPath(content, editingContentPath)
    },
  }
}

/**
 * @public
 */
export function prependPatchPath(patches: Patch[], path?: SelectPath): Patch[] {
  if (path && path.length > 0) {
    return patches.map((p) => ({ ...p, path: [...path, ...p.path] }))
  }
  return patches
}

function trimPatchPath(patches: Patch[], path?: SelectPath): Patch[] {
  if (path && path.length > 0) {
    return patches.map((p) => ({ ...p, path: p.path.slice(path.length) }))
  }
  return patches
}

/**
 * @public
 */
export function getByPath<T>(target: T, path?: SelectPath) {
  if (path) {
    return getItemByPath<T>(target, path)
  }
  return target
}

/**
 * @public
 */
export function getItemByPath<T>(target: unknown, path: SelectPath) {
  // type-coverage:ignore-next-line
  let result: any = target
  for (const p of path) {
    // type-coverage:ignore-next-line
    result = result[p]
  }
  return result as T
}
