import React from 'react'
import { SnapPointType, allSnapTypes, Nullable, useWindowSize } from '../src'
import { BaseContent } from './models/model'
import { CADEditor, CADEditorRef, usePlugins } from './cad-editor'

const draftKey = 'composable-editor-canvas-whiteboard'

export const WhiteBoard = () => {
  const [initialState] = React.useState(() => {
    const draftState = localStorage.getItem(draftKey)
    return draftState ? JSON.parse(draftState) as Nullable<BaseContent>[] : []
  })
  const editorRef = React.useRef<CADEditorRef | null>(null)
  const [snapTypes, setSnapTypes] = React.useState<readonly SnapPointType[]>(allSnapTypes)
  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)
  const [panelVisible, setPanelVisible] = React.useState(true)
  const [operation, setOperation] = React.useState<string>()
  const size = useWindowSize()
  const { pluginLoaded, pluginCommandTypes } = usePlugins()
  if (!pluginLoaded) {
    return null
  }
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
        panelVisible={panelVisible}
        onChange={(state) => localStorage.setItem(draftKey, JSON.stringify(state))}
      />
      <div style={{ position: 'relative' }}>
        {(['move canvas'] as const).map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'non command', name: p })} key={p} style={{ borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
        <button onClick={() => editorRef.current?.compress()}>compress</button>
        <button onClick={() => editorRef.current?.exitEditBlock()}>exit edit container</button>
        <button disabled={!canUndo} onClick={() => editorRef.current?.undo()}>undo</button>
        <button disabled={!canRedo} onClick={() => editorRef.current?.redo()}>redo</button>
        <button onClick={() => setPanelVisible(!panelVisible)}>panel visible</button>
        {allSnapTypes.map((type) => (
          <span key={type}>
            <input type='checkbox' checked={snapTypes.includes(type)} id={type} onChange={(e) => setSnapTypes(e.target.checked ? [...snapTypes, type] : snapTypes.filter((d) => d !== type))} />
            <label htmlFor={type}>{type}</label>
          </span>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        {pluginCommandTypes.map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'command', name: p.name })} key={p.name} style={{ borderColor: operation === p.name ? 'red' : undefined }}>{p.name}{p.hotkey ? `(${p.hotkey})` : ''}</button>)}
      </div>
    </div>
  )
}
