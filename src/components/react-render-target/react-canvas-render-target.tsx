import * as React from "react"
import { Filter, getColorString, PathFillOptions, PathLineStyleOptions, PathStrokeOptions, Pattern, ReactRenderTarget, renderPartStyledPolyline, setCanvasLineDash } from ".."
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
      const opacity = ctx.globalAlpha
      ctx.save()
      if (options?.opacity !== undefined) {
        ctx.globalAlpha = opacity * options.opacity
      }
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
      setCanvasLineDash(ctx, options)
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
      renderStroke(ctx, strokeWidthScale, rerender, options)
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
      setCanvasLineDash(ctx, options)
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
      renderStroke(ctx, strokeWidthScale, rerender, options)
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
      setCanvasLineDash(ctx, options)
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      renderStroke(ctx, strokeWidthScale, rerender, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
      setCanvasLineDash(ctx, options)
      const rotation = options?.rotation ?? ((options?.angle ?? 0) / 180 * Math.PI)
      ctx.ellipse(cx, cy, rx, ry, rotation, 0, 2 * Math.PI)
      renderStroke(ctx, strokeWidthScale, rerender, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
      setCanvasLineDash(ctx, options)
      ctx.arc(cx, cy, r, startAngle / 180 * Math.PI, endAngle / 180 * Math.PI, options?.counterclockwise)
      renderStroke(ctx, strokeWidthScale, rerender, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
  renderEllipseArc(cx, cy, rx, ry, startAngle, endAngle, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
      setCanvasLineDash(ctx, options)
      const rotation = options?.rotation ?? ((options?.angle ?? 0) / 180 * Math.PI)
      ctx.ellipse(cx, cy, rx, ry, rotation, startAngle / 180 * Math.PI, endAngle / 180 * Math.PI, options?.counterclockwise)
      renderStroke(ctx, strokeWidthScale, rerender, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
  renderPathCommands(pathCommands, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
      setCanvasLineDash(ctx, options)
      for (const command of pathCommands) {
        if (command.type === 'move') {
          ctx.moveTo(command.to.x, command.to.y)
        } else if (command.type === 'line') {
          ctx.lineTo(command.to.x, command.to.y)
        } else if (command.type === 'arc') {
          ctx.arcTo(command.from.x, command.from.y, command.to.x, command.to.y, command.radius)
        } else if (command.type === 'bezierCurve') {
          ctx.bezierCurveTo(command.cp1.x, command.cp1.y, command.cp2.x, command.cp2.y, command.to.x, command.to.y)
        } else if (command.type === 'quadraticCurve') {
          ctx.quadraticCurveTo(command.cp.x, command.cp.y, command.to.x, command.to.y)
        } else if (command.type === 'close') {
          ctx.closePath()
        }
      }
      if (options?.closed) {
        ctx.closePath()
      }
      renderStroke(ctx, strokeWidthScale, rerender, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
  renderText(x, y, text, fill, fontSize, fontFamily, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.font = `${options?.fontWeight ?? 'normal'} ${options?.fontStyle ?? 'normal'} ${fontSize}px ${fontFamily}`
      ctx.textAlign = options?.textAlign ?? 'left'
      ctx.textBaseline = options?.textBaseline ?? 'alphabetic'
      renderFill(ctx, strokeWidthScale, rerender, {
        ...options,
        fillColor: typeof fill === 'number' ? fill : undefined,
        fillPattern: fill !== undefined && typeof fill !== 'number' ? fill : undefined,
      }, () => ctx.fillText(text, x, y))
      if (options?.strokeColor !== undefined || options?.strokePattern || options?.strokeLinearGradient || options?.strokeRadialGradient) {
        if (options?.strokeColor !== undefined) {
          ctx.strokeStyle = getColorString(options.strokeColor, options.strokeOpacity)
        } else {
          renderPatternOrGradient(ctx, strokeWidthScale, rerender, options)
        }
        if (options.strokeWidth !== undefined) {
          ctx.lineWidth = options.strokeWidth
        }
        setCanvasLineDash(ctx, options)
        ctx.strokeText(text, x, y)
      }
      ctx.restore()
    }
  },
  renderImage(url, x, y, width, height, options) {
    return (ctx, _, rerender) => {
      const image = getImageFromCache(url, { rerender, crossOrigin: options?.crossOrigin })
      if (image) {
        const opacity = ctx.globalAlpha
        ctx.save()
        if (options?.opacity !== undefined) {
          ctx.globalAlpha = opacity * options.opacity
        }
        renderFilter(ctx, options?.filters)
        ctx.drawImage(image, x, y, width, height)
        ctx.restore()
      }
    }
  },
  renderPath(lines, options) {
    return (ctx, strokeWidthScale, rerender) => {
      ctx.save()
      ctx.beginPath()
      setCanvasLineDash(ctx, options)
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
      renderStroke(ctx, strokeWidthScale, rerender, options)
      renderFill(ctx, strokeWidthScale, rerender, options)
      ctx.restore()
    }
  },
}

function renderFilter(ctx: CanvasRenderingContext2D, filters?: Filter[]) {
  if (filters && filters.length > 0) {
    const result: string[] = []
    filters.forEach(f => {
      if (f.type === 'hue-rotate') {
        result.push(`hue-rotate(${f.value}deg)`)
      } else if (f.type === 'blur') {
        result.push(`blur(${f.value}px)`)
      } else if (
        f.type === 'brightness' ||
        f.type === 'contrast' ||
        f.type === 'saturate' ||
        f.type === 'grayscale' ||
        f.type === 'invert' ||
        f.type === 'opacity' ||
        f.type === 'sepia'
      ) {
        result.push(`${f.type}(${f.value})`)
      }
    })
    ctx.filter = result.join(' ')
  }
}

function renderStroke(
  ctx: CanvasRenderingContext2D,
  strokeWidthScale: number,
  rerender: () => void,
  options?: Partial<PathStrokeOptions<Draw> & PathLineStyleOptions>,
) {
  const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
  if (strokeWidth) {
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = getColorString(options?.strokeColor ?? 0, options?.strokeOpacity)
    ctx.miterLimit = options?.miterLimit ?? defaultMiterLimit
    ctx.lineJoin = options?.lineJoin ?? 'miter'
    ctx.lineCap = options?.lineCap ?? 'butt'
    renderPatternOrGradient(ctx, strokeWidthScale, rerender, options)
    ctx.stroke()
  }
}

function getPattern(
  ctx: CanvasRenderingContext2D,
  pattern: Pattern<Draw>,
  strokeWidthScale: number,
  rerender: () => void,
) {
  const canvas = document.createElement("canvas")
  canvas.width = pattern.width
  canvas.height = pattern.height
  const patternCtx = canvas.getContext('2d')
  if (patternCtx) {
    pattern.pattern()(patternCtx, strokeWidthScale, rerender)
    const result = ctx.createPattern(canvas, null)
    if (result) {
      // if (pattern.rotate) {
      //   const rotate = pattern.rotate * Math.PI / 180
      //   const c = Math.cos(rotate)
      //   const s = Math.sin(rotate)
      //   result.setTransform({ a: c, b: s, c: -s, d: c, e: 0, f: 0 })
      // }
      return result
    }
  }
  return
}

function renderFill(
  ctx: CanvasRenderingContext2D,
  strokeWidthScale: number,
  rerender: () => void,
  options?: Partial<PathFillOptions<Draw>>,
  fillCallback?: () => void,
) {
  if (options?.clip !== undefined) {
    ctx.clip('evenodd')
    options.clip()(ctx, strokeWidthScale, rerender)
  }
  if (options?.fillColor !== undefined || options?.fillPattern !== undefined || options?.fillLinearGradient !== undefined || options?.fillRadialGradient !== undefined) {
    if (options.fillPattern !== undefined) {
      const pattern = getPattern(ctx, options.fillPattern, strokeWidthScale, rerender)
      if (pattern) {
        ctx.fillStyle = pattern
      }
    } else if (options.fillColor !== undefined) {
      ctx.fillStyle = getColorString(options.fillColor, options.fillOpacity)
    } else if (options.fillLinearGradient !== undefined) {
      const { start, end, stops } = options.fillLinearGradient
      const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
      stops.forEach(s => {
        gradient.addColorStop(s.offset, getColorString(s.color, s.opacity))
      })
      ctx.fillStyle = gradient
    } else if (options.fillRadialGradient !== undefined) {
      const { start, end, stops } = options.fillRadialGradient
      const gradient = ctx.createRadialGradient(start.x, start.y, start.r, end.x, end.y, end.r)
      stops.forEach(s => {
        gradient.addColorStop(s.offset, getColorString(s.color, s.opacity))
      })
      ctx.fillStyle = gradient
    }
    if (fillCallback) {
      fillCallback()
    } else {
      ctx.fill('evenodd')
    }
  }
}

function renderPatternOrGradient(
  ctx: CanvasRenderingContext2D,
  strokeWidthScale: number,
  rerender: () => void,
  options?: Partial<PathStrokeOptions<Draw> & PathLineStyleOptions>,
) {
  if (options?.strokePattern) {
    const pattern = getPattern(ctx, options.strokePattern, strokeWidthScale, rerender)
    if (pattern) {
      ctx.strokeStyle = pattern
    }
  } else if (options?.strokeLinearGradient !== undefined) {
    const { start, end, stops } = options.strokeLinearGradient
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
    stops.forEach(s => {
      gradient.addColorStop(s.offset, getColorString(s.color, s.opacity))
    })
    ctx.strokeStyle = gradient
  } else if (options?.strokeRadialGradient !== undefined) {
    const { start, end, stops } = options.strokeRadialGradient
    const gradient = ctx.createRadialGradient(start.x, start.y, start.r, end.x, end.y, end.r)
    stops.forEach(s => {
      gradient.addColorStop(s.offset, getColorString(s.color, s.opacity))
    })
    ctx.strokeStyle = gradient
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
