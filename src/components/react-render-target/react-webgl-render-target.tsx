import * as React from "react"
import { arcToPolyline, circleToArc, dashedPolylineToLines, ellipseArcToPolyline, ellipseToPolygon, polygonToPolyline, rotatePosition } from "../../utils/geometry"
import { getPathCommandsPoints, pathCommandPointsToPath, ReactRenderTarget, renderPartStyledPolyline, RenderTransform } from "./react-render-target"
import { createWebglRenderer, getGroupGraphics, getImageGraphic, getPathGraphics, getTextGraphic, Graphic, PatternGraphic } from "./create-webgl-renderer"
import { Matrix } from "../../utils/matrix"
import { colorNumberToRec } from "../../utils/color"
import { Vec4 } from "../../utils/types"
import { angleToRadian, radianToAngle } from "../../utils/radian"

/**
 * @public
 */
export const reactWebglRenderTarget: ReactRenderTarget<WebglDraw> = {
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
    return (strokeWidthScale, rerender, matrix, opacity) => {
      return getGroupGraphics(children.map(c => c(strokeWidthScale, rerender)).flat(), matrix, options, opacity)
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
      angle = angleToRadian(options.angle)
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
    const { dashArray, closed, ...restOptions2 } = options ?? {}
    if (closed) {
      points = polygonToPolyline(points)
    }
    const path = dashedPolylineToLines(points, dashArray, options?.skippedLines, options?.dashOffset)
    return this.renderPath(path, restOptions2)
  },
  renderPolygon(points, options) {
    return this.renderPolyline(points, { ...options, closed: true })
  },
  renderCircle(cx, cy, r, options) {
    const points = arcToPolyline(circleToArc({ x: cx, y: cy, r }), 5)
    return this.renderPolyline(points, options)
  },
  renderEllipse(cx, cy, rx, ry, options) {
    let angle = 0
    if (options?.angle) {
      angle = options.angle
    } else if (options?.rotation) {
      angle = radianToAngle(options.rotation)
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
      angle = radianToAngle(options.rotation)
    }
    const points = ellipseArcToPolyline({ cx, cy, rx, ry, startAngle, endAngle, angle, counterclockwise: options?.counterclockwise }, 5)
    return this.renderPolyline(points, options)
  },
  renderPathCommands(pathCommands, options) {
    const result = getPathCommandsPoints(pathCommands)
    const path = pathCommandPointsToPath(result)
    return this.renderGroup(path.map(p => this.renderPath(p, options)))
  },
  renderText(x, y, text, fill, fontSize, fontFamily, options) {
    return (strokeWidthScale, rerender) => {
      let fillPatternGraphics: PatternGraphic | number | undefined
      if (fill !== undefined && typeof fill !== 'number') {
        fillPatternGraphics = {
          graphics: fill.pattern()(strokeWidthScale, rerender),
          width: fill.width,
          height: fill.height,
        }
      } else {
        fillPatternGraphics = fill
      }
      let strokePatternGraphics: PatternGraphic | undefined
      if (options?.strokePattern !== undefined) {
        strokePatternGraphics = {
          graphics: options.strokePattern.pattern()(strokeWidthScale, rerender),
          width: options.strokePattern.width,
          height: options.strokePattern.height,
        }
      }
      const graphic = getTextGraphic(x, y, text, fillPatternGraphics, fontSize, fontFamily, {
        ...options,
        strokePattern: strokePatternGraphics,
      })
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
      let fillPatternGraphics: PatternGraphic | undefined
      if (options?.clip !== undefined) {
        fillPatternGraphics = {
          graphics: options.clip()(strokeWidthScale, rerender),
        }
      }
      if (options?.fillPattern !== undefined) {
        fillPatternGraphics = {
          graphics: options.fillPattern.pattern()(strokeWidthScale, rerender),
          width: options.fillPattern.width,
          height: options.fillPattern.height,
        }
      }
      let strokePatternGraphics: PatternGraphic | undefined
      if (options?.strokePattern !== undefined) {
        strokePatternGraphics = {
          graphics: options.strokePattern.pattern()(strokeWidthScale, rerender),
          width: options.strokePattern.width,
          height: options.strokePattern.height,
        }
      }
      return getPathGraphics(points, strokeWidthScale, {
        ...options,
        fillPattern: fillPatternGraphics,
        strokePattern: strokePatternGraphics,
      })
    }
  },
}

/**
 * @public
 */
export type WebglDraw = (strokeWidthScale: number, rerender: () => void, matrix?: Matrix, opacity?: number) => Graphic[]

function Canvas(props: {
  width: number,
  height: number,
  attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
    style: React.CSSProperties
  }>,
  graphics: WebglDraw[]
  transform?: RenderTransform
  backgroundColor?: number
  debug?: boolean
  strokeWidthScale?: number
}) {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const [imageLoadStatus, setImageLoadStatus] = React.useState(0)
  const render = React.useRef<(
    graphics: ((strokeWidthScale: number, rerender: () => void) => Graphic[])[],
    backgroundColor: Vec4,
    x: number,
    y: number,
    scale: number,
    strokeWidthScale: number,
    rotate?: number
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
    render.current = (graphics, backgroundColor, x, y, scale, strokeWidthScale, rotate) => {
      const now = performance.now()
      renderer(graphics.map(g => g(strokeWidthScale, rerender)).flat(), backgroundColor, x, y, scale, rotate)
      if (props.debug) {
        console.info(Math.round(performance.now() - now))
      }
    }
  }, [ref.current, props.debug])

  React.useEffect(() => {
    if (render.current) {
      const x = props.transform?.x ?? 0
      const y = props.transform?.y ?? 0
      const scale = props.transform?.scale ?? 1
      const color = colorNumberToRec(props.backgroundColor ?? 0xffffff)
      const strokeWidthScale = props.strokeWidthScale ?? 1
      render.current(props.graphics, color, x, y, scale, strokeWidthScale, props.transform?.rotate)
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
