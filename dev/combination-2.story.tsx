import React from 'react'
import { bindMultipleRefs, Position, reactCanvasRenderTarget, reactSvgRenderTarget, useCursorInput, useDragMove, useDragSelect, useKey, usePatchBasedUndoRedo, useSelected, useSelectBeforeOperate, useWheelScroll, useWheelZoom, useWindowSize, useZoom, usePartialEdit, useEdit, reverseTransformPosition, Transform, getContentsByClickTwoPositions, getContentByClickPosition, usePointSnap, SnapPointType, allSnapTypes, zoomToFit, scaleByCursorPosition, colorStringToNumber, getColorString, getPointsBounding, isSamePath, TwoPointsFormRegion } from '../src'
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
import { getAllRendererTypes, registerRenderer, Renderer, visibleContents, contentVisible } from './renderers/renderer'
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
import { measureCommand } from './commands/measure'
import { radialDimensionModel } from './models/radial-dimension-model'
import { createRadialDimensionCommand } from './commands/create-radial-dimension'
import { createLinearDimensionCommand } from './commands/create-linear-dimension'
import { linearDimensionModel } from './models/linear-dimension-model'
import { groupModel } from './models/group-model'
import { createGroupCommand } from './commands/create-group'
import RTree from 'rtree'

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
registerModel(radialDimensionModel)
registerModel(linearDimensionModel)
registerModel(groupModel)

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
registerCommand(measureCommand)
registerCommand(createRadialDimensionCommand)
registerCommand(createLinearDimensionCommand)
registerCommand(createGroupCommand)

registerRenderer(reactSvgRenderTarget)
registerRenderer(reactPixiRenderTarget)
registerRenderer(reactCanvasRenderTarget)

const key = 'combination-2.json'

export default () => {
  const [initialState, setInitialState] = React.useState<BaseContent[]>()
  const [coEdit, setCoEdit] = React.useState(true)
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
      const json: (CircleContent | RectContent)[] = []
      const max = 100
      for (let i = 0; i < max; i++) {
        for (let j = 0; j < max; j++) {
          if (Math.random() < 0.5) {
            json.push({
              type: 'circle',
              x: i * 100 + (Math.random() - 0.5) * 50,
              y: j * 100 + (Math.random() - 0.5) * 50,
              r: Math.random() * 100,
            })
          } else {
            json.push({
              type: 'rect',
              x: i * 100 + (Math.random() - 0.5) * 50,
              y: j * 100 + (Math.random() - 0.5) * 50,
              width: Math.random() * 100,
              height: Math.random() * 100,
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
  const [angleSnapEnabled, setAngleSnapEnabled] = React.useState(true)
  const [snapTypes, setSnapTypes] = React.useState<readonly SnapPointType[]>(allSnapTypes)
  const [renderTarget, setRenderTarget] = React.useState<string>()
  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)
  const [operation, setOperation] = React.useState<string>()
  const [inputFixed, setInputFixed] = React.useState(false)
  const [backgroundColor, setBackgroundColor] = React.useState(0xffffff)

  return (
    <div style={{ height: '100%' }}>
      {initialState && (
        <CADEditor
          ref={editorRef}
          initialState={initialState}
          onApplyPatchesFromSelf={onApplyPatchesFromSelf}
          onSendSelection={onSendSelection}
          readOnly={readOnly}
          angleSnapEnabled={angleSnapEnabled}
          snapTypes={snapTypes}
          renderTarget={renderTarget}
          setCanUndo={setCanUndo}
          setCanRedo={setCanRedo}
          setOperation={setOperation}
          inputFixed={inputFixed}
          backgroundColor={backgroundColor}
        />
      )}
      <div style={{ position: 'fixed', width: '50%' }}>
        {(['move canvas'] as const).map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'non command', name: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
        <button onClick={() => addMockData()} style={{ position: 'relative' }}>add mock data</button>
        {!readOnly && ['create line', 'create polyline', 'create polygon', 'create rect', '2 points', '3 points', 'center radius', 'center diameter', 'create tangent tangent radius circle', 'create arc', 'ellipse center', 'ellipse endpoint', 'create ellipse arc', 'spline', 'spline fitting', 'move', 'delete', 'rotate', 'clone', 'explode', 'mirror', 'create block', 'create block reference', 'start edit block', 'fillet', 'chamfer', 'break', 'measure', 'create radial dimension', 'create linear dimension', 'create group'].map((p) => <button onClick={() => editorRef.current?.startOperation({ type: 'command', name: p })} key={p} style={{ position: 'relative', borderColor: operation === p ? 'red' : undefined }}>{p}</button>)}
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
        <input type='color' style={{ position: 'relative' }} value={getColorString(backgroundColor)} onChange={(e) => setBackgroundColor(colorStringToNumber(e.target.value))} />
      </div>
    </div>
  )
}

const CADEditor = React.forwardRef((props: {
  initialState: readonly BaseContent<string>[]
  onApplyPatchesFromSelf: ((patches: Patch[], reversePatches: Patch[]) => void)
  onSendSelection: (selectedContents: readonly number[]) => void
  readOnly: boolean
  angleSnapEnabled: boolean
  inputFixed: boolean
  snapTypes: readonly SnapPointType[]
  renderTarget?: string
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  setOperation: (operations: string | undefined) => void
  backgroundColor: number
}, ref: React.ForwardedRef<CADEditorRef>) => {
  const now = Date.now()
  const { filterSelection, selected, isSelected, addSelection, setSelected, isSelectable, operations, executeOperation, resetOperation, selectBeforeOperate, operate, message } = useSelectBeforeOperate<{ count?: number, part?: boolean, selectable?: (index: number[]) => boolean }, Operation, number[]>(
    {},
    (p, s) => {
      if (p?.type === 'command') {
        const command = getCommand(p.name)
        if (command?.execute) {
          setState((draft) => {
            draft = getContentByPath(draft)
            command.execute?.(draft, s, setEditingContentPath)
          })
          setSelected()
          return true
        }
      }
      return false
    },
    {
      onChange: (c) => props.onSendSelection(c.map((s) => s[0]))
    },
  )
  const { snapTypes, angleSnapEnabled, renderTarget, readOnly, inputFixed } = props
  const { state, setState, undo, redo, canRedo, canUndo, applyPatchFromSelf, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, me, {
    onApplyPatchesFromSelf: props.onApplyPatchesFromSelf,
    onChange({ patches, oldState, newState }) {
      const newContents = new Set<BaseContent>()
      const removedContents = new Set<BaseContent>()
      for (const patch of patches) {
        const index = patch.path[0] as number
        if (patch.op !== 'remove' || patch.path.length > 1) {
          newContents.add(newState[index])
        }
        if (patch.op !== 'add' || patch.path.length > 1) {
          removedContents.add(oldState[index])
        }
      }
      for (const content of newContents) {
        const geometries = getModel(content.type)?.getGeometries?.(content, newState)
        if (geometries?.bounding) {
          rtree.insert({
            x: geometries.bounding.start.x,
            y: geometries.bounding.start.y,
            w: geometries.bounding.end.x - geometries.bounding.start.x,
            h: geometries.bounding.end.y - geometries.bounding.start.y,
          }, content)
        }
      }
      for (const content of removedContents) {
        const geometries = getModel(content.type)?.getGeometries?.(content, oldState)
        if (geometries?.bounding) {
          rtree.remove({
            x: geometries.bounding.start.x,
            y: geometries.bounding.start.y,
            w: geometries.bounding.end.x - geometries.bounding.start.x,
            h: geometries.bounding.end.y - geometries.bounding.start.y,
          }, content)
        }
      }
    },
  })
  const { selected: hovering, setSelected: setHovering } = useSelected<number[]>({ maxCount: 1 })
  const { editingContent, getContentByPath, setEditingContentPath, prependPatchPath } = usePartialEdit(state, {
    onEditingContentPathChange(contents) {
      rebuildRTree(contents)
    }
  })
  const [position, setPosition] = React.useState<Position>()
  const previewPatches: Patch[] = []
  const previewReversePatches: Patch[] = []

  const { x, y, ref: wheelScrollRef, setX, setY } = useWheelScroll<HTMLDivElement>()
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    min: 0.001,
    onChange(oldScale, newScale, cursor) {
      const result = scaleByCursorPosition({ width, height }, newScale / oldScale, cursor)
      setX(result.setX)
      setY(result.setY)
    }
  })
  const { zoomIn, zoomOut } = useZoom(scale, setScale, { min: 0.001 })
  useKey((k) => k.code === 'Minus' && (isMacKeyboard ? k.metaKey : k.ctrlKey), zoomOut)
  useKey((k) => k.code === 'Equal' && (isMacKeyboard ? k.metaKey : k.ctrlKey), zoomIn)
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask } = useDragMove(() => {
    setX((v) => v + offset.x)
    setY((v) => v + offset.y)
  })
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const transform: Transform = {
    x: x + offset.x,
    y: y + offset.y,
    scale,
    center: {
      x: width / 2,
      y: height / 2,
    },
  }

  const selectedContents: { content: BaseContent, path: number[] }[] = []
  editingContent.forEach((s, i) => {
    if (isSelected([i])) {
      selectedContents.push({ content: s, path: [i] })
    } else {
      for (const f of selected) {
        if (f.length === 2 && f[0] === i) {
          const line = getModel(s.type)?.getGeometries?.(s)?.lines?.[f[1]]
          if (line) {
            selectedContents.push({ content: { type: 'line', points: line } as LineContent, path: f })
          }
        }
      }
    }
  })

  const { editPoint, updateEditPreview, onEditMove, onEditClick, getEditAssistentContents } = useEdit<BaseContent, number[]>(
    () => applyPatchFromSelf(prependPatchPath(previewPatches), prependPatchPath(previewReversePatches)),
    (s) => getModel(s.type)?.getEditPoints?.(s, editingContent),
    {
      scale: transform.scale,
      readOnly: readOnly || operations.type === 'operate',
      getAngleSnap: angleSnapEnabled ? getAngleSnap : undefined,
    }
  )

  // snap point
  const { getSnapAssistentContents, getSnapPoint, snapPoint } = usePointSnap(
    operations.type === 'operate' || editPoint !== undefined,
    getIntersectionPoints,
    snapTypes,
    getContentModel,
    scale,
  )

  // commands
  const { commandMasks, updateSelectedContents, startCommand, commandInputs, onCommandMove, commandAssistentContents, getCommandByHotkey } = useCommands(
    ({ updateContents, nextCommand, repeatedly } = {}) => {
      if (updateContents) {
        const [, ...patches] = produceWithPatches(editingContent, (draft) => {
          updateContents(draft, selected)
        })
        applyPatchFromSelf(prependPatchPath(patches[0]), prependPatchPath(patches[1]))
      } else {
        applyPatchFromSelf(prependPatchPath(previewPatches), prependPatchPath(previewReversePatches))
      }
      if (repeatedly) {
        return
      }
      resetOperation()
      setSelected()
      if (nextCommand) {
        startOperation({ type: 'command', name: nextCommand }, [])
      }
    },
    (p) => getSnapPoint(reverseTransformPosition(p, transform), editingContent, getContentsInRange),
    angleSnapEnabled && !snapPoint,
    inputFixed,
    operations.type === 'operate' && operations.operate.type === 'command' ? operations.operate.name : undefined,
    selectedContents,
    scale,
  )

  // select by region
  const { onStartSelect, dragSelectMask } = useDragSelect((start, end) => {
    if (end) {
      addSelection(...getContentsByClickTwoPositions(
        editingContent,
        reverseTransformPosition(start, transform),
        reverseTransformPosition(end, transform),
        getContentModel,
        isSelectable,
        contentVisible,
      ))
    } else {
      // double click
      const points: Position[] = []
      editingContent.forEach((c) => {
        const model = getModel(c.type)
        if (model?.getCircle) {
          const { bounding } = model.getCircle(c)
          points.push(bounding.start, bounding.end)
        } else if (model?.getGeometries) {
          const { bounding } = model.getGeometries(c, state)
          if (bounding) {
            points.push(bounding.start, bounding.end)
          }
        }
      })
      const result = zoomToFit(getPointsBounding(points), { width, height }, transform.center)
      if (result) {
        setScale(result.scale)
        setX(result.x)
        setY(result.y)
      }
    }
  })

  const assistentContents: BaseContent[] = [
    ...getSnapAssistentContents(
      (circle) => ({ type: 'circle', ...circle, strokeColor: 0x00ff00 } as CircleContent),
      (rect) => ({ type: 'rect', ...rect, angle: 0, strokeColor: 0x00ff00 } as RectContent),
      (points) => ({ type: 'polyline', points, strokeColor: 0x00ff00 } as LineContent),
    ),
    ...commandAssistentContents,
  ]

  let updatedContents: readonly BaseContent[] | undefined
  if (updateEditPreview) {
    const [r, patches, reversePatches] = produceWithPatches(editingContent, (draft) => {
      const result = updateEditPreview((path) => getContentByIndex(draft, path))
      if (result?.assistentContents) {
        assistentContents.push(...result.assistentContents)
      }
    })
    updatedContents = r
    previewPatches.push(...patches)
    previewReversePatches.push(...reversePatches)
  }

  const r = updateSelectedContents(state)
  assistentContents.push(...r.assistentContents)
  for (const [patches, reversePatches] of r.patches) {
    previewPatches.push(...patches)
    previewReversePatches.push(...reversePatches)
  }

  for (const { content, path } of selectedContents) {
    if (path.length === 1) {
      let c = content
      if (editPoint && isSamePath(editPoint.path, path) && updatedContents) {
        c = getContentByIndex(updatedContents, path) ?? content
      }
      assistentContents.push(...getEditAssistentContents(c, (rect) => ({ type: 'rect', ...rect, fillColor: 0xffffff, angle: 0 } as RectContent)))
    }
  }

  useKey((k) => k.code === 'KeyZ' && !k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), (e) => {
    undo(e)
    setSelected()
  })
  useKey((k) => k.code === 'KeyZ' && k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), (e) => {
    redo(e)
    setSelected()
  })
  useKey((k) => k.code === 'KeyA' && !k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), (e) => {
    addSelection(...editingContent.map((_, i) => [i]))
    e.preventDefault()
  })
  useKey((k) => k.code === 'Digit0' && !k.shiftKey && (isMacKeyboard ? k.metaKey : k.ctrlKey), (e) => {
    setScale(1)
    setX(0)
    setY(0)
    e.preventDefault()
  })

  React.useEffect(() => props.setCanUndo(canUndo), [canUndo])
  React.useEffect(() => props.setCanRedo(canRedo), [canRedo])
  React.useEffect(() => {
    props.setOperation(operations.type !== 'select' ? operations.operate.name : undefined)
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
    startOperation,
    exitEditBlock() {
      setEditingContentPath(undefined)
      setSelected()
    },
  }), [applyPatchFromOtherOperators])

  const { input: cursorInput, inputPosition, setInputPosition, setCursorPosition, clearText } = useCursorInput(message, operations.type !== 'operate' && !readOnly ? (e, text) => {
    if (e.key === 'Enter' && text) {
      const command = getCommandByHotkey(text)
      if (command) {
        startOperation({ type: 'command', name: command })
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
    const p = getSnapPoint(reverseTransformPosition(viewportPosition, transform), editingContent, getContentsInRange)
    // if the operation is command, start it
    if (operations.type === 'operate' && operations.operate.type === 'command') {
      startCommand(operations.operate.name, p)
    }
    if (operations.type !== 'operate') {
      if (editPoint) {
        onEditClick(p)
      } else if (hovering.length > 0) {
        // if hovering content, add it to selection
        addSelection(...hovering)
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
    if (operations.type === 'operate' && operations.operate.type === 'command') {
      onCommandMove(getSnapPoint(p, editingContent, getContentsInRange), viewportPosition)
    }
    if (operations.type !== 'operate') {
      onEditMove(getSnapPoint(p, editingContent, getContentsInRange), selectedContents)
      // hover by position
      setHovering(getContentByClickPosition(editingContent, p, isSelectable, getContentModel, operations.select.part, contentVisible))
    }
  }
  const [lastOperation, setLastOperation] = React.useState<Operation>()
  const startOperation = (p: Operation, s = selected) => {
    setLastOperation(p)
    if (p.type === 'command') {
      const command = getCommand(p.name)
      if (command) {
        const select = {
          count: command.selectCount,
          part: command.selectType === 'select part',
          selectable(v: readonly number[]) {
            const content = getContentByIndex(editingContent, v)
            if (content) {
              return command.contentSelectable?.(content, editingContent) ?? true
            }
            return false
          },
        }
        const { result, needSelect } = filterSelection(select.selectable, select.count, s)
        if (needSelect) {
          selectBeforeOperate(select, p)
          return
        }
        if (executeOperation(p, result)) {
          return
        }
      }
    }
    operate(p)
    if (position) {
      onCommandMove(getSnapPoint(position, editingContent, getContentsInRange), inputPosition)
    }
  }
  const onContextMenu = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    if (lastOperation) {
      startOperation(lastOperation)
    }
    e.preventDefault()
  }
  const [rtree, setRTree] = React.useState(RTree())
  const getContentsInRange = (region: TwoPointsFormRegion): BaseContent[] => {
    return rtree.search({ x: region.start.x, y: region.start.y, w: region.end.x - region.start.x, h: region.end.y - region.start.y })
  }
  const searchResult = getContentsInRange({
    start: reverseTransformPosition({ x: 0, y: 0 }, transform),
    end: reverseTransformPosition({ x: width, y: height }, transform),
  })
  visibleContents.clear()
  visibleContents.add(...searchResult)
  visibleContents.add(...assistentContents)
  
  const rebuildRTree = (contents: readonly BaseContent[]) => {
    const newRTree = RTree()
    for (const content of contents) {
      const geometries = getModel(content.type)?.getGeometries?.(content, contents)
      if (geometries?.bounding) {
        newRTree.insert({
          x: geometries.bounding.start.x,
          y: geometries.bounding.start.y,
          w: geometries.bounding.end.x - geometries.bounding.start.x,
          h: geometries.bounding.end.y - geometries.bounding.start.y,
        }, content)
      }
    }
    setRTree(newRTree)
  }

  React.useEffect(() => {
    rebuildRTree(props.initialState)
  }, [props.initialState])
  console.info(Date.now() - now, searchResult.length)

  return (
    <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}>
      <div style={{ cursor: editPoint?.cursor ?? (operations.type === 'operate' && operations.operate.name === 'move canvas' ? 'grab' : 'crosshair'), position: 'absolute', inset: '0px' }} onMouseMove={onMouseMove}>
        <Renderer
          type={renderTarget}
          contents={editingContent}
          previewPatches={previewPatches}
          assistentContents={assistentContents}
          selected={selected}
          othersSelectedContents={othersSelectedContents}
          hovering={hovering}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onContextMenu={onContextMenu}
          {...transform}
          width={width}
          height={height}
          backgroundColor={props.backgroundColor}
        />
        {position && <span style={{ position: 'absolute' }}>{position.x},{position.y}</span>}
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
  startOperation(p: Operation): void
  exitEditBlock(): void
}

type Operation = {
  type: 'command' | 'non command'
  name: string
}
