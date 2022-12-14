import React from 'react'
import { useUndoRedo, useKey, metaKeyIfMacElseCtrlKey } from '../src'

const initialState = { count: 0 }

export default () => {
  const { state, setState, undo, redo } = useUndoRedo(initialState)
  useKey((k) => k.code === 'KeyZ' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), undo)
  useKey((k) => k.code === 'KeyZ' && k.shiftKey && metaKeyIfMacElseCtrlKey(k), redo)
  return (
    <button
      onClick={() => setState((draft) => { draft.count++ })}
      style={{ width: '200px', height: '100px' }}
    >
      {state.count}
    </button>
  )
}
