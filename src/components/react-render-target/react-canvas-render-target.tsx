import * as React from "react"
import { getColorString, ReactRenderTarget } from ".."

export const reactCanvasRenderTarget: ReactRenderTarget<(ctx: CanvasRenderingContext2D) => void> = {
  type: 'canvas',
  getResult(children, width, height, attributes) {
    return (
      <Canvas
        width={width}
        height={height}
        attributes={attributes}
        draws={children}
      />
    )
  },
  strokeRect(x, y, width, height, color, angle) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      if (angle) {
        ctx.translate(x + width / 2, y + height / 2)
        ctx.rotate(angle / 180 * Math.PI)
        ctx.translate(-(x + width / 2), -(y + height / 2))
      }
      ctx.strokeStyle = getColorString(color)
      ctx.strokeRect(x, y, width, height)
      ctx.restore()
    }
  },
  strokePolyline(points, color, dashArray) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = getColorString(color)
      if (dashArray) {
        ctx.setLineDash(dashArray)
      }
      for (let i = 0; i < points.length; i++) {
        if (i === 0) {
          ctx.moveTo(points[i].x, points[i].y)
        } else {
          ctx.lineTo(points[i].x, points[i].y)
        }
      }
      ctx.stroke()
      ctx.restore()
    }
  },
  strokeCircle(cx, cy, r, color) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = getColorString(color)
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }
  },
  strokeEllipse(cx, cy, rx, ry, color, angle) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = getColorString(color)
      ctx.ellipse(cx, cy, rx, ry, (angle ?? 0) / 180 * Math.PI, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }
  },
  strokeArc(cx, cy, r, startAngle, endAngle, color) {
    return (ctx) => {
      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = getColorString(color)
      ctx.arc(cx, cy, r, startAngle / 180 * Math.PI, endAngle / 180 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }
  },
  fillText(x, y, text, color, fontSize) {
    return (ctx) => {
      ctx.save()
      ctx.fillStyle = getColorString(color)
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
        for (const draw of props.draws) {
          draw(ctx)
        }
      }
    }
  }, [props.draws, ref.current])
  return (
    <canvas
      ref={ref}
      width={props.width}
      height={props.height}
      {...props.attributes}
    />
  )
}
