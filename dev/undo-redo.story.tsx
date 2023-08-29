import React from 'react'
import { useUndoRedo, metaKeyIfMacElseCtrlKey, useGlobalKeyDown } from '../src'

export default () => {
  const { state, setState, undo, redo } = useUndoRedo({ count: 0 })
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
