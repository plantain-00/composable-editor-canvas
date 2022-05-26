import React from 'react'
import { bindMultipleRefs, reactCanvasRenderTarget, reactSvgRenderTarget, useCursorInput, useDragMove, useDragSelect, useHovering, useKey, usePatchBasedUndoRedo, useSelection, useWheelScroll, useWheelZoom, useWindowSize, useZoom } from '../src'
import { getContentByClickPosition, getContentsByClickTwoPositions } from './util-2'
import produce, { enablePatches, Patch, produceWithPatches } from 'immer'
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { BaseContent, fixedInputStyle, registerModel, reverseTransformPosition, Transform, useModelsCreate, useModelsEdit, useSnap } from './models/model'
import { lineModel } from './models/line-model'
import { circleModel } from './models/circle-model'
import { polylineModel } from './models/polyline-model'
import { rectModel } from './models/rect-model'
import { getCommand, registerCommand, useCommands } from './commands/command'
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
import { textModel } from './models/text-model'
import { blockModel } from './models/block-model'
import { blockReferenceModel } from './models/block-reference-model'
import { createBlockCommand } from './commands/create-block'
import { createBlockReferenceCommand } from './commands/create-block-reference'
import { startEditBlockCommand } from './commands/start-edit-block'

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
registerModel(textModel)
registerModel(blockModel)
registerModel(blockReferenceModel)

registerCommand(moveCommand)
registerCommand(rotateCommand)
registerCommand(mirrorCommand)
registerCommand(cloneCommand)
registerCommand(deleteCommand)
registerCommand(explodeCommand)
registerCommand(createBlockCommand)
registerCommand(startEditBlockCommand)
registerCommand(createBlockReferenceCommand)

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
  const onSendSelection = (selectedContents: readonly number[]) => {
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
  const [operations, setOperations] = React.useState<[Operation?, Operation?]>([])
  const [inputFixed, setInputFixed] = React.useState(false)

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
          inputFixed={inputFixed}
        />
      )}
      <div style={{ position: 'fixed', width: '50%' }}>
        {(['move canvas'] as const).map((p) => <button onClick={() => editorRef.current?.onStartOperation({ type: p })} key={p} style={{ position: 'relative', borderColor: operations.some((r) => r?.type === p) ? 'red' : undefined }}>{p}</button>)}
        {!readOnly && ['2 points', '3 points', 'center radius', 'center diameter', 'line', 'polyline', 'rect', 'polygon', 'ellipse center', 'ellipse endpoint', 'spline', 'spline fitting', 'circle arc', 'ellipse arc'].map((p) => <button onClick={() => editorRef.current?.onStartOperation({ type: 'create model', name: p })} key={p} style={{ position: 'relative', borderColor: operations.some((r) => r?.type === 'create model' && r.name === p) ? 'red' : undefined }}>{p}</button>)}
        {!readOnly && ['move', 'delete', 'rotate', 'clone', 'explode', 'mirror', 'create block', 'create block reference', 'start edit block'].map((p) => <button onClick={() => editorRef.current?.onStartOperation({ type: 'command', name: p })} key={p} style={{ position: 'relative', borderColor: operations.some((r) => r?.type === 'command' && r.name === p) ? 'red' : undefined }}>{p}</button>)}
        {!readOnly && <button onClick={() => editorRef.current?.exitEditBlock()} style={{ position: 'relative' }}>exit edit block</button>}
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
        {!readOnly && <span style={{ position: 'relative' }}>
          <input type='checkbox' checked={inputFixed} id='input fixed' onChange={(e) => setInputFixed(e.target.checked)} />
          <label htmlFor='input fixed'>input fixed</label>
        </span>}
      </div>
    </div>
  )
}

const CADEditor = React.forwardRef((props: {
  initialState: BaseContent<string>[]
  onApplyPatches: ((patches: Patch[], reversePatches: Patch[]) => void)
  onSendSelection: (selectedContents: readonly number[]) => void
  readOnly: boolean
  angleSnapEnabled: boolean
  inputFixed: boolean
  snapTypes: string[]
  renderTarget?: string
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  operations: [Operation?, Operation?]
  setOperations: (operations: [Operation?, Operation?]) => void
}, ref: React.ForwardedRef<CADEditorRef>) => {
  const { operations: [operation, nextOperation], setOperations, snapTypes, angleSnapEnabled, renderTarget, readOnly, inputFixed } = props
  const { state, setState, undo, redo, canRedo, canUndo, applyPatchFromSelf, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, me, {
    onApplyPatches: props.onApplyPatches,
  })
  const { selected, filterSelection, isSelected, selectedCount, addSelection, clearSelection } = useSelection<number | readonly [number, number]>({
    onChange(selected) {
      props.onSendSelection(selected.map((s) => typeof s === 'number' ? s : s[0]))
    }
  })
  const { hovering, isHovering, setHovering } = useHovering<number | readonly [number, number]>()
  const previewPatches: Patch[] = []
  const previewReversePatches: Patch[] = []

  const { x, y, ref: wheelScrollRef, setX, setY } = useWheelScroll<HTMLDivElement>()
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    onChange(oldScale, newScale, cursor) {
      setX((x) => cursor.x - width / 2 - (cursor.x - width / 2 - x) * newScale / oldScale)
      setY((y) => cursor.y - height / 2 - (cursor.y - height / 2 - y) * newScale / oldScale)
    }
  })
  const { zoomIn, zoomOut } = useZoom(scale, setScale)
  useKey((k) => k.code === 'Minus' && (isMacKeyboard ? k.metaKey : k.ctrlKey), zoomOut)
  useKey((k) => k.code === 'Equal' && (isMacKeyboard ? k.metaKey : k.ctrlKey), zoomIn)
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask } = useDragMove(
    () => {
      setX((v) => v + offset.x)
      setY((v) => v + offset.y)
    },
  )
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const transform: Transform | undefined = {
    x: x + offset.x,
    y: y + offset.y,
    scale,
    center: {
      x: width / 2,
      y: height / 2,
    },
  }

  const select = (targets: (number | readonly [number, number])[]) => {
    const result = addSelection(targets, operation?.type === 'select' ? operation.count : undefined)
    if (operation?.type === 'select' && operation.count === result.length) {
      startNextOperation((v) => isSelected(v, result))
    }
  }
  const isSelectOperation = operation === undefined || operation.type === 'select' || operation.type === 'select part'
  const [editingStatePath, setEditingStatePath] = React.useState<(string | number)[]>()
  const editingContents = getByPath(state, editingStatePath)

  // commands
  const { commandMasks, updateContent, startCommand, commandInputs, onCommandMove, commandAssistentContents } = useCommands(
    (updateContents) => {
      if (updateContents) {
        const [, ...patches] = produceWithPatches(editingContents, (draft) => {
          updateContents(draft, isSelected)
        })
        applyPatchFromSelf(
          prependPatchPath(patches[0], editingStatePath),
          prependPatchPath(patches[1], editingStatePath),
        )
      } else {
        applyPatchFromSelf(
          prependPatchPath(previewPatches, editingStatePath),
          prependPatchPath(previewReversePatches, editingStatePath),
        )
      }
      setOperations([])
    },
    (p) => getSnapPoint(reverseTransformPosition(p, transform), state, snapTypes),
    angleSnapEnabled,
    inputFixed,
    operation?.type === 'command' ? operation.name : undefined,
  )

  // select by region
  const { onStartSelect, dragSelectMask } = useDragSelect((start, end) => {
    if (end) {
      select(
        getContentsByClickTwoPositions(
          editingContents,
          reverseTransformPosition(start, transform),
          reverseTransformPosition(end, transform),
          contentSelectable,
        ),
      )
    }
  })

  // snap point
  const { snapAssistentContents, getSnapPoint, snapPoint } = useSnap(!isSelectOperation)
  // edit model
  const { editMasks, updateEditPreview, editBarMap } = useModelsEdit(
    () => {
      applyPatchFromSelf(
        prependPatchPath(previewPatches, editingStatePath),
        prependPatchPath(previewReversePatches, editingStatePath),
      )
    },
    (p) => getSnapPoint(reverseTransformPosition(p, transform), state, snapTypes, true),
    angleSnapEnabled,
    transform.scale,
  )
  // create model
  const { createInputs, updateCreatePreview, onStartCreate, onCreatingMove, createAssistentContents } = useModelsCreate(operation?.type === 'create model' ? operation.name : undefined, (c) => {
    setState((draft) => {
      getByPath(draft, editingStatePath).push(...c)
    })
    setOperations([])
  }, angleSnapEnabled && !snapPoint, inputFixed)

  // content data -> preview data / assistent data
  const assistentContents: BaseContent[] = [
    ...snapAssistentContents,
    ...createAssistentContents,
    ...commandAssistentContents,
  ]
  const previewContents = produce(editingContents, (draft) => {
    const newContents: BaseContent[] = []
    draft.forEach((content, i) => {
      if (isSelected(i)) {
        const result = updateContent(content, state)
        if (result.assistentContents) {
          assistentContents.push(...result.assistentContents)
        }
        if (result.newContents) {
          newContents.push(...result.newContents)
        }
      }
    })
    draft.push(...newContents)
    const result = updateEditPreview(draft)
    assistentContents.push(...result.assistentContents)
    updateCreatePreview(draft)
  }, (patches, reversePatches) => {
    previewPatches.push(...patches)
    previewReversePatches.push(...reversePatches)
  })

  const executeCommandForSelectedContents = (name: string, s: (value: number) => boolean | readonly number[]) => {
    const removedContents: number[] = []
    const newContents: BaseContent[] = []
    const command = getCommand(name)
    editingContents.forEach((c, i) => {
      if (s(i) && (command?.contentSelectable?.(c, state) ?? true)) {
        const result = command?.executeCommand?.(c, state, i)
        if (result?.newContents) {
          newContents.push(...result.newContents)
        }
        if (result?.removed) {
          removedContents.push(i)
        }
        if (result?.editingStatePath) {
          setEditingStatePath(result.editingStatePath)
        }
      }
    })
    if (removedContents.length + newContents.length > 0) {
      setState((draft) => {
        draft = getByPath(draft, editingStatePath)
        for (let i = draft.length; i >= 0; i--) {
          if (removedContents.includes(i)) {
            draft.splice(i, 1)
          }
        }
        draft.push(...newContents)
      })
    }
    clearSelection()
  }
  const contentSelectable = (content: BaseContent, index: number) => {
    // ignore selected contents
    if (isSelected(index) === true) {
      return false
    }
    return nextOperation?.type === 'command' ? (getCommand(nextOperation.name)?.contentSelectable?.(content, state) ?? true) : true
  }

  useKey((e) => e.key === 'Escape', () => {
    setOperations([])
    clearSelection()
  }, [setOperations])
  const startNextOperation = (s: (value: number) => boolean | readonly number[]) => {
    // after selection, execute command immediately
    if (nextOperation?.type === 'command' && getCommand(nextOperation.name)?.executeCommand) {
      executeCommandForSelectedContents(nextOperation.name, s)
      setOperations([])
      return
    }
    // after selection, continue operation
    if (nextOperation) {
      setOperations([nextOperation])
    }
  }
  useKey((e) => e.key === 'Enter', () => startNextOperation(isSelected))
  useKey((k) => k.code === 'KeyZ' && !k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), undo)
  useKey((k) => k.code === 'KeyZ' && k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), redo)
  useKey((k) => k.code === 'KeyA' && !k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), (e) => {
    addSelection(selected)
    e.preventDefault()
  })

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
    exitEditBlock() {
      setEditingStatePath(undefined)
      clearSelection()
    },
  }), [applyPatchFromOtherOperators])

  let message = ''
  if (isSelectOperation && nextOperation) {
    if (operation?.type === 'select') {
      message = `select ${operation.count} target`
    } else {
      message = selectedCount ? `${selectedCount} selected, press Enter to finish selection` : 'select targets'
    }
  }
  const { input: cursorInput, setInputPosition } = useCursorInput(message)
  let selectionInput = cursorInput
  if (!readOnly && cursorInput) {
    if (inputFixed) {
      selectionInput = React.cloneElement(cursorInput, {
        style: fixedInputStyle,
      })
    }
  }

  const onClick = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    const p = getSnapPoint(reverseTransformPosition(viewportPosition, transform), editingContents, snapTypes)
    // if the operation is create model/command, start it
    onStartCreate(p)
    if (!isSelectOperation && operation.type === 'command') {
      startCommand(operation.name, p)
    }
    if (isSelectOperation) {
      if (hovering !== undefined) {
        // if hovering content, add it to selection
        select([hovering])
      } else {
        // start selection by region
        onStartSelect(e)
      }
    }
  }
  const onMouseDown = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    if (operation?.type === 'move canvas') {
      onStartMoveCanvas({ x: e.clientX, y: e.clientY })
    }
  }
  const onMouseMove = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    setInputPosition(viewportPosition)
    const p = reverseTransformPosition(viewportPosition, transform)
    onCreatingMove(getSnapPoint(p, editingContents, snapTypes), viewportPosition)
    if (!isSelectOperation && operation.type === 'command') {
      onCommandMove(getSnapPoint(p, editingContents, snapTypes), viewportPosition)
    }
    if (isSelectOperation) {
      // hover by position
      setHovering(getContentByClickPosition(editingContents, p, contentSelectable, operation?.type === 'select part'))
    }
  }
  const onStartOperation = (p: Operation) => {
    if (p.type === 'command') {
      const command = getCommand(p.name)
      if (command) {
        const { selected, isSelected } = filterSelection((v) => command.contentSelectable?.(state[typeof v === 'number' ? v : v[0]], state) ?? true, command.selectCount)
        // for commands, but no/no enough content selected, start to select some
        if (command.selectCount === undefined ? selected.length === 0 : selected.length < command.selectCount) {
          setOperations([
            command.selectCount !== undefined ? { type: 'select', count: command.selectCount } : undefined,
            p,
          ])
          return
        }
        // for executable commands, if there are selections, do it
        if (command.executeCommand) {
          executeCommandForSelectedContents(p.name, isSelected)
          return
        }
      }
    }
    setOperations([p])
  }

  return (
    <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}>
      <div style={{ cursor: operation?.type === 'move canvas' ? 'grab' : 'crosshair', position: 'absolute', inset: '0px' }} onMouseMove={onMouseMove}>
        <Renderer
          type={renderTarget}
          contents={[...previewContents, ...assistentContents]}
          isSelected={isSelected}
          othersSelectedContents={othersSelectedContents}
          isHovering={isHovering}
          onClick={onClick}
          onMouseDown={onMouseDown}
          transform={transform}
          width={width}
          height={height}
        />
        {!readOnly && previewContents.map((s, i) => {
          if (isSelected(i) === true) {
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
                  <EditBar content={s} index={i} contents={editingContents} />
                </div>
              )
            }
          }
          return null
        })}
        {commandMasks}
        {!readOnly && createInputs}
        {selectionInput}
        {!readOnly && commandInputs}
      </div>
      {editMasks}
      {dragSelectMask}
      {moveCanvasMask}
    </div>
  )
})

interface CADEditorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
  handleSelectionEvent(data: { selectedContents: number[], operator: string }): void
  undo(): void
  redo(): void
  onStartOperation(p: Operation): void
  exitEditBlock(): void
}

function prependPatchPath(patches: Patch[], path?: (string | number)[]): Patch[] {
  if (path && path.length > 0) {
    return patches.map((p) => ({ ...p, path: [...path, ...p.path] }))
  }
  return patches
}

function getByPath<T>(target: T, path?: (string | number)[]) {
  if (path) {
    let result: any = target
    for (const p of path) {
      result = result[p]
    }
    return result as T
  }
  return target
}

type Operation =
  | {
    type: 'select'
    count: number
  }
  | {
    type: 'select part'
    count: number
  }
  | {
    type: 'create model'
    name: string
  }
  | {
    type: 'command'
    name: string
  }
  | {
    type: 'move canvas'
  }
