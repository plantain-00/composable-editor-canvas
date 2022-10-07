import React from 'react'
import { useWindowSize, SnapPointType, allSnapTypes, colorStringToNumber, getColorString, Nullable } from '../src'
import { Patch } from 'immer'
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { BaseContent, registerModel } from './models/model'
import { CircleContent } from './models/circle-model'
import { RectContent } from './models/rect-model'
import { Command, registerCommand } from './commands/command'
import { getAllRendererTypes } from './renderers/renderer'
import { EllipseContent } from './models/ellipse-model'
import { OffsetXContext } from './story-app'

import * as core from '../src'
import * as model from './models/model'
import { CADEditor, CADEditorRef } from './cad-editor'

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

const starPlugin = `
export function getModel(ctx) {
  function getStarGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const p0 = { x: content.x, y: content.y - content.outerRadius }
      const p1 = ctx.rotatePositionByCenter({ x: content.x, y: content.y - content.innerRadius }, content, 180 / content.count)
      const points = []
      for (let i = 0; i < content.count; i++) {
        const angle = 360 / content.count * i
        points.push(
          ctx.rotatePositionByCenter(p0, content, angle),
          ctx.rotatePositionByCenter(p1, content, angle),
        )
      }
      return {
        points,
        lines: Array.from(ctx.iteratePolygonLines(points)),
        bounding: ctx.getPointsBounding(points),
      }
    })
  }
  return {
    type: 'star',
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    render({ content, target, color, strokeWidth }) {
      const { lines } = getStarGeometriesFromCache(content)
      const children = []
      for (const line of lines) {
        children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth }))
      }
      return target.renderGroup(children)
    },
    getDefaultColor(content) {
      return content.strokeColor
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isStarContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] }] }
              },
            },
          ]
        }
      })
    },
    getGeometries: getStarGeometriesFromCache,
  }
}

function isStarContent(content) {
  return content.type === 'star'
}

export function getCommand(ctx) {
  return {
    name: 'create star',
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === 'create star',
        (c) => onEnd({
          updateContents: (contents) => {
            const outerRadius = ctx.getTwoPointsDistance(c[0], c[1])
            contents.push({
              type: 'star',
              x: c[0].x,
              y: c[0].y,
              outerRadius,
              innerRadius: outerRadius * 0.5,
              count: 5,
            })
          }
        }),
        {
          once: true,
        },
      )
      const assistentContents = []
      if (line) {
        const outerRadius = ctx.getTwoPointsDistance(line[0], line[1])
        assistentContents.push({
          type: 'star',
          x: line[0].x,
          y: line[0].y,
          outerRadius,
          innerRadius: outerRadius * 0.5,
          count: 5,
        })
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
      }
    },
    selectCount: 0,
  }
}`

const key = 'combination-2.json'

export default () => {
  const [initialState, setInitialState] = React.useState<Nullable<BaseContent>[]>()
  const [coEdit, setCoEdit] = React.useState(true)
  const [pluginCommandNames, setPluginCommandNames] = React.useState<string[]>([])
  const [pluginLoaded, setPluginLoaded] = React.useState(false)

  React.useEffect(() => {
    (async () => {
      try {
        const plugin: { getModel: (ctx: unknown) => model.Model<unknown>, getCommand: (ctx: unknown) => Command } = await import(/* webpackIgnore: true */'data:text/javascript;charset=utf-8,' + encodeURIComponent(starPlugin))
        const ctx = { ...core, ...model }
        registerModel(plugin.getModel(ctx))
        const command = plugin.getCommand(ctx)
        registerCommand(command)
        setPluginCommandNames([...pluginCommandNames, command.name])
        setPluginLoaded(true)
      } catch (e) {
        console.info(e)
        setPluginLoaded(true)
      }
    })()
  }, [])

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
      const json: (CircleContent | RectContent | EllipseContent)[] = []
      const max = 100
      for (let i = 0; i < max; i++) {
        for (let j = 0; j < max; j++) {
          const r = Math.random()
          if (r < 0.3) {
            json.push({
              type: 'circle',
              x: i * 100 + (Math.random() - 0.5) * 50,
              y: j * 100 + (Math.random() - 0.5) * 50,
              r: Math.random() * 100,
            })
          } else if (r < 0.7) {
            json.push({
              type: 'rect',
              x: i * 100 + (Math.random() - 0.5) * 50,
              y: j * 100 + (Math.random() - 0.5) * 50,
              width: Math.random() * 100,
              height: Math.random() * 100,
              angle: Math.random() * 360 - 180,
            })
          } else {
            json.push({
              type: 'ellipse',
              cx: i * 100 + (Math.random() - 0.5) * 50,
              cy: j * 100 + (Math.random() - 0.5) * 50,
              rx: Math.random() * 100,
              ry: Math.random() * 100,
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
  const [snapTypes, setSnapTypes] = React.useState<readonly SnapPointType[]>(allSnapTypes)
  const [renderTarget, setRenderTarget] = React.useState<string>()
  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)
  const [operation, setOperation] = React.useState<string>()
  const [inputFixed, setInputFixed] = React.useState(false)
  const [backgroundColor, setBackgroundColor] = React.useState(0xffffff)
  const offsetX = React.useContext(OffsetXContext)
  const size = useWindowSize()

  return (
    <div style={{ height: '100%' }}>
      {initialState && pluginLoaded && (
        <CADEditor
          ref={editorRef}
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
        />
      )}
      <div style={{ position: 'fixed', width: `calc(50% + ${offsetX}px)` }}>
        {(['move canvas'] as const).map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'non command', name: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
        <button onClick={() => addMockData()} style={{ position: 'relative' }}>add mock data</button>
        <button onClick={() => editorRef.current?.compress()} style={{ position: 'relative' }}>compress</button>
        {!readOnly && ['create line', 'create polyline', 'create polygon', 'create rect', '2 points', '3 points', 'center radius', 'center diameter', 'create tangent tangent radius circle', 'create arc', 'ellipse center', 'ellipse endpoint', 'create ellipse arc', 'spline', 'spline fitting', 'move', 'delete', 'rotate', 'clone', 'explode', 'mirror', 'create block', 'create block reference', 'start edit block', 'fillet', 'chamfer', 'break', 'measure', 'create radial dimension', 'create linear dimension', 'create group', 'fill', 'create text', 'create image', 'create arrow', ...pluginCommandNames].map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'command', name: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
        {!readOnly && <button onClick={() => editorRef.current?.exitEditBlock()} style={{ position: 'relative' }}>exit edit block</button>}
        {!readOnly && <button disabled={!canUndo} onClick={() => editorRef.current?.undo()} style={{ position: 'relative' }}>undo</button>}
        {!readOnly && <button disabled={!canRedo} onClick={() => editorRef.current?.redo()} style={{ position: 'relative' }}>redo</button>}
        <select onChange={(e) => setRenderTarget(e.target.value)} style={{ position: 'relative' }}>
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
