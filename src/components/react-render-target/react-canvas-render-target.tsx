import * as React from "react"
import { getColorString, loadImage, PathOptions, ReactRenderTarget, renderPartStyledPolyline } from ".."
import { polygonToPolyline } from "../../utils"

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
    return (ctx, strokeWidthScale, setImageLoadStatus) => {
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
        c(ctx, strokeWidthScale, setImageLoadStatus)
      })
      ctx.restore()
    }
  },
  renderRect(x, y, width, height, options) {
    return (ctx, strokeWidthScale, setImageLoadStatus) => {
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
      if (options?.fillColor !== undefined) {
        ctx.fillStyle = getColorString(options.fillColor)
        ctx.fillRect(x, y, width, height)
      }
      const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
      if (strokeWidth) {
        ctx.lineWidth = strokeWidth
        ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
        ctx.strokeRect(x, y, width, height)
      }
      renderFillPattern(ctx, strokeWidthScale, setImageLoadStatus, options)
      ctx.restore()
    }
  },
  renderPolyline(points, options) {
    const { partsStyles, ...restOptions } = options ?? {}
    if (partsStyles && partsStyles.length > 0) {
      return renderPartStyledPolyline(this, partsStyles, points, restOptions)
    }
    return (ctx, strokeWidthScale, setImageLoadStatus) => {
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
      const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
      if (strokeWidth) {
        ctx.lineWidth = strokeWidth
        ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
        ctx.stroke()
      }
      renderFillPattern(ctx, strokeWidthScale, setImageLoadStatus, options)
      ctx.restore()
    }
  },
  renderPolygon(points, options) {
    return this.renderPolyline(polygonToPolyline(points), options)
  },
  renderCircle(cx, cy, r, options) {
    return (ctx, strokeWidthScale, setImageLoadStatus) => {
      ctx.save()
      ctx.beginPath()
      if (options?.dashArray) {
        ctx.setLineDash(options.dashArray)
      }
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
      if (strokeWidth) {
        ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
        ctx.lineWidth = strokeWidth
        ctx.stroke()
      }
      renderFillPattern(ctx, strokeWidthScale, setImageLoadStatus, options)
      ctx.restore()
    }
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return (ctx, strokeWidthScale, setImageLoadStatus) => {
      ctx.save()
      ctx.beginPath()
      if (options?.dashArray) {
        ctx.setLineDash(options.dashArray)
      }
      const rotation = options?.rotation ?? ((options?.angle ?? 0) / 180 * Math.PI)
      ctx.ellipse(cx, cy, rx, ry, rotation, 0, 2 * Math.PI)
      const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
      if (strokeWidth) {
        ctx.lineWidth = strokeWidth
        ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
        ctx.stroke()
      }
      renderFillPattern(ctx, strokeWidthScale, setImageLoadStatus, options)
      ctx.restore()
    }
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    return (ctx, strokeWidthScale, setImageLoadStatus) => {
      ctx.save()
      ctx.beginPath()
      if (options?.dashArray) {
        ctx.setLineDash(options.dashArray)
      }
      ctx.arc(cx, cy, r, startAngle / 180 * Math.PI, endAngle / 180 * Math.PI)
      const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
      if (strokeWidth) {
        ctx.lineWidth = strokeWidth
        ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
        ctx.stroke()
      }
      renderFillPattern(ctx, strokeWidthScale, setImageLoadStatus, options)
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
  renderImage(url, x, y, width, height, options) {
    return (ctx, _, setImageLoadStatus) => {
      if (!images.has(url)) {
        images.set(url, undefined)
        loadImage(url, options?.crossOrigin).then(image => {
          images.set(url, image)
          setImageLoadStatus(c => c + 1)
        })
      }
      const image = images.get(url)
      if (!image) {
        return
      }
      ctx.drawImage(image, x, y, width, height)
    }
  },
  renderPath(lines, options) {
    return (ctx, strokeWidthScale, setImageLoadStatus) => {
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
      const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
      if (strokeWidth) {
        ctx.lineWidth = strokeWidth
        ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
        // ctx.lineCap = options?.lineCap ?? 'butt'
        ctx.stroke()
      }
      renderFillPattern(ctx, strokeWidthScale, setImageLoadStatus, options)
    }
  },
}

const images = new Map<string, HTMLImageElement | undefined>()

function renderFillPattern(
  ctx: CanvasRenderingContext2D,
  strokeWidthScale: number,
  setImageLoadStatus: React.Dispatch<React.SetStateAction<number>>,
  options?: Partial<PathOptions<Draw>>,
) {
  if (options?.fillColor !== undefined || options?.fillPattern !== undefined) {
    if (options.fillPattern !== undefined) {
      const canvas = document.createElement("canvas")
      canvas.width = options.fillPattern.width
      canvas.height = options.fillPattern.height
      const patternCtx = canvas.getContext('2d')
      if (patternCtx) {
        options.fillPattern.pattern()(patternCtx, strokeWidthScale, setImageLoadStatus)
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

type Draw = (ctx: CanvasRenderingContext2D, strokeWidthScale: number, setImageLoadStatus: React.Dispatch<React.SetStateAction<number>>) => void

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
        for (const draw of props.draws) {
          draw(ctx, scale, setImageLoadStatus)
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
