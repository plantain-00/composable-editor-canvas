import React from "react"
import * as twgl from 'twgl.js'
import earcut from 'earcut'
import { arcToPolyline, combineStripTriangles, dashedPolylineToLines, ellipseToPolygon, getPolylineTriangles, m3, polygonToPolyline, Position, ReactRenderTarget, renderPartStyledPolyline, rotatePosition, WeakmapCache, WeakmapMapCache } from "../../src"

type Graphic = {
  type: 'triangles'
  points: number[]
  color: [number, number, number, number]
  strip: boolean
  matrix?: number[]
} | {
  type: 'texture'
  color: [number, number, number, number]
  x: number
  y: number
  canvas: HTMLCanvasElement
  matrix?: number[]
}

export const reactWebglRenderTarget: ReactRenderTarget<(strokeWidthScale: number, matrix?: number[]) => Graphic[]> = {
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
    return (strokeWidthScale, matrix) => {
      if (options) {
        if (!matrix) {
          matrix = m3.identity()
        }
        if (options.translate) {
          matrix = m3.multiply(matrix, m3.translation(options.translate.x, options.translate.y))
        }
        if (options.base && (options.angle || options.rotation)) {
          matrix = m3.multiply(matrix, m3.translation(options.base.x, options.base.y))
          if (options.angle) {
            matrix = m3.multiply(matrix, m3.rotation(-options.angle / 180 * Math.PI))
          } else if (options.rotation) {
            matrix = m3.multiply(matrix, m3.rotation(-options.rotation))
          }
          matrix = m3.multiply(matrix, m3.translation(-options.base.x, -options.base.y))
        }
      }
      const graphics: Graphic[] = []
      children.forEach(c => {
        const g = c(strokeWidthScale)
        if (g) {
          graphics.push(...g.map(h => ({
            ...h,
            matrix: h.matrix ? (matrix ? m3.multiply(matrix, h.matrix) : h.matrix) : matrix,
          })))
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
    const { dashArray, ...restOptions2 } = options ?? {}
    const path = dashArray ? dashedPolylineToLines(points, dashArray, options?.skippedLines) : [points]
    return this.renderPath(path, restOptions2)
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
  renderText(x, y, text, fillColor, fontSize, fontFamily, options) {
    return () => {
      const getCanvas = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (ctx) {
          const font = `${fontSize}px ${fontFamily}`
          ctx.font = font
          const t = ctx.measureText(text);
          ctx.canvas.width = Math.ceil(t.width) + 2;
          ctx.canvas.height = fontSize
          ctx.font = font
          ctx.fillStyle = 'white';
          ctx.fillText(text, 0, ctx.canvas.height);
        }
        return canvas
      }
      const canvas = options?.cacheKey ? textCanvasCache.get(options.cacheKey, getCanvas) : getCanvas()
      return [
        {
          type: 'texture',
          x,
          y: y - canvas.height,
          color: colorNumberToRec(fillColor),
          canvas,
        }
      ]
    }
  },
  renderPath(points, options) {
    return (strokeWidthScale) => {
      const strokeWidth = (options?.strokeWidth ?? 1) * strokeWidthScale
      const strokeColor = colorNumberToRec(options?.strokeColor ?? 0)
      const graphics: Graphic[] = []
      if (strokeWidth) {
        if (options?.dashArray) {
          const dashArray = options.dashArray
          points = points.map(p => dashedPolylineToLines(p, dashArray)).flat()
        }
        graphics.push({
          type: 'triangles',
          points: combinedTrianglesCache.get(points, strokeWidth, () => {
            return combineStripTriangles(points.map(p => {
              return polylineTrianglesCache.get(p, strokeWidth, () => getPolylineTriangles(p, strokeWidth))
            }))
          }),
          color: strokeColor,
          strip: true,
        })
      }
      if (options?.fillColor !== undefined) {
        const vertices: number[] = []
        const holes: number[] = []
        for (let i = 0; i < points.length; i++) {
          if (i !== 0) {
            holes.push(vertices.length / 2)
          }
          vertices.push(...points[i].map(p => [p.x, p.y]).flat())
        }
        const index = earcut(vertices, holes)
        const triangles: number[] = []
        for (let i = 0; i < index.length; i += 3) {
          triangles.push(
            vertices[index[i] * 2], vertices[index[i] * 2 + 1],
            vertices[index[i + 1] * 2], vertices[index[i + 1] * 2 + 1],
            vertices[index[i + 2] * 2], vertices[index[i + 2] * 2 + 1]
          )
        }
        graphics.push({
          type: 'triangles',
          points: triangles,
          strip: false,
          color: colorNumberToRec(options.fillColor),
        })
      }
      return graphics
    }
  },
}

const polylineTrianglesCache = new WeakmapMapCache<Position[], number, number[]>()
const combinedTrianglesCache = new WeakmapMapCache<Position[][], number, number[]>()
const bufferInfoCache = new WeakmapCache<number[], twgl.BufferInfo>()
const textCanvasCache = new WeakmapCache<object, HTMLCanvasElement>()

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
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const programInfo = twgl.createProgramInfo(gl, [`
    attribute vec4 position;
    uniform mat3 matrix;
    void main() {
      gl_Position = vec4((matrix * vec3(position.xy, 1)).xy, 0, 1);
    }
    `, `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }`]);
    const textureProgramInfo = twgl.createProgramInfo(gl, [`
    attribute vec4 position;   
    uniform mat3 matrix;
    varying vec2 texcoord;

    void main () {
      gl_Position = vec4((matrix * vec3(position.xy, 1)).xy, 0, 1);
      texcoord = position.xy;
    }
    `, `
    precision mediump float;

    varying vec2 texcoord;
    uniform sampler2D texture;
    uniform vec4 color;

    void main() {
      if (texcoord.x < 0.0 || texcoord.x > 1.0 ||
          texcoord.y < 0.0 || texcoord.y > 1.0) {
        discard;
      }
      vec4 color = texture2D(texture, texcoord) * color;
      if (color.a < 0.1) {
        discard;
      }
      gl_FragColor = color;
    }`]);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    const textureBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
    const canvasTextureCache = new WeakmapCache<HTMLCanvasElement, WebGLTexture>()

    render.current = (graphics, backgroundColor, x, y, scale, strokeWidthScale) => {
      const now = Date.now()
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.clearColor(...backgroundColor)
      gl.clear(gl.COLOR_BUFFER_BIT)

      let worldMatrix = m3.projection(gl.canvas.width, gl.canvas.height)
      worldMatrix = m3.multiply(worldMatrix, m3.translation(x, y))
      if (scale !== 1) {
        worldMatrix = m3.multiply(worldMatrix, m3.translation(gl.canvas.width / 2, gl.canvas.height / 2));
        worldMatrix = m3.multiply(worldMatrix, m3.scaling(scale, scale));
        worldMatrix = m3.multiply(worldMatrix, m3.translation(-gl.canvas.width / 2, -gl.canvas.height / 2));
      }

      const objectsToDraw: twgl.DrawObject[] = []
      for (const g of graphics) {
        const lines = g(strokeWidthScale)
        for (const line of lines) {
          let matrix = line.matrix ? m3.multiply(worldMatrix, line.matrix) : worldMatrix
          if (line.type === 'texture') {
            matrix = m3.multiply(matrix, m3.translation(line.x, line.y))
            matrix = m3.multiply(matrix, m3.scaling(line.canvas.width, line.canvas.height))
            objectsToDraw.push({
              programInfo: textureProgramInfo,
              bufferInfo: textureBufferInfo,
              uniforms: {
                matrix,
                color: line.color,
                texture: canvasTextureCache.get(line.canvas, () => twgl.createTexture(gl, { src: line.canvas })),
              },
            })
            continue
          }
          objectsToDraw.push({
            programInfo,
            bufferInfo: bufferInfoCache.get(line.points, () => twgl.createBufferInfoFromArrays(gl, {
              position: {
                numComponents: 2,
                data: line.points
              },
            })),
            uniforms: {
              color: line.color,
              matrix,
            },
            type: line.strip ? gl.TRIANGLE_STRIP : gl.TRIANGLES,
          })
        }
      }
      twgl.drawObjectList(gl, objectsToDraw)
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
