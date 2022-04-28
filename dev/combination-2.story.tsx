import React from 'react'
import { Circle, CircleEditBar, PolylineEditBar, Position, useCircleClickCreate, useCircleEdit, useDragMove, useDragRotate, useDragSelect, useKey, useLineClickCreate, usePolylineEdit, useUndoRedo } from '../src'
import { getContentByClickPosition, getContentsByClickTwoPositions, moveContent, rotateContent } from './util-2'
import { PixiRenderer } from './pixi-renderer'
import { SvgRenderer } from './svg-renderer'
import produce from 'immer'
import { Content } from './model-2'

const operations = ['2 points', '3 points', 'center radius', 'center diameter', 'line', 'polyline', 'move', 'delete', 'rotate', 'clone'] as const
type Operation = typeof operations[number]
const draftKey = 'composable-editor-canvas-draft-2'
const draftState = localStorage.getItem(draftKey)
const initialState = draftState ? JSON.parse(draftState) as Content[] : []

export default () => {
  const [operation, setOperation] = React.useState<Operation>()
  const [nextOperation, setNextOperation] = React.useState<Operation>()
  const { state, setState, undo, redo, canRedo, canUndo, stateIndex } = useUndoRedo(initialState)
  const [selectedContents, setSelectedContents] = React.useState<number[]>([])
  const [hoveringContent, setHoveringContent] = React.useState<number>(-1)
  const [renderTarget, setRenderTarget] = React.useState<'pixi' | 'svg'>('pixi')

  const { setCircleEditOffset, setPolylineEditOffset, setLineEditOffset, setMoveOffset, setCloneOffset, setRotateOffset, previewContents, rotateOffset, setPolylineCreate, setCircleCreate, setLineCreate } = usePreview(state, selectedContents)

  const { onCircleClickCreateClick, onCircleClickCreateMove, circleClickCreateInput } = useCircleClickCreate(
    operation === '2 points' || operation === '3 points' || operation === 'center diameter' || operation === 'center radius' ? operation : undefined,
    setCircleCreate,
    (c) => {
      setState((draft) => {
        draft.push({ ...c, type: 'circle' })
      })
      setOperation(undefined)
    },
  )
  const { onLineClickCreateClick: onPolylineClickCreateClick, onLineClickCreateMove: onPolylineClickCreateMove, lineClickCreateInput: polylineClickCreateInput } = useLineClickCreate(
    operation === 'polyline',
    (c) => setPolylineCreate(c ? { points: c } : undefined),
    (c) => {
      setState((draft) => {
        draft.push({ points: c, type: 'polyline' })
      })
      setOperation(undefined)
    },
  )
  const { onLineClickCreateClick, onLineClickCreateMove, lineClickCreateInput } = useLineClickCreate(
    operation === 'line',
    (c) => setLineCreate(c ? { points: c } : undefined),
    (c) => {
      setState((draft) => {
        for (let i = 1; i < c.length; i++) {
          draft.push({ points: [c[i - 1], c[i]], type: 'line' })
        }
      })
      setOperation(undefined)
    },
  )

  const { onStartSelect, dragSelectMask } = useDragSelect((start, end) => {
    if (end) {
      setSelectedContents([...selectedContents, ...getContentsByClickTwoPositions(state, start, end)])
    }
  })

  const { onStartEditCircle, circleEditMask } = useCircleEdit<number>(setCircleEditOffset, () => setState(() => previewContents))
  const { onStartEditPolyline, polylineEditMask } = usePolylineEdit<number>(setPolylineEditOffset, () => setState(() => previewContents))
  const { onStartEditPolyline: onStartEditLine, polylineEditMask: lineEditMask } = usePolylineEdit<number>(setLineEditOffset, () => setState(() => previewContents))

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
    onCircleClickCreateClick(e)
    onLineClickCreateClick(e)
    onPolylineClickCreateClick(e)
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
    onCircleClickCreateMove(e)
    onLineClickCreateMove(e)
    onPolylineClickCreateMove(e)
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
            if (s.type === 'circle') {
              return <CircleEditBar key={i} x={s.x} y={s.y} radius={s.r} onClick={(e, type, cursor) => onStartEditCircle(e, { ...s, type, cursor, data: i })} />
            }
            if (s.type === 'polyline') {
              return <PolylineEditBar key={i} points={s.points} onClick={(e, pointIndexes) => onStartEditPolyline(e, pointIndexes, i)} />
            }
            if (s.type === 'line') {
              return <PolylineEditBar key={i} points={s.points} onClick={(e, pointIndexes) => onStartEditLine(e, pointIndexes, i)} />
            }
          }
          return null
        })}
      </div>
      {operations.map((p) => <button onClick={() => onStartOperation(p)} key={p} style={{ position: 'relative', borderColor: p === operation || p === nextOperation ? 'red' : undefined }}>{p}</button>)}
      <button disabled={!canUndo} onClick={() => undo()} style={{ position: 'relative' }}>undo</button>
      <button disabled={!canRedo} onClick={() => redo()} style={{ position: 'relative' }}>redo</button>
      <button onClick={() => setRenderTarget(renderTarget === 'pixi' ? 'svg' : 'pixi')} style={{ position: 'relative' }}>{renderTarget}</button>
      {circleClickCreateInput}
      {lineClickCreateInput}
      {polylineClickCreateInput}

      {circleEditMask}
      {polylineEditMask}
      {lineEditMask}

      {dragSelectMask}
      {dragMoveMask}
      {dragRotateMask}
      {dragCloneMask}
    </div>
  )
}

function usePreview(state: Content[], selectedContents: number[]) {
  const [circleCreate, setCircleCreate] = React.useState<Circle>()
  const [polylineCreate, setPolylineCreate] = React.useState<{ points: Position[] }>()
  const [lineCreate, setLineCreate] = React.useState<{ points: Position[] }>()

  const [circleEditOffset, setCircleEditOffset] = React.useState<Circle & { data?: number }>({ x: 0, y: 0, r: 0 })
  const [polylineEditOffset, setPolylineEditOffset] = React.useState<Position & { pointIndexes: number[], data?: number }>()
  const [lineEditOffset, setLineEditOffset] = React.useState<Position & { pointIndexes: number[], data?: number }>()

  const [moveOffset, setMoveOffset] = React.useState<Position>({ x: 0, y: 0 })
  const [cloneOffset, setCloneOffset] = React.useState<Position>({ x: 0, y: 0 })
  const [rotateOffset, setRotateOffset] = React.useState<Position & { angle?: number }>({ x: 0, y: 0 })

  const previewContents = produce(state, (draft) => {
    if (circleEditOffset.data !== undefined) {
      const content = draft[circleEditOffset.data]
      if (content.type === 'circle') {
        content.x += circleEditOffset.x
        content.y += circleEditOffset.y
        content.r += circleEditOffset.r
      }
    }
    if (polylineEditOffset?.data !== undefined) {
      const content = draft[polylineEditOffset.data]
      if (content.type === 'polyline') {
        for (const pointIndex of polylineEditOffset.pointIndexes) {
          content.points[pointIndex].x += polylineEditOffset.x
          content.points[pointIndex].y += polylineEditOffset.y
        }
      }
    }
    if (lineEditOffset?.data !== undefined) {
      const content = draft[lineEditOffset.data]
      if (content.type === 'line') {
        for (const pointIndex of lineEditOffset.pointIndexes) {
          content.points[pointIndex].x += lineEditOffset.x
          content.points[pointIndex].y += lineEditOffset.y
        }
      }
    }
    const clonedContents: Content[] = []
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

    if (circleCreate) {
      draft.push({ type: 'circle', ...circleCreate })
    }
    if (polylineCreate) {
      draft.push({ type: 'polyline', ...polylineCreate })
    }
    if (lineCreate) {
      for (let i = 1; i < lineCreate.points.length; i++) {
        draft.push({ points: [lineCreate.points[i - 1], lineCreate.points[i]], type: 'line' })
      }
    }
  })

  return {
    setCircleEditOffset,
    setPolylineEditOffset,
    setLineEditOffset,

    rotateOffset,
    setMoveOffset,
    setCloneOffset,
    setRotateOffset,
    previewContents,

    setCircleCreate,
    setPolylineCreate,
    setLineCreate,
  }
}
