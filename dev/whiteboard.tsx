import React from 'react'
import { SnapPointType, allSnapTypes, Nullable, useWindowSize } from '../src'
import { BaseContent } from './models/model'
import { CADEditor, CADEditorRef } from './combination-2.story'

const draftKey = 'composable-editor-canvas-whiteboard'
const draftState = localStorage.getItem(draftKey)
const initialState = draftState ? JSON.parse(draftState) as Nullable<BaseContent>[] : []

export const WhiteBoard = () => {
  const editorRef = React.useRef<CADEditorRef | null>(null)
  const [angleSnapEnabled, setAngleSnapEnabled] = React.useState(true)
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
        angleSnapEnabled={angleSnapEnabled}
        snapTypes={snapTypes}
        renderTarget='svg'
        setCanUndo={setCanUndo}
        setCanRedo={setCanRedo}
        setOperation={setOperation}
        backgroundColor={0xffffff}
        onChange={(state) => localStorage.setItem(draftKey, JSON.stringify(state))}
      />
      {(['move canvas'] as const).map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'non command', name: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
      <button onClick={() => editorRef.current?.compress()} style={{ position: 'relative' }}>compress</button>
      {['create line', 'create polyline', 'create polygon', 'create rect', '2 points', '3 points', 'center radius', 'center diameter', 'create tangent tangent radius circle', 'create arc', 'ellipse center', 'ellipse endpoint', 'create ellipse arc', 'spline', 'spline fitting', 'move', 'delete', 'rotate', 'clone', 'explode', 'mirror', 'create block', 'create block reference', 'start edit block', 'fillet', 'chamfer', 'break', 'measure', 'create radial dimension', 'create linear dimension', 'create group', 'fill', 'create text', 'create image'].map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'command', name: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
      <button onClick={() => editorRef.current?.exitEditBlock()} style={{ position: 'relative' }}>exit edit block</button>
      <button disabled={!canUndo} onClick={() => editorRef.current?.undo()} style={{ position: 'relative' }}>undo</button>
      <button disabled={!canRedo} onClick={() => editorRef.current?.redo()} style={{ position: 'relative' }}>redo</button>
      {allSnapTypes.map((type) => (
        <span key={type} style={{ position: 'relative' }}>
          <input type='checkbox' checked={snapTypes.includes(type)} id={type} onChange={(e) => setSnapTypes(e.target.checked ? [...snapTypes, type] : snapTypes.filter((d) => d !== type))} />
          <label htmlFor={type}>{type}</label>
        </span>
      ))}
      <span style={{ position: 'relative' }}>
        <input type='checkbox' checked={angleSnapEnabled} id='angle snap' onChange={(e) => setAngleSnapEnabled(e.target.checked)} />
        <label htmlFor='angle snap'>angle snap</label>
      </span>
    </div>
  )
}
