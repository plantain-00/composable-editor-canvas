import { Graphics, Stage, Text, Container, _ReactPixi } from "@inlet/react-pixi"
import * as PIXI from "pixi.js"
import React, { PropsWithChildren } from "react"
import { drawDashedPolyline, getColorString, Position, ReactRenderTarget } from "../../src"

const PixiContainer: React.FC<PropsWithChildren<_ReactPixi.IContainer>> = Container

export const reactPixiRenderTarget: ReactRenderTarget = {
  type: 'pixi',
  renderResult(children, width, height, attributes, transform, backgroundColor = 0xffffff) {
    children = children.map((child, i) => child.key ? child : React.cloneElement(child, { key: i }))
    const x = transform?.x ?? 0
    const y = transform?.y ?? 0
    const scale = transform?.scale ?? 1
    const ref = React.useRef<Stage & { app: PIXI.Application } | null>(null)
    React.useEffect(() => {
      if (ref.current) {
        ref.current.app.renderer.backgroundColor = backgroundColor
      }
    }, [backgroundColor])
    return (
      <Stage
        options={{
          backgroundColor,
          width,
          height,
          antialias: true,
        }}
        ref={ref}
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
  renderEmpty() {
    return <></>
  },
  renderGroup(children, x, y, base, angle) {
    children = children.map((child, i) => child.key ? child : React.cloneElement(child, { key: i }))
    return (
      <PixiContainer position={[base.x + x, base.y + y]} pivot={[base.x, base.y]} angle={angle} >
        {children}
      </PixiContainer>
    )
  },
  renderRect(x, y, width, height, strokeColor, angle, strokeWidth, fillColor) {
    return <RectGraphic x={x} y={y} width={width} height={height} strokeColor={strokeColor} angle={angle} strokeWidth={strokeWidth} fillColor={fillColor} />
  },
  renderPolyline(points, strokeColor, dashArray, strokeWidth, skippedLines) {
    return <PolylineGraphic points={points} strokeColor={strokeColor} dashArray={dashArray} strokeWidth={strokeWidth} skippedLines={skippedLines} />
  },
  renderCircle(cx, cy, r, strokeColor, strokeWidth) {
    return <CircleGraphic cx={cx} cy={cy} r={r} strokeColor={strokeColor} strokeWidth={strokeWidth} />
  },
  renderEllipse(cx, cy, rx, ry, strokeColor, angle, strokeWidth) {
    return <EllipseGraphic cx={cx} cy={cy} rx={rx} ry={ry} strokeColor={strokeColor} angle={angle} strokeWidth={strokeWidth} />
  },
  renderArc(cx, cy, r, startAngle, endAngle, strokeColor, strokeWidth) {
    return <ArcGraphic cx={cx} cy={cy} r={r} startAngle={startAngle} endAngle={endAngle} strokeColor={strokeColor} strokeWidth={strokeWidth} />
  },
  renderText(x, y, text, strokeColor, fontSize) {
    return <Text x={x} y={y - fontSize} text={text} style={{ fill: getColorString(strokeColor), fontSize, fontFamily: 'monospace' }} />
  },
}

function RectGraphic(props: {
  x: number
  y: number
  width: number
  height: number
  strokeColor: number
  angle?: number
  strokeWidth?: number
  fillColor?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.strokeColor)
    if (props.angle !== undefined) {
      g.angle = props.angle
    }
    g.position.x = props.x + props.width / 2
    g.position.y = props.y + props.height / 2
    if (props.fillColor) {
      g.beginFill(props.fillColor)
    }
    g.drawRect(-props.width / 2, -props.height / 2, props.width, props.height)
  }, [props.x, props.y, props.width, props.height, props.strokeColor, props.angle, props.strokeWidth, props.fillColor])
  return <Graphics draw={draw} />
}

function PolylineGraphic(props: {
  points: Position[]
  strokeColor: number
  dashArray?: number[]
  strokeWidth?: number
  skippedLines?: number[]
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.strokeColor)
    if (props.dashArray) {
      drawDashedPolyline(g, props.points, props.dashArray, props.skippedLines)
    } else {
      props.points.forEach((p, i) => {
        if (i === 0 || props.skippedLines?.includes(i - 1)) {
          g.moveTo(p.x, p.y)
        } else {
          g.lineTo(p.x, p.y)
        }
      })
    }
  }, [props.points, props.strokeColor, props.dashArray, props.strokeWidth, props.skippedLines])
  return <Graphics draw={draw} />
}

function CircleGraphic(props: {
  cx: number
  cy: number
  r: number
  strokeColor: number
  strokeWidth?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.strokeColor)
    g.drawCircle(props.cx, props.cy, props.r)
  }, [props.cx, props.cy, props.r, props.strokeColor, props.strokeWidth])
  return <Graphics draw={draw} />
}

function EllipseGraphic(props: {
  cx: number
  cy: number
  rx: number
  ry: number
  angle?: number
  strokeColor: number
  strokeWidth?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.strokeColor)
    if (props.angle !== undefined) {
      g.angle = props.angle
    }
    g.position.x = props.cx
    g.position.y = props.cy
    g.drawEllipse(0, 0, props.rx, props.ry)
  }, [props.cx, props.cy, props.rx, props.ry, props.angle, props.strokeColor, props.strokeWidth])
  return <Graphics draw={draw} />
}

function ArcGraphic(props: {
  cx: number
  cy: number
  r: number
  startAngle: number
  endAngle: number
  strokeColor: number
  strokeWidth?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.strokeColor)
    g.arc(props.cx, props.cy, props.r, props.startAngle * Math.PI / 180, props.endAngle * Math.PI / 180)
  }, [props.cx, props.cy, props.r, props.startAngle, props.endAngle, props.strokeColor, props.strokeWidth])
  return <Graphics draw={draw} />
}
