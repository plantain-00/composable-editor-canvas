import produce from "immer"
import React from "react"
import { Stage, Graphics } from '@inlet/react-pixi'
import * as PIXI from 'pixi.js'
import { Position, useLineClickCreate } from "../src"

export default () => {
  const [line, setLine] = React.useState<Position[]>()
  const [contents, setContents] = React.useState<Position[][]>([])
  const { onLineClickCreateClick, onLineClickCreateMove, lineClickCreateInput } = useLineClickCreate(true, setLine, (c) => {
    const data = c || line
    if (data) {
      setContents(produce(contents, (draft) => {
        draft.push(data)
      }))
    }
  })

  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, 0x00ff00, 1)
    for (const content of [...contents, line]) {
      if (content) {
        content.forEach((p, i) => {
          if (i === 0) {
            g.moveTo(p.x, p.y)
          } else {
            g.lineTo(p.x, p.y)
          }
        })
      }
    }
  }, [contents, line])

  return (
    <div style={{ height: '100%' }}>
      <Stage
        onClick={onLineClickCreateClick}
        onMouseMove={onLineClickCreateMove}
        options={{
          backgroundColor: 0xffffff,
        }}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Graphics draw={draw} />
      </Stage>
      {lineClickCreateInput}
    </div>
  )
}
