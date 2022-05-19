import { Graphics, Stage, Text, Container, _ReactPixi } from "@inlet/react-pixi"
import * as PIXI from "pixi.js"
import React, { PropsWithChildren } from "react"
import { drawDashedPolyline, getColorString, Position, ReactRenderTarget } from "../../src"

const PixiContainer: React.FC<PropsWithChildren<_ReactPixi.IContainer>> = Container

export const reactPixiRenderTarget: ReactRenderTarget = {
  type: 'pixi',
  getResult(children, width, height, attributes, transform) {
    children = children.map((child, i) => child.key ? child : React.cloneElement(child, { key: i }))
    const x = transform?.x ?? 0
    const y = transform?.y ?? 0
    const scale = transform?.scale ?? 1
    return (
      <Stage
        options={{
          backgroundColor: 0xffffff,
          width,
          height,
          antialias: true,
        }}
        width={width}
        height={height}
        {...attributes}
      >
        <PixiContainer position={[width / 2 + x, height / 2 + y]} pivot={[width / 2, height / 2]} scale={scale} >
          {children}
        </PixiContainer>
      </Stage>
    )
  },
  strokeRect(x, y, width, height, color, angle, strokeWidth) {
    return <RectGraphic x={x} y={y} width={width} height={height} color={color} angle={angle} strokeWidth={strokeWidth} />
  },
  strokePolyline(points, color, dashArray, strokeWidth) {
    return <PolylineGraphic points={points} color={color} dashArray={dashArray} strokeWidth={strokeWidth} />
  },
  strokeCircle(cx, cy, r, color, strokeWidth) {
    return <CircleGraphic cx={cx} cy={cy} r={r} color={color} strokeWidth={strokeWidth} />
  },
  strokeEllipse(cx, cy, rx, ry, color, angle, strokeWidth) {
    return <EllipseGraphic cx={cx} cy={cy} rx={rx} ry={ry} color={color} angle={angle} strokeWidth={strokeWidth} />
  },
  strokeArc(cx, cy, r, startAngle, endAngle, color, strokeWidth) {
    return <ArcGraphic cx={cx} cy={cy} r={r} startAngle={startAngle} endAngle={endAngle} color={color} strokeWidth={strokeWidth} />
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
  strokeWidth?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.color)
    if (props.angle !== undefined) {
      g.angle = props.angle
    }
    g.position.x = props.x + props.width / 2
    g.position.y = props.y + props.height / 2
    g.drawRect(-props.width / 2, -props.height / 2, props.width, props.height)
  }, [props.x, props.y, props.width, props.height, props.color, props.angle, props.strokeWidth])
  return <Graphics draw={draw} />
}

function PolylineGraphic(props: {
  points: Position[]
  color: number
  dashArray?: number[]
  strokeWidth?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.color)
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
  }, [props.points, props.color, props.dashArray, props.strokeWidth])
  return <Graphics draw={draw} />
}

function CircleGraphic(props: {
  cx: number
  cy: number
  r: number
  color: number
  strokeWidth?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.color)
    g.drawCircle(props.cx, props.cy, props.r)
  }, [props.cx, props.cy, props.r, props.color, props.strokeWidth])
  return <Graphics draw={draw} />
}

function EllipseGraphic(props: {
  cx: number
  cy: number
  rx: number
  ry: number
  angle?: number
  color: number
  strokeWidth?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.color)
    if (props.angle !== undefined) {
      g.angle = props.angle
    }
    g.position.x = props.cx
    g.position.y = props.cy
    g.drawEllipse(0, 0, props.rx, props.ry)
  }, [props.cx, props.cy, props.rx, props.ry, props.angle, props.color, props.strokeWidth])
  return <Graphics draw={draw} />
}

function ArcGraphic(props: {
  cx: number
  cy: number
  r: number
  startAngle: number
  endAngle: number
  color: number
  strokeWidth?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.color)
    g.arc(props.cx, props.cy, props.r, props.startAngle * Math.PI / 180, props.endAngle * Math.PI / 180)
  }, [props.cx, props.cy, props.r, props.startAngle, props.endAngle, props.color, props.strokeWidth])
  return <Graphics draw={draw} />
}
