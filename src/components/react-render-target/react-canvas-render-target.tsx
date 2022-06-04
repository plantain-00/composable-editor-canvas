import * as React from "react"
import { getColorString, ReactRenderTarget } from ".."

export const reactCanvasRenderTarget: ReactRenderTarget<(ctx: CanvasRenderingContext2D) => void> = {
  type: 'canvas',
  renderResult(children, width, height, attributes, transform) {
    return (
      <Canvas
        width={width}
        height={height}
        attributes={attributes}
        draws={children}
        transform={transform}
      />
    )
  },
  renderEmpty() {
    return () => {
      // empty
    }
  },
  renderGroup(children, x, y, base, angle) {
    return (ctx) => {
      ctx.save()
      ctx.translate(x, y)
      if (angle) {
        ctx.translate(base.x, base.y)
        ctx.rotate(angle / 180 * Math.PI)
        ctx.translate(-base.x, - base.y)
      }
      children.forEach((c) => {
        c(ctx)
      })
      ctx.restore()
    }
  },
  renderRect(x, y, width, height, strokeColor, angle, strokeWidth, fillColor) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = strokeWidth ?? 1
      if (angle) {
        ctx.translate(x + width / 2, y + height / 2)
        ctx.rotate(angle / 180 * Math.PI)
        ctx.translate(-(x + width / 2), -(y + height / 2))
      }
      if (fillColor !== undefined) {
        ctx.fillStyle = getColorString(fillColor)
        ctx.fillRect(x, y, width, height)
      }
      ctx.strokeStyle = getColorString(strokeColor)
      ctx.strokeRect(x, y, width, height)
      ctx.restore()
    }
  },
  renderPolyline(points, strokeColor, dashArray, strokeWidth, skippedLines) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = strokeWidth ?? 1
      ctx.strokeStyle = getColorString(strokeColor)
      if (dashArray) {
        ctx.setLineDash(dashArray)
      }
      for (let i = 0; i < points.length; i++) {
        if (i === 0 || skippedLines?.includes(i - 1)) {
          ctx.moveTo(points[i].x, points[i].y)
        } else {
          ctx.lineTo(points[i].x, points[i].y)
        }
      }
      ctx.stroke()
      ctx.restore()
    }
  },
  renderCircle(cx, cy, r, strokeColor, strokeWidth) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = strokeWidth ?? 1
      ctx.strokeStyle = getColorString(strokeColor)
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }
  },
  renderEllipse(cx, cy, rx, ry, strokeColor, angle, strokeWidth) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = strokeWidth ?? 1
      ctx.strokeStyle = getColorString(strokeColor)
      ctx.ellipse(cx, cy, rx, ry, (angle ?? 0) / 180 * Math.PI, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }
  },
  renderArc(cx, cy, r, startAngle, endAngle, strokeColor, strokeWidth) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = strokeWidth ?? 1
      ctx.strokeStyle = getColorString(strokeColor)
      ctx.arc(cx, cy, r, startAngle / 180 * Math.PI, endAngle / 180 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }
  },
  renderText(x, y, text, strokeColor, fontSize) {
    return (ctx) => {
      ctx.save()
      ctx.fillStyle = getColorString(strokeColor)
      ctx.font = `${fontSize}px monospace`
      ctx.fillText(text, x, y)
      ctx.restore()
    }
  },
}

function Canvas(props: {
  width: number,
  height: number,
  attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
    style: React.CSSProperties
  }>,
  draws: ((ctx: CanvasRenderingContext2D) => void)[]
  transform?: {
    x: number
    y: number
    scale: number
  }
}) {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  React.useEffect(() => {
    if (ref.current) {
      ref.current.width = props.width
      ref.current.height = props.height
    }
  }, [props.width, props.height])
  React.useEffect(() => {
    if (ref.current) {
      const ctx = ref.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.save()
        if (props.transform) {
          ctx.translate(props.width / 2, props.height / 2)
          ctx.scale(props.transform.scale, props.transform.scale)
          ctx.translate(
            props.transform.x / props.transform.scale - props.width / 2,
            props.transform.y / props.transform.scale - props.height / 2,
          )
        }
        for (const draw of props.draws) {
          draw(ctx)
        }
        ctx.restore()
      }
    }
  }, [props.draws, ref.current, props.transform])
  return (
    <canvas
      ref={ref}
      width={props.width}
      height={props.height}
      {...props.attributes}
    />
  )
}
