import React from 'react'
import { SnapPointType, allSnapTypes, Nullable, useLocalStorageState, getColorString, colorStringToNumber } from '../src'
import { BaseContent } from './cad-editor/model'
import { CADEditor, CADEditorRef, useInitialStateValidated, usePlugins } from './cad-editor/cad-editor'
import { getAllRendererTypes } from './cad-editor/renderer'

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

export function WhiteBoard() {
  const [, onChange, initialState] = useLocalStorageState<readonly Nullable<BaseContent>[]>('composable-editor-canvas-whiteboard', [])
  const editorRef = React.useRef<CADEditorRef | null>(null)
  const [snapTypes, setSnapTypes] = useLocalStorageState<readonly SnapPointType[]>('composable-editor-canvas-whiteboard:snaps', allSnapTypes)
  const [printMode, setPrintMode] = useLocalStorageState('composable-editor-canvas-whiteboard:print-mode', false)
  const [performanceMode, setPerformanceMode] = useLocalStorageState('composable-editor-canvas-whiteboard:performance-mode', false)
  const [renderTarget, setRenderTarget] = useLocalStorageState<string>('composable-editor-canvas-whiteboard:render-target', 'svg')
  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)
  const [backgroundColor, setBackgroundColor] = useLocalStorageState('composable-editor-canvas-whiteboard:background-color', 0xffffff)
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
        operator={me}
        initialState={initialState}
        snapTypes={snapTypes}
        renderTarget={renderTarget}
        setCanUndo={setCanUndo}
        setCanRedo={setCanRedo}
        setOperation={setOperation}
        backgroundColor={backgroundColor}
        panelVisible
        printMode={printMode}
        performanceMode={performanceMode}
        onChange={onChange}
      />
      <div style={{ position: 'relative' }}>
        <label>
          <input type='checkbox' checked={printMode} onChange={() => setPrintMode(!printMode)} />
          print mode
        </label>
        <label>
          <input type='checkbox' checked={performanceMode} onChange={() => setPerformanceMode(!performanceMode)} />
          performance mode
        </label>
        {allSnapTypes.map((type) => (
          <label key={type}>
            <input type='checkbox' checked={snapTypes.includes(type)} onChange={(e) => setSnapTypes(e.target.checked ? [...snapTypes, type] : snapTypes.filter((d) => d !== type))} />
            {type}
          </label>
        ))}
        {(['move canvas', 'zoom window'] as const).map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'non command', name: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
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
        <input type='color' style={{ position: 'relative', top: '-5px' }} value={getColorString(backgroundColor)} onChange={(e) => setBackgroundColor(colorStringToNumber(e.target.value))} />
        <button disabled={!canUndo} onClick={() => editorRef.current?.undo()} style={{ position: 'relative', top: '-10px' }}>undo</button>
        <button disabled={!canRedo} onClick={() => editorRef.current?.redo()} style={{ position: 'relative', top: '-10px' }}>redo</button>
        <select value={renderTarget} onChange={(e) => setRenderTarget(e.target.value)} style={{ position: 'relative', top: '-10px' }}>
          {getAllRendererTypes().map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
    </div>
  )
}
