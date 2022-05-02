import { Graphics, Stage } from "@inlet/react-pixi"
import * as PIXI from "pixi.js"
import React from "react"
import { Position, ReactRenderTarget } from "../../src"

export const reactPixiRenderTarget: ReactRenderTarget = {
  type: 'pixi',
  getResult(
    children: JSX.Element[],
    width: number,
    height: number,
    attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
      style: React.CSSProperties
    }>,
  ) {
    return (
      <Stage
        options={{
          backgroundColor: 0xffffff,
          width,
          height,
        }}
        {...attributes}
      >
        {children}
      </Stage>
    )
  },
  strokeRect(x: number, y: number, width: number, height: number, color: number, angle?: number) {
    const draw = React.useCallback((g: PIXI.Graphics) => {
      g.clear()
      g.lineStyle(1, color)
      if (angle !== undefined) {
        g.angle = angle
      }
      g.position.x = x + width / 2
      g.position.y = y + height / 2
      g.drawRect(-width / 2, -height / 2, width, height)
    }, [x, y, width, height, color, angle])
    return <Graphics draw={draw} />
  },
  strokePolyline(points: Position[], color: number) {
    const draw = React.useCallback((g: PIXI.Graphics) => {
      g.clear()
      g.lineStyle(1, color)
      points.forEach((p, i) => {
        if (i === 0) {
          g.moveTo(p.x, p.y)
        } else {
          g.lineTo(p.x, p.y)
        }
      })
    }, [points, color])
    return <Graphics draw={draw} />
  },
  strokeCircle(cx: number, cy: number, r: number, color: number) {
    const draw = React.useCallback((g: PIXI.Graphics) => {
      g.clear()
      g.lineStyle(1, color)
      g.drawCircle(cx, cy, r)
    }, [cx, cy, r, color])
    return <Graphics draw={draw} />
  },
}
