import * as React from "react"
import produce, { applyPatches, castDraft } from "immer"
import type { Patch, WritableDraft } from "immer/dist/types/types-external"

export function usePatchBasedUndoRedo<T, P>(
  defaultState: Readonly<T>,
  operator: P,
  options?: Partial<{
    onApplyPatches: (patches: Patch[], reversePatches: Patch[]) => void
  }>,
) {
  const [history, setHistory] = React.useState({
    state: defaultState,
    patchIndex: -1,
    patches: [] as [Patch[], Patch[], P][],
  })

  const undoCurrentIndex = getPreviousIndex(history.patchIndex, history.patches, (p) => p[2] === operator)
  const redoNextIndex = getNextIndex(history.patchIndex + 1, history.patches, (p) => p[2] === operator)
  const canUndo = undoCurrentIndex >= 0
  const canRedo = redoNextIndex < history.patches.length

  const applyPatchFromOtherOperators = (patches: Patch[], reversePatches: Patch[], operator: P) => {
    const s = applyPatches(history.state, patches)
    const newStateIndex = history.patchIndex + 1
    setHistory(produce(history, (draft) => {
      draft.patches.splice(newStateIndex, draft.patches.length, [patches, reversePatches, castDraft(operator)])
      draft.patchIndex = newStateIndex
      draft.state = castDraft(s)
    }))
    return s
  }
  const applyPatchFromSelf = (patches: Patch[], reversePatches: Patch[]) => {
    options?.onApplyPatches?.(patches, reversePatches)
    return applyPatchFromOtherOperators(patches, reversePatches, operator)
  }

  return {
    state: history.state,
    applyPatchFromOtherOperators,
    applyPatchFromSelf,
    setState: (recipe: (draft: WritableDraft<T>) => void) => {
      return produce(history.state, recipe, (patches, reversePatches) => {
        applyPatchFromSelf(patches, reversePatches)
      })
    },
    canUndo,
    canRedo,
    undo: (e?: { preventDefault(): void }) => {
      e?.preventDefault()
      if (canUndo) {
        setHistory(produce(history, (draft) => {
          draft.patchIndex = undoCurrentIndex - 1
          const [patches, reversePatches] = history.patches[undoCurrentIndex]
          options?.onApplyPatches?.(reversePatches, patches)
          draft.state = castDraft(applyPatches(history.state, reversePatches))
        }))
      }
    },
    redo: (e?: { preventDefault(): void }) => {
      e?.preventDefault()
      if (canRedo) {
        setHistory(produce(history, (draft) => {
          draft.patchIndex = redoNextIndex
          const [patches, reversePatches] = history.patches[redoNextIndex]
          options?.onApplyPatches?.(patches, reversePatches)
          draft.state = castDraft(applyPatches(history.state, patches))
        }))
      }
    },
    stateIndex: history.patchIndex,
  }
}

function getPreviousIndex<T>(startIndex: number, items: T[], predicate: (item: T) => boolean) {
  for (let i = startIndex; i >= 0; i--) {
    if (predicate(items[i])) {
      return i
    }
  }
  return -Infinity
}

function getNextIndex<T>(startIndex: number, items: T[], predicate: (item: T) => boolean) {
  for (let i = startIndex; i < items.length; i++) {
    if (predicate(items[i])) {
      return i
    }
  }
  return Infinity
}
