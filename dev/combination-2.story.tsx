import React from 'react'
import { bindMultipleRefs, Position, reactCanvasRenderTarget, reactSvgRenderTarget, useCursorInput, useDragMove, useDragSelect, useKey, usePatchBasedUndoRedo, useSelected, useSelectBeforeOperate, useWheelScroll, useWheelZoom, useWindowSize, useZoom, usePartialEdit, useEdit, reverseTransformPosition, Transform, getContentsByClickTwoPositions, getContentByClickPosition, usePointSnap, SnapPointType, allSnapTypes } from '../src'
import produce, { enablePatches, Patch, produceWithPatches } from 'immer'
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { BaseContent, fixedInputStyle, getAngleSnap, getContentByIndex, getContentModel, getIntersectionPoints, getModel, registerModel } from './models/model'
import { LineContent, lineModel } from './models/line-model'
import { CircleContent, circleModel } from './models/circle-model'
import { polylineModel } from './models/polyline-model'
import { RectContent, rectModel } from './models/rect-model'
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
  const [snapTypes, setSnapTypes] = React.useState<readonly SnapPointType[]>(allSnapTypes)
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
        {(['move canvas'] as const).map((p) => <button onClick={() => editorRef.current?.onStartOperation({ type: 'non command', name: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
        {!readOnly && ['create line', 'create polyline', 'create polygon', 'create rect', '2 points', '3 points', 'center radius', 'center diameter', 'create tangent tangent radius circle', 'create arc', 'ellipse center', 'ellipse endpoint', 'create ellipse arc', 'spline', 'spline fitting', 'move', 'delete', 'rotate', 'clone', 'explode', 'mirror', 'create block', 'create block reference', 'start edit block', 'fillet', 'chamfer', 'break'].map((p) => <button onClick={() => editorRef.current?.onStartOperation({ type: 'command', name: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
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
  snapTypes: readonly SnapPointType[]
  renderTarget?: string
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  setOperation: (operations: string | undefined) => void
}, ref: React.ForwardedRef<CADEditorRef>) => {
  const { operations, executeOperation, resetOperation, startNextOperation, selectBeforeOperate, operate } = useSelectBeforeOperate<{ count?: number, part?: boolean }, Operation>({}, (p, s = selected) => {
    if (p?.type === 'command') {
      const command = getCommand(p.name)
      if (command?.executeCommand) {
        const removedContents: number[] = []
        const newContents: BaseContent[] = []
        editingContent.forEach((c, i) => {
          if (isSelected([i], s) && (command?.contentSelectable?.(c, state) ?? true)) {
            const result = command?.executeCommand?.(c, state, i)
            if (result?.newContents) {
              newContents.push(...result.newContents)
            }
            if (result?.removed) {
              removedContents.push(i)
            }
            if (result?.editingStatePath) {
              setEditingContentPath(result.editingStatePath)
            }
          }
        })
        if (removedContents.length + newContents.length > 0) {
          setState((draft) => {
            draft = getContentByPath(draft)
            for (let i = draft.length; i >= 0; i--) {
              if (removedContents.includes(i)) {
                draft.splice(i, 1)
              }
            }
            draft.push(...newContents)
          })
        }
        setSelected()
        return true
      }
    }
    return false
  })
  const { snapTypes, angleSnapEnabled, renderTarget, readOnly, inputFixed } = props
  const { state, setState, undo, redo, canRedo, canUndo, applyPatchFromSelf, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, me, {
    onApplyPatches: props.onApplyPatches,
  })
  const { filterSelection, selected, isSelected, addSelection, setSelected } = useSelected<number[]>({
    onChange: (c) => props.onSendSelection(c.map((s) => s[0]))
  })
  const { selected: hovering, setSelected: setHovering } = useSelected<number[]>({ maxCount: 1 })
  const { editingContent, getContentByPath, setEditingContentPath, prependPatchPath } = usePartialEdit(state)
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
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask } = useDragMove(() => {
    setX((v) => v + offset.x)
    setY((v) => v + offset.y)
  })
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

  const maxCount = operations.type !== 'operate' ? operations.select.count : undefined
  const isSelectOperation = operations.type !== 'operate'
  const selectedContents: { content: BaseContent, path: number[] }[] = []
  editingContent.forEach((s, i) => {
    if (isSelected([i])) {
      selectedContents.push({ content: s, path: [i] })
    } else {
      for (const f of selected) {
        if (f.length === 2 && f[0] === i) {
          const line = getModel(s.type)?.getLines?.(s)?.lines?.[f[1]]
          if (line) {
            selectedContents.push({ content: { type: 'line', points: line } as LineContent, path: f })
          }
        }
      }
    }
  })

  const { editPoint, updateEditPreview, onEditMove, onEditClick, getEditAssistentContents } = useEdit<BaseContent, number[]>(
    () => applyPatchFromSelf(previewPatches, previewReversePatches),
    (s) => getModel(s.type)?.getEditPoints?.(s, editingContent),
    {
      scale: transform.scale,
      readOnly,
      getAngleSnap: angleSnapEnabled ? getAngleSnap : undefined,
    }
  )

  // snap point
  const { getSnapAssistentContents, getSnapPoint, snapPoint } = usePointSnap(
    !isSelectOperation || editPoint !== undefined,
    getIntersectionPoints,
    snapTypes,
    (c) => getModel(c.type)?.getSnapPoints?.(c, editingContent),
  )

  // commands
  const { commandMasks, updateContent, startCommand, commandInputs, onCommandMove, commandAssistentContents, getCommandByHotkey } = useCommands(
    (updateContents) => {
      if (updateContents) {
        const [, ...patches] = produceWithPatches(editingContent, (draft) => {
          updateContents(draft, selected)
        })
        applyPatchFromSelf(prependPatchPath(patches[0]), prependPatchPath(patches[1]))
      } else {
        applyPatchFromSelf(previewPatches, previewReversePatches)
      }
      resetOperation()
      setSelected()
    },
    (p) => getSnapPoint(reverseTransformPosition(p, transform), editingContent),
    angleSnapEnabled && !snapPoint,
    inputFixed,
    operations.type === 'operate' && operations.operate.type === 'command' ? operations.operate.name : undefined,
    selectedContents,
  )

  // select by region
  const { onStartSelect, dragSelectMask } = useDragSelect((start, end) => {
    if (end) {
      addSelection(
        getContentsByClickTwoPositions(
          editingContent,
          reverseTransformPosition(start, transform),
          reverseTransformPosition(end, transform),
          getContentModel,
          contentSelectable,
        ),
        maxCount,
        (r) => startNextOperation(r),
      )
    }
  })

  // content data -> preview data / assistent data
  const assistentContents: BaseContent[] = [
    ...getSnapAssistentContents(
      (circle) => ({ type: 'circle', ...circle } as CircleContent),
      (rect) => ({ type: 'rect', ...rect, angle: 0 } as RectContent),
      (points) => ({ type: 'polyline', points } as LineContent),
    ),
    ...commandAssistentContents,
  ]
  const previewContents = produce(editingContent, (draft) => {
    const newContents: BaseContent[] = []
    draft.forEach((content, i) => {
      if (isSelected([i])) {
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
    const result = updateEditPreview((path) => getContentByIndex(draft, path))
    if (result?.assistentContents) {
      assistentContents.push(...result.assistentContents)
    }
    draft.forEach((content, i) => {
      if (isSelected([i])) {
        assistentContents.push(...getEditAssistentContents(content, (rect) => ({ type: 'rect', ...rect, fillColor: 0xffffff } as RectContent)))
      }
    })
  }, (patches, reversePatches) => {
    previewPatches.push(...prependPatchPath(patches))
    previewReversePatches.push(...prependPatchPath(reversePatches))
  })

  const contentSelectable = (index: number[]) => {
    // ignore selected contents
    if (isSelected(index) || operations.type === 'operate') {
      return false
    }
    if (operations.type === 'select then operate' && operations.operate.type === 'command') {
      const command = getCommand(operations.operate.name)
      const content = getContentByIndex(editingContent, index)
      if (content) {
        return command?.contentSelectable?.(content, state) ?? true
      }
    }
    return true
  }

  useKey((k) => k.code === 'KeyZ' && !k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), undo)
  useKey((k) => k.code === 'KeyZ' && k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), redo)
  useKey((k) => k.code === 'KeyA' && !k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), (e) => {
    addSelection(editingContent.map((_, i) => [i]))
    e.preventDefault()
  })

  React.useEffect(() => props.setCanUndo(canUndo), [canUndo])
  React.useEffect(() => props.setCanRedo(canRedo), [canRedo])
  React.useEffect(() => {
    props.setOperation(operations.type === 'operate' || operations.type === 'select then operate' ? operations.operate.name : undefined)
  }, [operations])

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
      setEditingContentPath(undefined)
      setSelected()
    },
  }), [applyPatchFromOtherOperators])

  let message = ''
  if (isSelectOperation && operations.type === 'select then operate') {
    if (maxCount !== undefined) {
      message = `${selected.length} selected, extra ${maxCount - selected.length} targets are needed`
    } else {
      message = selected.length ? `${selected.length} selected, press Enter to finish selection` : 'select targets'
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
    const p = getSnapPoint(reverseTransformPosition(viewportPosition, transform), editingContent)
    // if the operation is command, start it
    if (!isSelectOperation && operations.type === 'operate' && operations.operate.type === 'command') {
      startCommand(operations.operate.name, p)
    }
    if (isSelectOperation) {
      if (editPoint) {
        onEditClick(p)
      } else if (hovering.length > 0) {
        // if hovering content, add it to selection
        addSelection(hovering, maxCount, (r) => startNextOperation(r))
        setHovering()
      } else {
        // start selection by region
        onStartSelect(e)
      }
    }
  }
  const onMouseDown = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    if (operations.type === 'operate' && operations.operate.name === 'move canvas') {
      onStartMoveCanvas({ x: e.clientX, y: e.clientY })
    }
  }
  const onMouseMove = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    setInputPosition(viewportPosition)
    const p = reverseTransformPosition(viewportPosition, transform)
    setCursorPosition(p)
    setPosition({ x: Math.round(p.x), y: Math.round(p.y) })
    if (!isSelectOperation && operations.type === 'operate' && operations.operate.type === 'command') {
      onCommandMove(getSnapPoint(p, editingContent), viewportPosition)
    }
    if (isSelectOperation) {
      onEditMove(getSnapPoint(p, editingContent), selectedContents)
      // hover by position
      setHovering(getContentByClickPosition(editingContent, p, contentSelectable, getContentModel, operations.select.part))
    }
  }
  const onStartOperation = (p: Operation) => {
    if (p.type === 'command') {
      const command = getCommand(p.name)
      if (command) {
        const { result, needSelect } = filterSelection(
          (v) => {
            const content = getContentByIndex(editingContent, v)
            if (content) {
              return command.contentSelectable?.(content, editingContent) ?? true
            }
            return false
          },
          command.selectCount,
        )
        // for commands, but no/no enough content selected, start to select some
        if (needSelect) {
          selectBeforeOperate({ count: command.selectCount, part: command.selectType === 'select part' }, p)
          return
        }
        if (executeOperation(p, result)) {
          return
        }
      }
    }
    operate(p)
  }

  return (
    <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}>
      <div style={{ cursor: editPoint?.cursor ?? (operations.type === 'operate' && operations.operate.name === 'move canvas' ? 'grab' : 'crosshair'), position: 'absolute', inset: '0px' }} onMouseMove={onMouseMove}>
        <Renderer
          type={renderTarget}
          contents={[...previewContents, ...assistentContents]}
          selected={selected}
          othersSelectedContents={othersSelectedContents}
          hovering={hovering}
          onClick={onClick}
          onMouseDown={onMouseDown}
          transform={transform}
          width={width}
          height={height}
        />
        {position && `${position.x},${position.y}`}
        {commandMasks}
        {selectionInput}
        {!readOnly && commandInputs}
      </div>
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

type Operation = {
  type: 'command' | 'non command'
  name: string
}
