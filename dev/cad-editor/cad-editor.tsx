import React from 'react'
import { bindMultipleRefs, Position, reactCanvasRenderTarget, reactSvgRenderTarget, useCursorInput, useDragMove, useDragSelect, usePatchBasedUndoRedo, useSelected, useSelectBeforeOperate, useWheelScroll, useWheelZoom, useZoom, usePartialEdit, useEdit, reverseTransformPosition, Transform, getContentsByRegion, getContentByClickPosition, usePointSnap, SnapPointType, scaleByCursorPosition, TwoPointsFormRegion, useEvent, metaKeyIfMacElseCtrlKey, reactWebglRenderTarget, Nullable, zoomToFitPoints, isSamePath, Debug, useWindowSize, Validator, validate, BooleanEditor, NumberEditor, ObjectEditor, iterateItemOrArray, useDelayedAction, useMinimap, useDragRotate, RotationBar, angleToRadian, getPointsBoundingUnsafe, useLocalStorageState, getPolygonFromTwoPointsFormRegion, getTwoPointsFormRegion, reactWebgpuRenderTarget, useGlobalKeyDown, ContentPath } from '../../src'
import { produce, enablePatches, Patch, produceWithPatches } from 'immer'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseExpression, tokenizeExpression, evaluateExpression } from 'expression-engine'
import { BaseContent, Content, fixedInputStyle, getContentByIndex, getContentIndex, getContentModel, getDefaultViewport, getIntersectionPoints, getViewportByPoints, isViewportContent, registerModel, updateReferencedContents, ViewportContent, zoomContentsToFit, SnapResult, Select, PartRef, boundingToRTreeBounding } from './model'
import { Command, CommandType, getCommand, registerCommand, useCommands } from './command'
import { registerRenderer, MemoizedRenderer } from './renderer'
import RTree from 'rtree'

import * as core from '../../src'
import * as model from './model'
import { pluginScripts } from './plugins/variables'
import type { RectContent } from './plugins/rect.plugin'
import type { CircleContent } from './plugins/circle-arc.plugin'
import type { LineContent } from './plugins/line-polyline.plugin'
import type { PluginContext } from './plugins/types'

enablePatches()

registerRenderer(reactWebglRenderTarget)
registerRenderer(reactSvgRenderTarget)
registerRenderer(reactCanvasRenderTarget)
if (navigator.gpu) {
  registerRenderer(reactWebgpuRenderTarget)
}

export const CADEditor = React.forwardRef((props: {
  id: string
  operator: string
  initialState: readonly Nullable<BaseContent>[]
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
  onSendSelection?: (selectedContents: readonly number[]) => void
  onChange?: (state: readonly Nullable<BaseContent>[]) => void
  readOnly?: boolean
  inputFixed?: boolean
  snapTypes: readonly SnapPointType[]
  renderTarget?: string
  setCanUndo?: (canUndo: boolean) => void
  setCanRedo?: (canRedo: boolean) => void
  setOperation: (operations: string | undefined) => void
  backgroundColor: number
  debug?: boolean
  panelVisible?: boolean
  printMode?: boolean
  performanceMode?: boolean
}, ref: React.ForwardedRef<CADEditorRef>) => {
  const debug = new Debug(props.debug)
  const { width, height } = useWindowSize()
  const { filterSelection, selected, isSelected, addSelection, removeSelection, setSelected, isSelectable, operations, executeOperation, resetOperation, selectBeforeOperate, operate, message, onSelectBeforeOperateKeyDown } = useSelectBeforeOperate<Select, Operation, ContentPath>(
    {},
    (p, s) => {
      if (p?.type === 'command') {
        if (acquireContentHandler.current) {
          acquireContentHandler.current?.(s)
          acquireContentHandler.current = undefined
          return true
        }
        const command = getCommand(p.name)
        if (command?.execute) {
          setState((draft) => {
            draft = getContentByPath(draft)
            command.execute?.({ contents: draft, selected: s, setEditingContentPath, type: p.name, strokeStyleId, fillStyleId, textStyleId, width, height, transform })
          })
          setSelected()
          resetOperation()
          return true
        }
      }
      return false
    },
    {
      onChange: (c) => props.onSendSelection?.(c.map((s) => s[0]))
    },
  )
  const { snapTypes, renderTarget, readOnly, inputFixed } = props
  const { state, setState, undo, redo, canRedo, canUndo, applyPatchFromSelf, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, props.operator, {
    onApplyPatchesFromSelf(patches, reversePatches) {
      const newReversePatches: Patch[] = []
      reversePatches.forEach(p => {
        // type-coverage:ignore-next-line
        if (p.op === 'replace' && p.path.length === 1 && p.path[0] === 'length' && typeof p.value === 'number') {
          for (let i = p.value; i < state.length; i++) {
            if (state[i]) {
              newReversePatches.push({
                op: 'replace',
                path: [i],
              })
            }
          }
        } else {
          newReversePatches.push(p)
        }
      })
      props.onApplyPatchesFromSelf?.(patches, newReversePatches)
    },
    onChange({ patches, oldState, newState }) {
      const newContents = new Set<BaseContent>()
      const removedContents = new Set<BaseContent>()
      patches = trimPatchPath(patches)
      for (const patch of patches) {
        const index = patch.path[0]
        if (typeof index !== 'number') {
          // type-coverage:ignore-next-line
          if (index === 'length' && patch.op === 'replace' && typeof patch.value === 'number') {
            const oldContent = getContentByPath(oldState)[patch.value]
            if (oldContent) {
              removedContents.add(oldContent)
            }
          }
          continue
        }
        if (patch.op !== 'remove' || patch.path.length > 1) {
          const newContent = getContentByPath(newState)[index]
          if (newContent) {
            newContents.add(newContent)
          }
        }
        if (patch.op !== 'add' || patch.path.length > 1) {
          const oldContent = getContentByPath(oldState)[index]
          if (oldContent) {
            removedContents.add(oldContent)
          }
        }
      }
      for (const content of newContents) {
        const r = validate(content, Content)
        if (r !== true) {
          console.error(r)
          return false
        }
      }
      for (const content of newContents) {
        const geometries = getContentModel(content)?.getGeometries?.(content, newState)
        if (geometries?.bounding) {
          rtree?.insert(boundingToRTreeBounding(geometries.bounding), content)
        }
      }
      for (const content of removedContents) {
        const geometries = getContentModel(content)?.getGeometries?.(content, oldState)
        if (geometries?.bounding) {
          rtree?.remove(boundingToRTreeBounding(geometries.bounding), content)
        }
      }
      setMinimapTransform(zoomContentsToFit(minimapWidth, minimapHeight, newState, newState, 1))
      props.onChange?.(newState)
      return
    },
  })
  const { selected: hovering, setSelected: setHovering } = useSelected<ContentPath>({ maxCount: 1 })
  const { editingContent, trimPatchPath, getContentByPath, setEditingContentPath, prependPatchPath } = usePartialEdit(state, {
    onEditingContentPathChange(contents) {
      rebuildRTree(contents)
    }
  })
  const [position, setPosition] = React.useState<Position>()
  const previewPatches: Patch[] = []
  const previewReversePatches: Patch[] = []
  const strokeStyleId = model.getStrokeStyles(state).find(s => s.content.isCurrent)?.index
  const fillStyleId = model.getFillStyles(state).find(s => s.content.isCurrent)?.index
  const textStyleId = model.getTextStyles(state).find(s => s.content.isCurrent)?.index
  const [activeViewportIndex, setActiveViewportIndex] = React.useState<number>()
  const [active, setActive] = React.useState<number>()
  const [activeChild, setActiveChild] = React.useState<number[]>()
  const activeContent = active !== undefined ? editingContent[active] : undefined
  const activeContentBounding = activeContent ? getContentModel(activeContent)?.getGeometries?.(activeContent, editingContent).bounding : undefined
  const activeViewportContent = activeViewportIndex !== undefined ? editingContent[activeViewportIndex] : undefined
  const activeViewport = activeViewportContent && isViewportContent(activeViewportContent) ? activeViewportContent : undefined
  const reverseTransformViewport = activeViewport ? (p: Position) => model.reverseTransformPositionByViewport(p, activeViewport) : undefined
  const transformViewport = activeViewport ? (p: Position) => model.transformPositionByViewport(p, activeViewport) : undefined
  const [xOffset, setXOffset] = React.useState(0)
  const [yOffset, setYOffset] = React.useState(0)
  const [scaleOffset, setScaleOffset] = React.useState(1)
  const [time, setTime] = React.useState(0)
  const acquirePointHandler = React.useRef<(r: SnapResult) => void>()
  const acquireContentHandler = React.useRef<(path: readonly ContentPath[]) => void>()
  const acquireRegionHandler = React.useRef<(region: Position[]) => void>()

  const { x, y, ref: wheelScrollRef, setX, setY } = useWheelScroll<HTMLDivElement>({
    localStorageXKey: props.id + '-x',
    localStorageYKey: props.id + '-y',
    setXOffset: activeViewport ? (offset) => setXOffset(x => x + offset) : undefined,
    setYOffset: activeViewport ? (offset) => setYOffset(y => y + offset) : undefined,
  })
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    min: 0.001,
    localStorageKey: props.id + '-scale',
    setScaleOffset: activeViewport ? (scaleOffset, cursor) => {
      setScaleOffset(f => f * scaleOffset)
      cursor = reverseTransformPosition(cursor, transform)
      setXOffset(f => (cursor.x - activeViewport.x) * scale * (1 - scaleOffset) + f * scaleOffset)
      setYOffset(f => (cursor.y - activeViewport.y) * scale * (1 - scaleOffset) + f * scaleOffset)
    } : undefined,
    onChange(oldScale, newScale, cursor) {
      const result = scaleByCursorPosition({ width, height }, newScale / oldScale, cursor)
      setX(result.setX)
      setY(result.setY)
    }
  })
  const [rotate, setRotate] = useLocalStorageState(props.id + '-rotate', 0)
  const { offset: rotateOffset, onStart: startRotate, mask: rotateMask, resetDragRotate } = useDragRotate(
    () => {
      if (activeViewport && activeViewportIndex !== undefined) {
        setState((draft) => {
          draft = getContentByPath(draft)
          const content = draft[activeViewportIndex]
          if (content && isViewportContent(content)) {
            content.rotate = currentRotate
          }
        })
        return
      }
      setRotate(angleToRadian(rotateOffset?.angle))
    },
    {
      transformOffset: (r, e) => {
        if (e && r !== undefined && !e.shiftKey) {
          const snap = Math.round(r / 90) * 90
          if (Math.abs(snap - r) < 5) return snap
        }
        return r
      },
    }
  )
  const { zoomIn, zoomOut } = useZoom(scale, setScale, { min: 0.001 })
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask, resetDragMove } = useDragMove(() => {
    if (activeViewportIndex !== undefined) {
      applyPatchFromSelf(prependPatchPath(previewPatches), prependPatchPath(previewReversePatches))
      return
    }
    setX((v) => v + offset.x)
    setY((v) => v + offset.y)
  })

  const scaleWithViewport = scale * (activeViewport?.scale ?? 1)
  const currentRotate = rotateOffset?.angle !== undefined ? angleToRadian(rotateOffset.angle) : undefined
  const rotateWithViewport = currentRotate ?? (activeViewport ? activeViewport.rotate ?? 0 : rotate)
  const transform: Transform = {
    x,
    y,
    scale,
    center: {
      x: width / 2,
      y: height / 2,
    },
    rotate: activeViewport ? rotate : currentRotate ?? rotate,
  }
  if (activeViewportIndex !== undefined) {
    const [, patches, reversePatches] = produceWithPatches(editingContent, draft => {
      const content = draft[activeViewportIndex]
      if (content && isViewportContent(content)) {
        const p = core.rotatePosition(offset, { x: 0, y: 0 }, -rotate)
        content.x += (p.x + xOffset) / scale
        content.y += (p.y + yOffset) / scale
        content.scale *= scaleOffset
        if (rotateOffset?.angle !== undefined) {
          content.rotate = angleToRadian(rotateOffset.angle)
        }
      }
    })
    previewPatches.push(...patches)
    previewReversePatches.push(...reversePatches)
  } else {
    transform.x += offset.x
    transform.y += offset.y
  }

  useDelayedAction(xOffset !== 0 || yOffset !== 0 || scaleOffset !== 1, 500, () => {
    applyPatchFromSelf(prependPatchPath(previewPatches), prependPatchPath(previewReversePatches))
    setXOffset(0)
    setYOffset(0)
    setScaleOffset(1)
  })

  const selectedContents: { content: BaseContent, path: ContentPath }[] = []
  editingContent.forEach((s, i) => {
    if (!s) {
      return
    }
    if (isSelected([i])) {
      selectedContents.push({ content: s, path: [i] })
    } else {
      for (const f of selected) {
        if (f.length === 2 && f[0] === i) {
          const line = getContentModel(s)?.getGeometries?.(s, editingContent)?.lines?.[f[1]]
          if (line) {
            selectedContents.push({ content: model.geometryLineToContent(line), path: f })
          }
        }
      }
    }
  })

  const acquirePoint = (handle: (point: Position, target?: model.SnapTarget | undefined) => void) => {
    acquirePointHandler.current = p => {
      handle(p.position, p.target)
    }
  }
  const acquireContent = (select: Select, handle: (refs: readonly PartRef[]) => void) => {
    const current = selected
    const op = operations.type === 'operate' ? operations.operate : undefined
    acquireContentHandler.current = p => {
      handle(p.map(t => ({ id: t[0], partIndex: t[1] })))
      setSelected(...current)
      if (op) {
        operate(op)
      } else {
        resetOperation()
      }
    }
    setSelected()
    selectBeforeOperate(select, { type: 'command', name: '' })
  }
  const acquireRegion = (handle: (region: Position[]) => void) => {
    acquireRegionHandler.current = handle
  }
  const transformPosition = (p: Position) => {
    if (transformViewport) {
      p = transformViewport(p)
    }
    p = core.transformPosition(p, transform)
    return p
  }

  const { editPoint, editLastPosition, updateEditPreview, onEditMove, onEditClick, getEditAssistentContents, resetEdit } = useEdit<BaseContent, ContentPath>(
    (p1, p2) => applyPatchFromSelf(prependPatchPath([...previewPatches, ...p1]), prependPatchPath([...previewReversePatches, ...p2])),
    (s) => getContentModel(s)?.getEditPoints?.(s, editingContent),
    {
      scale: scaleWithViewport,
      readOnly: readOnly || operations.type === 'operate',
      contentReadOnly: c => c.readonly,
    }
  )

  // snap point
  const { snapOffset, snapOffsetActive, snapOffsetInput, setSnapOffset, onSnapOffsetKeyDown } = useSnapOffset((operations.type === 'operate' && operations.operate.type === 'command') || (operations.type !== 'operate' && editPoint !== undefined))
  const { getSnapAssistentContents, getSnapPoint } = usePointSnap(
    (operations.type === 'operate' && !getCommand(operations.operate.name)?.pointSnapDisabled) || editPoint !== undefined || acquirePointHandler.current !== undefined,
    getIntersectionPoints,
    snapTypes,
    getContentModel,
    snapOffset,
    5 / scaleWithViewport,
  )

  const getContentsInRange = (region: TwoPointsFormRegion): BaseContent[] => {
    if (!rtree) {
      return []
    }
    return rtree.search({ x: region.start.x, y: region.start.y, w: region.end.x - region.start.x, h: region.end.y - region.start.y })
  }

  // commands
  const { commandMask, commandUpdateSelectedContent, startCommand, onCommandMouseDown, onCommandMouseUp, onCommandKeyDown, commandInput, commandButtons, commandPanel, onCommandMouseMove, commandAssistentContents, getCommandByHotkey, commandLastPosition, resetCommand } = useCommands(
    ({ updateContents, nextCommand, repeatedly } = {}) => {
      if (updateContents) {
        const [, ...patches] = produceWithPatches(editingContent, (draft) => {
          updateContents(draft, selected)
        })
        applyPatchFromSelf(prependPatchPath(patches[0]), prependPatchPath(patches[1]))
      } else if (previewPatches.length > 0) {
        applyPatchFromSelf(prependPatchPath(previewPatches), prependPatchPath(previewReversePatches))
      }
      if (repeatedly) {
        return
      }
      resetOperation()
      if (nextCommand) {
        startOperation({ type: 'command', name: nextCommand }, [])
      }
    },
    (p) => getSnapPoint(reverseTransform(p), editingContent, getContentsInRange, lastPosition).position,
    inputFixed,
    operations.type === 'operate' && operations.operate.type === 'command' ? operations.operate.name : undefined,
    selectedContents,
    scaleWithViewport,
    strokeStyleId,
    fillStyleId,
    textStyleId,
    editingContent,
    props.backgroundColor,
    acquireContent,
    acquireRegion,
    transformPosition,
    getContentsInRange,
  )
  const lastPosition = editLastPosition ?? commandLastPosition
  const reverseTransform = (p: Position) => {
    p = reverseTransformPosition(p, transform)
    if (reverseTransformViewport) {
      p = reverseTransformViewport(p)
    }
    return p
  }

  // select by region
  const { onStartSelect, dragSelectMask, endDragSelect, resetDragSelect } = useDragSelect((start, end, e) => {
    if (end) {
      const polygon = getPolygonFromTwoPointsFormRegion(getTwoPointsFormRegion(start, end)).map(p => reverseTransform(p))
      if (acquireRegionHandler.current) {
        acquireRegionHandler.current(polygon)
        acquireRegionHandler.current = undefined
        return
      }
      if (operations.type === 'operate' && operations.operate.name === 'zoom window') {
        if (activeViewportIndex !== undefined && activeViewport) {
          const viewport = getViewportByPoints(activeViewport, polygon, activeViewport.rotate)
          if (viewport) {
            setState((draft) => {
              draft = getContentByPath(draft)
              const content = draft[activeViewportIndex]
              if (content && isViewportContent(content)) {
                content.x = viewport.x
                content.y = viewport.y
                content.scale = viewport.scale
              }
            })
          }
          resetOperation()
          return
        }
        const result = zoomToFitPoints(polygon, { width, height }, { x: width / 2, y: height / 2 }, 1, transform.rotate)
        if (result) {
          setScale(result.scale)
          setX(result.x)
          setY(result.y)
        }
        resetOperation()
        return
      }
      const target = getContentsByRegion(
        editingContent,
        polygon,
        start.x > end.x,
        !!transform.rotate,
        getContentModel,
        e.shiftKey ? undefined : isSelectable,
        contentVisible,
      )
      if (e.shiftKey) {
        removeSelection(...target)
      } else {
        addSelection(...target)
      }
    } else {
      // double click
      const point = reverseTransform(start)
      const activeIndex = editingContent.findIndex((e): e is ViewportContent => !!e && isViewportContent(e) && !!getContentModel(e.border)?.isPointIn?.(e.border, point))
      if (activeIndex >= 0) {
        if (activeViewportIndex === activeIndex && activeViewport) {
          const viewport = getDefaultViewport(activeViewport, state, activeViewport.rotate)
          if (viewport) {
            setState((draft) => {
              draft = getContentByPath(draft)
              const content = draft[activeViewportIndex]
              if (content && isViewportContent(content)) {
                content.x = viewport.x
                content.y = viewport.y
                content.scale = viewport.scale
              }
            })
          }
        }
        setActiveViewportIndex(activeIndex)
        return
      }
      const indexes = getContentsInRange({ start: point, end: point }).map(c => getContentIndex(c, editingContent))
      const index = getContentByClickPosition(editingContent, point, () => true, getContentModel, false, contentVisible, indexes)
      if (index !== undefined) {
        const content = editingContent[index[0]]
        if (content) {
          const child = getContentModel(content)?.getChildByPoint?.(content, point, { textStyleId })
          if (child) {
            setActiveChild(child.child)
            if (child.patches) {
              applyPatchFromSelf(prependPatchPath(child.patches[0], index), prependPatchPath(child.patches[1], index))
            }
          }
        }
        setActive(index[0])
        return
      }
      if (active !== undefined) {
        setActive(undefined)
        setActiveChild(undefined)
        return
      }
      if (activeViewportIndex !== undefined) {
        setActiveViewportIndex(undefined)
        return
      }
      const result = zoomContentsToFit(width, height, editingContent, state, 0.8, transform.rotate)
      if (result) {
        setScale(result.scale)
        setX(result.x)
        setY(result.y)
      }
    }
  })

  debug.mark('before assistent contents')
  const assistentContents: BaseContent[] = [
    ...getSnapAssistentContents(
      (circle) => ({ type: 'circle', ...circle, strokeColor: 0x00ff00 } as CircleContent),
      (rect) => ({ type: 'rect', ...rect, angle: 0, strokeColor: 0x00ff00 } as RectContent),
      (points) => ({ type: 'polyline', points, strokeColor: 0x00ff00 } as LineContent),
    ),
    ...(commandAssistentContents || []),
  ]

  const result = updateEditPreview()
  previewPatches.push(...result?.patches ?? [])
  previewReversePatches.push(...result?.reversePatches ?? [])
  assistentContents.push(...result?.assistentContents ?? [])
  if (result) {
    assistentContents.push(...updateReferencedContents(result.content, result.result, editingContent))
  }
  for (const { content, path } of selectedContents) {
    if (path.length === 1) {
      const c = editPoint && isSamePath(editPoint.path, path) ? result?.result : result?.relatedEditPointResults.get(content)
      assistentContents.push(...getEditAssistentContents(c ?? content, (rect) => ({ type: 'rect', ...rect, fillColor: 0xffffff, angle: 0 } as RectContent)))
    }
  }

  const r = commandUpdateSelectedContent(state)
  assistentContents.push(...r.assistentContents)
  for (const [patches, reversePatches] of r.patches) {
    previewPatches.push(...patches)
    previewReversePatches.push(...reversePatches)
  }

  React.useEffect(() => props.setCanUndo?.(canUndo), [canUndo])
  React.useEffect(() => props.setCanRedo?.(canRedo), [canRedo])
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

  const onClick = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = reverseTransform({ x: e.clientX, y: e.clientY })
    const p = getSnapPoint(viewportPosition, editingContent, getContentsInRange, lastPosition)
    if (acquirePointHandler.current) {
      acquirePointHandler.current({ position: p.position, target: p.target ? { id: getContentIndex(p.target.content, state), snapIndex: p.target.snapIndex, param: p.target.param } : undefined })
      acquirePointHandler.current = undefined
      return
    }
    // if the operation is command, start it
    if (operations.type === 'operate' && operations.operate.type === 'command') {
      startCommand?.(p.position, p.target ? { id: getContentIndex(p.target.content, state), snapIndex: p.target.snapIndex, param: p.target.param } : undefined)
    }
    if (operations.type !== 'operate') {
      if (editPoint) {
        onEditClick(p.position)
      } else if (hovering.length > 0) {
        // if hovering content, add it to selection
        if (e.shiftKey) {
          removeSelection(...hovering)
        } else {
          addSelection(...hovering)
        }
        setHovering()
      } else if (active !== undefined && !activeViewport) {
        setActive(undefined)
        setActiveChild(undefined)
        return
      } else {
        // start selection by region
        onStartSelect(e)
      }
    }
    if ((operations.type === 'operate' && operations.operate.name === 'zoom window') || acquireRegionHandler.current) {
      onStartSelect(e)
    }
    setSnapOffset(undefined)
  })
  const onMouseDown = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    if (operations.type === 'operate' && operations.operate.name === 'move canvas') {
      onStartMoveCanvas({ x: e.clientX, y: e.clientY })
    } else if (e.buttons === 4) {
      onStartMoveCanvas({ x: e.clientX, y: e.clientY })
    } else if (onCommandMouseDown) {
      onCommandMouseDown(reverseTransform({ x: e.clientX, y: e.clientY }))
    }
  })
  const onMouseUp = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    onCommandMouseUp?.(reverseTransform({ x: e.clientX, y: e.clientY }))
  })
  const onMouseMove = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    setInputPosition(viewportPosition)
    const p = reverseTransform(viewportPosition)
    setCursorPosition(p)
    setPosition({ x: Math.round(p.x), y: Math.round(p.y) })
    if (operations.type === 'operate' && operations.operate.type === 'command' && onCommandMouseMove) {
      const s = getSnapPoint(p, editingContent, getContentsInRange, lastPosition)
      onCommandMouseMove(s.position, viewportPosition, s.target ? { id: getContentIndex(s.target.content, state), snapIndex: s.target.snapIndex, param: s.target.param } : undefined)
    }
    if (operations.type !== 'operate') {
      let s: core.SnapResult<BaseContent<string>>
      if (editPoint && isViewportContent(editPoint.content)) {
        const viewport = editPoint.content
        s = getSnapPoint(model.reverseTransformPositionByViewport(p, editPoint.content), editingContent, getContentsInRange, lastPosition, c => model.transformPositionByViewport(c, viewport))
        if (!s.target) {
          s = getSnapPoint(p, editingContent, getContentsInRange, lastPosition)
        }
      } else {
        s = getSnapPoint(p, editingContent, getContentsInRange, lastPosition)
      }
      onEditMove(s.position, selectedContents, s.target)
      // hover by position
      const indexes = getContentsInRange({ start: p, end: p }).map(c => getContentIndex(c, editingContent))
      setHovering(getContentByClickPosition(editingContent, p, e.shiftKey ? () => true : isSelectable, getContentModel, operations.select.part, contentVisible, indexes, 3 / scaleWithViewport))
    }
  })
  const onDoubleClick = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    endDragSelect(e)
  })
  useGlobalKeyDown(e => {
    onCommandKeyDown?.(e)
    onSelectBeforeOperateKeyDown(e)
    onSnapOffsetKeyDown(e)
    if (metaKeyIfMacElseCtrlKey(e)) {
      if (e.code === 'Minus') {
        zoomOut(e)
      } else if (e.code === 'Equal') {
        zoomIn(e)
      } else if (e.key === 'ArrowLeft') {
        if (activeViewportIndex !== undefined && activeContentBounding) {
          setState((draft) => {
            draft = getContentByPath(draft)
            const content = draft[activeViewportIndex]
            if (content && isViewportContent(content)) {
              const p = core.rotatePosition({ x: (activeContentBounding.end.x - activeContentBounding.start.x) / 10, y: 0 }, { x: 0, y: 0 }, -rotate)
              content.x += p.x
              content.y += p.y
            }
          })
        } else {
          setX((v) => v + width / 10)
        }
        e.preventDefault()
      } else if (e.key === 'ArrowRight') {
        if (activeViewportIndex !== undefined && activeContentBounding) {
          setState((draft) => {
            draft = getContentByPath(draft)
            const content = draft[activeViewportIndex]
            if (content && isViewportContent(content)) {
              const p = core.rotatePosition({ x: (activeContentBounding.end.x - activeContentBounding.start.x) / 10, y: 0 }, { x: 0, y: 0 }, -rotate)
              content.x -= p.x
              content.y -= p.y
            }
          })
        } else {
          setX((v) => v - width / 10)
        }
        e.preventDefault()
      } else if (e.key === 'ArrowUp') {
        if (activeViewportIndex !== undefined && activeContentBounding) {
          setState((draft) => {
            draft = getContentByPath(draft)
            const content = draft[activeViewportIndex]
            if (content && isViewportContent(content)) {
              const p = core.rotatePosition({ x: 0, y: (activeContentBounding.end.y - activeContentBounding.start.y) / 10 }, { x: 0, y: 0 }, -rotate)
              content.x += p.x
              content.y += p.y
            }
          })
        } else {
          setY((v) => v + height / 10)
        }
        e.preventDefault()
      } else if (e.key === 'ArrowDown') {
        if (activeViewportIndex !== undefined && activeContentBounding) {
          setState((draft) => {
            draft = getContentByPath(draft)
            const content = draft[activeViewportIndex]
            if (content && isViewportContent(content)) {
              const p = core.rotatePosition({ x: 0, y: (activeContentBounding.end.y - activeContentBounding.start.y) / 10 }, { x: 0, y: 0 }, -rotate)
              content.x -= p.x
              content.y -= p.y
            }
          })
        } else {
          setY((v) => v - height / 10)
        }
        e.preventDefault()
      } else if (e.code === 'KeyZ') {
        if (operations.type === 'select') {
          if (e.shiftKey) {
            redo(e)
          } else {
            undo(e)
          }
          setSelected()
        }
      } else if (!e.shiftKey) {
        if (e.code === 'KeyA') {
          addSelection(...editingContent.map((_, i) => [i] as ContentPath))
          e.preventDefault()
        } else if (e.code === 'Digit0') {
          setScale(1)
          setX(0)
          setY(0)
          e.preventDefault()
        } else if (e.code === 'KeyC') {
          startOperation({ type: 'command', name: 'copy' })
          e.preventDefault()
        } else if (e.code === 'KeyV') {
          startOperation({ type: 'command', name: 'paste' })
          e.preventDefault()
        } else if (e.code === 'KeyX') {
          startOperation({ type: 'command', name: 'cut' })
          e.preventDefault()
        }
      }
    } else if (e.key === 'Escape') {
      if (!activeViewport) {
        setActive(undefined)
        setActiveChild(undefined)
      }
      resetCommand?.(true)
      resetEdit()
      resetDragSelect()
      resetDragRotate()
      resetDragMove()
    }
  })
  const [lastOperation, setLastOperation] = React.useState<Operation>()
  const startOperation = (p: Operation, s = selected) => {
    setLastOperation(p)
    resetCommand?.()
    if (p.type === 'command') {
      const command = getCommand(p.name)
      if (command) {
        const select: Select = {
          count: command.selectCount,
          part: command.selectType === 'select part',
          selectable(v) {
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
    if (position && onCommandMouseMove) {
      const s = getSnapPoint(position, editingContent, getContentsInRange)
      onCommandMouseMove(s.position, inputPosition, s.target ? { id: getContentIndex(s.target.content, state), snapIndex: s.target.snapIndex, param: s.target.param } : undefined)
    }
  }
  const onContextMenu = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    if (lastOperation) {
      startOperation(lastOperation)
      e.preventDefault()
    }
  })
  const [rtree, setRTree] = React.useState<ReturnType<typeof RTree>>()
  debug.mark('before search')
  const bounding = getPointsBoundingUnsafe(getPolygonFromTwoPointsFormRegion({ start: { x: 0, y: 0 }, end: { x: width, y: height } }).map(p => reverseTransform(p)))
  const searchResult = new Set(getContentsInRange(bounding))
  const contentVisible = (c: BaseContent) => searchResult.has(c) || assistentContents.includes(c)

  const rebuildRTree = (contents: readonly Nullable<BaseContent>[]) => {
    const newRTree = RTree()
    for (const content of contents) {
      if (!content) {
        continue
      }
      const geometries = getContentModel(content)?.getGeometries?.(content, contents)
      if (geometries?.bounding) {
        newRTree.insert(boundingToRTreeBounding(geometries.bounding), content)
      }
    }
    setRTree(newRTree)
  }

  const operatorVisible = props.onApplyPatchesFromSelf !== undefined
  const minimapHeight = 100
  const minimapWidth = 100
  React.useEffect(() => {
    rebuildRTree(props.initialState)
    setMinimapTransform(zoomContentsToFit(minimapWidth, minimapHeight, state, state, 1))
  }, [props.initialState])
  const { setMinimapTransform, minimap, getMinimapPosition } = useMinimap({
    viewport: {
      width: width / transform.scale,
      height: height / transform.scale,
      rotate: transform.rotate,
      center: reverseTransformPosition(transform.center, transform),
    },
    width: minimapWidth,
    height: minimapHeight,
    children: minimapTransform => (
      <>
        <MemoizedRenderer
          type={renderTarget}
          contents={editingContent}
          x={minimapTransform.x}
          y={minimapTransform.y}
          scale={minimapTransform.scale}
          width={minimapWidth}
          height={minimapHeight}
          backgroundColor={props.backgroundColor}
          debug={props.debug}
          printMode={props.printMode}
          performanceMode
          operatorVisible={operatorVisible}
          time={time}
          onClick={e => {
            if (getMinimapPosition) {
              const p = getMinimapPosition(e)
              setX((transform.center.x - p.x) * transform.scale)
              setY((transform.center.y - p.y) * transform.scale)
            }
          }}
          style={{ cursor: 'default' }}
        />
      </>
    )
  })
  const contentsUpdater = (update: (content: BaseContent, contents: Nullable<BaseContent>[]) => void) => {
    const [, ...patches] = produceWithPatches(editingContent, (draft) => {
      selectedContents.forEach(target => {
        const content = getContentByIndex(draft, target.path)
        if (content) {
          update(content, draft)
        }
      })
    })
    applyPatchFromSelf(prependPatchPath(patches[0]), prependPatchPath(patches[1]))
  }
  let panel: JSX.Element | undefined
  if (props.panelVisible && selectedContents.length > 0) {
    const propertyPanels: Record<string, JSX.Element | JSX.Element[]> = {}
    const types = new Set<string>()
    const ids: number[] = []
    const zPanel: JSX.Element[] = []
    const visiblePanel: JSX.Element[] = []
    const readonlyPanel: JSX.Element[] = []
    let areas = 0
    selectedContents.forEach(target => {
      types.add(target.content.type)
      const id = target.path[0]
      ids.push(id)
      const startTime = (max: number) => {
        const now = performance.now()
        const step = (time: number) => {
          const t = time - now
          if (t >= max) {
            setTime(0)
          } else {
            setTime(t)
            requestAnimationFrame(step)
          }
        }
        requestAnimationFrame(step)
      }
      const propertyPanel = getContentModel(target.content)?.propertyPanel?.(target.content, contentsUpdater, state, {
        startTime,
        activeChild: id === active ? activeChild : undefined,
        acquirePoint,
        acquireContent,
      })
      if (propertyPanel) {
        Object.entries(propertyPanel).forEach(([field, value]) => {
          const element = propertyPanels[field]
          const v = Array.from(iterateItemOrArray(value))
          if (v.length === 0) {
            return
          }
          if (Array.isArray(element)) {
            element.push(...v)
          } else if (element) {
            propertyPanels[field] = [element, ...v]
          } else {
            propertyPanels[field] = v
          }
        })
      }
      zPanel.push(<BooleanEditor value={target.content.z !== undefined} setValue={(v) => contentsUpdater(c => { c.z = v ? id : undefined })} />)
      if (target.content.z !== undefined) {
        zPanel.push(<NumberEditor value={target.content.z} setValue={(v) => contentsUpdater(c => { c.z = v })} />)
      }
      visiblePanel.push(<BooleanEditor value={target.content.visible !== false} setValue={(v) => contentsUpdater(c => { c.visible = v ? undefined : false })} />)
      readonlyPanel.push(<BooleanEditor value={target.content.readonly === true} setValue={(v) => contentsUpdater(c => { c.readonly = v ? true : undefined })} />)
      const area = getContentModel(target.content)?.getArea?.(target.content)
      if (area) {
        areas += area
      }
    })
    propertyPanels.z = zPanel
    propertyPanels.visible = visiblePanel
    propertyPanels.readonly = readonlyPanel
    if (areas) {
      propertyPanels.areas = <NumberEditor value={areas} />
    }
    propertyPanels.debug = <core.Button onClick={() => console.info(selectedContents.map(s => [s.content, getContentModel(s.content)?.getGeometries?.(s.content, state)]))}>log to console</core.Button>
    panel = (
      <div style={{ position: 'absolute', right: '0px', top: '100px', bottom: '0px', width: '400px', overflowY: 'auto', background: 'white', zIndex: 11 }}>
        {Array.from(types).join(',')}
        <div>{ids.join(',')}</div>
        {propertyPanels && <ObjectEditor
          properties={propertyPanels}
          readOnly={readOnly}
        />}
      </div>
    )
  }
  let editPanel: JSX.Element | undefined
  if (activeContent) {
    editPanel = getContentModel(activeContent)?.editPanel?.(activeContent, scaleWithViewport, contentsUpdater, state, () => setActive(undefined), transformPosition, activeChild)
  }
  if (props.debug) {
    console.info(debug.print())
  }

  const main = (
    <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}>
      <div style={{ cursor: editPoint?.cursor ?? (operations.type === 'operate' && operations.operate.name === 'move canvas' ? 'grab' : 'crosshair'), position: 'absolute', inset: '0px', overflow: 'hidden' }} onMouseMove={onMouseMove}>
        {rtree && <MemoizedRenderer
          type={renderTarget}
          contents={editingContent}
          previewPatches={previewPatches.length === 0 ? undefined : previewPatches}
          assistentContents={assistentContents.length === 0 ? undefined : assistentContents}
          selected={selected}
          othersSelectedContents={othersSelectedContents}
          hovering={hovering}
          active={active}
          activeViewportIndex={activeViewportIndex}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onContextMenu={onContextMenu}
          onDoubleClick={onDoubleClick}
          x={transform.x}
          y={transform.y}
          scale={transform.scale}
          rotate={transform.rotate}
          width={width}
          height={height}
          backgroundColor={props.backgroundColor}
          printMode={props.printMode}
          performanceMode={props.performanceMode}
          operatorVisible={operatorVisible}
          debug={props.debug}
          time={time}
        />}
        {minimap}
        <div
          style={{
            width: '100px',
            height: '100px',
            left: '1px',
            top: `${height - 204}px`,
            boxSizing: 'border-box',
            position: 'absolute',
            transform: `rotate(${rotateWithViewport}rad)`,
            border: '1px solid black',
            borderRadius: '50px',
          }}
        >
          <RotationBar onMouseDown={() => startRotate({ x: 51, y: height - 154 })} />
        </div>
        {position && <span style={{ position: 'absolute', right: 0 }}>{position.x},{position.y}</span>}
        {commandMask}
        {!snapOffsetActive && selectionInput}
        {!readOnly && !snapOffsetActive && commandInput}
        {!readOnly && !snapOffsetActive && commandButtons}
        {commandPanel}
        {!readOnly && snapOffsetInput}
      </div>
      {dragSelectMask}
      {moveCanvasMask}
      {rotateMask}
    </div>
  )
  return (
    <>
      {main}
      {panel}
      {editPanel}
    </>
  )
})

export function usePlugins() {
  const [pluginCommandTypes, setPluginCommandTypes] = React.useState<CommandType[]>([])
  const [pluginLoaded, setPluginLoaded] = React.useState(false)

  React.useEffect(() => {
    (async () => {
      try {
        const commandNames = await registerPlugins()
        setPluginCommandTypes(commandNames)
        setPluginLoaded(true)
      } catch (e) {
        console.info(e)
        setPluginLoaded(true)
      }
    })()
  }, [])

  return {
    pluginCommandTypes,
    pluginLoaded,
  }
}

async function registerPlugins() {
  const plugins: { getModel?: (ctx: PluginContext) => model.Model<BaseContent> | model.Model<BaseContent>[], getCommand?: (ctx: PluginContext) => Command | Command[] }[] = await Promise.all(pluginScripts.map(p => import(/* webpackIgnore: true */'data:text/javascript;charset=utf-8,' + encodeURIComponent(p))))
  const ctx: PluginContext = { ...core, ...model, React, produce, produceWithPatches, renderToStaticMarkup, parseExpression, tokenizeExpression, evaluateExpression }
  const commandTypes: CommandType[] = []
  for (const plugin of plugins) {
    if (plugin.getModel) {
      for (const m of iterateItemOrArray(plugin.getModel(ctx))) {
        registerModel(m)
      }
    }
    if (plugin.getCommand) {
      for (const command of iterateItemOrArray(plugin.getCommand(ctx))) {
        registerCommand(command)
        if (command.type) {
          commandTypes.push(...command.type)
        } else {
          commandTypes.push(command)
        }
      }
    }
  }
  return commandTypes
}

const CADEditorState: Validator = [Nullable(Content)]

export function useInitialStateValidated(
  initialState: readonly Nullable<BaseContent>[] | undefined,
  pluginLoaded: boolean,
) {
  const [valid, setValid] = React.useState(false)
  React.useEffect(() => {
    if (initialState && pluginLoaded) {
      const r = validate(initialState, CADEditorState)
      if (r !== true) {
        console.error(r)
      } else {
        setValid(true)
      }
    }
  }, [initialState, pluginLoaded])

  return valid
}

function useSnapOffset(enabled: boolean) {
  const [offset, setOffset] = React.useState<Position>()
  const [text, setText] = React.useState('')
  const [active, setActive] = React.useState(false)

  return {
    snapOffset: offset,
    snapOffsetActive: active,
    setSnapOffset: setOffset,
    onSnapOffsetKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOffset(undefined)
        setText('')
      }
    },
    snapOffsetInput: enabled && (
      <input
        placeholder={offset ? `${offset.x},${offset.y}` : 'x,y'}
        value={text}
        style={{
          position: 'absolute',
          left: '104px',
          bottom: '1px',
          width: '70px',
        }}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (!text) {
              setOffset(undefined)
              setActive(false)
              return
            }
            const positions = text.split(',')
            if (positions.length === 2) {
              const x = +positions[0]
              const y = +positions[1]
              if (!isNaN(x) && !isNaN(y)) {
                setOffset({ x, y })
                setText('')
                setActive(false)
              }
            }
          }
        }}
      />
    )
  }
}

export interface CADEditorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
  handleSelectionEvent(data: { selectedContents: number[], operator: string }): void
  undo(): void
  redo(): void
  startOperation(p: Operation): void
}

type Operation = {
  type: 'command' | 'non command'
  name: string
}
