import * as React from "react"
import * as twgl from 'twgl.js'
import earcut from 'earcut'
import { arcToPolyline, combineStripTriangles, dashedPolylineToLines, ellipseToPolygon, getPolylineTriangles, m3, polygonToPolyline, Position, rotatePosition, Size, WeakmapCache, WeakmapMapCache } from "../../utils"
import { loadImage, ReactRenderTarget, renderPartStyledPolyline } from "./react-render-target"

interface LineOrTriangleGraphic {
  type: 'triangles' | 'lines'
  points: number[]
  color: [number, number, number, number]
  strip: boolean
}

interface TextureGraphic {
  type: 'texture'
  color?: [number, number, number, number]
  x: number
  y: number
  width?: number
  height?: number
  src: HTMLCanvasElement | HTMLImageElement
}

type Graphic = (LineOrTriangleGraphic | TextureGraphic) & {
  matrix?: number[]
  pattern?: {
    graphics: Graphic[]
  } & Size
}

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
    return (strokeWidthScale, setImageLoadStatus, matrix) => {
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
        const g = c(strokeWidthScale, setImageLoadStatus)
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
    const points = arcToPolyline({ x: cx, y: cy, r, startAngle, endAngle, counterclockwise: options?.counterclockwise }, 5)
    return this.renderPolyline(points, options)
  },
  renderText(x, y, text, fill, fontSize, fontFamily, options) {
    return (strokeWidthScale, setImageLoadStatus) => {
      const getCanvas = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (ctx) {
          const font = `${options?.fontWeight ?? 'normal'} ${options?.fontStyle ?? 'normal'} ${fontSize}px ${fontFamily}`
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
      if (fill !== undefined && typeof fill !== 'number') {
        return [
          {
            type: 'texture',
            x,
            y: y - canvas.height,
            src: canvas,
            color: [0, 0, 0, 1],
            pattern: {
              graphics: fill.pattern()(strokeWidthScale, setImageLoadStatus),
              width: fill.width,
              height: fill.height,
            },
          }
        ]
      }
      return [
        {
          type: 'texture',
          x,
          y: y - canvas.height,
          color: colorNumberToRec(fill),
          src: canvas,
        }
      ]
    }
  },
  renderImage(url, x, y, width, height, options) {
    return (_, setImageLoadStatus) => {
      if (!images.has(url)) {
        images.set(url, undefined)
        // eslint-disable-next-line plantain/promise-not-await
        loadImage(url, options?.crossOrigin).then(image => {
          images.set(url, image)
          setImageLoadStatus(c => c + 1)
        })
      }
      const image = images.get(url)
      if (!image) {
        return []
      }
      return [
        {
          type: 'texture',
          x,
          y,
          width,
          height,
          src: image,
        },
      ]
    }
  },
  renderPath(points, options) {
    return (strokeWidthScale, setImageLoadStatus) => {
      let strokeWidth = options?.strokeWidth ?? 1

      const strokeColor = colorNumberToRec(options?.strokeColor ?? 0)
      const graphics: Graphic[] = []
      if (strokeWidth) {
        if (options?.dashArray) {
          const dashArray = options.dashArray
          points = points.map(p => dashedPolylineToLines(p, dashArray)).flat()
        }

        if (strokeWidth === 1) {
          graphics.push({
            type: 'lines',
            points: combinedLinesCache.get(points, () => {
              return points.map(p => {
                return polylineLinesCache.get(p, () => {
                  const result: number[] = []
                  for (let i = 1; i < p.length; i++) {
                    result.push(p[i - 1].x, p[i - 1].y, p[i].x, p[i].y)
                  }
                  return result
                })
              }).flat()
            }),
            color: strokeColor,
            strip: false,
          })
        } else {
          strokeWidth *= strokeWidthScale
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
      }
      if (options?.fillColor !== undefined || options?.fillPattern !== undefined) {
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
        if (options?.fillPattern !== undefined) {
          const pathGraphics = options.fillPattern.pattern()(strokeWidthScale, setImageLoadStatus)
          graphics.push({
            type: 'triangles',
            points: triangles,
            strip: false,
            color: options.fillColor ? colorNumberToRec(options.fillColor) : [0, 0, 0, 0],
            pattern: {
              graphics: pathGraphics,
              width: options.fillPattern.width,
              height: options.fillPattern.height,
            },
          })
        } else if (options?.fillColor !== undefined) {
          graphics.push({
            type: 'triangles',
            points: triangles,
            strip: false,
            color: colorNumberToRec(options.fillColor),
          })
        }
      }
      return graphics
    }
  },
}

type Draw = (strokeWidthScale: number, setImageLoadStatus: React.Dispatch<React.SetStateAction<number>>, matrix?: number[]) => Graphic[]

const images = new Map<string, HTMLImageElement | undefined>()

const polylineTrianglesCache = new WeakmapMapCache<Position[], number, number[]>()
const combinedTrianglesCache = new WeakmapMapCache<Position[][], number, number[]>()
const bufferInfoCache = new WeakmapCache<number[], twgl.BufferInfo>()
const textCanvasCache = new WeakmapCache<object, HTMLCanvasElement>()
const polylineLinesCache = new WeakmapCache<Position[], number[]>()
const combinedLinesCache = new WeakmapCache<Position[][], number[]>()

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
    graphics: ((strokeWidthScale: number, setImageLoadStatus: React.Dispatch<React.SetStateAction<number>>) => Graphic[])[],
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
    const gl = ref.current.getContext("webgl", { antialias: true, stencil: true });
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
    const coloredTextureProgramInfo = twgl.createProgramInfo(gl, [`
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

    void main() {
      if (texcoord.x < 0.0 || texcoord.x > 1.0 ||
          texcoord.y < 0.0 || texcoord.y > 1.0) {
        discard;
      }
      gl_FragColor = texture2D(texture, texcoord);
    }`]);
    const colorMaskedTextureProgramInfo = twgl.createProgramInfo(gl, [`
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
      vec4 color2 = texture2D(texture, texcoord);
      vec4 color3 =  color2 * color;
      if (color3.a < 0.1) {
        discard;
      }
      gl_FragColor = color2;
    }`]);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    const textureBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
    const canvasTextureCache = new WeakmapCache<HTMLCanvasElement | HTMLImageElement, WebGLTexture>()

    let objectsToDraw: twgl.DrawObject[] = []
    const drawPattern = (
      pattern: { graphics: Graphic[] } & Size,
      matrix: number[],
      bounding: { xMin: number, xMax: number, yMin: number, yMax: number },
      drawObject: twgl.DrawObject,
    ) => {
      twgl.drawObjectList(gl, objectsToDraw)
      objectsToDraw = []

      gl.enable(gl.STENCIL_TEST);
      gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      twgl.drawObjectList(gl, [drawObject])

      gl.stencilFunc(gl.EQUAL, 1, 0xFF);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

      const { xMin, yMin, xMax, yMax } = bounding
      const columnStartIndex = Math.floor(xMin / pattern.width)
      const columnEndIndex = Math.floor(xMax / pattern.width)
      const rowStartIndex = Math.floor(yMin / pattern.height)
      const rowEndIndex = Math.floor(yMax / pattern.height)
      for (let i = columnStartIndex; i <= columnEndIndex; i++) {
        for (let j = rowStartIndex; j <= rowEndIndex; j++) {
          const baseMatrix = m3.multiply(matrix, m3.translation(i * pattern.width, j * pattern.height))
          for (const p of pattern.graphics) {
            drawGraphic(p, baseMatrix)
          }
        }
      }
      twgl.drawObjectList(gl, objectsToDraw)
      objectsToDraw = []

      gl.disable(gl.STENCIL_TEST);
      gl.clear(gl.STENCIL_BUFFER_BIT)
    }
    const drawGraphic = (line: Graphic, matrix: number[]) => {
      if (line.type === 'texture') {
        let textureMatrix = m3.multiply(matrix, m3.translation(line.x, line.y))
        const width = line.width ?? line.src.width
        const height = line.height ?? line.src.height
        textureMatrix = m3.multiply(textureMatrix, m3.scaling(width, height))

        const drawObject: twgl.DrawObject = {
          programInfo: line.pattern ? colorMaskedTextureProgramInfo : line.color ? coloredTextureProgramInfo : textureProgramInfo,
          bufferInfo: textureBufferInfo,
          uniforms: {
            matrix: textureMatrix,
            color: line.color,
            texture: canvasTextureCache.get(line.src, () => twgl.createTexture(gl, { src: line.src })),
          },
        }
        if (line.pattern) {
          drawPattern(line.pattern, matrix, { xMin: line.x, yMin: line.y, xMax: line.x + width, yMax: line.y + height }, drawObject)
        } else {
          objectsToDraw.push(drawObject)
        }
      } else if (line.type === 'lines' || line.type === 'triangles') {
        const drawObject: twgl.DrawObject = {
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
          type: getDrawType(line, gl),
        }
        if (line.pattern) {
          let xMin = Infinity
          let yMin = Infinity
          let xMax = -Infinity
          let yMax = -Infinity
          for (let i = 0; i < line.points.length; i += 2) {
            if (line.points[i] < xMin) {
              xMin = line.points[i]
            } else if (line.points[i] > xMax) {
              xMax = line.points[i]
            }
            if (line.points[i + 1] < yMin) {
              yMin = line.points[i + 1]
            } else if (line.points[i + 1] > yMax) {
              yMax = line.points[i + 1]
            }
          }
          drawPattern(line.pattern, matrix, { xMin, yMin, xMax, yMax }, drawObject)
        } else {
          objectsToDraw.push(drawObject)
        }
      }
    }

    render.current = (graphics, backgroundColor, x, y, scale, strokeWidthScale) => {
      const now = Date.now()
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.clearColor(...backgroundColor)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)

      let worldMatrix = m3.projection(gl.canvas.width, gl.canvas.height)
      worldMatrix = m3.multiply(worldMatrix, m3.translation(x, y))
      if (scale !== 1) {
        worldMatrix = m3.multiply(worldMatrix, m3.translation(gl.canvas.width / 2, gl.canvas.height / 2));
        worldMatrix = m3.multiply(worldMatrix, m3.scaling(scale, scale));
        worldMatrix = m3.multiply(worldMatrix, m3.translation(-gl.canvas.width / 2, -gl.canvas.height / 2));
      }

      for (const g of graphics) {
        const lines = g(strokeWidthScale, setImageLoadStatus)
        for (const line of lines) {
          const matrix = line.matrix ? m3.multiply(worldMatrix, line.matrix) : worldMatrix
          drawGraphic(line, matrix)
        }
      }
      twgl.drawObjectList(gl, objectsToDraw)
      objectsToDraw = []
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

function getDrawType(
  graphic: {
    type: 'triangles' | 'lines'
    strip: boolean
  },
  gl: WebGLRenderingContext,
) {
  return graphic.type === 'triangles'
    ? (graphic.strip ? gl.TRIANGLE_STRIP : gl.TRIANGLES)
    : (graphic.strip ? gl.LINE_STRIP : gl.LINES)
}

function colorNumberToRec(n: number, alpha = 1) {
  const color: [number, number, number, number] = [0, 0, 0, alpha]
  color[2] = n % 256 / 255
  n = Math.floor(n / 256)
  color[1] = n % 256 / 255
  color[0] = Math.floor(n / 256) / 255
  return color
}
