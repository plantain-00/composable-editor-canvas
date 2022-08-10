import * as React from "react"
import { getColorString, PathOptions, ReactRenderTarget, renderPartStyledPolyline } from ".."
import { defaultMiterLimit, m3 } from "../../utils"
import { getImageFromCache } from "./image-loader"

/**
 * @public
 */
export const reactCanvasRenderTarget: ReactRenderTarget<Draw> = {
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
        debug={options?.debug}
        strokeWidthScale={options?.strokeWidthScale}
      />
    )
  },
  renderEmpty() {
    return () => {
      // empty
    }
  },
  renderGroup(children, options) {
    return (ctx, strokeWidthScale, rerender) => {
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
      if (options?.matrix) {
        ctx.setTransform(...m3.getTransform(options.matrix))
      }
      children.forEach((c) => {
        c(ctx, strokeWidthScale, rerender)
      })
      ctx.restore()
    }
  },
  renderRect(x, y, width, height, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
      if (options?.dashArray) {
        ctx.setLineDash(options.dashArray)
      }
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
      ctx.rect(x, y, width, height)
      const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
      if (strokeWidth) {
        ctx.lineWidth = strokeWidth
        ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
        ctx.strokeRect(x, y, width, height)
      }
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
  renderPolyline(points, options) {
    const { partsStyles, ...restOptions } = options ?? {}
    if (partsStyles && partsStyles.length > 0) {
      return renderPartStyledPolyline(this, partsStyles, points, restOptions)
    }
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
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
      if (options?.closed) {
        ctx.closePath()
      }
      renderStroke(ctx, strokeWidthScale, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
  renderPolygon(points, options) {
    return this.renderPolyline(points, { ...options, closed: true })
  },
  renderCircle(cx, cy, r, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
      if (options?.dashArray) {
        ctx.setLineDash(options.dashArray)
      }
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      renderStroke(ctx, strokeWidthScale, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
      if (options?.dashArray) {
        ctx.setLineDash(options.dashArray)
      }
      const rotation = options?.rotation ?? ((options?.angle ?? 0) / 180 * Math.PI)
      ctx.ellipse(cx, cy, rx, ry, rotation, 0, 2 * Math.PI)
      renderStroke(ctx, strokeWidthScale, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
      if (options?.dashArray) {
        ctx.setLineDash(options.dashArray)
      }
      ctx.arc(cx, cy, r, startAngle / 180 * Math.PI, endAngle / 180 * Math.PI, options?.counterclockwise)
      renderStroke(ctx, strokeWidthScale, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
  renderEllipseArc(cx, cy, rx, ry, startAngle, endAngle, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
      if (options?.dashArray) {
        ctx.setLineDash(options.dashArray)
      }
      const rotation = options?.rotation ?? ((options?.angle ?? 0) / 180 * Math.PI)
      ctx.ellipse(cx, cy, rx, ry, rotation, startAngle / 180 * Math.PI, endAngle / 180 * Math.PI, options?.counterclockwise)
      renderStroke(ctx, strokeWidthScale, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
  renderText(x, y, text, fill, fontSize, fontFamily, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      if (typeof fill !== 'number') {
        const canvas = document.createElement("canvas")
        canvas.width = fill.width
        canvas.height = fill.height
        const patternCtx = canvas.getContext('2d')
        if (patternCtx) {
          fill.pattern()(patternCtx, strokeWidthScale, rerender)
          const pattern = ctx.createPattern(canvas, null)
          if (pattern) {
            ctx.fillStyle = pattern
          }
        }
      } else {
        ctx.fillStyle = getColorString(fill)
      }
      ctx.font = `${options?.fontWeight ?? 'normal'} ${options?.fontStyle ?? 'normal'} ${fontSize}px ${fontFamily}`
      ctx.fillText(text, x, y)
      ctx.restore()
    }
  },
  renderImage(url, x, y, width, height, options) {
    return (ctx, _, rerender) => {
      const image = getImageFromCache(url, rerender, options?.crossOrigin)
      if (image) {
        ctx.drawImage(image, x, y, width, height)
      }
    }
  },
  renderPath(lines, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
      if (options?.dashArray) {
        ctx.setLineDash(options.dashArray)
      }
      for (const points of lines) {
        for (let i = 0; i < points.length; i++) {
          if (i === 0) {
            ctx.moveTo(points[i].x, points[i].y)
          } else {
            ctx.lineTo(points[i].x, points[i].y)
          }
        }
      }
      if (options?.closed) {
        ctx.closePath()
      }
      renderStroke(ctx, strokeWidthScale, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
}

function renderStroke<T>(ctx: CanvasRenderingContext2D, strokeWidthScale: number, options?: Partial<PathOptions<T>>) {
  const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
  if (strokeWidth) {
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
    ctx.miterLimit = options?.miterLimit ?? defaultMiterLimit
    ctx.lineJoin = options?.lineJoin ?? 'miter'
    ctx.lineCap = options?.lineCap ?? 'butt'
    ctx.stroke()
  }
}

function renderFill(
  ctx: CanvasRenderingContext2D,
  strokeWidthScale: number,
  rerender: () => void,
  options?: Partial<Pick<PathOptions<Draw>, 'fillColor' | 'fillPattern'>>,
) {
  if (options?.fillColor !== undefined || options?.fillPattern !== undefined) {
    if (options.fillPattern !== undefined) {
      const canvas = document.createElement("canvas")
      canvas.width = options.fillPattern.width
      canvas.height = options.fillPattern.height
      const patternCtx = canvas.getContext('2d')
      if (patternCtx) {
        options.fillPattern.pattern()(patternCtx, strokeWidthScale, rerender)
        const pattern = ctx.createPattern(canvas, null)
        if (pattern) {
          // if (options.fillPattern.rotate) {
          //   const rotate = options.fillPattern.rotate * Math.PI / 180
          //   const c = Math.cos(rotate)
          //   const s = Math.sin(rotate)
          //   pattern.setTransform({ a: c, b: s, c: -s, d: c, e: 0, f: 0 })
          // }
          ctx.fillStyle = pattern
        }
      }
    } else if (options.fillColor !== undefined) {
      ctx.fillStyle = getColorString(options.fillColor)
    }
    ctx.fill('evenodd')
  }
}

type Draw = (ctx: CanvasRenderingContext2D, strokeWidthScale: number, rerender: () => void) => void

function Canvas(props: {
  width: number,
  height: number,
  attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
    style: React.CSSProperties
  }>,
  draws: Draw[]
  transform?: {
    x: number
    y: number
    scale: number
  }
  backgroundColor?: number
  debug?: boolean
  strokeWidthScale?: number
}) {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const [imageLoadStatus, setImageLoadStatus] = React.useState(0)
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
        const now = Date.now()
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
        const scale = props.strokeWidthScale ?? 1
        const rerender = () => setImageLoadStatus(c => c + 1)
        for (const draw of props.draws) {
          draw(ctx, scale, rerender)
        }
        ctx.restore()
        if (props.debug) {
          console.info(Date.now() - now)
        }
      }
    }
  }, [props.draws, ref.current, props.transform, props.backgroundColor, imageLoadStatus])
  return (
    <canvas
      ref={ref}
      width={props.width}
      height={props.height}
      {...props.attributes}
    />
  )
}
