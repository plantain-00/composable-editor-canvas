import produce from "immer"
import React from "react"
import { Stage, Graphics } from '@inlet/react-pixi'
import * as PIXI from 'pixi.js'
import { Circle, useCircleClickCreate } from "../src"

export default () => {
  const [contents, setContents] = React.useState<Circle[]>([])
  const { circle, onClick, onMove, input } = useCircleClickCreate('center radius', (c) => {
    setContents(produce(contents, (draft) => {
      draft.push(c)
    }))
  })

  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, 0x00ff00, 1)
    for (const content of [...contents, circle]) {
      if (content) {
        g.drawCircle(content.x, content.y, content.r)
      }
    }
  }, [contents, circle])

  return (
    <div style={{ height: '100%' }}>
      <Stage
        onClick={(e) => onClick({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => onMove({ x: e.clientX, y: e.clientY })}
        options={{
          backgroundColor: 0xffffff,
        }}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Graphics draw={draw} />
      </Stage>
      {input}
    </div>
  )
}
