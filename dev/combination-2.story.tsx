import React from 'react'
import { Position, useDragMove, useDragRotate, useDragSelect, useKey, useUndoRedo } from '../src'
import { getContentByClickPosition, getContentsByClickTwoPositions, moveContent, rotateContent } from './util-2'
import { PixiRenderer } from './pixi-renderer'
import { SvgRenderer } from './svg-renderer'
import produce from 'immer'
import { BaseContent, registerModel, useModelsCreate, useModelsEdit } from './model-2'
import { lineModel } from './models/line-model'
import { circleModel } from './models/circle-model'
import { polylineModel } from './models/polyline-model'

const operations = ['2 points', '3 points', 'center radius', 'center diameter', 'line', 'polyline', 'move', 'delete', 'rotate', 'clone'] as const
type Operation = typeof operations[number]
const draftKey = 'composable-editor-canvas-draft-2'
const draftState = localStorage.getItem(draftKey)
const initialState = draftState ? JSON.parse(draftState) as BaseContent[] : []

registerModel('line', lineModel)
registerModel('circle', circleModel)
registerModel('polyline', polylineModel)

export default () => {
  const [operation, setOperation] = React.useState<Operation>()
  const [nextOperation, setNextOperation] = React.useState<Operation>()
  const { state, setState, undo, redo, canRedo, canUndo, stateIndex } = useUndoRedo(initialState)
  const [selectedContents, setSelectedContents] = React.useState<number[]>([])
  const [hoveringContent, setHoveringContent] = React.useState<number>(-1)
  const [renderTarget, setRenderTarget] = React.useState<'pixi' | 'svg'>('pixi')

  const [moveOffset, setMoveOffset] = React.useState<Position>({ x: 0, y: 0 })
  const [cloneOffset, setCloneOffset] = React.useState<Position>({ x: 0, y: 0 })
  const [rotateOffset, setRotateOffset] = React.useState<Position & { angle?: number }>({ x: 0, y: 0 })

  let previewContents = produce(state, (draft) => {
    const clonedContents: BaseContent[] = []
    draft.forEach((content, i) => {
      if (selectedContents.includes(i)) {
        if (moveOffset.x !== 0 || moveOffset.y !== 0) {
          moveContent(content, moveOffset)
        }
        if (rotateOffset.angle) {
          rotateContent(content, rotateOffset, -rotateOffset.angle)
        }
        if (cloneOffset.x !== 0 || cloneOffset.y !== 0) {
          clonedContents.push(produce(content, (d) => {
            moveContent(d, cloneOffset)
          }))
        }
      }
    })
    draft.push(...clonedContents)
  })

  const { onStartSelect, dragSelectMask } = useDragSelect((start, end) => {
    if (end) {
      setSelectedContents([...selectedContents, ...getContentsByClickTwoPositions(state, start, end)])
    }
  })

  const { editMasks, updateEditPreview, editBarMap } = useModelsEdit(() => setState(() => previewContents))
  const { createInputs, updateCreatePreview, onStartCreate, onCreatingMove } = useModelsCreate(operation, (c) => {
    setState((draft) => {
      draft.push(...c)
    })
    setOperation(undefined)
  })

  previewContents = produce(previewContents, (draft) => {
    updateEditPreview(draft)
    updateCreatePreview(draft)
  })

  const { onStartMove, dragMoveMask } = useDragMove(setMoveOffset, () => setState(() => previewContents))
  const { onStartMove: onStartClone, dragMoveMask: dragCloneMask } = useDragMove(setCloneOffset, () => setState(() => previewContents), { clone: true })
  const { onStartRotate, dragRotateMask } = useDragRotate((f) => setRotateOffset({ ...rotateOffset, angle: f ? f - 90 : undefined }), () => setState(() => previewContents))

  useKey((e) => e.key === 'Escape', () => {
    setOperation(undefined)
    setNextOperation(undefined)
    setSelectedContents([])
  }, [setOperation])

  useKey((e) => e.key === 'Enter', () => {
    if (nextOperation === 'delete') {
      setState((draft) => draft.filter((_, i) => !selectedContents.includes(i)))
      setSelectedContents([])
      setNextOperation(undefined)
      return
    }
    if (nextOperation) {
      setOperation(nextOperation)
      setNextOperation(undefined)
    }
  })

  React.useEffect(() => {
    if (stateIndex > 0) {
      localStorage.setItem(draftKey, JSON.stringify(state))
    }
  }, [state, stateIndex])

  const onClick = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    onStartCreate(e)
    if (operation === 'move') {
      onStartMove(e)
      setOperation(undefined)
    } else if (operation === 'clone') {
      onStartClone(e)
      setOperation(undefined)
    } else if (operation === 'rotate') {
      onStartRotate({ x: e.clientX, y: e.clientY })
      setRotateOffset({ x: e.clientX, y: e.clientY })
      setOperation(undefined)
    }
    if (!operation) {
      if (hoveringContent >= 0) {
        setSelectedContents([...selectedContents, hoveringContent])
      } else {
        onStartSelect(e)
      }
    }
  }
  const onMouseMove = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    onCreatingMove(e)
    if (!operation) {
      setHoveringContent(getContentByClickPosition(state, { x: e.clientX, y: e.clientY }, selectedContents))
    }
  }
  const onStartOperation = (p: Operation) => {
    if ((p === 'move' || p === 'rotate' || p === 'delete' || p === 'clone') && selectedContents.length === 0) {
      setOperation(undefined)
      setNextOperation(p)
      return
    }
    if (p === 'delete') {
      setState((draft) => draft.filter((_, i) => !selectedContents.includes(i)))
      setSelectedContents([])
      return
    }
    setOperation(p)
  }

  const Render = renderTarget === 'pixi' ? PixiRenderer : SvgRenderer

  return (
    <div style={{ height: '100%' }}>
      <div style={{ cursor: 'crosshair' }} onMouseMove={onMouseMove}>
        <Render
          contents={previewContents}
          selectedContents={selectedContents}
          hoveringContent={hoveringContent}
          onClick={onClick}
        />
        {previewContents.map((s, i) => {
          if (selectedContents.includes(i)) {
            const EditBar = editBarMap[s.type]
            return <EditBar key={i} content={s} index={i} />
          }
          return null
        })}
        {createInputs}
      </div>
      {operations.map((p) => <button onClick={() => onStartOperation(p)} key={p} style={{ position: 'relative', borderColor: p === operation || p === nextOperation ? 'red' : undefined }}>{p}</button>)}
      <button disabled={!canUndo} onClick={() => undo()} style={{ position: 'relative' }}>undo</button>
      <button disabled={!canRedo} onClick={() => redo()} style={{ position: 'relative' }}>redo</button>
      <button onClick={() => setRenderTarget(renderTarget === 'pixi' ? 'svg' : 'pixi')} style={{ position: 'relative' }}>{renderTarget}</button>
      {editMasks}
      {dragSelectMask}
      {dragMoveMask}
      {dragRotateMask}
      {dragCloneMask}
    </div>
  )
}
