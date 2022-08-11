import * as twgl from 'twgl.js'
import { combineStripTriangles, dashedPolylineToLines, defaultMiterLimit, getPolylineTriangles, m3, Matrix, polygonToPolyline, Position, Size, WeakmapCache, WeakmapMap3Cache, WeakmapMapCache } from "../../utils"
import earcut from 'earcut'
import { getImageFromCache } from './image-loader'
import { PathLineStyleOptions, PathStrokeOptions } from './react-render-target'
import { getColorString } from './react-svg-render-target'

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
  src: ImageData | ImageBitmap
}

export type Graphic = (LineOrTriangleGraphic | TextureGraphic) & {
  matrix?: Matrix
  pattern?: PatternGraphic
}

export type PatternGraphic = {
  graphics: Graphic[]
} & Size

export function createWebglRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { antialias: true, stencil: true });
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
  const canvasTextureCache = new WeakmapCache<ImageData | ImageBitmap, WebGLTexture>()

  let objectsToDraw: twgl.DrawObject[] = []
  const drawPattern = (
    pattern: { graphics: Graphic[] } & Size,
    matrix: Matrix,
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
          drawGraphic(p, p.matrix ? m3.multiply(baseMatrix, p.matrix) : baseMatrix)
        }
      }
    }
    twgl.drawObjectList(gl, objectsToDraw)
    objectsToDraw = []

    gl.disable(gl.STENCIL_TEST);
    gl.clear(gl.STENCIL_BUFFER_BIT)
  }
  const drawGraphic = (line: Graphic, matrix: Matrix) => {
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
          const x = line.points[i]
          const y = line.points[i + 1]
          if (x < xMin) {
            xMin = x
          }
          if (x > xMax) {
            xMax = x
          }
          if (y < yMin) {
            yMin = y
          }
          if (y > yMax) {
            yMax = y
          }
        }
        drawPattern(line.pattern, matrix, { xMin, yMin, xMax, yMax }, drawObject)
      } else {
        objectsToDraw.push(drawObject)
      }
    }
  }

  return (graphics: Graphic[], backgroundColor: [number, number, number, number], x: number, y: number, scale: number) => {
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

    for (const graphic of graphics) {
      const matrix = graphic.matrix ? m3.multiply(worldMatrix, graphic.matrix) : worldMatrix
      drawGraphic(graphic, matrix)
    }
    twgl.drawObjectList(gl, objectsToDraw)
    objectsToDraw = []
  }
}

export function getTextGraphic(
  x: number,
  y: number,
  text: string,
  fill: number | PatternGraphic | undefined,
  fontSize: number,
  fontFamily: string,
  options?: Partial<PathStrokeOptions & {
    fontWeight: React.CSSProperties['fontWeight']
    fontStyle: React.CSSProperties['fontStyle']
    cacheKey: object
  }>,
): Graphic | undefined {
  const getTextImageData = () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return
    }
    const font = `${options?.fontWeight ?? 'normal'} ${options?.fontStyle ?? 'normal'} ${fontSize}px ${fontFamily}`
    ctx.font = font
    const t = ctx.measureText(text);
    ctx.canvas.width = Math.ceil(t.width) + 2;
    ctx.canvas.height = fontSize
    ctx.font = font
    if (fill !== undefined) {
      ctx.fillStyle = options?.strokeColor !== undefined && typeof fill === 'number' ? getColorString(fill) : 'white';
      ctx.fillText(text, 0, ctx.canvas.height);
    }
    if (options?.strokeColor !== undefined) {
      ctx.strokeStyle = fill !== undefined && typeof fill === 'number' ? getColorString(options.strokeColor) : 'white'
      if (options.strokeWidth !== undefined) {
        ctx.lineWidth = options.strokeWidth
      }
      setCanvasLineDash(ctx, options)
      ctx.strokeText(text, 0, ctx.canvas.height);
    }
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }
  const imageData = options?.cacheKey ? textCanvasCache.get(options.cacheKey, getTextImageData) : getTextImageData()
  if (!imageData) {
    return undefined
  }
  if (fill !== undefined && typeof fill !== 'number') {
    return {
      type: 'texture',
      x,
      y: y - imageData.height,
      src: imageData,
      color: [0, 0, 0, 1],
      pattern: fill,
    }
  }
  if (fill === undefined) {
    if (options?.strokeColor === undefined) {
      return undefined
    }
    return {
      type: 'texture',
      x,
      y: y - imageData.height,
      color: colorNumberToRec(options.strokeColor),
      src: imageData,
    }
  }
  if (options?.strokeColor !== undefined) {
    return {
      type: 'texture',
      x,
      y: y - imageData.height,
      src: imageData,
    }
  }
  return {
    type: 'texture',
    x,
    y: y - imageData.height,
    color: colorNumberToRec(fill),
    src: imageData,
  }
}

export function getPathGraphics(
  points: Position[][],
  strokeWidthScale: number,
  options?: Partial<PathStrokeOptions & PathLineStyleOptions & {
    fillColor: number
    fillPattern: PatternGraphic
    closed: boolean
  }>,
): Graphic[] {
  let strokeWidth = options?.strokeWidth ?? 1
  const lineCapWithClosed = options?.closed ? true : (options?.lineCap ?? 'butt')
  const lineJoin = options?.lineJoin ?? 'miter'
  const lineJoinWithLimit = lineJoin === 'miter' ? options?.miterLimit ?? defaultMiterLimit : lineJoin
  const strokeColor = colorNumberToRec(options?.strokeColor ?? 0)
  const graphics: Graphic[] = []
  if (strokeWidth) {
    if (options?.dashArray) {
      const dashArray = options.dashArray
      points = points.map(p => {
        if (lineCapWithClosed === true) {
          p = polygonToPolyline(p)
        }
        return dashedPolylineToLines(p, dashArray, undefined, options.dashOffset)
      }).flat()
    }

    if (strokeWidth === 1) {
      graphics.push({
        type: 'lines',
        points: combinedLinesCache.get(points, lineCapWithClosed, () => {
          return points.map(p => {
            return polylineLinesCache.get(p, lineCapWithClosed, () => {
              if (lineCapWithClosed === true) {
                p = polygonToPolyline(p)
              }
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
        points: combinedTrianglesCache.get(points, strokeWidth, lineCapWithClosed, lineJoinWithLimit, () => {
          return combineStripTriangles(points.map(p => {
            return polylineTrianglesCache.get(p, strokeWidth, lineCapWithClosed, lineJoinWithLimit, () => getPolylineTriangles(p, strokeWidth, lineCapWithClosed, lineJoinWithLimit))
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
      graphics.push({
        type: 'triangles',
        points: triangles,
        strip: false,
        color: options.fillColor ? colorNumberToRec(options.fillColor) : [0, 0, 0, 0],
        pattern: options.fillPattern,
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

export function getImageGraphic(
  url: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rerender: () => void,
  options?: Partial<{
    crossOrigin: "anonymous" | "use-credentials" | ""
  }>,
): Graphic | undefined {
  const image = getImageFromCache(url, rerender, options?.crossOrigin)
  if (!image) {
    return
  }
  return {
    type: 'texture',
    x,
    y,
    width,
    height,
    src: image,
  }
}

export function getGroupGraphics(
  children: Graphic[],
  matrix?: Matrix,
  options?: Partial<{
    translate: Position
    base: Position
    angle: number
    rotation: number
    matrix: Matrix
  }>,
) {
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
    if (options.matrix) {
      matrix = m3.multiply(matrix, options.matrix)
    }
  }
  return children.map(h => ({
    ...h,
    matrix: h.matrix ? (matrix ? m3.multiply(matrix, h.matrix) : h.matrix) : matrix,
  }))
}

const bufferInfoCache = new WeakmapCache<number[], twgl.BufferInfo>()
const textCanvasCache = new WeakmapCache<object, ImageData | undefined>()
const polylineTrianglesCache = new WeakmapMap3Cache<Position[], number, true | 'butt' | 'round' | 'square', 'round' | 'bevel' | number, number[]>()
const combinedTrianglesCache = new WeakmapMap3Cache<Position[][], number, true | 'butt' | 'round' | 'square', 'round' | 'bevel' | number, number[]>()
const polylineLinesCache = new WeakmapMapCache<Position[], true | 'butt' | 'round' | 'square', number[]>()
const combinedLinesCache = new WeakmapMapCache<Position[][], true | 'butt' | 'round' | 'square', number[]>()


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

export function setCanvasLineDash(ctx: CanvasRenderingContext2D, options?: Partial<PathStrokeOptions>) {
  if (options?.dashArray) {
    ctx.setLineDash(options.dashArray)
    if (options.dashOffset) {
      ctx.lineDashOffset = options.dashOffset
    }
  }
}

export function colorNumberToRec(n: number, alpha = 1) {
  const color: [number, number, number, number] = [0, 0, 0, alpha]
  color[2] = n % 256 / 255
  n = Math.floor(n / 256)
  color[1] = n % 256 / 255
  color[0] = Math.floor(n / 256) / 255
  return color
}
