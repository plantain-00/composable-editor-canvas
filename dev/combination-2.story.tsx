import React from 'react'
import { bindMultipleRefs, reactCanvasRenderTarget, reactSvgRenderTarget, reverseTransformPosition, Transform2, useDragSelect, useKey, usePatchBasedUndoRedo, useWheelScroll, useWheelZoom, useWindowSize, useZoom } from '../src'
import { executeCommand, getContentByClickPosition, getContentsByClickTwoPositions, isCommand, isContentSelectable, isExecutableCommand } from './util-2'
import produce, { enablePatches, Patch } from 'immer'
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { BaseContent, registerModel, useModelsCreate, useModelsEdit, useSnap } from './models/model'
import { lineModel } from './models/line-model'
import { circleModel } from './models/circle-model'
import { polylineModel } from './models/polyline-model'
import { rectModel } from './models/rect-model'
import { registerCommand, useCommands } from './commands/command'
import { moveCommand } from './commands/move'
import { rotateCommand } from './commands/rotate'
import { mirrorCommand } from './commands/mirror'
import { cloneCommand } from './commands/clone'
import { explodeCommand } from './commands/explode'
import { deleteCommand } from './commands/delete'
import { getAllRendererTypes, registerRenderer, Renderer } from './renderers/renderer'
import { reactPixiRenderTarget } from './renderers/react-pixi-render-target'
import { polygonModel } from './models/polygon-model'
import { ellipseModel } from './models/ellipse-model'
import { arcModel } from './models/arc-model'
import { splineModel } from './models/spline-model'
import { ellipseArcModel } from './models/ellipse-arc-model'

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

const isMacKeyboard = /Mac|iPod|iPhone|iPad/.test(navigator.platform)

enablePatches()

registerModel(lineModel)
registerModel(circleModel)
registerModel(polylineModel)
registerModel(rectModel)
registerModel(polygonModel)
registerModel(ellipseModel)
registerModel(arcModel)
registerModel(splineModel)
registerModel(ellipseArcModel)

registerCommand(moveCommand)
registerCommand(rotateCommand)
registerCommand(mirrorCommand)
registerCommand(cloneCommand)
registerCommand(deleteCommand)
registerCommand(explodeCommand)

registerRenderer(reactSvgRenderTarget)
registerRenderer(reactPixiRenderTarget)
registerRenderer(reactCanvasRenderTarget)

const key = 'combination-2.json'

export default () => {
  const [initialState, setInitialState] = React.useState<BaseContent[]>()
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://storage.yorkyao.com/${key}`)
        const json: BaseContent[] = await res.json()
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

  const onApplyPatches = (patches: Patch[], reversePatches: Patch[]) => {
    if (ws.current && ws.current.readyState === ws.current.OPEN) {
      const operations = patches.map((p) => ({ ...p, path: p.path.map((c) => `/${c}`).join('') }))
      ws.current.send(JSON.stringify({ method: 'patch', operations, reversePatches, operator: me }))
    }
  }
  const onSendSelection = (selectedContents: number[]) => {
    if (ws.current && ws.current.readyState === ws.current.OPEN) {
      ws.current.send(JSON.stringify({ method: 'selection', selectedContents, operator: me }))
    }
  }

  const editorRef = React.useRef<CADEditorRef | null>(null)
  React.useEffect(() => {
    if (!ws.current || !editorRef.current) {
      return
    }
    ws.current.onmessage = (data: MessageEvent<unknown>) => {
      if (editorRef.current && typeof data.data === 'string' && data.data) {
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
  const [angleSnapEnabled, setAngleSnapEnabled] = React.useState(true)
  const [snapTypes, setSnapTypes] = React.useState(['endpoint', 'midpoint', 'center', 'intersection'])
  const [renderTarget, setRenderTarget] = React.useState<string>()
  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)
  const [operations, setOperations] = React.useState<[string?, string?]>([])

  return (
    <div style={{ height: '100%' }}>
      {initialState && (
        <CADEditor
          ref={editorRef}
          initialState={initialState}
          onApplyPatches={onApplyPatches}
          onSendSelection={onSendSelection}
          readOnly={readOnly}
          angleSnapEnabled={angleSnapEnabled}
          snapTypes={snapTypes}
          renderTarget={renderTarget}
          setCanUndo={setCanUndo}
          setCanRedo={setCanRedo}
          operations={operations}
          setOperations={setOperations}
        />
      )}
      {!readOnly && ['2 points', '3 points', 'center radius', 'center diameter', 'line', 'polyline', 'rect', 'polygon', 'ellipse center', 'ellipse endpoint', 'spline', 'spline fitting', 'circle arc', 'ellipse arc', 'move', 'delete', 'rotate', 'clone', 'explode', 'mirror'].map((p) => <button onClick={() => editorRef.current?.onStartOperation(p)} key={p} style={{ position: 'relative', borderColor: operations.includes(p) ? 'red' : undefined }}>{p}</button>)}
      {!readOnly && <button disabled={!canUndo} onClick={() => editorRef.current?.undo()} style={{ position: 'relative' }}>undo</button>}
      {!readOnly && <button disabled={!canRedo} onClick={() => editorRef.current?.redo()} style={{ position: 'relative' }}>redo</button>}
      <select onChange={(e) => setRenderTarget(e.target.value)} style={{ position: 'relative' }}>
        {getAllRendererTypes().map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      {!readOnly && ['endpoint', 'midpoint', 'center', 'intersection'].map((type) => (
        <span key={type} style={{ position: 'relative' }}>
          <input type='checkbox' checked={snapTypes.includes(type)} id={type} onChange={(e) => setSnapTypes(e.target.checked ? [...snapTypes, type] : snapTypes.filter((d) => d !== type))} />
          <label htmlFor={type}>{type}</label>
        </span>
      ))}
      {!readOnly && <span style={{ position: 'relative' }}>
        <input type='checkbox' checked={angleSnapEnabled} id='angle snap' onChange={(e) => setAngleSnapEnabled(e.target.checked)} />
        <label htmlFor='angle snap'>angle snap</label>
      </span>}
      <span style={{ position: 'relative' }}>
        <input type='checkbox' checked={readOnly} id='read only' onChange={(e) => setReadOnly(e.target.checked)} />
        <label htmlFor='read only'>read only</label>
      </span>
    </div>
  )
}

const CADEditor = React.forwardRef((props: {
  initialState: BaseContent<string>[]
  onApplyPatches: ((patches: Patch[], reversePatches: Patch[]) => void)
  onSendSelection: (selectedContents: number[]) => void
  readOnly: boolean
  angleSnapEnabled: boolean
  snapTypes: string[]
  renderTarget?: string
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  operations: [string?, string?]
  setOperations: (operation: [string?, string?]) => void
}, ref: React.ForwardedRef<CADEditorRef>) => {
  const { operations: [operation, nextOperation], setOperations, snapTypes, angleSnapEnabled, renderTarget, readOnly } = props
  const { state, setState, undo, redo, canRedo, canUndo, applyPatchFromSelf, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, me, {
    onApplyPatches: props.onApplyPatches,
  })
  const [selectedContents, setSelectedContents] = React.useState<number[]>([])
  const [hoveringContent, setHoveringContent] = React.useState<number>(-1)
  const previewPatches: Patch[] = []
  const previewReversePatches: Patch[] = []

  const [scale, setScale] = React.useState(1)
  const [x, setX] = React.useState(0)
  const [y, setY] = React.useState(0)
  const wheelScrollRef = useWheelScroll<HTMLDivElement>(setX, setY, -1, -1)
  const wheelZoomRef = useWheelZoom<HTMLDivElement>(setScale)
  const { zoomIn, zoomOut } = useZoom(scale, setScale)
  useKey((k) => k.code === 'Minus' && (isMacKeyboard ? k.metaKey : k.ctrlKey), zoomOut)
  useKey((k) => k.code === 'Equal' && (isMacKeyboard ? k.metaKey : k.ctrlKey), zoomIn)
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  let transform: Transform2 | undefined = {
    x,
    y,
    scale,
    center: {
      x: width / 2,
      y: height / 2,
    },
  }
  transform = undefined

  // commands
  const { commandMasks, updateContent, startCommand } = useCommands(
    () => {
      applyPatchFromSelf(previewPatches, previewReversePatches)
      setOperations([])
    },
    (e) => getSnapPoint(e, state, snapTypes),
    operation,
  )

  // select by region
  const { onStartSelect, dragSelectMask } = useDragSelect((start, end) => {
    if (end) {
      setSelectedContents([...selectedContents, ...getContentsByClickTwoPositions(state, start, end, contentSelectable)])
    }
  })

  // snap point
  const { snapAssistentContents, getSnapPoint, snapPoint } = useSnap(!!operation)
  // edit model
  const { editMasks, updateEditPreview, editBarMap } = useModelsEdit(() => applyPatchFromSelf(previewPatches, previewReversePatches), transform)
  // create model
  const { createInputs, updateCreatePreview, onStartCreate, onCreatingMove, createSubcommands, createAssistentContents } = useModelsCreate(operation, (c) => {
    setState((draft) => {
      draft.push(...c)
    })
    setOperations([])
  }, angleSnapEnabled && !snapPoint)

  // content data -> preview data / assistent data
  const assistentContents: BaseContent[] = [
    ...snapAssistentContents,
    ...createAssistentContents,
  ]
  const previewContents = produce(state, (draft) => {
    const newContents: BaseContent[] = []
    draft.forEach((content, i) => {
      if (selectedContents.includes(i)) {
        const result = updateContent(content)
        if (result.assistentContents) {
          assistentContents.push(...result.assistentContents)
        }
        if (result.newContents) {
          newContents.push(...result.newContents)
        }
      }
    })
    draft.push(...newContents)
    updateEditPreview(draft)
    updateCreatePreview(draft)
  }, (patches, reversePatches) => {
    previewPatches.push(...patches)
    previewReversePatches.push(...reversePatches)
  })

  const executeCommandForSelectedContents = (name: string) => {
    const removedContents: number[] = []
    const newContents: BaseContent[] = []
    state.forEach((c, i) => {
      if (selectedContents.includes(i)) {
        const result = executeCommand(name, c)
        if (result?.newContents) {
          newContents.push(...result.newContents)
        }
        if (result?.removed) {
          removedContents.push(i)
        }
      }
    })
    if (removedContents.length + newContents.length > 0) {
      setState((draft) => {
        for (let i = draft.length; i >= 0; i--) {
          if (removedContents.includes(i)) {
            draft.splice(i, 1)
          }
        }
        draft.push(...newContents)
      })
    }
    setSelectedContents([])
  }
  const contentSelectable = (content: BaseContent, index: number) => {
    // ignore selected contents
    if (selectedContents.includes(index)) {
      return false
    }
    return nextOperation ? isContentSelectable(nextOperation, content) : true
  }

  useKey((e) => e.key === 'Escape', () => {
    setOperations([])
    setSelectedContents([])
  }, [setOperations])
  useKey((e) => e.key === 'Enter', () => {
    // after selection, execute command immediately
    if (nextOperation && isExecutableCommand(nextOperation)) {
      executeCommandForSelectedContents(nextOperation)
      setOperations([operation])
      return
    }
    // after selection, continue operation
    if (nextOperation) {
      setOperations([nextOperation])
    }
  })
  useKey((k) => k.code === 'KeyZ' && !k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), undo)
  useKey((k) => k.code === 'KeyZ' && k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), redo)

  React.useEffect(() => props.setCanUndo(canUndo), [canUndo])
  React.useEffect(() => props.setCanRedo(canRedo), [canRedo])

  const [othersSelectedContents, setOthersSelectedContents] = React.useState<{ selection: number[], operator: string }[]>([])

  React.useImperativeHandle<CADEditorRef, CADEditorRef>(ref, () => ({
    handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }) {
      try {
        applyPatchFromOtherOperators(data.patches, data.reversePatches, data.operator)
      } catch (error) {
        console.error(error)
      }
    },
    handleSelectionEvent(data: { selectedContents: number[], operator: string }) {
      setOthersSelectedContents(produce(othersSelectedContents, (draft) => {
        const index = othersSelectedContents.findIndex((s) => s.operator === data.operator)
        if (index >= 0) {
          draft[index].selection = data.selectedContents
        } else {
          draft.push({ selection: data.selectedContents, operator: data.operator })
        }
      }))
    },
    undo,
    redo,
    onStartOperation,
  }), [applyPatchFromOtherOperators])

  React.useEffect(() => {
    props.onSendSelection(selectedContents)
  }, [selectedContents])

  const onClick = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const p = getSnapPoint(e, state, snapTypes)
    // if the operation is create model/command, start it
    onStartCreate(p)
    if (operation && isCommand(operation)) {
      startCommand(operation, p)
    }
    if (!operation) {
      if (hoveringContent >= 0) {
        // if no operation and is hovering content, add it to selection
        setSelectedContents([...selectedContents, hoveringContent])
      } else {
        // if no operation and is not hovering, start selection by region
        onStartSelect(e)
      }
    }
  }
  const onMouseMove = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    onCreatingMove(getSnapPoint(e, state, snapTypes))
    if (!operation) {
      // if no operation, hover by position
      setHoveringContent(getContentByClickPosition(state, reverseTransformPosition({ x: e.clientX, y: e.clientY }, transform), contentSelectable))
    }
  }
  const onStartOperation = (p: string) => {
    // for commands, but no content selected, start to select some
    if (isCommand(p) && selectedContents.length === 0) {
      setOperations([undefined, p])
      return
    }
    // for executable commands, if there are selections, do it
    if (isExecutableCommand(p)) {
      executeCommandForSelectedContents(p)
      return
    }
    setOperations([p])
  }

  return (
    <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}>
      <div style={{ cursor: 'crosshair', position: 'absolute', inset: '0px' }} onMouseMove={onMouseMove}>
        <Renderer
          type={renderTarget}
          contents={[...previewContents, ...assistentContents]}
          selectedContents={selectedContents}
          othersSelectedContents={othersSelectedContents}
          hoveringContent={hoveringContent}
          onClick={onClick}
          transform={transform}
          width={width}
          height={height}
        />
        {!readOnly && previewContents.map((s, i) => {
          if (selectedContents.includes(i)) {
            const EditBar = editBarMap[s.type]
            if (EditBar) {
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    boxSizing: 'border-box',
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: transform ? `scale(${transform.scale}) translate(${transform.x / transform.scale}px, ${transform.y / transform.scale}px)` : undefined,
                    pointerEvents: 'none',
                  }}
                >
                  <EditBar content={s} index={i} />
                </div>
              )
            }
          }
          return null
        })}
        {!readOnly && createInputs}
      </div>
      {!readOnly && createSubcommands}
      {editMasks}
      {dragSelectMask}
      {commandMasks}
    </div>
  )
})

interface CADEditorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
  handleSelectionEvent(data: { selectedContents: number[], operator: string }): void
  undo(): void
  redo(): void
  onStartOperation(p: string): void
}
