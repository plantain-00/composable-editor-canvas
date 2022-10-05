import React from 'react'
import { SnapPointType, allSnapTypes, Nullable, useWindowSize } from '../src'
import { BaseContent } from './models/model'
import { CADEditor, CADEditorRef } from './combination-2.story'

const draftKey = 'composable-editor-canvas-whiteboard'
const draftState = localStorage.getItem(draftKey)
const initialState = draftState ? JSON.parse(draftState) as Nullable<BaseContent>[] : []

export const WhiteBoard = () => {
  const editorRef = React.useRef<CADEditorRef | null>(null)
  const [snapTypes, setSnapTypes] = React.useState<readonly SnapPointType[]>(allSnapTypes)
  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)
  const [operation, setOperation] = React.useState<string>()
  const size = useWindowSize()
  return (
    <div>
      <CADEditor
        ref={editorRef}
        initialState={initialState}
        width={size.width}
        height={size.height}
        snapTypes={snapTypes}
        renderTarget='svg'
        setCanUndo={setCanUndo}
        setCanRedo={setCanRedo}
        setOperation={setOperation}
        backgroundColor={0xffffff}
        onChange={(state) => localStorage.setItem(draftKey, JSON.stringify(state))}
      />
      <div style={{ position: 'relative' }}>
        {(['move canvas'] as const).map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'non command', name: p })} key={p} style={{ borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
        <button onClick={() => editorRef.current?.compress()}>compress</button>
        <button onClick={() => editorRef.current?.exitEditBlock()}>exit edit block</button>
        <button disabled={!canUndo} onClick={() => editorRef.current?.undo()}>undo</button>
        <button disabled={!canRedo} onClick={() => editorRef.current?.redo()}>redo</button>
        {allSnapTypes.map((type) => (
          <span key={type}>
            <input type='checkbox' checked={snapTypes.includes(type)} id={type} onChange={(e) => setSnapTypes(e.target.checked ? [...snapTypes, type] : snapTypes.filter((d) => d !== type))} />
            <label htmlFor={type}>{type}</label>
          </span>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        {['create line', 'create polyline', 'create polygon', 'create rect', '2 points', '3 points', 'center radius', 'center diameter', 'create tangent tangent radius circle', 'create arc', 'ellipse center', 'ellipse endpoint', 'create ellipse arc', 'spline', 'spline fitting', 'create radial dimension', 'create linear dimension', 'create text', 'create image', 'create arrow'].map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'command', name: p })} key={p} style={{ borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
      </div>
      <div style={{ position: 'relative' }}>
        {['move', 'delete', 'rotate', 'clone', 'explode', 'mirror', 'create block', 'create block reference', 'start edit block', 'fillet', 'chamfer', 'break', 'measure', 'create group', 'fill'].map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'command', name: p })} key={p} style={{ borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
      </div>
    </div>
  )
}
