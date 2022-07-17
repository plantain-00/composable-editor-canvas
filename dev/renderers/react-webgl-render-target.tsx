import React from "react"
import * as twgl from 'twgl.js'
import earcut from 'earcut'
import { arcToPolyline, combineStripTriangles, dashedPolylineToLines, ellipseToPolygon, getPolylineTriangles, m3, polygonToPolyline, Position, ReactRenderTarget, renderPartStyledPolyline, rotatePosition, WeakmapCache, WeakmapMapCache } from "../../src"

type Graphic = { points: number[], color: [number, number, number, number], strip: boolean }

export const reactWebglRenderTarget: ReactRenderTarget<(strokeWidthScale: number) => Graphic[]> = {
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
  renderGroup(children) {
    return (strokeWidthScale) => {
      const graphics: Graphic[] = []
      children.forEach(c => {
        const g = c(strokeWidthScale)
        if (g) {
          graphics.push(...g)
        }
      })
      return graphics
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
    return (strokeWidthScale) => {
      const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
      const strokeColor = colorNumberToRec(options?.strokeColor ?? 0)
      const graphics: Graphic[] = []
      if (strokeWidth) {
        if (options?.dashArray) {
          graphics.push({
            points: combineStripTriangles(
              dashedPolylineToLines(points, options.dashArray, options.skippedLines)
                .map(p => getPolylineTriangles(p, strokeWidth))
            ),
            color: strokeColor,
            strip: true,
          })
        } else {
          graphics.push({
            points: getPolylineTriangles(points, strokeWidth),
            color: strokeColor,
            strip: true,
          })
        }
      }
      if (options?.fillColor !== undefined) {
        const index = earcut(points.map(p => [p.x, p.y]).flat())
        const triangles: number[] = []
        for (let i = 0; i < index.length; i += 3) {
          triangles.push(points[index[i]].x, points[index[i]].y, points[index[i + 1]].x, points[index[i + 1]].y, points[index[i + 2]].x, points[index[i + 2]].y)
        }
        graphics.push({
          points: triangles,
          strip: false,
          color: colorNumberToRec(options.fillColor),
        })
      }
      return graphics
    }
  },
  renderPolygon(points, options) {
    return this.renderPolyline(polygonToPolyline(points), options)
  },
  renderCircle(cx, cy, r, options) {
    const points = arcToPolyline({ x: cx, y: cy, r, startAngle: 0, endAngle: 360 }, 5)
    return this.renderPolyline(points, options)
  },
  renderEllipse(cx, cy, rx, ry, options) {
    let points = ellipseToPolygon({ cx, cy, rx, ry }, 5)
    let angle = 0
    if (options?.angle) {
      angle = options.angle * Math.PI / 180
    } else if (options?.rotation) {
      angle = options.rotation
    }
    if (angle) {
      const center = { x: cx, y: cy }
      points = points.map((p) => rotatePosition(p, center, angle))
    }
    return this.renderPolygon(points, options)
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    const points = arcToPolyline({ x: cx, y: cy, r, startAngle, endAngle }, 5)
    return this.renderPolyline(points, options)
  },
  renderText(x, y, text, fillColor, fontSize, fontFamily) {
    return () => {
      return []
    }
  },
  renderPath(points, options) {
    return (strokeWidthScale) => {
      const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
      const strokeColor = colorNumberToRec(options?.strokeColor ?? 0)
      if (options?.dashArray) {
        const dashArray = options.dashArray
        points = points.map(p => dashedPolylineToLines(p, dashArray)).flat()
      }
      return [
        {
          points: combinedTrianglesCache.get(points, strokeWidth, () => {
            return combineStripTriangles(points.map(p => {
              return polylineTrianglesCache.get(p, strokeWidth, () => getPolylineTriangles(p, strokeWidth))
            }))
          }),
          color: strokeColor,
          strip: true,
        },
      ]
    }
  },
}

const polylineTrianglesCache = new WeakmapMapCache<Position[], number, number[]>()
const combinedTrianglesCache = new WeakmapMapCache<Position[][], number, number[]>()
const bufferInfoCache = new WeakmapCache<number[], twgl.BufferInfo>()

function Canvas(props: {
  width: number,
  height: number,
  attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
    style: React.CSSProperties
  }>,
  graphics: ((strokeWidthScale: number) => Graphic[])[]
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
  const render = React.useRef<(
    graphics: ((strokeWidthScale: number) => Graphic[])[],
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
    const gl = ref.current.getContext("webgl", { antialias: true });
    if (!gl) {
      return
    }
    const programInfo = twgl.createProgramInfo(gl, [`
    attribute vec4 position;
    uniform vec2 resolution;
    uniform mat3 matrix;
    void main() {
      gl_Position = vec4((((matrix * vec3(position.xy, 1)).xy / resolution) * 2.0 - 1.0) * vec2(1, -1), 0, 1);
    }
    `, `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }`]);

    render.current = (graphics, backgroundColor, x, y, scale, strokeWidthScale) => {
      const now = Date.now()
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(programInfo.program);
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.clearColor(...backgroundColor)
      gl.clear(gl.COLOR_BUFFER_BIT)

      let matrix = m3.translation(x, y)
      if (scale !== 1) {
        matrix = m3.multiply(matrix, m3.translation(gl.canvas.width / 2, gl.canvas.height / 2));
        matrix = m3.multiply(matrix, m3.scaling(scale, scale));
        matrix = m3.multiply(matrix, m3.translation(-gl.canvas.width / 2, -gl.canvas.height / 2));
      }

      for (const g of graphics) {
        const lines = g(strokeWidthScale)
        for (const line of lines) {
          const bufferInfo = bufferInfoCache.get(line.points, () => twgl.createBufferInfoFromArrays(gl, {
            position: {
              numComponents: 2,
              data: line.points
            },
          }))
          twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo)
          twgl.setUniforms(programInfo, {
            resolution: [gl.canvas.width, gl.canvas.height],
            color: line.color,
            matrix,
          });
          twgl.drawBufferInfo(gl, bufferInfo, line.strip ? gl.TRIANGLE_STRIP : gl.TRIANGLES);
        }
      }
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
  }, [props.graphics, props.backgroundColor, render.current, props.transform])
  return (
    <canvas
      ref={ref}
      width={props.width}
      height={props.height}
      {...props.attributes}
    />
  )
}

function colorNumberToRec(n: number, alpha = 1) {
  const color: [number, number, number, number] = [0, 0, 0, alpha]
  color[2] = n % 256 / 255
  n = Math.floor(n / 256)
  color[1] = n % 256 / 255
  color[0] = Math.floor(n / 256) / 255
  return color
}
