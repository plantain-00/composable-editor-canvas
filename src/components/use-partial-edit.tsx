import type { Patch } from "immer/dist/types/types-external"
import * as React from "react"
import { SelectPath } from "./use-selected"

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
    getContentByPath<V>(content: V) {
      return getByPath(content, editingContentPath)
    },
  }
}

export function prependPatchPath(patches: Patch[], path?: SelectPath): Patch[] {
  if (path && path.length > 0) {
    return patches.map((p) => ({ ...p, path: [...path, ...p.path] }))
  }
  return patches
}

function getByPath<T>(target: T, path?: SelectPath) {
  if (path) {
    let result: any = target
    for (const p of path) {
      result = result[p]
    }
    return result as T
  }
  return target
}
