import React from 'react'
import { bindMultipleRefs, Position, reactCanvasRenderTarget, reactSvgRenderTarget, useCursorInput, useDragMove, useDragSelect, useHoverPart, useKey, usePatchBasedUndoRedo, useSelectBeforeOperate, useSelectPart, useWheelScroll, useWheelZoom, useWindowSize, useZoom } from '../src'
import { getContentByClickPosition, getContentsByClickTwoPositions } from './util-2'
import produce, { enablePatches, Patch, produceWithPatches } from 'immer'
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { BaseContent, fixedInputStyle, getContentByIndex, getModel, registerModel, reverseTransformPosition, Transform, useModelsEdit, useSnap } from './models/model'
import { LineContent, lineModel } from './models/line-model'
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
import { createCircleCommand } from './commands/create-circle'
import { createArcCommand } from './commands/create-arc'
import { createEllipseCommand } from './commands/create-ellipse'
import { createEllipseArcCommand } from './commands/create-ellipse-arc'
import { createLineCommand } from './commands/create-line'
import { createPolylineCommand } from './commands/create-polyline'
import { createPolygonCommand } from './commands/create-polygon'
import { createRectCommand } from './commands/create-rect'
import { createSplineCommand } from './commands/create-spline'
import { createTangentTangentRadiusCircleCommand } from './commands/create-tangent-tangent-radius-circle'
import { filletCommand } from './commands/fillet'
import { chamferCommand } from './commands/chamfer'
import { breakCommand } from './commands/break'

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
registerCommand(createCircleCommand)
registerCommand(createArcCommand)
registerCommand(createEllipseCommand)
registerCommand(createEllipseArcCommand)
registerCommand(createLineCommand)
registerCommand(createPolylineCommand)
registerCommand(createPolygonCommand)
registerCommand(createRectCommand)
registerCommand(createSplineCommand)
registerCommand(createTangentTangentRadiusCircleCommand)
registerCommand(filletCommand)
registerCommand(chamferCommand)
registerCommand(breakCommand)

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
  const [operation, setOperation] = React.useState<string>()
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
          setOperation={setOperation}
          inputFixed={inputFixed}
        />
      )}
      <div style={{ position: 'fixed', width: '50%' }}>
        {(['move canvas'] as const).map((p) => <button onClick={() => editorRef.current?.onStartOperation({ type: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
        {!readOnly && ['create line', 'create polyline', 'create polygon', 'create rect', '2 points', '3 points', 'center radius', 'center diameter', 'create tangent tangent radius circle', 'create arc', 'ellipse center', 'ellipse endpoint', 'create ellipse arc', 'spline', 'spline fitting', 'move', 'delete', 'rotate', 'clone', 'explode', 'mirror', 'create block', 'create block reference', 'start edit block', 'fillet', 'chamfer', 'break'].map((p) => <button onClick={() => editorRef.current?.onStartOperation({ type: 'command', name: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
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
  setOperation: (operations: string | undefined) => void
}, ref: React.ForwardedRef<CADEditorRef>) => {
  const { operation, nextOperation, resetOperation, completeCurrentOperation, selectBeforeOperate, operate } = useSelectBeforeOperate<Operation>()
  const { snapTypes, angleSnapEnabled, renderTarget, readOnly, inputFixed } = props
  const { state, setState, undo, redo, canRedo, canUndo, applyPatchFromSelf, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, me, {
    onApplyPatches: props.onApplyPatches,
  })
  const { filterSelection, isSelected, selectedCount, addSelection, clearSelection } = useSelectPart<number>({
    onChange(selected) {
      props.onSendSelection(selected.map((s) => typeof s === 'number' ? s : s[0]))
    }
  })
  const { hovering, isHovering, setHovering } = useHoverPart<number>()
  const [position, setPosition] = React.useState<Position>()
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
    const result = addSelection(targets, operation?.type === 'select' || operation?.type === 'select part' ? operation.count : undefined)
    if ((operation?.type === 'select' || operation?.type === 'select part') && operation.count === result.length) {
      startNextOperation((v) => isSelected(v, result))
    }
  }
  const isSelectOperation = operation === undefined || operation.type === 'select' || operation.type === 'select part'
  const [editingStatePath, setEditingStatePath] = React.useState<(string | number)[]>()
  const editingContents = getByPath(state, editingStatePath)
  const selectedContents: BaseContent[] = []
  editingContents.forEach((s, i) => {
    const e = isSelected(i)
    if (typeof e !== 'boolean') {
      for (const j of e) {
        const line = getModel(s.type)?.getLines?.(s)?.lines?.[j]
        if (line) {
          selectedContents.push({ type: 'line', points: line } as LineContent)
        }
      }
    } else if (e) {
      selectedContents.push(s)
    }
  })

  // snap point
  const { snapAssistentContents, getSnapPoint, snapPoint } = useSnap(!isSelectOperation)

  // commands
  const { commandMasks, updateContent, startCommand, commandInputs, onCommandMove, commandAssistentContents, getCommandByHotkey } = useCommands(
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
      resetOperation()
      clearSelection()
    },
    (p) => getSnapPoint(reverseTransformPosition(p, transform), state, snapTypes),
    angleSnapEnabled && !snapPoint,
    inputFixed,
    operation?.type === 'command' ? operation.name : undefined,
    selectedContents,
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

  // content data -> preview data / assistent data
  const assistentContents: BaseContent[] = [
    ...snapAssistentContents,
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
  const contentSelectable = (index: number | readonly [number, number]) => {
    // ignore selected contents
    if (isSelected(index) === true) {
      return false
    }
    if (nextOperation?.type === 'command') {
      const command = getCommand(nextOperation.name)
      const content = getContentByIndex(editingContents, index)
      if (content) {
        return command?.contentSelectable?.(content, state) ?? true
      }
    }
    return true
  }

  const startNextOperation = (s: (value: number) => boolean | readonly number[]) => {
    // after selection, execute command immediately
    if (nextOperation?.type === 'command' && getCommand(nextOperation.name)?.executeCommand) {
      executeCommandForSelectedContents(nextOperation.name, s)
      resetOperation()
      return
    }
    completeCurrentOperation()
  }
  useKey((e) => e.key === 'Enter', () => startNextOperation(isSelected))
  useKey((k) => k.code === 'KeyZ' && !k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), undo)
  useKey((k) => k.code === 'KeyZ' && k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), redo)
  useKey((k) => k.code === 'KeyA' && !k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), (e) => {
    addSelection(editingContents.map((_, i) => i))
    e.preventDefault()
  })

  React.useEffect(() => props.setCanUndo(canUndo), [canUndo])
  React.useEffect(() => props.setCanRedo(canRedo), [canRedo])
  React.useEffect(() => {
    const p = nextOperation || operation
    props.setOperation(p?.type === 'command' ? p.name : p?.type)
  }, [operation, nextOperation])

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
      message = `${selectedCount} selected, extra ${operation.count - selectedCount} targets are needed`
    } else if (operation?.type === 'select part') {
      message = `${selectedContents.length} selected, extra ${operation.count - selectedContents.length} targets are needed`
    } else {
      message = selectedCount ? `${selectedCount} selected, press Enter to finish selection` : 'select targets'
    }
  }
  const { input: cursorInput, setInputPosition, setCursorPosition, clearText } = useCursorInput(message, isSelectOperation ? (e, text) => {
    if (e.key === 'Enter' && text) {
      const command = getCommandByHotkey(text)
      if (command) {
        onStartOperation({ type: 'command', name: command })
      }
      clearText()
      e.stopPropagation()
    }
  } : undefined, { hideIfNoInput: true, inputStyle: { textTransform: 'uppercase' } })
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
    // if the operation is command, start it
    if (!isSelectOperation && operation.type === 'command') {
      startCommand(operation.name, p)
    }
    if (isSelectOperation) {
      if (hovering !== undefined) {
        // if hovering content, add it to selection
        select([hovering])
        setHovering(undefined)
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
    setCursorPosition(p)
    setPosition({ x: Math.round(p.x), y: Math.round(p.y) })
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
        const { selected, isSelected } = filterSelection(
          (v) => {
            const content = getContentByIndex(editingContents, v)
            if (content) {
              return command.contentSelectable?.(content, editingContents) ?? true
            }
            return false
          },
          command.selectCount,
        )
        // for commands, but no/no enough content selected, start to select some
        if (command.selectCount === undefined ? selected.length === 0 : selected.length < command.selectCount) {
          selectBeforeOperate(
            command.selectCount !== undefined ? { type: command.selectType ?? 'select', count: command.selectCount } : undefined,
            p,
          )
          return
        }
        // for executable commands, if there are selections, do it
        if (command.executeCommand) {
          executeCommandForSelectedContents(p.name, isSelected)
          return
        }
      }
    }
    operate(p)
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
        {position && `${position.x},${position.y}`}
        {commandMasks}
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
    type: 'command'
    name: string
  }
  | {
    type: 'move canvas'
  }
