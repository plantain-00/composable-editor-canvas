import React from 'react'
import { metaKeyIfMacElseCtrlKey, useGlobalKeyDown, usePatchBasedUndoRedo } from '../src'

const initialState = { count: 0 }

export default () => {
  const { state, setState, undo, redo } = usePatchBasedUndoRedo(initialState, 'a')
  useGlobalKeyDown(e => {
    if (e.code === 'KeyZ' && metaKeyIfMacElseCtrlKey(e)) {
      if (e.shiftKey) {
        redo(e)
      } else {
        undo(e)
      }
    }
  })
  return (
    <button
      onClick={() => setState((draft) => { draft.count++ })}
      style={{ width: '200px', height: '100px' }}
    >
      {state.count}
    </button>
  )
}
