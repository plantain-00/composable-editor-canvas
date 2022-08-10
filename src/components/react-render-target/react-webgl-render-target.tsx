import * as React from "react"
import { arcToPolyline, dashedPolylineToLines, ellipseArcToPolyline, ellipseToPolygon, Matrix, polygonToPolyline, rotatePosition } from "../../utils"
import { ReactRenderTarget, renderPartStyledPolyline } from "./react-render-target"
import { colorNumberToRec, createWebglRenderer, getGroupGraphics, getImageGraphic, getPathGraphics, getTextGraphic, Graphic, PatternGraphic } from "./create-webgl-renderer"

/**
 * @public
 */
export const reactWebglRenderTarget: ReactRenderTarget<Draw> = {
  type: 'webgl',
  renderResult(children, width, height, options) {
    return (
      <Canvas
        width={width}
        height={height}
        attributes={options?.attributes}
        graphics={children}
        transform={options?.transform}
        backgroundColor={options?.backgroundColor}
        debug={options?.debug}
        strokeWidthScale={options?.strokeWidthScale}
      />
    )
  },
  renderEmpty() {
    return () => {
      return []
    }
  },
  renderGroup(children, options) {
    return (strokeWidthScale, rerender, matrix) => {
      return getGroupGraphics(children.map(c => c(strokeWidthScale, rerender)).flat(), matrix, options)
    }
  },
  renderRect(x, y, width, height, options) {
    let points = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ]
    let angle = 0
    if (options?.angle) {
      angle = options.angle * Math.PI / 180
    } else if (options?.rotation) {
      angle = options.rotation
    }
    if (angle) {
      const center = { x: x + width / 2, y: y + height / 2 }
      points = points.map((p) => rotatePosition(p, center, angle))
    }
    return this.renderPolygon(points, options)
  },
  renderPolyline(points, options) {
    const { partsStyles, ...restOptions } = options ?? {}
    if (partsStyles && partsStyles.length > 0) {
      return renderPartStyledPolyline(this, partsStyles, points, restOptions)
    }
    const { dashArray, ...restOptions2 } = options ?? {}
    if (options?.closed) {
      points = polygonToPolyline(points)
    }
    const path = dashArray ? dashedPolylineToLines(points, dashArray, options?.skippedLines, options?.dashOffset) : [points]
    return this.renderPath(path, restOptions2)
  },
  renderPolygon(points, options) {
    return this.renderPolyline(points, { ...options, closed: true })
  },
  renderCircle(cx, cy, r, options) {
    const points = arcToPolyline({ x: cx, y: cy, r, startAngle: 0, endAngle: 360 }, 5)
    return this.renderPolyline(points, options)
  },
  renderEllipse(cx, cy, rx, ry, options) {
    let angle = 0
    if (options?.angle) {
      angle = options.angle
    } else if (options?.rotation) {
      angle = options.rotation * 180 / Math.PI
    }
    const points = ellipseToPolygon({ cx, cy, rx, ry, angle }, 5)
    return this.renderPolygon(points, options)
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    const points = arcToPolyline({ x: cx, y: cy, r, startAngle, endAngle, counterclockwise: options?.counterclockwise }, 5)
    return this.renderPolyline(points, options)
  },
  renderEllipseArc(cx, cy, rx, ry, startAngle, endAngle, options) {
    let angle = 0
    if (options?.angle) {
      angle = options.angle
    } else if (options?.rotation) {
      angle = options.rotation * 180 / Math.PI
    }
    const points = ellipseArcToPolyline({ cx, cy, rx, ry, startAngle, endAngle, angle, counterclockwise: options?.counterclockwise }, 5)
    return this.renderPolyline(points, options)
  },
  renderText(x, y, text, fill, fontSize, fontFamily, options) {
    return (strokeWidthScale, rerender) => {
      let patternGraphics: PatternGraphic | number | undefined
      if (fill !== undefined && typeof fill !== 'number') {
        patternGraphics = {
          graphics: fill.pattern()(strokeWidthScale, rerender),
          width: fill.width,
          height: fill.height,
        }
      } else {
        patternGraphics = fill
      }
      const graphic = getTextGraphic(x, y, text, patternGraphics, fontSize, fontFamily, options)
      return graphic ? [graphic] : []
    }
  },
  renderImage(url, x, y, width, height, options) {
    return (_, rerender) => {
      const graphic = getImageGraphic(url, x, y, width, height, rerender, options)
      return graphic ? [graphic] : []
    }
  },
  renderPath(points, options) {
    return (strokeWidthScale, rerender) => {
      let patternGraphics: PatternGraphic | undefined
      if (options?.fillPattern !== undefined) {
        patternGraphics = {
          graphics: options.fillPattern.pattern()(strokeWidthScale, rerender),
          width: options.fillPattern.width,
          height: options.fillPattern.height,
        }
      }
      return getPathGraphics(points, strokeWidthScale, {
        ...options,
        fillPattern: patternGraphics,
      })
    }
  },
}

type Draw = (strokeWidthScale: number, rerender: () => void, matrix?: Matrix) => Graphic[]

function Canvas(props: {
  width: number,
  height: number,
  attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
    style: React.CSSProperties
  }>,
  graphics: Draw[]
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
  const render = React.useRef<(
    graphics: ((strokeWidthScale: number, rerender: () => void) => Graphic[])[],
    backgroundColor: [number, number, number, number],
    x: number,
    y: number,
    scale: number,
    strokeWidthScale: number,
  ) => void>()
  React.useEffect(() => {
    if (ref.current) {
      ref.current.width = props.width
      ref.current.height = props.height
    }
  }, [props.width, props.height])
  React.useEffect(() => {
    if (!ref.current) {
      return
    }
    const renderer = createWebglRenderer(ref.current)
    if (!renderer) {
      return
    }

    const rerender = () => setImageLoadStatus(c => c + 1)
    render.current = (graphics, backgroundColor, x, y, scale, strokeWidthScale) => {
      const now = Date.now()
      renderer(graphics.map(g => g(strokeWidthScale, rerender)).flat(), backgroundColor, x, y, scale)
      if (props.debug) {
        console.info(Date.now() - now)
      }
    }
  }, [ref.current])

  React.useEffect(() => {
    if (render.current) {
      const x = props.transform?.x ?? 0
      const y = props.transform?.y ?? 0
      const scale = props.transform?.scale ?? 1
      const color = colorNumberToRec(props.backgroundColor ?? 0xffffff)
      const strokeWidthScale = props.strokeWidthScale ?? 1
      render.current(props.graphics, color, x, y, scale, strokeWidthScale)
    }
  }, [props.graphics, props.backgroundColor, render.current, props.transform, imageLoadStatus])
  return (
    <canvas
      ref={ref}
      width={props.width}
      height={props.height}
      {...props.attributes}
    />
  )
}
