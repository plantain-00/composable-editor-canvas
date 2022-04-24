import React from 'react'
import { useCircleClickCreate, useDragSelect, useKey, useLineClickCreate, useUndoRedo } from '../src'
import { Content, getContentByClickPosition, getContentsByClickTwoPositions } from './util-2'
import { PixiRenderer } from './pixi-renderer'
import { SvgRenderer } from './svg-renderer'

const operations = ['2 points', '3 points', 'center radius', 'center diameter', 'line', 'polyline'] as const
const draftKey = 'composable-editor-canvas-draft-2'
const draftState = localStorage.getItem(draftKey)
const initialState = draftState ? JSON.parse(draftState) as Content[] : []

export default () => {
  const [operation, setOperation] = React.useState<typeof operations[number]>()
  const [drawingContent, setDrawingContent] = React.useState<Content>()
  const { state, setState, undo, redo, canRedo, canUndo, stateIndex } = useUndoRedo(initialState)
  const [selectedContents, setSelectedContents] = React.useState<number[]>([])
  const [hoveringContent, setHoveringContent] = React.useState<number>(-1)
  const [renderTarget, setRenderTarget] = React.useState<'pixi' | 'svg'>('pixi')

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

  useKey((e) => e.key === 'Escape', () => {
    setOperation(undefined)
    setSelectedContents([])
  }, [setOperation])

  React.useEffect(() => {
    if (stateIndex > 0) {
      localStorage.setItem(draftKey, JSON.stringify(state))
    }
  }, [state, stateIndex])

  const onClick = (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    onCircleClickCreateClick(e)
    onLineClickCreateClick(e)
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

  const Render = renderTarget === 'pixi' ? PixiRenderer : SvgRenderer

  return (
    <div style={{ height: '100%', cursor: 'crosshair' }} onMouseMove={onMouseMove}>
      <Render
        contents={state}
        drawingContent={drawingContent}
        selectedContents={selectedContents}
        hoveringContent={hoveringContent}
        onClick={onClick}
      />
      {operations.map((p) => (
        <button key={p} onClick={() => setOperation(p)} style={{ position: 'relative', borderColor: p === operation ? 'red' : undefined }}>{p}</button>
      ))}
      <button style={{ position: 'relative' }} disabled={!canUndo} onClick={() => undo()}>undo</button>
      <button style={{ position: 'relative' }} disabled={!canRedo} onClick={() => redo()}>redo</button>
      <button style={{ position: 'relative' }} disabled={selectedContents.length === 0} onClick={() => {
        setState((draft) => draft.filter((_, i) => !selectedContents.includes(i)))
        setSelectedContents([])
      }}>delete</button>
      <button style={{ position: 'relative' }} onClick={() => setRenderTarget(renderTarget === 'pixi' ? 'svg' : 'pixi')}>{renderTarget}</button>
      {circleClickCreateInput}
      {lineClickCreateInput}
      {dragSelectMask}
    </div>
  )
}
