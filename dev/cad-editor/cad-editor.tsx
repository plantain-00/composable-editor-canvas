import React from 'react'
import { bindMultipleRefs, Position, reactCanvasRenderTarget, reactSvgRenderTarget, useCursorInput, useDragMove, useDragSelect, useKey, usePatchBasedUndoRedo, useSelected, useSelectBeforeOperate, useWheelScroll, useWheelZoom, useZoom, usePartialEdit, useEdit, reverseTransformPosition, Transform, getContentsByClickTwoPositions, getContentByClickPosition, usePointSnap, SnapPointType, scaleByCursorPosition, TwoPointsFormRegion, useEvent, metaKeyIfMacElseCtrlKey, reactWebglRenderTarget, Nullable, zoomToFit, isSamePath, Debug, useWindowSize, Validator, validate } from '../../src'
import * as jsonEditor from "react-composable-json-editor"
import { BooleanEditor, NumberEditor, ObjectEditor } from "react-composable-json-editor"
import produce, { enablePatches, Patch, produceWithPatches } from 'immer'
import { renderToStaticMarkup } from 'react-dom/server'
import { BaseContent, Content, fixedInputStyle, getContentByIndex, getContentModel, getIntersectionPoints, getSortedContents, registerModel, zoomContentsToFit } from './model'
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

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

enablePatches()

registerRenderer(reactWebglRenderTarget)
registerRenderer(reactSvgRenderTarget)
registerRenderer(reactCanvasRenderTarget)

export const CADEditor = React.forwardRef((props: {
  id: string
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
}, ref: React.ForwardedRef<CADEditorRef>) => {
  const debug = new Debug(props.debug)
  const { width, height } = useWindowSize()
  const { filterSelection, selected, isSelected, addSelection, setSelected, isSelectable, operations, executeOperation, resetOperation, selectBeforeOperate, operate, message } = useSelectBeforeOperate<{ count?: number, part?: boolean, selectable?: (index: number[]) => boolean }, Operation, number[]>(
    {},
    (p, s) => {
      if (p?.type === 'command') {
        const command = getCommand(p.name)
        if (command?.execute) {
          setState((draft) => {
            draft = getContentByPath(draft)
            command.execute?.({ contents: draft, selected: s, setEditingContentPath, type: p.name, strokeStyleId, fillStyleId })
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
  const { snapTypes, renderTarget, readOnly, inputFixed } = props
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
        const geometries = getContentModel(content)?.getGeometries?.(content, newState)
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
        const geometries = getContentModel(content)?.getGeometries?.(content, oldState)
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
  const strokeStyleId = model.getStrokeStyles(state).find(s => s.content.isCurrent)?.index
  const fillStyleId = model.getFillStyles(state).find(s => s.content.isCurrent)?.index

  const { x, y, ref: wheelScrollRef, setX, setY } = useWheelScroll<HTMLDivElement>({
    localStorageXKey: props.id + '-x',
    localStorageYKey: props.id + '-y',
  })
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    min: 0.001,
    localStorageKey: props.id + '-scale',
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
          const line = getContentModel(s)?.getGeometries?.(s)?.lines?.[f[1]]
          if (line) {
            selectedContents.push({ content: { type: 'line', points: line } as LineContent, path: f })
          }
        }
      }
    }
  })

  const { editPoint, editLastPosition, updateEditPreview, onEditMove, onEditClick, getEditAssistentContents } = useEdit<BaseContent, readonly number[]>(
    () => applyPatchFromSelf(prependPatchPath(previewPatches), prependPatchPath(previewReversePatches)),
    (s) => getContentModel(s)?.getEditPoints?.(s, editingContent),
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
  const { commandMasks, updateSelectedContents, startCommand, commandInputs, onCommandMove, commandAssistentContents, getCommandByHotkey, commandLastPosition, resetCommands } = useCommands(
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
    strokeStyleId,
    fillStyleId,
  )
  const lastPosition = editLastPosition ?? commandLastPosition

  // select by region
  const { onStartSelect, dragSelectMask } = useDragSelect((start, end, e) => {
    if (end) {
      start = reverseTransformPosition(start, transform)
      end = reverseTransformPosition(end, transform)
      if (e.shiftKey || (operations.type === 'operate' && operations.operate.name === 'zoom window')) {
        const result = zoomToFit({ start, end }, { width, height }, { x: width / 2, y: height / 2 }, 1)
        if (result) {
          setScale(result.scale)
          setX(result.x)
          setY(result.y)
        }
        resetOperation()
        return
      }
      addSelection(...getContentsByClickTwoPositions(
        editingContent,
        start,
        end,
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

  debug.mark('before assistent contents')
  const assistentContents: BaseContent[] = [
    ...getSnapAssistentContents(
      (circle) => ({ type: 'circle', ...circle, strokeColor: 0x00ff00 } as CircleContent),
      (rect) => ({ type: 'rect', ...rect, angle: 0, strokeColor: 0x00ff00 } as RectContent),
      (points) => ({ type: 'polyline', points, strokeColor: 0x00ff00 } as LineContent),
    ),
    ...commandAssistentContents,
  ]

  const result = updateEditPreview()
  previewPatches.push(...result?.patches ?? [])
  previewReversePatches.push(...result?.reversePatches ?? [])
  assistentContents.push(...result?.assistentContents ?? [])
  for (const { content, path } of selectedContents) {
    if (path.length === 1) {
      let c = content
      if (editPoint && isSamePath(editPoint.path, path)) {
        c = result?.result ?? content
      } else {
        c = result?.relatedEditPointResults.get(content) ?? content
      }
      assistentContents.push(...getEditAssistentContents(c, (rect) => ({ type: 'rect', ...rect, fillColor: 0xffffff, angle: 0 } as RectContent)))
    }
  }

  const r = updateSelectedContents(state)
  assistentContents.push(...r.assistentContents)
  for (const [patches, reversePatches] of r.patches) {
    previewPatches.push(...patches)
    previewReversePatches.push(...reversePatches)
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
    startOperation({ type: 'command', name: 'copy' })
    e.preventDefault()
  })
  useKey((k) => k.code === 'KeyV' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    startOperation({ type: 'command', name: 'paste' })
    e.preventDefault()
  })
  useKey((k) => k.code === 'KeyX' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    startOperation({ type: 'command', name: 'cut' })
    e.preventDefault()
  })

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
    const viewportPosition = { x: e.clientX, y: e.clientY }
    const p = getSnapPoint(reverseTransformPosition(viewportPosition, transform), editingContent, getContentsInRange, lastPosition)
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
    if (operations.type === 'operate' && operations.operate.name === 'zoom window') {
      onStartSelect(e)
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
    if (operations.type !== 'operate') {
      onEditMove(getSnapPoint(p, editingContent, getContentsInRange, lastPosition), selectedContents)
      // hover by position
      const indexes = getSortedContents(editingContent).indexes
      setHovering(getContentByClickPosition(editingContent, p, isSelectable, getContentModel, operations.select.part, contentVisible, indexes))
    }
  })
  const [lastOperation, setLastOperation] = React.useState<Operation>()
  const startOperation = (p: Operation, s = selected) => {
    setLastOperation(p)
    resetCommands()
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
      e.preventDefault()
    }
  })
  const [rtree, setRTree] = React.useState<ReturnType<typeof RTree>>()
  const getContentsInRange = (region: TwoPointsFormRegion): BaseContent[] => {
    if (!rtree) {
      return []
    }
    return rtree.search({ x: region.start.x, y: region.start.y, w: region.end.x - region.start.x, h: region.end.y - region.start.y })
  }
  debug.mark('before search')
  const start = reverseTransformPosition({ x: 0, y: 0 }, transform)
  const end = reverseTransformPosition({ x: width, y: height }, transform)
  const searchResult = new Set(getContentsInRange({
    start,
    end,
  }))
  const contentVisible = (c: BaseContent) => searchResult.has(c) || assistentContents.includes(c)

  const rebuildRTree = (contents: readonly Nullable<BaseContent>[]) => {
    const newRTree = RTree()
    for (const content of contents) {
      if (!content) {
        continue
      }
      const geometries = getContentModel(content)?.getGeometries?.(content, contents)
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

  const operatorVisible = props.onApplyPatchesFromSelf !== undefined
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
          debug={props.debug}
          printMode={props.printMode}
          operatorVisible={operatorVisible}
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
    const ids: number[] = []
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
    const zPanel: JSX.Element[] = []
    const visiblePanel: JSX.Element[] = []
    selectedContents.forEach(target => {
      types.add(target.content.type)
      const id = target.path[0]
      ids.push(id)
      const propertyPanel = getContentModel(target.content)?.propertyPanel?.(target.content, contentsUpdater, state)
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
    })
    propertyPanels.z = zPanel
    propertyPanels.visible = visiblePanel
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
  if (props.debug) {
    console.info(debug.print())
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
          printMode={props.printMode}
          operatorVisible={operatorVisible}
          debug={props.debug}
        />}
        {minimap}
        {position && <span style={{ position: 'absolute', right: 0 }}>{position.x},{position.y}</span>}
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
  const ctx: PluginContext = { ...core, ...model, ...jsonEditor, React, produce, produceWithPatches, renderToStaticMarkup }
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
}

type Operation = {
  type: 'command' | 'non command'
  name: string
}
