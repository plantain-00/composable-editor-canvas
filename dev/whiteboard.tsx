import React from 'react'
import { SnapPointType, allSnapTypes, Nullable, useWindowSize, useLocalStorageState } from '../src'
import { BaseContent } from './models/model'
import { CADEditor, CADEditorRef, usePlugins } from './cad-editor'

export const WhiteBoard = () => {
  const [initialState, onChange] = useLocalStorageState<readonly Nullable<BaseContent>[]>('composable-editor-canvas-whiteboard', [])
  const editorRef = React.useRef<CADEditorRef | null>(null)
  const [snapTypes, setSnapTypes] = useLocalStorageState<readonly SnapPointType[]>('composable-editor-canvas-whiteboard:snaps', allSnapTypes)
  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)
  const [panelVisible, setPanelVisible] = useLocalStorageState('composable-editor-canvas-whiteboard:panel', true)
  const [printMode, setPrintMode] = useLocalStorageState('composable-editor-canvas-whiteboard:print-mode', false)
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
        printMode={printMode}
        onChange={onChange}
      />
      <div style={{ position: 'relative' }}>
        {(['move canvas'] as const).map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'non command', name: p })} key={p} style={{ borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
        <button disabled={!canUndo} onClick={() => editorRef.current?.undo()}>undo</button>
        <button disabled={!canRedo} onClick={() => editorRef.current?.redo()}>redo</button>
        <span>
          <input type='checkbox' checked={panelVisible} id='panel' onChange={() => setPanelVisible(!panelVisible)} />
          <label htmlFor='panel'>panel</label>
        </span>
        <span>
          <input type='checkbox' checked={printMode} id='print mode' onChange={() => setPrintMode(!printMode)} />
          <label htmlFor='print mode'>print mode</label>
        </span>
        {allSnapTypes.map((type) => (
          <span key={type}>
            <input type='checkbox' checked={snapTypes.includes(type)} id={type} onChange={(e) => setSnapTypes(e.target.checked ? [...snapTypes, type] : snapTypes.filter((d) => d !== type))} />
            <label htmlFor={type}>{type}</label>
          </span>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        {pluginCommandTypes.map((p) => {
          if (p.icon) {
            return React.cloneElement(p.icon, {
              onClick: () => editorRef.current?.startOperation({ type: 'command', name: p.name }),
              key: p.name,
              style: {
                width: '20px',
                height: '20px',
                margin: '5px',
                cursor: 'pointer',
                color: operation === p.name ? 'red' : undefined,
              },
            })
          }
          return null
        })}
      </div>
    </div>
  )
}
