import * as React from "react"
import { getColorString, ReactRenderTarget } from ".."

export const reactCanvasRenderTarget: ReactRenderTarget<(ctx: CanvasRenderingContext2D) => void> = {
  type: 'canvas',
  renderResult(children, width, height, options) {
    return (
      <Canvas
        width={width}
        height={height}
        attributes={options?.attributes}
        draws={children}
        transform={options?.transform}
        backgroundColor={options?.backgroundColor}
      />
    )
  },
  renderEmpty() {
    return () => {
      // empty
    }
  },
  renderGroup(children, options) {
    return (ctx) => {
      ctx.save()
      if (options?.translate) {
        ctx.translate(options.translate.x, options.translate.y)
      }
      if (options?.angle && options?.base !== undefined) {
        ctx.translate(options.base.x, options?.base.y)
        ctx.rotate(options.angle / 180 * Math.PI)
        ctx.translate(-options.base.x, - options.base.y)
      }
      if (options?.rotation && options?.base !== undefined) {
        ctx.translate(options.base.x, options?.base.y)
        ctx.rotate(options.rotation)
        ctx.translate(-options.base.x, - options.base.y)
      }
      children.forEach((c) => {
        c(ctx)
      })
      ctx.restore()
    }
  },
  renderRect(x, y, width, height, options) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = options?.strokeWidth ?? 1
      if (options?.angle) {
        ctx.translate(x + width / 2, y + height / 2)
        ctx.rotate(options.angle / 180 * Math.PI)
        ctx.translate(-(x + width / 2), -(y + height / 2))
      }
      if (options?.rotation) {
        ctx.translate(x + width / 2, y + height / 2)
        ctx.rotate(options.rotation)
        ctx.translate(-(x + width / 2), -(y + height / 2))
      }
      if (options?.fillColor !== undefined) {
        ctx.fillStyle = getColorString(options.fillColor)
        ctx.fillRect(x, y, width, height)
      }
      ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
      ctx.strokeRect(x, y, width, height)
      ctx.restore()
    }
  },
  renderPolyline(points, options) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = options?.strokeWidth ?? 1
      ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
      if (options?.dashArray) {
        ctx.setLineDash(options.dashArray)
      }
      for (let i = 0; i < points.length; i++) {
        if (i === 0 || options?.skippedLines?.includes(i - 1)) {
          ctx.moveTo(points[i].x, points[i].y)
        } else {
          ctx.lineTo(points[i].x, points[i].y)
        }
      }
      ctx.stroke()
      if (options?.fillColor !== undefined) {
        ctx.fillStyle = getColorString(options.fillColor)
        ctx.fill()
      }
      ctx.restore()
    }
  },
  renderCircle(cx, cy, r, options) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = options?.strokeWidth ?? 1
      ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = options?.strokeWidth ?? 1
      ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
      const rotation = options?.rotation ?? ((options?.angle ?? 0) / 180 * Math.PI)
      ctx.ellipse(cx, cy, rx, ry, rotation, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = options?.strokeWidth ?? 1
      ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
      ctx.arc(cx, cy, r, startAngle / 180 * Math.PI, endAngle / 180 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }
  },
  renderText(x, y, text, fillColor, fontSize, fontFamily) {
    return (ctx) => {
      ctx.save()
      ctx.fillStyle = getColorString(fillColor)
      ctx.font = `${fontSize}px ${fontFamily}`
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
  backgroundColor?: number
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
        ctx.fillStyle = getColorString(props.backgroundColor ?? 0xffffff)
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
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
  }, [props.draws, ref.current, props.transform, props.backgroundColor])
  return (
    <canvas
      ref={ref}
      width={props.width}
      height={props.height}
      {...props.attributes}
    />
  )
}
