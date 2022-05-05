import produce from "immer"
import React from "react"
import { Stage, Graphics } from '@inlet/react-pixi'
import * as PIXI from 'pixi.js'
import { Ellipse, useEllipseClickCreate } from "../src"

export default () => {
  const [ellipse, setEllipse] = React.useState<Ellipse>()
  const [contents, setContents] = React.useState<Ellipse[]>([])
  const { onEllipseClickCreateClick, onEllipseClickCreateMove, ellipseClickCreateInput } = useEllipseClickCreate('ellipse center', setEllipse, (c) => {
    setContents(produce(contents, (draft) => {
      draft.push(c)
    }))
  })

  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, 0x00ff00, 1)
    for (const content of [...contents, ellipse]) {
      if (content) {
        if (content.angle !== undefined) {
          g.angle = content.angle
        }
        g.position.x = content.cx
        g.position.y = content.cy
        g.drawEllipse(0, 0, content.rx, content.ry)
      }
    }
  }, [contents, ellipse])

  return (
    <div style={{ height: '100%' }}>
      <Stage
        onClick={onEllipseClickCreateClick}
        onMouseMove={onEllipseClickCreateMove}
        options={{
          backgroundColor: 0xffffff,
        }}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Graphics draw={draw} />
      </Stage>
      {ellipseClickCreateInput}
    </div>
  )
}
