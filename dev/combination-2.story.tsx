import React from 'react'
import { useWindowSize, SnapPointType, allSnapTypes, colorStringToNumber, getColorString, Nullable, useLocalStorageState } from '../src'
import { Patch } from 'immer'
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { BaseContent } from './models/model'
import { getAllRendererTypes } from './renderers/renderer'
import { OffsetXContext } from './story-app'
import type { EllipseContent } from './plugins/ellipse.plugin'
import { CADEditor, CADEditorRef, usePlugins } from './cad-editor'
import type { RectContent } from './plugins/rect.plugin'
import type { CircleContent } from './plugins/circle-arc.plugin'
import type { RegularPolygonContent } from './plugins/regular-polygon.plugin'
import type { StarContent } from './plugins/star.plugin'

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

const key = 'combination-2.json'

export default () => {
  const [initialState, setInitialState] = React.useState<Nullable<BaseContent>[]>()
  const [coEdit, setCoEdit] = React.useState(true)
  const { pluginLoaded, pluginCommandTypes } = usePlugins()
  const [panelVisible, setPanelVisible] = useLocalStorageState('composable-editor-canvas-combination2:panel', true)
  const [printMode, setPrintMode] = useLocalStorageState('composable-editor-canvas-combination2:print-mode', false)

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://storage.yorkyao.com/${key}`)
        const json: Nullable<BaseContent>[] = await res.json()
        setInitialState(json)
      } catch {
        setInitialState([])
      }
    })()
  }, [])

  const ws = React.useRef<WebSocket>()
  React.useEffect(() => {
    ws.current = new WebSocket(`wss://storage.yorkyao.com/ws/composable-editor-canvas?key=${key}`)
    setWsHeartbeat(ws.current, '{"method":"ping"}')
    return () => ws.current?.close()
  }, [])

  const onApplyPatchesFromSelf = (patches: Patch[], reversePatches: Patch[]) => {
    if (ws.current && ws.current.readyState === ws.current.OPEN && coEdit) {
      const operations = patches.map((p) => ({ ...p, path: p.path.map((c) => `/${c}`).join('') }))
      ws.current.send(JSON.stringify({ method: 'patch', operations, reversePatches, operator: me }))
    }
  }
  const onSendSelection = (selectedContents: readonly number[]) => {
    if (ws.current && ws.current.readyState === ws.current.OPEN && coEdit) {
      ws.current.send(JSON.stringify({ method: 'selection', selectedContents, operator: me }))
    }
  }

  const addMockData = () => {
    setInitialState(undefined)
    setCoEdit(false)
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
  React.useEffect(() => {
    if (!ws.current || !editorRef.current) {
      return
    }
    ws.current.onmessage = (data: MessageEvent<unknown>) => {
      if (editorRef.current && typeof data.data === 'string' && data.data && coEdit) {
        const json = JSON.parse(data.data) as
          | { method: 'patch', operations: (Omit<Patch, 'path'> & { path: string })[], reversePatches: Patch[], operator: string }
          | { method: 'selection', selectedContents: number[], operator: string }
        if (json.method === 'patch') {
          editorRef.current.handlePatchesEvent({
            ...json,
            patches: json.operations.map((p) => ({ ...p, path: p.path.substring(1).split('/') }))
          })
        } else if (json.method === 'selection') {
          editorRef.current.handleSelectionEvent(json)
        }
      }
    }
  }, [ws.current, editorRef.current])

  const [readOnly, setReadOnly] = React.useState(false)
  const [snapTypes, setSnapTypes] = useLocalStorageState<readonly SnapPointType[]>('composable-editor-canvas-combination2:snaps', allSnapTypes)
  const [renderTarget, setRenderTarget] = useLocalStorageState<string | undefined>('composable-editor-canvas-combination2:render-target', undefined)
  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)
  const [operation, setOperation] = React.useState<string>()
  const [inputFixed, setInputFixed] = useLocalStorageState('composable-editor-canvas-combination2:input-fiixed', false)
  const [backgroundColor, setBackgroundColor] = useLocalStorageState('composable-editor-canvas-combination2:background-color', 0xffffff)
  const offsetX = React.useContext(OffsetXContext)
  const size = useWindowSize()

  return (
    <div style={{ height: '100%' }}>
      {initialState && pluginLoaded && (
        <CADEditor
          ref={editorRef}
          id='combination2'
          initialState={initialState}
          width={size.width / 2 + offsetX}
          height={size.height}
          onApplyPatchesFromSelf={onApplyPatchesFromSelf}
          onSendSelection={onSendSelection}
          readOnly={readOnly}
          snapTypes={snapTypes}
          renderTarget={renderTarget}
          setCanUndo={setCanUndo}
          setCanRedo={setCanRedo}
          setOperation={setOperation}
          inputFixed={inputFixed}
          backgroundColor={backgroundColor}
          debug
          panelVisible={panelVisible}
          printMode={printMode}
        />
      )}
      <div style={{ position: 'fixed', width: `calc(50% + ${offsetX}px)` }}>
        {!readOnly && pluginCommandTypes.map((p) => {
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
        {(['move canvas', 'zoom window'] as const).map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'non command', name: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
        <button onClick={() => addMockData()} style={{ position: 'relative' }}>add mock data</button>
        {!readOnly && <button disabled={!canUndo} onClick={() => editorRef.current?.undo()} style={{ position: 'relative' }}>undo</button>}
        {!readOnly && <button disabled={!canRedo} onClick={() => editorRef.current?.redo()} style={{ position: 'relative' }}>redo</button>}
        {!readOnly && <span>
          <input type='checkbox' checked={panelVisible} id='panel' onChange={() => setPanelVisible(!panelVisible)} />
          <label htmlFor='panel'>panel</label>
        </span>}
        <span>
          <input type='checkbox' checked={printMode} id='print mode' onChange={() => setPrintMode(!printMode)} />
          <label htmlFor='print mode'>print mode</label>
        </span>
        <select value={renderTarget} onChange={(e) => setRenderTarget(e.target.value)} style={{ position: 'relative' }}>
          {getAllRendererTypes().map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        {!readOnly && allSnapTypes.map((type) => (
          <span key={type} style={{ position: 'relative' }}>
            <input type='checkbox' checked={snapTypes.includes(type)} id={type} onChange={(e) => setSnapTypes(e.target.checked ? [...snapTypes, type] : snapTypes.filter((d) => d !== type))} />
            <label htmlFor={type}>{type}</label>
          </span>
        ))}
        <span style={{ position: 'relative' }}>
          <input type='checkbox' checked={readOnly} id='read only' onChange={(e) => setReadOnly(e.target.checked)} />
          <label htmlFor='read only'>read only</label>
        </span>
        {!readOnly && <span style={{ position: 'relative' }}>
          <input type='checkbox' checked={inputFixed} id='input fixed' onChange={(e) => setInputFixed(e.target.checked)} />
          <label htmlFor='input fixed'>input fixed</label>
        </span>}
        <input type='color' style={{ position: 'relative' }} value={getColorString(backgroundColor)} onChange={(e) => setBackgroundColor(colorStringToNumber(e.target.value))} />
      </div>
    </div>
  )
}
