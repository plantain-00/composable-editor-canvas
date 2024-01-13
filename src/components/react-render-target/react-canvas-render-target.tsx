import * as React from "react"
import { m3 } from "../../utils/matrix"
import { setCanvasLineDash } from "./create-webgl-renderer"
import { getImageFromCache } from "./image-loader"
import { Filter, PathFillOptions, PathLineStyleOptions, PathStrokeOptions, Pattern, ReactRenderTarget, RenderTransform, getEllipseArcByStartEnd, renderPartStyledPolyline } from "./react-render-target"
import { getColorString } from "../../utils/color"
import { angleToRadian } from "../../utils/radian"
import { defaultLineCap, defaultLineJoin, defaultMiterLimit } from "../../utils/triangles"
import { Position } from "../../utils/position"

/**
 * @public
 */
export const reactCanvasRenderTarget: ReactRenderTarget<CanvasDraw> = {
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
        strokeWidthFixed={options?.strokeWidthFixed}
      />
    )
  },
  renderEmpty() {
    return () => {
      // empty
    }
  },
  renderGroup(children, options) {
    return (ctx, scale, rerender) => {
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
        ctx.rotate(angleToRadian(options.angle))
        ctx.translate(-options.base.x, - options.base.y)
      }
      if (options?.rotation && options?.base !== undefined) {
        ctx.translate(options.base.x, options?.base.y)
        ctx.rotate(options.rotation)
        ctx.translate(-options.base.x, - options.base.y)
      }
      if (options?.matrix) {
        ctx.setTransform(ctx.getTransform().multiply(m3.getTransformInit(options.matrix)))
      }
      children.forEach((c) => {
        c(ctx, scale, rerender)
      })
      ctx.restore()
    }
  },
  renderRect(x, y, width, height, options) {
    return (ctx, scale, rerender) => {
      ctx.save()
      ctx.beginPath()
      setCanvasLineDash(ctx, options)
      if (options?.angle) {
        ctx.translate(x + width / 2, y + height / 2)
        ctx.rotate(angleToRadian(options.angle))
        ctx.translate(-(x + width / 2), -(y + height / 2))
      }
      if (options?.rotation) {
        ctx.translate(x + width / 2, y + height / 2)
        ctx.rotate(options.rotation)
        ctx.translate(-(x + width / 2), -(y + height / 2))
      }
      ctx.rect(x, y, width, height)
      const strokeWidth = (options?.strokeWidth ?? 1) / scale
      if (strokeWidth) {
        ctx.lineWidth = strokeWidth
        ctx.strokeStyle = getColorString(options?.strokeColor ?? 0)
        ctx.strokeRect(x, y, width, height)
      }
      renderStroke(ctx, scale, rerender, options)
      renderFill(ctx, scale, rerender, options)
      ctx.restore()
    }
  },
  renderPolyline(points, options) {
    const { partsStyles, ...restOptions } = options ?? {}
    if (partsStyles && partsStyles.length > 0) {
      return renderPartStyledPolyline(this, partsStyles, points, restOptions)
    }
    return (ctx, scale, rerender) => {
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
      renderStroke(ctx, scale, rerender, options)
      renderFill(ctx, scale, rerender, options)
      ctx.restore()
    }
  },
  renderPolygon(points, options) {
    return this.renderPolyline(points, { ...options, closed: true })
  },
  renderCircle(cx, cy, r, options) {
    return (ctx, scale, rerender) => {
      ctx.save()
      ctx.beginPath()
      setCanvasLineDash(ctx, options)
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      renderStroke(ctx, scale, rerender, options)
      renderFill(ctx, scale, rerender, options)
      ctx.restore()
    }
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return (ctx, scale, rerender) => {
      ctx.save()
      ctx.beginPath()
      setCanvasLineDash(ctx, options)
      const rotation = options?.rotation ?? (angleToRadian(options?.angle))
      ctx.ellipse(cx, cy, rx, ry, rotation, 0, 2 * Math.PI)
      renderStroke(ctx, scale, rerender, options)
      renderFill(ctx, scale, rerender, options)
      ctx.restore()
    }
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    return (ctx, scale, rerender) => {
      ctx.save()
      ctx.beginPath()
      setCanvasLineDash(ctx, options)
      ctx.arc(cx, cy, r, angleToRadian(startAngle), angleToRadian(endAngle), options?.counterclockwise)
      renderStroke(ctx, scale, rerender, options)
      renderFill(ctx, scale, rerender, options)
      ctx.restore()
    }
  },
  renderEllipseArc(cx, cy, rx, ry, startAngle, endAngle, options) {
    return (ctx, scale, rerender) => {
      ctx.save()
      ctx.beginPath()
      setCanvasLineDash(ctx, options)
      const rotation = options?.rotation ?? (angleToRadian(options?.angle))
      ctx.ellipse(cx, cy, rx, ry, rotation, angleToRadian(startAngle), angleToRadian(endAngle), options?.counterclockwise)
      renderStroke(ctx, scale, rerender, options)
      renderFill(ctx, scale, rerender, options)
      ctx.restore()
    }
  },
  renderPathCommands(pathCommands, options) {
    return (ctx, scale, rerender) => {
      ctx.save()
      ctx.beginPath()
      setCanvasLineDash(ctx, options)
      let last: Position | undefined
      for (const command of pathCommands) {
        if (command.type === 'move') {
          ctx.moveTo(command.to.x, command.to.y)
        } else if (command.type === 'line') {
          ctx.lineTo(command.to.x, command.to.y)
        } else if (command.type === 'arc') {
          ctx.arcTo(command.from.x, command.from.y, command.to.x, command.to.y, command.radius)
        } else if (command.type === 'ellipseArc') {
          if (last) {
            const ellipse = getEllipseArcByStartEnd(last, command.rx, command.ry, command.angle, command.largeArc, command.sweep, command.to)
            if (ellipse) {
              ctx.ellipse(ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry, angleToRadian(ellipse.angle), angleToRadian(ellipse.startAngle), angleToRadian(ellipse.endAngle), ellipse.counterclockwise)
            }
          }
        } else if (command.type === 'bezierCurve') {
          ctx.bezierCurveTo(command.cp1.x, command.cp1.y, command.cp2.x, command.cp2.y, command.to.x, command.to.y)
        } else if (command.type === 'quadraticCurve') {
          ctx.quadraticCurveTo(command.cp.x, command.cp.y, command.to.x, command.to.y)
        } else if (command.type === 'close') {
          ctx.closePath()
        }
        if (command.type !== 'close') {
          last = command.to
        }
      }
      if (options?.closed) {
        ctx.closePath()
      }
      renderStroke(ctx, scale, rerender, options)
      renderFill(ctx, scale, rerender, options)
      ctx.restore()
    }
  },
  renderText(x, y, text, fill, fontSize, fontFamily, options) {
    return (ctx, scale, rerender) => {
      ctx.save()
      ctx.font = `${options?.fontWeight ?? 'normal'} ${options?.fontStyle ?? 'normal'} ${fontSize}px ${fontFamily}`
      ctx.textAlign = options?.textAlign ?? 'left'
      ctx.textBaseline = options?.textBaseline ?? 'alphabetic'
      renderFill(ctx, scale, rerender, {
        ...options,
        fillColor: typeof fill === 'number' ? fill : undefined,
        fillPattern: fill !== undefined && typeof fill !== 'number' ? fill : undefined,
      }, () => ctx.fillText(text, x, y))
      if (options?.strokeColor !== undefined || options?.strokePattern || options?.strokeLinearGradient || options?.strokeRadialGradient) {
        if (options?.strokeColor !== undefined) {
          ctx.strokeStyle = getColorString(options.strokeColor, options.strokeOpacity)
        } else {
          renderPatternOrGradient(ctx, scale, rerender, options)
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
    return (ctx, scale, rerender) => {
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
      renderStroke(ctx, scale, rerender, options)
      renderFill(ctx, scale, rerender, options)
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
  scale: number,
  rerender: () => void,
  options?: Partial<PathStrokeOptions<CanvasDraw> & PathLineStyleOptions>,
) {
  const strokeWidth = (options?.strokeWidth ?? 1) / scale
  if (strokeWidth) {
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = getColorString(options?.strokeColor ?? 0, options?.strokeOpacity)
    ctx.miterLimit = options?.miterLimit ?? defaultMiterLimit
    ctx.lineJoin = options?.lineJoin ?? defaultLineJoin
    ctx.lineCap = options?.lineCap ?? defaultLineCap
    renderPatternOrGradient(ctx, scale, rerender, options)
    ctx.stroke()
  }
}

function getPattern(
  ctx: CanvasRenderingContext2D,
  pattern: Pattern<CanvasDraw>,
  scale: number,
  rerender: () => void,
) {
  const canvas = document.createElement("canvas")
  canvas.width = pattern.width
  canvas.height = pattern.height
  const patternCtx = canvas.getContext('2d')
  if (patternCtx) {
    pattern.pattern()(patternCtx, scale, rerender)
    const result = ctx.createPattern(canvas, null)
    if (result) {
      // if (pattern.rotate) {
      //   const rotate = angleToRadian(pattern.rotate)
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
  scale: number,
  rerender: () => void,
  options?: Partial<PathFillOptions<CanvasDraw>>,
  fillCallback?: () => void,
) {
  if (options?.clip !== undefined) {
    ctx.clip('evenodd')
    options.clip()(ctx, scale, rerender)
  }
  if (options?.fillColor !== undefined || options?.fillPattern !== undefined || options?.fillLinearGradient !== undefined || options?.fillRadialGradient !== undefined) {
    if (options.fillPattern !== undefined) {
      const pattern = getPattern(ctx, options.fillPattern, scale, rerender)
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
  scale: number,
  rerender: () => void,
  options?: Partial<PathStrokeOptions<CanvasDraw> & PathLineStyleOptions>,
) {
  if (options?.strokePattern) {
    const pattern = getPattern(ctx, options.strokePattern, scale, rerender)
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

/**
 * @public
 */
export type CanvasDraw = (ctx: CanvasRenderingContext2D, scale: number, rerender: () => void) => void

function Canvas(props: {
  width: number,
  height: number,
  attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
    style: React.CSSProperties
  }>,
  draws: CanvasDraw[]
  transform?: RenderTransform
  backgroundColor?: number
  debug?: boolean
  strokeWidthFixed?: boolean
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
          if (props.transform.rotate) {
            ctx.rotate(props.transform.rotate)
          }
        }
        const rerender = () => setImageLoadStatus(c => c + 1)
        const scale = props.strokeWidthFixed && props.transform?.scale ? props.transform.scale : 1
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
