import { Graphics, Stage, Text } from "@inlet/react-pixi"
import * as PIXI from "pixi.js"
import React from "react"
import { drawDashedPolyline, getColorString, Position, ReactRenderTarget } from "../../src"

export const reactPixiRenderTarget: ReactRenderTarget = {
  type: 'pixi',
  getResult(children, width, height, attributes) {
    children = children.map((child, i) => child.key ? child : React.cloneElement(child, { key: i }))
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
  strokeRect(x, y, width, height, color, angle) {
    return <RectGraphic x={x} y={y} width={width} height={height} color={color} angle={angle} />
  },
  strokePolyline(points, color, dashArray) {
    return <PolylineGraphic points={points} color={color} dashArray={dashArray} />
  },
  strokeCircle(cx, cy, r, color) {
    return <CircleGraphic cx={cx} cy={cy} r={r} color={color} />
  },
  strokeEllipse(cx, cy, rx, ry, color, angle) {
    return <EllipseGraphic cx={cx} cy={cy} rx={rx} ry={ry} color={color} angle={angle} />
  },
  strokeArc(cx, cy, r, startAngle, endAngle, color) {
    return <ArcGraphic cx={cx} cy={cy} r={r} startAngle={startAngle} endAngle={endAngle} color={color} />
  },
  fillText(x, y, text, color, fontSize) {
    return <Text x={x} y={y - fontSize} text={text} style={{ fill: getColorString(color), fontSize, fontFamily: 'monospace' }} />
  },
}

function RectGraphic(props: {
  x: number
  y: number
  width: number
  height: number
  color: number
  angle?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, props.color)
    if (props.angle !== undefined) {
      g.angle = props.angle
    }
    g.position.x = props.x + props.width / 2
    g.position.y = props.y + props.height / 2
    g.drawRect(-props.width / 2, -props.height / 2, props.width, props.height)
  }, [props.x, props.y, props.width, props.height, props.color, props.angle])
  return <Graphics draw={draw} />
}

function PolylineGraphic(props: {
  points: Position[]
  color: number
  dashArray?: number[]
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, props.color)
    if (props.dashArray) {
      drawDashedPolyline(g, props.points, props.dashArray)
    } else {
      props.points.forEach((p, i) => {
        if (i === 0) {
          g.moveTo(p.x, p.y)
        } else {
          g.lineTo(p.x, p.y)
        }
      })
    }
  }, [props.points, props.color, props.dashArray])
  return <Graphics draw={draw} />
}

function CircleGraphic(props: {
  cx: number
  cy: number
  r: number
  color: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, props.color)
    g.drawCircle(props.cx, props.cy, props.r)
  }, [props.cx, props.cy, props.r, props.color])
  return <Graphics draw={draw} />
}

function EllipseGraphic(props: {
  cx: number
  cy: number
  rx: number
  ry: number
  angle?: number
  color: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, props.color)
    if (props.angle !== undefined) {
      g.angle = props.angle
    }
    g.position.x = props.cx
    g.position.y = props.cy
    g.drawEllipse(0, 0, props.rx, props.ry)
  }, [props.cx, props.cy, props.rx, props.ry, props.angle, props.color])
  return <Graphics draw={draw} />
}

function ArcGraphic(props: {
  cx: number
  cy: number
  r: number
  startAngle: number
  endAngle: number
  color: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, props.color)
    g.arc(props.cx, props.cy, props.r, props.startAngle * Math.PI / 180, props.endAngle * Math.PI / 180)
  }, [props.cx, props.cy, props.r, props.startAngle, props.endAngle, props.color])
  return <Graphics draw={draw} />
}
