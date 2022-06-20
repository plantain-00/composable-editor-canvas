import { Graphics, Stage, Text, Container, _ReactPixi } from "@inlet/react-pixi"
import * as PIXI from "pixi.js"
import React, { PropsWithChildren } from "react"
import { drawDashedPolyline, getColorString, polygonToPolyline, Position, ReactRenderTarget, renderPartStyledPolyline } from "../../src"

const PixiContainer: React.FC<PropsWithChildren<_ReactPixi.IContainer>> = Container

export const reactPixiRenderTarget: ReactRenderTarget = {
  type: 'pixi',
  renderResult(children, width, height, options) {
    children = children.map((child, i) => child.key ? child : React.cloneElement(child, { key: i }))
    const x = options?.transform?.x ?? 0
    const y = options?.transform?.y ?? 0
    const scale = options?.transform?.scale ?? 1
    const backgroundColor = options?.backgroundColor ?? 0xffffff
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
        {...options?.attributes}
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
  renderGroup(children, options) {
    children = children.map((child, i) => child.key ? child : React.cloneElement(child, { key: i }))
    const baseX = options?.base?.x ?? 0
    const baseY = options?.base?.y ?? 0
    const translateX = options?.translate?.x ?? 0
    const translateY = options?.translate?.y ?? 0
    return (
      <PixiContainer position={[baseX + translateX, baseY + translateY]} pivot={[baseX, baseY]} angle={options?.angle ?? 0} rotation={options?.rotation ?? 0} >
        {children}
      </PixiContainer>
    )
  },
  renderRect(x, y, width, height, options) {
    return <RectGraphic x={x} y={y} width={width} height={height} strokeColor={options?.strokeColor} angle={options?.angle} rotation={options?.rotation} strokeWidth={options?.strokeWidth} fillColor={options?.fillColor} />
  },
  renderPolyline(points, options) {
    const { partsStyles, ...restOptions } = options ?? {}
    if (partsStyles && partsStyles.length > 0) {
      return renderPartStyledPolyline(this, partsStyles, points, restOptions)
    }
    return <PolylineGraphic points={points} strokeColor={options?.strokeColor} dashArray={options?.dashArray} strokeWidth={options?.strokeWidth} skippedLines={options?.skippedLines} fillColor={options?.fillColor} />
  },
  renderPolygon(points, options) {
    return this.renderPolyline(polygonToPolyline(points), options)
  },
  renderCircle(cx, cy, r, options) {
    return <CircleGraphic cx={cx} cy={cy} r={r} strokeColor={options?.strokeColor} strokeWidth={options?.strokeWidth} />
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return <EllipseGraphic cx={cx} cy={cy} rx={rx} ry={ry} strokeColor={options?.strokeColor} angle={options?.angle} rotation={options?.rotation} strokeWidth={options?.strokeWidth} />
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    return <ArcGraphic cx={cx} cy={cy} r={r} startAngle={startAngle} endAngle={endAngle} strokeColor={options?.strokeColor} strokeWidth={options?.strokeWidth} />
  },
  renderText(x, y, text, fillColor, fontSize, fontFamily) {
    return <Text x={x} y={y - fontSize} text={text} style={{ fill: getColorString(fillColor), fontSize, fontFamily }} />
  },
}

function RectGraphic(props: {
  x: number
  y: number
  width: number
  height: number
  strokeColor?: number
  angle?: number
  rotation?: number
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
  }, [props.x, props.y, props.width, props.height, props.strokeColor, props.angle, props.rotation, props.strokeWidth, props.fillColor])
  return <Graphics draw={draw} />
}

function PolylineGraphic(props: {
  points: Position[]
  strokeColor?: number
  dashArray?: number[]
  strokeWidth?: number
  skippedLines?: number[]
  fillColor?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.strokeColor)
    if (props.fillColor !== undefined) {
      g.beginFill(props.fillColor)
    }
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
  }, [props.points, props.strokeColor, props.dashArray, props.strokeWidth, props.skippedLines, props.fillColor])
  return <Graphics draw={draw} />
}

function CircleGraphic(props: {
  cx: number
  cy: number
  r: number
  strokeColor?: number
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
  rotation?: number
  strokeColor?: number
  strokeWidth?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.strokeColor)
    if (props.angle !== undefined) {
      g.angle = props.angle
    }
    if (props.rotation !== undefined) {
      g.rotation = props.rotation
    }
    g.position.x = props.cx
    g.position.y = props.cy
    g.drawEllipse(0, 0, props.rx, props.ry)
  }, [props.cx, props.cy, props.rx, props.ry, props.angle, props.rotation, props.strokeColor, props.strokeWidth])
  return <Graphics draw={draw} />
}

function ArcGraphic(props: {
  cx: number
  cy: number
  r: number
  startAngle: number
  endAngle: number
  strokeColor?: number
  strokeWidth?: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(props.strokeWidth ?? 1, props.strokeColor)
    g.arc(props.cx, props.cy, props.r, props.startAngle * Math.PI / 180, props.endAngle * Math.PI / 180)
  }, [props.cx, props.cy, props.r, props.startAngle, props.endAngle, props.strokeColor, props.strokeWidth])
  return <Graphics draw={draw} />
}
