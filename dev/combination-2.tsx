import React from 'react'
import { SnapPointType, allSnapTypes, colorStringToNumber, getColorString, Nullable, useLocalStorageState } from '../src'
import { BaseContent } from './cad-editor/model'
import { getAllRendererTypes } from './cad-editor/renderer'
import type { EllipseContent } from './cad-editor/plugins/ellipse.plugin'
import { CADEditor, CADEditorRef, useInitialStateValidated, usePlugins } from './cad-editor/cad-editor'
import type { RectContent } from './cad-editor/plugins/rect.plugin'
import type { CircleContent } from './cad-editor/plugins/circle-arc.plugin'
import type { RegularPolygonContent } from './cad-editor/plugins/regular-polygon.plugin'
import type { StarContent } from './cad-editor/plugins/star.plugin'

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

export function Combination2() {
  const [initialState, setInitialState] = React.useState<Nullable<BaseContent>[]>()
  const { pluginLoaded, pluginCommandTypes } = usePlugins()
  const [panelVisible, setPanelVisible] = useLocalStorageState('composable-editor-canvas-combination2:panel', true)
  const [printMode, setPrintMode] = useLocalStorageState('composable-editor-canvas-combination2:print-mode', false)
  const [performanceMode, setPerformanceMode] = useLocalStorageState('composable-editor-canvas-combination2:performance-mode', false)
  const valid = useInitialStateValidated(initialState, pluginLoaded)

  React.useEffect(() => {
    setInitialState([])
  }, [])

  const addMockData = () => {
    setInitialState(undefined)
    setTimeout(() => {
      const json: (CircleContent | RectContent | EllipseContent | RegularPolygonContent | StarContent)[] = []
      const max = 200
      for (let i = 0; i < max; i++) {
        for (let j = 0; j < max; j++) {
          const r = Math.random()
          if (r < 0.05) {
            json.push({
              type: 'circle',
              x: i * 100 + (Math.random() - 0.5) * 50,
              y: j * 100 + (Math.random() - 0.5) * 50,
              r: Math.random() * 80 + 20,
            })
          } else if (r < 0.1) {
            json.push({
              type: 'rect',
              x: i * 100 + (Math.random() - 0.5) * 50,
              y: j * 100 + (Math.random() - 0.5) * 50,
              width: Math.random() * 80 + 20,
              height: Math.random() * 20 + 80,
              angle: Math.random() * 360 - 180,
            })
          } else if (r < 0.15) {
            json.push({
              type: 'ellipse',
              cx: i * 100 + (Math.random() - 0.5) * 50,
              cy: j * 100 + (Math.random() - 0.5) * 50,
              rx: Math.random() * 80 + 20,
              ry: Math.random() * 20 + 80,
              angle: Math.random() * 360 - 180,
            })
          } else if (r < 0.2) {
            json.push({
              type: 'regular polygon',
              x: i * 100 + (Math.random() - 0.5) * 50,
              y: j * 100 + (Math.random() - 0.5) * 50,
              radius: Math.random() * 80 + 20,
              count: [3, 5, 6, 8][Math.floor(Math.random() * 4)],
              angle: Math.random() * 360 - 180,
            })
          } else if (r < 0.25) {
            const radius = Math.random() * 80 + 20
            json.push({
              type: 'star',
              x: i * 100 + (Math.random() - 0.5) * 50,
              y: j * 100 + (Math.random() - 0.5) * 50,
              innerRadius: radius * (Math.random() * 0.4 + 0.3),
              outerRadius: radius,
              count: [5, 6, 8][Math.floor(Math.random() * 3)],
              angle: Math.random() * 360 - 180,
            })
          }
        }
      }
      setInitialState(json)
    }, 0)
  }

  const editorRef = React.useRef<CADEditorRef | null>(null)

  const [readOnly, setReadOnly] = React.useState(false)
  const [snapTypes, setSnapTypes] = useLocalStorageState<readonly SnapPointType[]>('composable-editor-canvas-combination2:snaps', allSnapTypes)
  const [renderTarget, setRenderTarget] = useLocalStorageState<string | undefined>('composable-editor-canvas-combination2:render-target', undefined)
  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)
  const [operation, setOperation] = React.useState<string>()
  const [inputFixed, setInputFixed] = useLocalStorageState('composable-editor-canvas-combination2:input-fixed', false)
  const [backgroundColor, setBackgroundColor] = useLocalStorageState('composable-editor-canvas-combination2:background-color', 0xffffff)
  const [debug, setDebug] = useLocalStorageState('composable-editor-canvas-combination2:debug', false)

  return (
    <div style={{ height: '100%' }}>
      {initialState && pluginLoaded && valid && (
        <CADEditor
          ref={editorRef}
          id='combination2'
          operator={me}
          initialState={initialState}
          readOnly={readOnly}
          snapTypes={snapTypes}
          renderTarget={renderTarget}
          setCanUndo={setCanUndo}
          setCanRedo={setCanRedo}
          setOperation={setOperation}
          inputFixed={inputFixed}
          backgroundColor={backgroundColor}
          debug={debug}
          panelVisible={panelVisible}
          printMode={printMode}
          performanceMode={performanceMode}
        />
      )}
      <div style={{ position: 'fixed', width: '100%' }}>
        {!readOnly && pluginCommandTypes.map((p) => {
          if (p.icon) {
            const svg = React.cloneElement<React.HTMLAttributes<unknown>>(p.icon, {
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
            return (
              <span title={p.name} key={p.name}>
                {svg}
              </span>
            )
          }
          return null
        })}
        {(['move canvas', 'zoom window'] as const).map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'non command', name: p })} key={p} style={{ position: 'relative', top: '-10px', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
        <button onClick={() => addMockData()} style={{ position: 'relative', top: '-10px' }}>add mock data</button>
        {!readOnly && <button disabled={!canUndo} onClick={() => editorRef.current?.undo()} style={{ position: 'relative', top: '-10px' }}>undo</button>}
        {!readOnly && <button disabled={!canRedo} onClick={() => editorRef.current?.redo()} style={{ position: 'relative', top: '-10px' }}>redo</button>}
        {!readOnly && <label>
          <input type='checkbox' checked={panelVisible} onChange={() => setPanelVisible(!panelVisible)} />
          panel
        </label>}
        <label>
          <input type='checkbox' checked={printMode} onChange={() => setPrintMode(!printMode)} />
          print mode
        </label>
        <label>
          <input type='checkbox' checked={performanceMode} onChange={() => setPerformanceMode(!performanceMode)} />
          performance mode
        </label>
        <label>
          <input type='checkbox' checked={debug} onChange={() => setDebug(!debug)} />
          debug
        </label>
        <select value={renderTarget} onChange={(e) => setRenderTarget(e.target.value)} style={{ position: 'relative' }}>
          {getAllRendererTypes().map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        {!readOnly && allSnapTypes.map((type) => (
          <label key={type} style={{ position: 'relative' }}>
            <input type='checkbox' checked={snapTypes.includes(type)} onChange={(e) => setSnapTypes(e.target.checked ? [...snapTypes, type] : snapTypes.filter((d) => d !== type))} />
            {type}
          </label>
        ))}
        <label style={{ position: 'relative' }}>
          <input type='checkbox' checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} />
          read only
        </label>
        {!readOnly && <label style={{ position: 'relative' }}>
          <input type='checkbox' checked={inputFixed} onChange={(e) => setInputFixed(e.target.checked)} />
          input fixed
        </label>}
        <input type='color' style={{ position: 'relative' }} value={getColorString(backgroundColor)} onChange={(e) => setBackgroundColor(colorStringToNumber(e.target.value))} />
      </div>
    </div>
  )
}
