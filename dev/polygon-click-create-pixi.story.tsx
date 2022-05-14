import produce from "immer"
import React from "react"
import { Stage, Graphics } from '@inlet/react-pixi'
import * as PIXI from 'pixi.js'
import { Position, usePolygonClickCreate } from "../src"

export default () => {
  const [polygon, setPolygon] = React.useState<Position[]>()
  const [contents, setContents] = React.useState<Position[][]>([])
  const { onPolygonClickCreateClick, onPolygonClickCreateMove, polygonClickCreateInput } = usePolygonClickCreate(true, setPolygon, (c) => {
    const data = c || polygon
    if (data) {
      setContents(produce(contents, (draft) => {
        draft.push(data)
      }))
    }
  })

  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, 0x00ff00, 1)
    for (const content of [...contents, polygon]) {
      if (content) {
        content.forEach((p, i) => {
          if (i === 0) {
            g.moveTo(p.x, p.y)
          } else {
            g.lineTo(p.x, p.y)
          }
        })
        g.lineTo(content[0].x, content[0].y)
      }
    }
  }, [contents, polygon])

  return (
    <div style={{ height: '100%' }}>
      <Stage
        onClick={(e) => onPolygonClickCreateClick({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => onPolygonClickCreateMove({ x: e.clientX, y: e.clientY })}
        options={{
          backgroundColor: 0xffffff,
        }}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Graphics draw={draw} />
      </Stage>
      {polygonClickCreateInput}
    </div>
  )
}
