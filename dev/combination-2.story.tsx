import React from 'react'
import { Stage, Graphics } from '@inlet/react-pixi'
import * as PIXI from 'pixi.js'
import { Circle, getFootPoint, getTwoNumbersDistance, getTwoPointsDistance, isBetween, Position, TwoPointLineToGeneralFormLine, useCircleClickCreate, useKey, useLineClickCreate, useUndoRedo } from '../src'

type Content =
  | { type: 'circle' } & Circle
  | { type: 'polyline', points: Position[] }
  | { type: 'line', points: Position[] }
const operations = ['2 points', '3 points', 'center radius', 'center diameter', 'line', 'polyline'] as const

const initialState: Content[] = []

export default () => {
  const [operation, setOperation] = React.useState<typeof operations[number]>()
  const [drawingContent, setDrawingContent] = React.useState<Content>()
  const { state, setState, undo, redo, canRedo, canUndo } = useUndoRedo(initialState)
  const [selectedContents, setSelectedContents] = React.useState<number[]>([])
  const [hoveringContent, setHoveringContent] = React.useState<number>(-1)

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
    operation === 'polyline' || operation === 'line',
    (c) => {
      setDrawingContent(c ? { points: c, type: 'polyline' } : undefined)
    },
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

  useKey((e) => e.key === 'Escape', () => {
    setOperation(undefined)
    setSelectedContents([])
  }, [setOperation])

  const drawContent = (g: PIXI.Graphics, content: Content, index?: number) => {
    let color = 0x00ff00
    if (index !== undefined) {
      if (selectedContents.includes(index)) {
        color = 0xff0000
      } else if (hoveringContent === index) {
        color = 0x000000
      }
    }
    g.lineStyle(1, color, 1)
    if (content.type === 'circle') {
      g.drawCircle(content.x, content.y, content.r)
    } else if (content.type === 'polyline' || content.type === 'line') {
      content.points.forEach((p, i) => {
        if (i === 0) {
          g.moveTo(p.x, p.y)
        } else {
          g.lineTo(p.x, p.y)
        }
      })
    }
  }

  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    for (let i = 0; i < state.length; i++) {
      drawContent(g, state[i], i)
    }
    if (drawingContent) {
      drawContent(g, drawingContent)
    }
  }, [state, drawingContent, hoveringContent, selectedContents])

  return (
    <div style={{ height: '100%' }}>
      <Stage
        onClick={(e) => {
          onCircleClickCreateClick(e)
          onLineClickCreateClick(e)
          if (!operation) {
            if (hoveringContent >= 0) {
              setSelectedContents([...selectedContents, hoveringContent])
            }
          }
        }}
        onMouseMove={(e) => {
          onCircleClickCreateMove(e)
          onLineClickCreateMove(e)
          if (!operation) {
            const index = getContentByPosition(state, { x: e.clientX, y: e.clientY }, selectedContents)
            setHoveringContent(index)
          }
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
      <button style={{ position: 'relative' }} disabled={selectedContents.length === 0} onClick={() => {
        setState((draft) => {
          return draft.filter((_, i) => !selectedContents.includes(i))
        })
        setSelectedContents([])
      }}>delete</button>
      {circleClickCreateInput}
      {lineClickCreateInput}
    </div>
  )
}

function getContentByPosition(
  contents: Content[],
  position: Position,
  selectedContents: number[],
  delta = 3,
) {
  for (let i = 0; i < contents.length; i++) {
    if (selectedContents.includes(i)) {
      continue
    }
    const content = contents[i]
    if (content.type === 'circle') {
      if (getTwoNumbersDistance(getTwoPointsDistance(content, position), content.r) <= delta) {
        return i
      }
    } else if (content.type === 'polyline' || content.type === 'line') {
      for (let j = 1; j < content.points.length; j++) {
        const footPoint = getFootPoint(position, TwoPointLineToGeneralFormLine(content.points[j - 1], content.points[j]))
        let minDistance: number
        if (isBetween(footPoint.x, content.points[j - 1].x, content.points[j].x)) {
          minDistance = getTwoPointsDistance(position, footPoint)
        } else {
          minDistance = Math.min(getTwoPointsDistance(position, content.points[j - 1]), getTwoPointsDistance(position, content.points[j]))
        }
        if (minDistance <= delta) {
          return i
        }
      }
    }
  }
  return -1
}
