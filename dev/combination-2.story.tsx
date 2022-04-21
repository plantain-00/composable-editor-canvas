import produce from 'immer'
import React from 'react'
import { Stage, Graphics } from '@inlet/react-pixi'
import * as PIXI from 'pixi.js'
import { useCircleClickCreate } from '../src'

export default () => {
  const operations = ['2 points', '3 points', 'center radius', 'center diameter'] as const
  type Content = { type: 'circle', x: number, y: number, r: number }

  const [operation, setOperation] = React.useState<typeof operations[number]>()
  const [drawingContent, setDrawingContent] = React.useState<Content>()
  const [contents, setContents] = React.useState<Content[]>([])
  const { onCircleClickCreateClick, onCircleClickCreateMove, circleClickCreateInput } = useCircleClickCreate(
    operation,
    (c) => {
      setDrawingContent(c ? { ...c, type: 'circle' } : undefined)
    },
    (c) => {
      const data = c ? { ...c, type: 'circle' as const } : drawingContent
      if (data) {
        setContents(produce(contents, (draft) => {
          draft.push(data)
        }))
      }
      setOperation(undefined)
    },
  )

  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, 0x00ff00, 1)
    for (const content of [...contents, drawingContent]) {
      if (content) {
        g.drawCircle(content.x, content.y, content.r)
      }
    }
  }, [contents, drawingContent])

  return (
    <div style={{ height: '100%' }}>
      <Stage
        onClick={onCircleClickCreateClick}
        onMouseMove={onCircleClickCreateMove}
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
      {circleClickCreateInput}
    </div>
  )
}
