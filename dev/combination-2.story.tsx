import React from 'react'
import { Stage, Graphics } from '@inlet/react-pixi'
import * as PIXI from 'pixi.js'
import { Circle, Position, useCircleClickCreate, useKey, useLineClickCreate, useUndoRedo } from '../src'

type Content =
  | { type: 'circle' } & Circle
  | { type: 'line', points: Position[] }
const operations = ['2 points', '3 points', 'center radius', 'center diameter', 'line'] as const

const initialState: Content[] = []

export default () => {
  const [operation, setOperation] = React.useState<typeof operations[number]>()
  const [drawingContent, setDrawingContent] = React.useState<Content>()
  const { state, setState, undo, redo, canRedo, canUndo } = useUndoRedo(initialState)
  const { onCircleClickCreateClick, onCircleClickCreateMove, circleClickCreateInput } = useCircleClickCreate(
    operation === '2 points' || operation === '3 points' || operation === 'center diameter' || operation === 'center radius' ? operation : undefined,
    (c) => {
      setDrawingContent(c ? { ...c, type: 'circle' } : undefined)
    },
    (c) => {
      setState((draft) => {
        draft.push({ ...c, type: 'circle' })
      })
      setOperation(undefined)
    },
  )

  const { onLineClickCreateClick, onLineClickCreateMove, lineClickCreateInput } = useLineClickCreate(
    operation === 'line',
    (c) => {
      setDrawingContent(c ? { points: c, type: 'line' } : undefined)
    },
    (c) => {
      setState((draft) => {
        draft.push({ points: c, type: 'line' })
      })
      setOperation(undefined)
    },
  )

  useKey((e) => e.key === 'Escape', () => {
    setOperation(undefined)
  }, [setOperation])

  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, 0x00ff00, 1)
    for (const content of [...state, drawingContent]) {
      if (content) {
        if (content.type === 'circle') {
          g.drawCircle(content.x, content.y, content.r)
        } else if (content.type === 'line') {
          content.points.forEach((p, i) => {
            if (i === 0) {
              g.moveTo(p.x, p.y)
            } else {
              g.lineTo(p.x, p.y)
            }
          })
        }
      }
    }
  }, [state, drawingContent])

  return (
    <div style={{ height: '100%' }}>
      <Stage
        onClick={(e) => {
          onCircleClickCreateClick(e)
          onLineClickCreateClick(e)
        }}
        onMouseMove={(e) => {
          onCircleClickCreateMove(e)
          onLineClickCreateMove(e)
        }}
        options={{
          backgroundColor: 0xffffff,
        }}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Graphics draw={draw} />
      </Stage>
      {operations.map((p) => (
        <button
          key={p}
          style={{ position: 'relative', borderColor: p === operation ? 'red' : undefined }}
          onClick={() => setOperation(p)}
        >
          {p}
        </button>
      ))}
      <button style={{ position: 'relative' }} disabled={!canUndo} onClick={() => undo()}>undo</button>
      <button style={{ position: 'relative' }} disabled={!canRedo} onClick={() => redo()}>redo</button>
      {circleClickCreateInput}
      {lineClickCreateInput}
    </div>
  )
}
