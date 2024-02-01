import * as React from "react"
import { rotatePosition } from "../../utils/position"
import { polygonToPolyline } from "../../utils/line"
import { dashedPolylineToLines } from "../../utils/line"
import { circleToArc } from "../../utils/circle"
import { ellipseArcToPolyline, ellipseToPolygon } from "../../utils/ellipse"
import { arcToPolyline } from "../../utils/circle"
import { ReactRenderTarget, renderPartStyledPolyline } from "./react-render-target"
import { getRayTransformedLineSegment } from "../../utils/line"
import { RenderTransform } from "../../utils/transform"
import { getPathCommandsPoints } from "../../utils/path"
import { pathCommandPointsToPath } from "../../utils/path"
import { createWebglRenderer, getImageGraphic, getPathGraphics, getTextGraphic, Graphic, PatternGraphic } from "./create-webgl-renderer"
import { Matrix, getRenderOptionsMatrix, multiplyMatrix } from "../../utils/matrix"
import { colorNumberToRec } from "../../utils/color"
import { Vec4 } from "../../utils/types"
import { angleToRadian, radianToAngle } from "../../utils/radian"
import { multiplyOpacity } from "../../utils/math"

/**
 * @public
 */
export const reactWebglRenderTarget: ReactRenderTarget<WebglDraw> = {
  type: 'webgl',
  renderResult(children, width, height, options) {
    return (
      <WebglDrawCanvas
        width={width}
        height={height}
        attributes={options?.attributes}
        graphics={children}
        transform={options?.transform}
        backgroundColor={options?.backgroundColor}
        debug={options?.debug}
        strokeWidthFixed={options?.strokeWidthFixed}
      />
    )
  },
  renderEmpty() {
    return () => {
      return []
    }
  },
  renderGroup(children, options) {
    return (strokeWidthFixed, rerender, width, height, transform, matrix, opacity) => {
      const currentMatrix = getRenderOptionsMatrix(options)
      const parentMatrix = multiplyMatrix(matrix, currentMatrix)
      opacity = multiplyOpacity(opacity, options?.opacity)
      return children.map(c => c(strokeWidthFixed, rerender, width, height, transform, parentMatrix)).flat().map(h => ({
        ...h,
        matrix: multiplyMatrix(currentMatrix, h.matrix),
        opacity: multiplyOpacity(opacity, h.opacity),
      }))
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
    return (strokeWidthFixed, rerender, width, height, transform) => {
      let fillPatternGraphics: PatternGraphic | number | undefined
      if (fill !== undefined && typeof fill !== 'number') {
        fillPatternGraphics = {
          graphics: fill.pattern()(strokeWidthFixed, rerender, width, height, transform),
          width: fill.width,
          height: fill.height,
        }
      } else {
        fillPatternGraphics = fill
      }
      let strokePatternGraphics: PatternGraphic | undefined
      if (options?.strokePattern !== undefined) {
        strokePatternGraphics = {
          graphics: options.strokePattern.pattern()(strokeWidthFixed, rerender, width, height, transform),
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
    return (strokeWidthFixed, rerender, width, height, transform) => {
      let fillPatternGraphics: PatternGraphic | undefined
      if (options?.clip !== undefined) {
        fillPatternGraphics = {
          graphics: options.clip()(strokeWidthFixed, rerender, width, height, transform),
        }
      }
      if (options?.fillPattern !== undefined) {
        fillPatternGraphics = {
          graphics: options.fillPattern.pattern()(strokeWidthFixed, rerender, width, height, transform),
          width: options.fillPattern.width,
          height: options.fillPattern.height,
        }
      }
      let strokePatternGraphics: PatternGraphic | undefined
      if (options?.strokePattern !== undefined) {
        strokePatternGraphics = {
          graphics: options.strokePattern.pattern()(strokeWidthFixed, rerender, width, height, transform),
          width: options.strokePattern.width,
          height: options.strokePattern.height,
        }
      }
      return getPathGraphics(points, strokeWidthFixed, {
        ...options,
        fillPattern: fillPatternGraphics,
        strokePattern: strokePatternGraphics,
      })
    }
  },
  renderRay(x, y, angle, options) {
    return (strokeWidthFixed, rerender, width, height, transform, matrix) => {
      const line = getRayTransformedLineSegment({ x, y, angle, bidirectional: options?.bidirectional }, width, height, transform, matrix)
      if (!line) return []
      return this.renderPath([line], options)(strokeWidthFixed, rerender, width, height, transform)
    }
  },
}

/**
 * @public
 */
export type WebglDraw = (strokeWidthFixed: boolean, rerender: () => void, width: number, height: number, transform?: RenderTransform, matrix?: Matrix, opacity?: number) => Graphic[]

function WebglDrawCanvas(props: {
  width: number,
  height: number,
  attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
    style: React.CSSProperties
  }>,
  graphics: WebglDraw[]
  transform?: RenderTransform
  backgroundColor?: number
  debug?: boolean
  strokeWidthFixed?: boolean
  onRender?: () => void
}) {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const [imageLoadStatus, setImageLoadStatus] = React.useState(0)
  const render = React.useRef<(
    graphics: ((strokeWidthFixed: boolean, rerender: () => void, width: number, height: number, transform?: RenderTransform) => Graphic[])[],
    backgroundColor: Vec4,
    x: number,
    y: number,
    scale: number,
    strokeWidthFixed: boolean,
    width: number,
    height: number,
    transform?: RenderTransform,
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
    render.current = (graphics, backgroundColor, x, y, scale, strokeWidthFixed, width, height, transform) => {
      const now = performance.now()
      renderer(graphics.map(g => g(strokeWidthFixed, rerender, width, height, transform)).flat(), backgroundColor, x, y, scale, transform?.rotate)
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
      const strokeWidthFixed = props.strokeWidthFixed ?? false
      render.current(props.graphics, color, x, y, scale, strokeWidthFixed, props.width, props.height, props.transform)
      props.onRender?.()
    }
  }, [props.graphics, props.backgroundColor, render.current, props.transform, imageLoadStatus, props.width, props.height, props.onRender])
  return (
    <canvas
      ref={ref}
      width={props.width}
      height={props.height}
      {...props.attributes}
    />
  )
}
