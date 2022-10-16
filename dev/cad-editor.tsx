import React from 'react'
import { bindMultipleRefs, Position, reactCanvasRenderTarget, reactSvgRenderTarget, useCursorInput, useDragMove, useDragSelect, useKey, usePatchBasedUndoRedo, useSelected, useSelectBeforeOperate, useWheelScroll, useWheelZoom, useZoom, usePartialEdit, useEdit, reverseTransformPosition, Transform, getContentsByClickTwoPositions, getContentByClickPosition, usePointSnap, SnapPointType, scaleByCursorPosition, isSamePath, TwoPointsFormRegion, useEvent, metaKeyIfMacElseCtrlKey, reactWebglRenderTarget, Nullable, ObjectEditor } from '../src'
import produce, { enablePatches, Patch, produceWithPatches } from 'immer'
import { BaseContent, fixedInputStyle, getContentByIndex, getContentModel, getIntersectionPoints, getModel, iterateAllContents, registerModel, zoomContentsToFit } from './models/model'
import { Command, CommandType, getCommand, registerCommand, useCommands } from './commands/command'
import { registerRenderer, MemoizedRenderer, visibleContents, contentVisible } from './renderers/renderer'
import RTree from 'rtree'

import * as core from '../src'
import * as model from './models/model'
import { pluginScripts } from './plugins/variables'
import type { RectContent } from './plugins/rect.plugin'
import type { CircleContent } from './plugins/circle-arc.plugin'
import type { LineContent } from './plugins/line-polyline.plugin'
import type { PluginContext } from './plugins/types'

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

enablePatches()

registerRenderer(reactWebglRenderTarget)
registerRenderer(reactSvgRenderTarget)
registerRenderer(reactCanvasRenderTarget)

export const CADEditor = React.forwardRef((props: {
  initialState: readonly Nullable<BaseContent>[]
  width: number
  height: number
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
  onSendSelection?: (selectedContents: readonly number[]) => void
  onChange?: (state: readonly Nullable<BaseContent>[]) => void
  readOnly?: boolean
  inputFixed?: boolean
  snapTypes: readonly SnapPointType[]
  renderTarget?: string
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  setOperation: (operations: string | undefined) => void
  backgroundColor: number
  debug?: boolean
  panelVisible?: boolean
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
      onChange: (c) => props.onSendSelection?.(c.map((s) => s[0]))
    },
  )
  const { snapTypes, renderTarget, readOnly, inputFixed, width, height } = props
  const { state, setState, undo, redo, canRedo, canUndo, applyPatchFromSelf, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, me, {
    onApplyPatchesFromSelf: props.onApplyPatchesFromSelf,
    onChange({ patches, oldState, newState }) {
      const newContents = new Set<BaseContent>()
      const removedContents = new Set<BaseContent>()
      patches = trimPatchPath(patches)
      for (const patch of patches) {
        // type-coverage:ignore-next-line
        const index = patch.path[0] as number
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
        const geometries = getModel(content.type)?.getGeometries?.(content, newState)
        if (geometries?.bounding) {
          rtree?.insert({
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
          rtree?.remove({
            x: geometries.bounding.start.x,
            y: geometries.bounding.start.y,
            w: geometries.bounding.end.x - geometries.bounding.start.x,
            h: geometries.bounding.end.y - geometries.bounding.start.y,
          }, content)
        }
      }
      setMinimapTransform(zoomContentsToFit(minimapWidth, minimapHeight, newState, newState, 1))
      props.onChange?.(newState)
    },
  })
  const { selected: hovering, setSelected: setHovering } = useSelected<number[]>({ maxCount: 1 })
  const { editingContent, trimPatchPath, getContentByPath, setEditingContentPath, prependPatchPath } = usePartialEdit(state, {
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
  useKey((k) => k.code === 'Minus' && metaKeyIfMacElseCtrlKey(k), zoomOut)
  useKey((k) => k.code === 'Equal' && metaKeyIfMacElseCtrlKey(k), zoomIn)
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask } = useDragMove(() => {
    setX((v) => v + offset.x)
    setY((v) => v + offset.y)
  })

  const transform: Transform = {
    x: x + offset.x,
    y: y + offset.y,
    scale,
    center: {
      x: width / 2,
      y: height / 2,
    },
  }
  useKey((k) => k.key === 'ArrowLeft' && metaKeyIfMacElseCtrlKey(k), (e) => {
    setX((v) => v + width / 10)
    e.preventDefault()
  })
  useKey((k) => k.key === 'ArrowRight' && metaKeyIfMacElseCtrlKey(k), (e) => {
    setX((v) => v - width / 10)
    e.preventDefault()
  })
  useKey((k) => k.key === 'ArrowUp' && metaKeyIfMacElseCtrlKey(k), (e) => {
    setY((v) => v + height / 10)
    e.preventDefault()
  })
  useKey((k) => k.key === 'ArrowDown' && metaKeyIfMacElseCtrlKey(k), (e) => {
    setY((v) => v - height / 10)
    e.preventDefault()
  })

  const selectedContents: { content: BaseContent, path: number[] }[] = []
  editingContent.forEach((s, i) => {
    if (!s) {
      return
    }
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

  const { editPoint, editLastPosition, updateEditPreview, onEditMove, onEditClick, getEditAssistentContents } = useEdit<BaseContent, readonly number[]>(
    () => applyPatchFromSelf(prependPatchPath(previewPatches), prependPatchPath(previewReversePatches)),
    (s) => getModel(s.type)?.getEditPoints?.(s, editingContent),
    {
      scale: transform.scale,
      readOnly: readOnly || operations.type === 'operate',
    }
  )

  // snap point
  const { snapOffset, snapOffsetActive, snapOffsetInput, setSnapOffset } = useSnapOffset((operations.type === 'operate' && operations.operate.type === 'command') || (operations.type !== 'operate' && editPoint !== undefined))
  const { getSnapAssistentContents, getSnapPoint } = usePointSnap(
    operations.type === 'operate' || editPoint !== undefined,
    getIntersectionPoints,
    snapTypes,
    getContentModel,
    scale,
    snapOffset,
  )

  // commands
  const { commandMasks, updateSelectedContents, startCommand, commandInputs, onCommandMove, commandAssistentContents, getCommandByHotkey, commandLastPosition } = useCommands(
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
    (p) => getSnapPoint(reverseTransformPosition(p, transform), editingContent, getContentsInRange, lastPosition),
    inputFixed,
    operations.type === 'operate' && operations.operate.type === 'command' ? operations.operate.name : undefined,
    selectedContents,
    scale,
  )
  const lastPosition = editLastPosition ?? commandLastPosition

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
      const result = zoomContentsToFit(width, height, editingContent, state)
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

  let updatedContents: readonly Nullable<BaseContent>[] | undefined
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

  useKey((k) => k.code === 'KeyZ' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    undo(e)
    setSelected()
  })
  useKey((k) => k.code === 'KeyZ' && k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    redo(e)
    setSelected()
  })
  useKey((k) => k.code === 'KeyA' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    addSelection(...editingContent.map((_, i) => [i]))
    e.preventDefault()
  })
  useKey((k) => k.code === 'Digit0' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    setScale(1)
    setX(0)
    setY(0)
    e.preventDefault()
  })
  useKey((k) => k.code === 'KeyC' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    startOperation({ type: 'command', name: 'clone' })
    e.preventDefault()
  })
  useKey((k) => k.code === 'KeyX' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    startOperation({ type: 'command', name: 'move' })
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
    compress() {
      setState(draft => {
        const newIndexes: (number | undefined)[] = []
        let validContentCount = 0
        const invalidContentsIndex: number[] = []
        const contentIsValid = (d: Nullable<BaseContent>): d is BaseContent => !!d && (getContentModel(d)?.isValid?.(d) ?? true)
        draft.forEach((d, i) => {
          if (contentIsValid(d)) {
            newIndexes.push(validContentCount)
            if (model.isContainerContent(d)) {
              d.contents = d.contents.filter(c => contentIsValid(c))
            }
            validContentCount++
          } else {
            newIndexes.push(undefined)
            invalidContentsIndex.unshift(i)
          }
        })
        invalidContentsIndex.forEach(i => {
          draft.splice(i, 1)
        })
        for (const content of iterateAllContents(draft)) {
          getContentModel(content)?.updateRefId?.(content, refId => newIndexes[refId])
        }
      })
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

  const onClick = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    const p = getSnapPoint(reverseTransformPosition(viewportPosition, transform), editingContent, getContentsInRange, lastPosition)
    // if the operation is command, start it
    if (operations.type === 'operate' && operations.operate.type === 'command') {
      startCommand(operations.operate.name, p)
    }
    if (operations.type !== 'operate' && !simplified) {
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
    setSnapOffset(undefined)
  })
  const onMouseDown = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    if (operations.type === 'operate' && operations.operate.name === 'move canvas') {
      onStartMoveCanvas({ x: e.clientX, y: e.clientY })
    } else if (e.buttons === 4) {
      onStartMoveCanvas({ x: e.clientX, y: e.clientY })
    }
  })
  const onMouseMove = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const viewportPosition = { x: e.clientX, y: e.clientY }
    setInputPosition(viewportPosition)
    const p = reverseTransformPosition(viewportPosition, transform)
    setCursorPosition(p)
    setPosition({ x: Math.round(p.x), y: Math.round(p.y) })
    if (operations.type === 'operate' && operations.operate.type === 'command') {
      onCommandMove(getSnapPoint(p, editingContent, getContentsInRange, lastPosition), viewportPosition)
    }
    if (operations.type !== 'operate' && !simplified) {
      onEditMove(getSnapPoint(p, editingContent, getContentsInRange, lastPosition), selectedContents)
      // hover by position
      setHovering(getContentByClickPosition(editingContent, p, isSelectable, getContentModel, operations.select.part, contentVisible))
    }
  })
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
  const onContextMenu = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    if (lastOperation) {
      startOperation(lastOperation)
    }
    e.preventDefault()
  })
  const [rtree, setRTree] = React.useState<ReturnType<typeof RTree>>()
  const getContentsInRange = (region: TwoPointsFormRegion): BaseContent[] => {
    if (!rtree) {
      return []
    }
    return rtree.search({ x: region.start.x, y: region.start.y, w: region.end.x - region.start.x, h: region.end.y - region.start.y })
  }
  const start = reverseTransformPosition({ x: 0, y: 0 }, transform)
  const end = reverseTransformPosition({ x: width, y: height }, transform)
  const searchResult = getContentsInRange({
    start,
    end,
  })
  visibleContents.clear()
  visibleContents.add(...searchResult)
  visibleContents.add(...assistentContents)
  const simplified = searchResult.length > 1000

  const rebuildRTree = (contents: readonly Nullable<BaseContent>[]) => {
    const newRTree = RTree()
    for (const content of contents) {
      if (!content) {
        continue
      }
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

  const minimapHeight = 100
  const minimapWidth = 100
  const [minimapTransform, setMinimapTransform] = React.useState<{ x: number, y: number, scale: number, bounding: TwoPointsFormRegion }>()
  React.useEffect(() => {
    rebuildRTree(props.initialState)
    setMinimapTransform(zoomContentsToFit(minimapWidth, minimapHeight, state, state, 1))
  }, [props.initialState])
  let minimap: JSX.Element | undefined
  if (minimapTransform) {
    const contentWidth = minimapTransform.bounding.end.x - minimapTransform.bounding.start.x
    const contentHeight = minimapTransform.bounding.end.y - minimapTransform.bounding.start.y
    const xRatio = minimapWidth / contentWidth
    const yRatio = minimapHeight / contentHeight
    let xOffset = 0
    let yOffset = 0
    let ratio: number
    if (xRatio < yRatio) {
      ratio = xRatio
      yOffset = (minimapHeight - ratio * contentHeight) / 2
    } else {
      ratio = yRatio
      xOffset = (minimapWidth - ratio * contentWidth) / 2
    }
    minimap = (
      <div
        style={{
          position: 'absolute',
          left: '1px',
          bottom: '1px',
          width: `${minimapWidth}px`,
          height: `${minimapHeight}px`,
          clipPath: 'inset(0)',
          border: '1px solid blue',
        }}
      >
        <MemoizedRenderer
          type={renderTarget}
          contents={editingContent}
          x={minimapTransform.x}
          y={minimapTransform.y}
          scale={minimapTransform.scale}
          width={minimapWidth}
          height={minimapHeight}
          backgroundColor={props.backgroundColor}
          simplified
          debug={props.debug}
        />
        <div style={{
          position: 'absolute',
          border: '1px solid red',
          left: `${xOffset + ratio * (start.x - minimapTransform.bounding.start.x)}px`,
          top: `${yOffset + ratio * (start.y - minimapTransform.bounding.start.y)}px`,
          width: `${ratio * (end.x - start.x)}px`,
          height: `${ratio * (end.y - start.y)}px`,
        }}></div>
      </div>
    )
  }
  let panel: JSX.Element | undefined
  if (props.panelVisible && selectedContents.length > 0) {
    const propertyPanels: Record<string, JSX.Element | JSX.Element[]> = {}
    const types = new Set<string>()
    const contentsUpdater = (update: (content: BaseContent) => void) => {
      const [, ...patches] = produceWithPatches(editingContent, (draft) => {
        selectedContents.forEach(target => {
          const content = getContentByIndex(draft, target.path)
          if (content) {
            update(content)
          }
        })
      })
      applyPatchFromSelf(prependPatchPath(patches[0]), prependPatchPath(patches[1]))
    }
    selectedContents.forEach(target => {
      types.add(target.content.type)
      const propertyPanel = getModel(target.content.type)?.propertyPanel?.(target.content, contentsUpdater)
      if (propertyPanel) {
        Object.entries(propertyPanel).forEach(([field, value]) => {
          const element = propertyPanels[field]
          const v = Array.from(iterateItemOrArray(value))
          if (Array.isArray(element)) {
            element.push(...v)
          } else if (element) {
            propertyPanels[field] = [element, ...v]
          } else {
            propertyPanels[field] = v
          }
        })
      }
    })
    panel = (
      <div style={{ position: 'absolute', right: '0px', top: '100px', bottom: '0px', width: '400px', overflowY: 'auto', background: 'white', zIndex: 11 }}>
        {Array.from(types).join(',')}
        {propertyPanels && <ObjectEditor
          properties={propertyPanels}
          readOnly={readOnly}
        />}
      </div>
    )
  }
  if (props.debug) {
    console.info(Date.now() - now, searchResult.length)
  }

  const main = (
    <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}>
      <div style={{ cursor: editPoint?.cursor ?? (operations.type === 'operate' && operations.operate.name === 'move canvas' ? 'grab' : 'crosshair'), position: 'absolute', inset: '0px' }} onMouseMove={onMouseMove}>
        {rtree && <MemoizedRenderer
          type={renderTarget}
          contents={editingContent}
          previewPatches={previewPatches.length === 0 ? undefined : previewPatches}
          assistentContents={assistentContents.length === 0 ? undefined : assistentContents}
          selected={selected}
          othersSelectedContents={othersSelectedContents}
          hovering={hovering}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onContextMenu={onContextMenu}
          x={transform.x}
          y={transform.y}
          scale={transform.scale}
          width={width}
          height={height}
          backgroundColor={props.backgroundColor}
          simplified={simplified}
        />}
        {minimap}
        {position && <span style={{ position: 'absolute' }}>{position.x},{position.y}</span>}
        {commandMasks}
        {!snapOffsetActive && selectionInput}
        {!readOnly && !snapOffsetActive && commandInputs}
        {!readOnly && snapOffsetInput}
      </div>
      {dragSelectMask}
      {moveCanvasMask}
    </div>
  )
  return (
    <>
      {main}
      {panel}
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
  const plugins: { getModel?: (ctx: PluginContext) => model.Model<unknown> | model.Model<unknown>[], getCommand?: (ctx: PluginContext) => Command | Command[] }[] = await Promise.all(pluginScripts.map(p => import(/* webpackIgnore: true */'data:text/javascript;charset=utf-8,' + encodeURIComponent(p))))
  const ctx: PluginContext = { ...core, ...model, React, produce, produceWithPatches }
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

function* iterateItemOrArray<T>(item: T | (T | undefined)[]): Generator<T, void, unknown> {
  if (Array.isArray(item)) {
    for (const t of item) {
      if (t) {
        yield t
      }
    }
  } else {
    yield item
  }
}

function useSnapOffset(enabled: boolean) {
  const [offset, setOffset] = React.useState<Position>()
  const [text, setText] = React.useState('')
  const [active, setActive] = React.useState(false)

  useKey((e) => e.key === 'Escape', () => {
    setOffset(undefined)
    setText('')
  }, [setOffset, setText])

  return {
    snapOffset: offset,
    snapOffsetActive: active,
    setSnapOffset: setOffset,
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
  exitEditBlock(): void
  compress(): void
}

type Operation = {
  type: 'command' | 'non command'
  name: string
}
