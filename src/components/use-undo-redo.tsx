import * as React from "react"
import produce, { castDraft } from "immer"
import { WritableDraft } from "immer/dist/types/types-external"

export function useUndoRedo<T>(defaultState: T) {
  const [history, setHistory] = React.useState({
    states: [defaultState] as readonly T[],
    stateIndex: 0,
  })

  const { stateIndex, states } = history
  const canUndo = stateIndex > 0
  const canRedo = stateIndex < states.length - 1
  const state = states[stateIndex]

  return {
    state,
    setState: (recipe: (draft: WritableDraft<T>) => void) => {
      const s = produce(state, recipe)
      const newStateIndex = stateIndex + 1
      setHistory(produce(history, (draft) => {
        draft.states.splice(newStateIndex, draft.states.length, castDraft(s))
        draft.stateIndex = newStateIndex
      }))
      return s
    },
    canUndo,
    canRedo,
    undo: (e?: { preventDefault(): void }) => {
      e?.preventDefault()
      if (canUndo) {
        setHistory(produce(history, (draft) => {
          draft.stateIndex = stateIndex - 1
        }))
      }
    },
    redo: (e?: { preventDefault(): void }) => {
      e?.preventDefault()
      if (canRedo) {
        setHistory(produce(history, (draft) => {
          draft.stateIndex = stateIndex + 1
        }))
      }
    },
  }
}
