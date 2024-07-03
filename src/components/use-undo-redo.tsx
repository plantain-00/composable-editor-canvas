import * as React from "react"
import { produce, castDraft, Draft } from "immer"

/**
 * @public
 */
export function useUndoRedo<T>(
  defaultState: T,
  options?: Partial<{
    onChange: (data: { oldState: Readonly<T>, newState: Readonly<T> }) => void
  }>,
) {
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
    stateIndex,
    setState: (recipe: (draft: Draft<T>) => void) => {
      const s = produce(state, recipe)
      if (s === state) {
        return state
      }
      options?.onChange?.({ oldState: state, newState: s })
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
    resetHistory: (s = defaultState) => {
      setHistory({
        states: [s] as readonly T[],
        stateIndex: 0,
      })
    },
  }
}
