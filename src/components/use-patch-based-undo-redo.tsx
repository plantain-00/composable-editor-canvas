import * as React from "react"
import { produce, applyPatches, castDraft, Patch, Draft } from "immer"

/**
 * @public
 */
export function usePatchBasedUndoRedo<T, P>(
  defaultState: Readonly<T>,
  operator: P,
  options?: Partial<{
    onApplyPatchesFromSelf: (patches: Patch[], reversePatches: Patch[]) => void | Promise<[Patch[], Patch[]]>
    onChange: (data: { patches: Patch[], oldState: Readonly<T>, newState: Readonly<T> }) => void | false
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
    const valid = options?.onChange?.({ patches, oldState: history.state, newState: s })
    if (valid === false) {
      return history.state
    }
    const newStateIndex = history.patchIndex + 1
    setHistory(produce(history, (draft) => {
      draft.patches.splice(newStateIndex, draft.patches.length, [patches, reversePatches, castDraft(operator)])
      draft.patchIndex = newStateIndex
      draft.state = castDraft(s)
    }))
    return s
  }
  const applyPatchFromSelf = async (patches: Patch[], reversePatches: Patch[]) => {
    const newPatches = await options?.onApplyPatchesFromSelf?.(patches, reversePatches)
    if (newPatches) {
      patches = newPatches[0]
      reversePatches = newPatches[1]
    }
    return applyPatchFromOtherOperators(patches, reversePatches, operator)
  }

  return {
    state: history.state,
    applyPatchFromOtherOperators,
    applyPatchFromSelf,
    setState: (recipe: (draft: Draft<T>) => void) => {
      return produce(history.state, recipe, (patches, reversePatches) => {
        if (patches.length === 0) {
          return
        }
        applyPatchFromSelf(patches, reversePatches)
      })
    },
    canUndo,
    canRedo,
    undo: async (e?: { preventDefault(): void }) => {
      e?.preventDefault()
      if (canUndo) {
        let [patches, reversePatches] = history.patches[undoCurrentIndex]
        const newPatches = await options?.onApplyPatchesFromSelf?.(reversePatches, patches)
        if (newPatches) {
          reversePatches = newPatches[0]
          patches = newPatches[1]
          history.patches[undoCurrentIndex][0] = patches
          history.patches[undoCurrentIndex][1] = reversePatches
        }
        const newState = applyPatches(history.state, reversePatches)
        const valid = options?.onChange?.({ patches: reversePatches, oldState: history.state, newState })
        if (valid === false) {
          return
        }
        setHistory(produce(history, (draft) => {
          draft.patchIndex = undoCurrentIndex - 1
          draft.state = castDraft(newState)
        }))
      }
    },
    redo: async (e?: { preventDefault(): void }) => {
      e?.preventDefault()
      if (canRedo) {
        let [patches, reversePatches] = history.patches[redoNextIndex]
        const newPatches = await options?.onApplyPatchesFromSelf?.(patches, reversePatches)
        if (newPatches) {
          patches = newPatches[0]
          reversePatches = newPatches[1]
          history.patches[undoCurrentIndex][0] = patches
          history.patches[undoCurrentIndex][1] = reversePatches
        }
        const newState = applyPatches(history.state, patches)
        const valid = options?.onChange?.({ patches, oldState: history.state, newState })
        if (valid === false) {
          return
        }
        setHistory(produce(history, (draft) => {
          draft.patchIndex = redoNextIndex
          draft.state = castDraft(newState)
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
