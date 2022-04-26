import React from 'react'
import { Circle, CircleEditBar, PolylineEditBar, Position, useCircleClickCreate, useCircleEdit, useDragMove, useDragSelect, useKey, useLineClickCreate, usePolylineEdit, useUndoRedo } from '../src'
import { Content, getContentByClickPosition, getContentsByClickTwoPositions, moveContent } from './util-2'
import { PixiRenderer } from './pixi-renderer'
import { SvgRenderer } from './svg-renderer'
import produce from 'immer'

const operations = ['2 points', '3 points', 'center radius', 'center diameter', 'line', 'polyline', 'move', 'delete'] as const
type Operation = typeof operations[number]
const draftKey = 'composable-editor-canvas-draft-2'
const draftState = localStorage.getItem(draftKey)
const initialState = draftState ? JSON.parse(draftState) as Content[] : []

export default () => {
  const [operation, setOperation] = React.useState<Operation>()
  const [nextOperation, setNextOperation] = React.useState<Operation>()
  const [drawingContent, setDrawingContent] = React.useState<Content>()
  const { state, setState, undo, redo, canRedo, canUndo, stateIndex } = useUndoRedo(initialState)
  const [selectedContents, setSelectedContents] = React.useState<number[]>([])
  const [hoveringContent, setHoveringContent] = React.useState<number>(-1)
  const [renderTarget, setRenderTarget] = React.useState<'pixi' | 'svg'>('pixi')
  const [circleEditOffset, setCircleEditOffset] = React.useState<Circle & { data?: number }>({ x: 0, y: 0, r: 0 })
  const [polyineEditOffset, setPolylineEditOffset] = React.useState<Position & { pointIndexes: number[], data?: number }>()
  const [moveOffset, setMoveOffset] = React.useState<Position>({ x: 0, y: 0 })

  const previewContents = produce(state, (draft) => {
    if (circleEditOffset.data !== undefined) {
      const content = draft[circleEditOffset.data]
      if (content.type === 'circle') {
        content.x += circleEditOffset.x
        content.y += circleEditOffset.y
        content.r += circleEditOffset.r
      }
    }
    if (polyineEditOffset?.data !== undefined) {
      const content = draft[polyineEditOffset.data]
      if (content.type === 'line' || content.type === 'polyline') {
        for (const pointIndex of polyineEditOffset.pointIndexes) {
          content.points[pointIndex].x += polyineEditOffset.x
          content.points[pointIndex].y += polyineEditOffset.y
        }
      }
    }
    draft.forEach((content, i) => {
      if (selectedContents.includes(i)) {
        moveContent(content, moveOffset)
      }
    })
  })

  const { onCircleClickCreateClick, onCircleClickCreateMove, circleClickCreateInput } = useCircleClickCreate(
    operation === '2 points' || operation === '3 points' || operation === 'center diameter' || operation === 'center radius' ? operation : undefined,
    (c) => setDrawingContent(c ? { ...c, type: 'circle' } : undefined),
    (c) => {
      setState((draft) => {
        draft.push({ ...c, type: 'circle' })
      })
      setOperation(undefined)
    },
  )

  const { onLineClickCreateClick, onLineClickCreateMove, lineClickCreateInput } = useLineClickCreate(
    operation === 'polyline' || operation === 'line',
    (c) => setDrawingContent(c ? { points: c, type: 'polyline' } : undefined),
    (c) => {
      setState((draft) => {
        if (operation === 'polyline') {
          draft.push({ points: c, type: 'polyline' })
        } else if (operation === 'line') {
          for (let i = 1; i < c.length; i++) {
            draft.push({ points: [c[i - 1], c[i]], type: 'line' })
          }
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
  const { onStartMove, dragMoveMask } = useDragMove(setMoveOffset, () => setState(() => previewContents))

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
    if (operation === 'move') {
      onStartMove(e)
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
    if (!operation) {
      setHoveringContent(getContentByClickPosition(state, { x: e.clientX, y: e.clientY }, selectedContents))
    }
  }
  const onStartOperation = (p: Operation) => {
    if ((p === 'move' || p === 'delete') && selectedContents.length === 0) {
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
    <div style={{ height: '100%', cursor: 'crosshair' }} onMouseMove={onMouseMove}>
      <Render
        contents={previewContents}
        drawingContent={drawingContent}
        selectedContents={selectedContents}
        hoveringContent={hoveringContent}
        onClick={onClick}
      />
      {previewContents.map((s, i) => {
        if (selectedContents.includes(i)) {
          if (s.type === 'circle') {
            return <CircleEditBar key={i} x={s.x} y={s.y} radius={s.r} onClick={(e, type, cursor) => onStartEditCircle(e, { ...s, type, cursor, data: i })} />
          }
          if (s.type === 'line' || s.type === 'polyline') {
            return <PolylineEditBar key={i} points={s.points} onClick={(e, pointIndexes) => onStartEditPolyline(e, pointIndexes, i)} />
          }
        }
        return null
      })}
      {operations.map((p) => <button onClick={() => onStartOperation(p)} key={p} style={{ position: 'relative', borderColor: p === operation || p === nextOperation ? 'red' : undefined }}>{p}</button>)}
      <button disabled={!canUndo} onClick={() => undo()} style={{ position: 'relative' }}>undo</button>
      <button disabled={!canRedo} onClick={() => redo()} style={{ position: 'relative' }}>redo</button>
      <button onClick={() => setRenderTarget(renderTarget === 'pixi' ? 'svg' : 'pixi')} style={{ position: 'relative' }}>{renderTarget}</button>
      {circleClickCreateInput}
      {lineClickCreateInput}
      {dragSelectMask}
      {circleEditMask}
      {polylineEditMask}
      {dragMoveMask}
    </div>
  )
}
