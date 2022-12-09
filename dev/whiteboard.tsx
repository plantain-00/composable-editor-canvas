import React from 'react'
import { SnapPointType, allSnapTypes, Nullable, useLocalStorageState } from '../src'
import { BaseContent } from './cad-editor/model'
import { CADEditor, CADEditorRef, useInitialStateValidated, usePlugins } from './cad-editor/cad-editor'

export function WhiteBoard() {
  const [, onChange, initialState] = useLocalStorageState<readonly Nullable<BaseContent>[]>('composable-editor-canvas-whiteboard', [])
  const editorRef = React.useRef<CADEditorRef | null>(null)
  const [snapTypes, setSnapTypes] = useLocalStorageState<readonly SnapPointType[]>('composable-editor-canvas-whiteboard:snaps', allSnapTypes)
  const [printMode, setPrintMode] = useLocalStorageState('composable-editor-canvas-whiteboard:print-mode', false)
  const [operation, setOperation] = React.useState<string>()
  const { pluginLoaded, pluginCommandTypes } = usePlugins()
  const valid = useInitialStateValidated(initialState, pluginLoaded)
  if (!valid) {
    return null
  }
  return (
    <div>
      <CADEditor
        ref={editorRef}
        id='whiteboard'
        initialState={initialState}
        snapTypes={snapTypes}
        renderTarget='svg'
        setOperation={setOperation}
        backgroundColor={0xffffff}
        panelVisible
        printMode={printMode}
        onChange={onChange}
      />
      <div style={{ position: 'relative' }}>
        <label>
          <input type='checkbox' checked={printMode} onChange={() => setPrintMode(!printMode)} />
          print mode
        </label>
        {allSnapTypes.map((type) => (
          <label key={type}>
            <input type='checkbox' checked={snapTypes.includes(type)} onChange={(e) => setSnapTypes(e.target.checked ? [...snapTypes, type] : snapTypes.filter((d) => d !== type))} />
            {type}
          </label>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        {pluginCommandTypes.map((p) => {
          if (p.icon) {
            const svg = React.cloneElement<React.HTMLAttributes<unknown>>(p.icon, {
              onClick: () => editorRef.current?.startOperation({ type: 'command', name: p.name }),
              style: {
                width: '20px',
                height: '20px',
                margin: '5px',
                cursor: 'pointer',
                color: operation === p.name ? 'red' : undefined,
              },
            })
            return (
              <span title={p.name} key={p.name}>
                {svg}
              </span>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
