import * as twgl from 'twgl.js'
import earcut from 'earcut'
import type * as React from "react"
import { getImageFromCache } from './image-loader'
import { Filter, LinearGradient, PathLineStyleOptions, RadialGradient } from './react-render-target'
import { colorNumberToVec, getColorString, mergeOpacities, mergeOpacityToColor } from '../../utils/color'
import { m3, Matrix } from '../../utils/matrix'
import { isSameNumber, isZero } from '../../utils/math'
import { Position } from "../../utils/position"
import { Size } from "../../utils/region"
import { Bounding } from "../../utils/bounding"
import { getTwoPointsDistance } from "../../utils/position"
import { polygonToPolyline } from "../../utils/line"
import { getParallelLinesByDistance } from "../../utils/line"
import { dashedPolylineToLines } from "../../utils/line"
import { twoPointLineToGeneralFormLine } from "../../utils/line"
import { getPointSideOfLine } from "../../utils/line"
import { circleToArc } from "../../utils/circle"
import { arcToPolyline } from "../../utils/circle"
import { WeakmapCache, WeakmapMap3Cache, WeakmapMapCache } from '../../utils/weakmap-cache'
import { Vec2, Vec4 } from '../../utils/types'
import { angleToRadian } from '../../utils/radian'
import type { Align, VerticalAlign } from '../../utils/flow-layout'
import { Lazy } from '../../utils/lazy'
import { getPerpendicularPoint } from '../../utils/perpendicular'
import { LineCapWithClosed, LineJoinWithLimit, combineStripTriangleColors, combineStripTriangles, defaultLineCap, defaultLineJoin, defaultMiterLimit, getPolylineTriangles, triangleStripToTriangles } from '../../utils/triangles'

/**
 * @public
 */
export interface LineOrTriangleGraphic {
  type: 'triangles' | 'lines' | 'line strip' | 'triangle strip'
  points: number[]
  color?: Vec4
  colors?: number[]
  basePoints?: number[]
}

/**
 * @public
 */
export interface TextureGraphic {
  type: 'texture'
  color?: Vec4
  x: number
  y: number
  width?: number
  height?: number
  src: ImageData | ImageBitmap
  canvas?: HTMLCanvasElement
  filters?: FilterGraphic[]
}

/**
 * @public
 */
export type FilterGraphic =
  | {
    type: 'color matrix'
    value: number[]
  }
  | {
    type: 'blur'
    value: Vec2
  }

export type Graphic = (LineOrTriangleGraphic | TextureGraphic) & {
  matrix?: Matrix
  pattern?: PatternGraphic
  opacity?: number
}

export type PatternGraphic = {
  graphics: Graphic[]
} & Partial<Size>

export function createWebglRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { antialias: true, stencil: true, premultipliedAlpha: false });
  if (!gl) {
    return
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const basicProgramInfo = new Lazy(() => twgl.createProgramInfo(gl, [`
    attribute vec2 position;
    uniform mat3 matrix;
    uniform float flipY;
    void main() {
      gl_Position = vec4((matrix * vec3(position, 1)).xy * vec2(1, flipY), 0, 1);
    }
    `, `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }`]));
  const scaledProgramInfo = new Lazy(() => twgl.createProgramInfo(gl, [`
    attribute vec2 position;
    attribute vec2 base;
    uniform mat3 matrix;
    uniform float flipY;
    uniform float scale;
    void main() {
      vec2 p = (position - base) * scale + base;
      gl_Position = vec4((matrix * vec3(p, 1)).xy * vec2(1, flipY), 0, 1);
    }
    `, `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }`]));
  const coloredTextureProgramInfo = new Lazy(() => twgl.createProgramInfo(gl, [`
    attribute vec2 position;
    uniform mat3 matrix;
    varying vec2 texcoord;

    void main () {
      gl_Position = vec4((matrix * vec3(position, 1)).xy, 0, 1);
      texcoord = position;
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
    }`]));
  const textureProgramInfo = new Lazy(() => twgl.createProgramInfo(gl, [`
    attribute vec2 position;
    uniform mat3 matrix;
    uniform float flipY;
    varying vec2 texcoord;

    void main () {
      gl_Position = vec4((matrix * vec3(position, 1)).xy * vec2(1, flipY), 0, 1);
      texcoord = position;
    }
    `, `
    precision mediump float;

    varying vec2 texcoord;
    uniform sampler2D texture;
    uniform float opacity;

    void main() {
      if (texcoord.x < 0.0 || texcoord.x > 1.0 ||
          texcoord.y < 0.0 || texcoord.y > 1.0) {
        discard;
      }
      gl_FragColor = texture2D(texture, texcoord) * vec4(1, 1, 1, opacity);
    }`]));
  const colorMatrixTextureProgramInfo = new Lazy(() => twgl.createProgramInfo(gl, [`
    attribute vec2 position;
    uniform mat3 matrix;
    uniform float flipY;
    varying vec2 texcoord;

    void main () {
      gl_Position = vec4((matrix * vec3(position, 1)).xy * vec2(1, flipY), 0, 1);
      texcoord = position;
    }
    `, `
    precision mediump float;

    varying vec2 texcoord;
    uniform sampler2D texture;
    uniform float opacity;
    uniform float colorMatrix[20];

    void main() {
      if (texcoord.x < 0.0 || texcoord.x > 1.0 ||
          texcoord.y < 0.0 || texcoord.y > 1.0) {
        discard;
      }
      vec4 c = texture2D(texture, texcoord) * vec4(1, 1, 1, opacity);
			gl_FragColor.r = colorMatrix[0] * c.r + colorMatrix[1] * c.g + colorMatrix[2] * c.b + colorMatrix[3] * c.a + colorMatrix[4];
			gl_FragColor.g = colorMatrix[5] * c.r + colorMatrix[6] * c.g + colorMatrix[7] * c.b + colorMatrix[8] * c.a + colorMatrix[9];
			gl_FragColor.b = colorMatrix[10] * c.r + colorMatrix[11] * c.g + colorMatrix[12] * c.b + colorMatrix[13] * c.a + colorMatrix[14];
			gl_FragColor.a = colorMatrix[15] * c.r + colorMatrix[16] * c.g + colorMatrix[17] * c.b + colorMatrix[18] * c.a + colorMatrix[19];
    }`]));
  const blurTextureProgramInfo = new Lazy(() => twgl.createProgramInfo(gl, [`
    attribute vec2 position;
    uniform mat3 matrix;
    uniform float flipY;
    varying vec2 texcoord;

    void main () {
      gl_Position = vec4((matrix * vec3(position, 1)).xy * vec2(1, flipY), 0, 1);
      texcoord = position;
    }
    `, `
    precision mediump float;

    varying vec2 texcoord;
    uniform sampler2D texture;
    uniform float opacity;
    uniform vec2 px;

    void main() {
      if (texcoord.x < 0.0 || texcoord.x > 1.0 ||
          texcoord.y < 0.0 || texcoord.y > 1.0) {
        discard;
      }
			gl_FragColor = vec4(0.0);
			gl_FragColor += texture2D(texture, texcoord + vec2(-7.0*px.x, -7.0*px.y))*0.0044299121055113265;
			gl_FragColor += texture2D(texture, texcoord + vec2(-6.0*px.x, -6.0*px.y))*0.00895781211794;
			gl_FragColor += texture2D(texture, texcoord + vec2(-5.0*px.x, -5.0*px.y))*0.0215963866053;
			gl_FragColor += texture2D(texture, texcoord + vec2(-4.0*px.x, -4.0*px.y))*0.0443683338718;
			gl_FragColor += texture2D(texture, texcoord + vec2(-3.0*px.x, -3.0*px.y))*0.0776744219933;
			gl_FragColor += texture2D(texture, texcoord + vec2(-2.0*px.x, -2.0*px.y))*0.115876621105;
			gl_FragColor += texture2D(texture, texcoord + vec2(-1.0*px.x, -1.0*px.y))*0.147308056121;
			gl_FragColor += texture2D(texture, texcoord                             )*0.159576912161;
			gl_FragColor += texture2D(texture, texcoord + vec2( 1.0*px.x,  1.0*px.y))*0.147308056121;
			gl_FragColor += texture2D(texture, texcoord + vec2( 2.0*px.x,  2.0*px.y))*0.115876621105;
			gl_FragColor += texture2D(texture, texcoord + vec2( 3.0*px.x,  3.0*px.y))*0.0776744219933;
			gl_FragColor += texture2D(texture, texcoord + vec2( 4.0*px.x,  4.0*px.y))*0.0443683338718;
			gl_FragColor += texture2D(texture, texcoord + vec2( 5.0*px.x,  5.0*px.y))*0.0215963866053;
			gl_FragColor += texture2D(texture, texcoord + vec2( 6.0*px.x,  6.0*px.y))*0.00895781211794;
			gl_FragColor += texture2D(texture, texcoord + vec2( 7.0*px.x,  7.0*px.y))*0.0044299121055113265;
    }`]));
  const colorMaskedTextureProgramInfo = new Lazy(() => twgl.createProgramInfo(gl, [`
    attribute vec2 position;
    uniform mat3 matrix;
    varying vec2 texcoord;

    void main () {
      gl_Position = vec4((matrix * vec3(position, 1)).xy, 0, 1);
      texcoord = position;
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
    }`]));
  const gradientProgramInfo = new Lazy(() => twgl.createProgramInfo(gl, [`
    attribute vec2 position;
    attribute vec4 color;
    uniform mat3 matrix;
    uniform float flipY;
    varying vec4 v_color;

    void main () {
      gl_Position = vec4((matrix * vec3(position, 1)).xy * vec2(1, flipY), 0, 1);
      v_color = color;
    }
    `, `
    precision mediump float;

    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }`]));
  // gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  const textureBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
  const canvasTextureCache = new WeakmapCache<ImageData | ImageBitmap, WebGLTexture>()
  const bufferInfoCache = new WeakmapCache<number[], twgl.BufferInfo>()

  const getFilterProgramInfoAndUniforms = (filter: FilterGraphic) => {
    const filterUniforms: Record<string, unknown> = {}
    let programInfo: twgl.ProgramInfo
    if (filter.type === 'color matrix') {
      programInfo = colorMatrixTextureProgramInfo.instance
      filterUniforms.colorMatrix = filter.value
    } else {
      programInfo = blurTextureProgramInfo.instance
      filterUniforms.px = filter.value
    }
    return {
      programInfo,
      filterUniforms,
    }
  }
  const flushDraw = () => {
    twgl.drawObjectList(gl, objectsToDraw)
    objectsToDraw = []
  }

  let objectsToDraw: twgl.DrawObject[] = []
  const drawPattern = (
    pattern: PatternGraphic,
    matrix: Matrix,
    bounding: Bounding,
    drawObject: twgl.DrawObject,
    opacity?: number,
  ) => {
    flushDraw()

    let texture: WebGLTexture | WebGLRenderbuffer | undefined
    if (pattern.graphics.some(p => p.pattern)) {
      const framebufferInfo = twgl.createFramebufferInfo(gl, undefined, canvas.width, canvas.height)
      twgl.bindFramebufferInfo(gl, framebufferInfo)
      forEachPatternGraphicRepeatedGraphic(pattern, matrix, bounding, (g, m) => {
        drawGraphic(g, m, opacity)
      })
      flushDraw()
      texture = framebufferInfo.attachments[0]
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    }

    gl.clearStencil(0)
    gl.clear(gl.STENCIL_BUFFER_BIT)
    gl.colorMask(false, false, false, false)
    gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    twgl.drawObjectList(gl, [drawObject])

    gl.stencilFunc(gl.EQUAL, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    gl.colorMask(true, true, true, true)

    if (texture) {
      twgl.drawObjectList(gl, [{
        programInfo: textureProgramInfo.instance,
        bufferInfo: textureBufferInfo,
        uniforms: {
          matrix: m3.projection(1, 1),
          opacity: opacity ?? 1,
          texture,
          flipY: -1,
        },
      }])
    } else {
      forEachPatternGraphicRepeatedGraphic(pattern, matrix, bounding, (g, m) => {
        drawGraphic(g, m, opacity)
      })
      flushDraw()
    }

    gl.disable(gl.STENCIL_TEST);
  }
  const drawGraphic = (line: Graphic, matrix: Matrix, opacity?: number, scale?: number) => {
    const op = mergeOpacities(line.opacity, opacity)
    const color = mergeOpacityToColor(line.color, op)
    if (line.type === 'texture') {
      const { textureMatrix, width, height } = getTextureGraphicMatrix(matrix, line)

      let texture = canvasTextureCache.get(line.src, () => twgl.createTexture(gl, { src: line.src }))
      if (line.filters && line.filters.length > 1) {
        flushDraw()
        const framebufferInfos: twgl.FramebufferInfo[] = []
        for (let i = 0; i < line.filters.length - 1; i++) {
          let framebufferInfo: twgl.FramebufferInfo
          if (framebufferInfos.length < 2) {
            framebufferInfo = twgl.createFramebufferInfo(gl, undefined, line.src.width, line.src.height)
            framebufferInfos.push(framebufferInfo)
          } else {
            framebufferInfo = framebufferInfos[i % 2]
          }
          twgl.bindFramebufferInfo(gl, framebufferInfo)
          const { programInfo, filterUniforms } = getFilterProgramInfoAndUniforms(line.filters[i])
          twgl.drawObjectList(gl, [
            {
              programInfo,
              bufferInfo: textureBufferInfo,
              uniforms: {
                matrix: m3.projection(1, 1),
                opacity: line.opacity ?? 1,
                texture,
                ...filterUniforms,
                flipY: -1,
              },
            }
          ])
          texture = framebufferInfo.attachments[0]
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      }
      let filterUniforms: Record<string, unknown> = {}
      let programInfo: twgl.ProgramInfo
      if (line.filters && line.filters.length > 0) {
        const p = getFilterProgramInfoAndUniforms(line.filters[line.filters.length - 1])
        programInfo = p.programInfo
        filterUniforms = p.filterUniforms
      } else {
        if (line.pattern) {
          programInfo = colorMaskedTextureProgramInfo.instance
        } else if (line.color) {
          programInfo = coloredTextureProgramInfo.instance
        } else {
          programInfo = textureProgramInfo.instance
        }
      }

      const drawObject: twgl.DrawObject = {
        programInfo,
        bufferInfo: textureBufferInfo,
        uniforms: {
          matrix: textureMatrix,
          color,
          opacity: line.opacity ?? 1,
          texture,
          ...filterUniforms,
          flipY: 1,
        },
      }
      if (line.pattern) {
        drawPattern(line.pattern, matrix, { xMin: line.x, yMin: line.y, xMax: line.x + width, yMax: line.y + height }, drawObject, op)
      } else {
        objectsToDraw.push(drawObject)
      }
    } else {
      const drawObject: twgl.DrawObject = {
        programInfo: line.colors ? gradientProgramInfo.instance : line.basePoints && scale ? scaledProgramInfo.instance : basicProgramInfo.instance,
        bufferInfo: bufferInfoCache.get(line.points, () => {
          const arrays: twgl.Arrays = {
            position: {
              numComponents: 2,
              data: line.points
            }
          }
          if (line.colors) {
            arrays.color = {
              numComponents: 4,
              data: line.colors
            }
          }
          if (line.basePoints && scale) {
            arrays.base = {
              numComponents: 2,
              data: line.basePoints
            }
          }
          return twgl.createBufferInfoFromArrays(gl, arrays)
        }),
        uniforms: {
          color,
          matrix,
          flipY: 1,
          scale: scale ? 1 / scale : undefined,
        },
        type: line.type === 'triangles' ? gl.TRIANGLES
          : line.type === 'line strip' ? gl.LINE_STRIP
            : line.type === 'lines' ? gl.LINES
              : gl.TRIANGLE_STRIP,
      }
      if (line.pattern) {
        const bounding = getNumArrayPointsBounding(line.points)
        drawPattern(line.pattern, matrix, bounding, drawObject, op)
      } else {
        objectsToDraw.push(drawObject)
      }
    }
  }

  return (graphics: Graphic[], backgroundColor: Vec4, x: number, y: number, scale: number, rotate?: number) => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    twgl.resizeCanvasToDisplaySize(canvas);
    gl.clearColor(...backgroundColor)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)

    const worldMatrix = getWorldMatrix(gl.canvas, x, y, scale, rotate)

    for (const graphic of graphics) {
      const matrix = graphic.matrix ? m3.multiply(worldMatrix, graphic.matrix) : worldMatrix
      drawGraphic(graphic, matrix, undefined, scale)
    }
    flushDraw()
  }
}

export function getTextGraphic(
  x: number,
  y: number,
  text: string,
  fill: number | PatternGraphic | undefined,
  fontSize: number,
  fontFamily: string,
  options?: Partial<StrokeStyle & {
    fontWeight: React.CSSProperties['fontWeight']
    fontStyle: React.CSSProperties['fontStyle']
    textAlign: Align
    textBaseline: 'alphabetic' | VerticalAlign
    fillOpacity: number
    fillLinearGradient: LinearGradient
    fillRadialGradient: RadialGradient
    cacheKey: object
  }>,
): Graphic | undefined {
  const strokeWidth = options?.strokeWidth ?? 0
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
    ctx.canvas.height = fontSize + t.actualBoundingBoxDescent
    ctx.font = font
    if (fill !== undefined || options?.fillLinearGradient || options?.fillRadialGradient) {
      ctx.fillStyle = options?.strokeColor !== undefined && typeof fill === 'number' ? getColorString(fill, options.fillOpacity) : 'white';
      ctx.fillText(text, 0, fontSize);
    }
    if (options?.strokeColor !== undefined) {
      ctx.strokeStyle = fill !== undefined && typeof fill === 'number' ? getColorString(options.strokeColor, options.strokeOpacity) : 'white'
      if (options.strokeWidth !== undefined) {
        ctx.lineWidth = options.strokeWidth
      }
      setCanvasLineDash(ctx, options)
      ctx.strokeText(text, 0, fontSize);
    } else if (options?.strokePattern || options?.strokeLinearGradient || options?.strokeRadialGradient) {
      ctx.strokeStyle = 'white'
      if (options.strokeWidth !== undefined) {
        ctx.lineWidth = options.strokeWidth - 1
      }
      setCanvasLineDash(ctx, options)
      ctx.strokeText(text, 0, fontSize - strokeWidth)
    }
    return {
      textMetrics: t,
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
      canvas,
    }
  }
  const imageDataInfo = options?.cacheKey ? textCanvasCache.get(options.cacheKey, text, getTextImageData) : getTextImageData()
  if (!imageDataInfo) {
    return undefined
  }
  const { imageData, textMetrics, canvas } = imageDataInfo
  let y1 = y - imageData.height + strokeWidth + textMetrics.actualBoundingBoxDescent
  if (options?.textBaseline === 'top') {
    y1 += textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent / 2
  } else if (options?.textBaseline === 'middle') {
    y1 += (textMetrics.actualBoundingBoxAscent - textMetrics.actualBoundingBoxDescent) / 2
  } else if (options?.textBaseline === 'bottom') {
    y1 -= textMetrics.fontBoundingBoxDescent
  }
  let x1 = x
  if (options?.textAlign === 'right') {
    x1 -= imageData.width
  } else if (options?.textAlign === 'center') {
    x1 -= imageData.width / 2
  }
  let pattern: PatternGraphic | undefined
  if (options?.strokePattern) {
    pattern = options.strokePattern
  } else if (options?.strokeLinearGradient) {
    pattern = {
      graphics: [
        getLinearGradientGraphic(options.strokeLinearGradient, [
          { x: x1, y: y1 },
          { x: x1 + imageData.width, y: y1 },
          { x: x1, y },
          { x: x1 + imageData.width, y },
        ])
      ],
    }
  } else if (options?.strokeRadialGradient) {
    pattern = {
      graphics: [
        getRadialGradientGraphic(options.strokeRadialGradient, [
          { x: x1, y: y1 },
          { x: x1 + imageData.width, y: y1 },
          { x: x1, y },
          { x: x1 + imageData.width, y },
        ])
      ],
    }
  } else if (options?.fillLinearGradient) {
    pattern = {
      graphics: [
        getLinearGradientGraphic(options.fillLinearGradient, [
          { x: x1, y: y1 },
          { x: x1 + imageData.width, y: y1 },
          { x: x1, y },
          { x: x1 + imageData.width, y },
        ])
      ],
    }
  } else if (options?.fillRadialGradient) {
    pattern = {
      graphics: [
        getRadialGradientGraphic(options.fillRadialGradient, [
          { x: x1, y: y1 },
          { x: x1 + imageData.width, y: y1 },
          { x: x1, y },
          { x: x1 + imageData.width, y },
        ])
      ],
    }
  }
  if (pattern) {
    return {
      type: 'texture',
      x: x1,
      y: y1,
      src: imageData,
      canvas,
      color: defaultVec4Color,
      pattern,
    }
  }
  if (fill !== undefined && typeof fill !== 'number') {
    return {
      type: 'texture',
      x: x1,
      y: y1,
      src: imageData,
      canvas,
      color: defaultVec4Color,
      pattern: fill,
    }
  }
  if (fill === undefined) {
    if (options?.strokeColor === undefined) {
      return undefined
    }
    return {
      type: 'texture',
      x: x1,
      y: y1,
      color: colorNumberToVec(options.strokeColor, options.strokeOpacity),
      src: imageData,
      canvas,
    }
  }
  if (options?.strokeColor !== undefined) {
    return {
      type: 'texture',
      x: x1,
      y: y1,
      src: imageData,
      canvas,
    }
  }
  return {
    type: 'texture',
    x: x1,
    y: y1,
    color: colorNumberToVec(fill, options?.fillOpacity),
    src: imageData,
    canvas,
  }
}

export const defaultVec4Color: Vec4 = [0, 0, 0, 1]

export function getPathGraphics(
  points: Position[][],
  strokeWidthFixed: boolean,
  options?: Partial<StrokeStyle & PathLineStyleOptions & FillStyle & {
    closed: boolean
  }>,
): Graphic[] {
  const strokeWidth = options?.strokeWidth ?? 1
  const lineCapWithClosed = options?.closed ? true : (options?.lineCap ?? defaultLineCap)
  const lineJoin = options?.lineJoin ?? defaultLineJoin
  const lineJoinWithLimit = lineJoin === 'miter' ? options?.miterLimit ?? defaultMiterLimit : lineJoin
  const strokeColor = colorNumberToVec(options?.strokeColor ?? 0, options?.strokeOpacity)
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

    if (strokeWidthFixed && isSameNumber(strokeWidth, 1)) {
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
      })
    } else {
      const triangles = combinedTrianglesCache.get(points, strokeWidth, lineCapWithClosed, lineJoinWithLimit, () => {
        const results: { points: number[], base: number[] } = { points: [], base: [] }
        for (const p of points) {
          const triangles = polylineTrianglesCache.get(p, strokeWidth, lineCapWithClosed, lineJoinWithLimit, () => {
            const r = getPolylineTriangles(p, strokeWidth, lineCapWithClosed, lineJoinWithLimit)
            return {
              points: triangleStripToTriangles(r.points),
              base: triangleStripToTriangles(r.base)
            }
          })
          results.points.push(...triangles.points)
          results.base.push(...triangles.base)
        }
        return results
      })
      let pattern: PatternGraphic | undefined
      let color = strokeColor
      if (options?.strokePattern) {
        pattern = options.strokePattern
        color = [0, 0, 0, 0]
      } else if (options?.strokeLinearGradient) {
        pattern = {
          graphics: [
            getLinearGradientGraphic(options.strokeLinearGradient, numberArrayToPoints(triangles.points))
          ],
        }
        color = [0, 0, 0, 0]
      } else if (options?.strokeRadialGradient) {
        pattern = {
          graphics: [
            getRadialGradientGraphic(options.strokeRadialGradient, numberArrayToPoints(triangles.points))
          ],
        }
        color = [0, 0, 0, 0]
      }
      graphics.push({
        type: 'triangles',
        points: triangles.points,
        basePoints: strokeWidthFixed ? triangles.base : undefined,
        color,
        pattern,
      })
    }
  }
  if (
    options?.fillColor !== undefined ||
    options?.fillPattern !== undefined ||
    options?.fillLinearGradient !== undefined ||
    options?.fillRadialGradient !== undefined
  ) {
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
      triangles.unshift(
        vertices[index[i + 2] * 2], vertices[index[i + 2] * 2 + 1],
        vertices[index[i + 1] * 2], vertices[index[i + 1] * 2 + 1],
        vertices[index[i] * 2], vertices[index[i] * 2 + 1],
      )
    }
    let pattern: PatternGraphic | undefined
    let color: Vec4 | undefined
    if (options.fillPattern !== undefined) {
      color = options.fillColor ? colorNumberToVec(options.fillColor) : [0, 0, 0, 0]
      pattern = options.fillPattern
    } else if (options.fillColor !== undefined) {
      color = colorNumberToVec(options.fillColor, options.fillOpacity)
    } else if (options.fillLinearGradient !== undefined) {
      color = options.fillColor ? colorNumberToVec(options.fillColor) : [0, 0, 0, 0]
      pattern = {
        graphics: [
          getLinearGradientGraphic(options.fillLinearGradient, points[0])
        ],
      }
    } else if (options.fillRadialGradient !== undefined) {
      color = options.fillColor ? colorNumberToVec(options.fillColor, options.fillOpacity) : [0, 0, 0, 0]
      pattern = {
        graphics: [
          getRadialGradientGraphic(options.fillRadialGradient, points[0])
        ],
      }
    }
    if (color) {
      graphics.push({
        type: 'triangles',
        points: triangles,
        color,
        pattern,
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
    opacity: number
    crossOrigin: "anonymous" | "use-credentials" | ""
    filters: Filter[]
  }>,
): Graphic | undefined {
  const image = getImageFromCache(url, { rerender, crossOrigin: options?.crossOrigin })
  if (!image) {
    return
  }
  const filters: FilterGraphic[] = []
  if (options?.filters && options.filters.length > 0) {
    options.filters.forEach(f => {
      if (f.type === 'brightness') {
        filters.push({
          type: 'color matrix',
          value: [
            f.value, 0, 0, 0, 0,
            0, f.value, 0, 0, 0,
            0, 0, f.value, 0, 0,
            0, 0, 0, 1, 0
          ]
        })
      } else if (f.type === 'contrast') {
        const intercept = 0.5 * (1 - f.value)
        filters.push({
          type: 'color matrix',
          value: [
            f.value, 0, 0, 0, intercept,
            0, f.value, 0, 0, intercept,
            0, 0, f.value, 0, intercept,
            0, 0, 0, 1, 0
          ]
        })
      } else if (f.type === 'hue-rotate') {
        const rotation = angleToRadian(f.value)
        const cos = Math.cos(rotation)
        const sin = Math.sin(rotation)
        const lumR = 0.213
        const lumG = 0.715
        const lumB = 0.072
        filters.push({
          type: 'color matrix',
          value: [
            lumR + cos * (1 - lumR) + sin * (-lumR), lumG + cos * (-lumG) + sin * (-lumG), lumB + cos * (-lumB) + sin * (1 - lumB), 0, 0,
            lumR + cos * (-lumR) + sin * (0.143), lumG + cos * (1 - lumG) + sin * (0.140), lumB + cos * (-lumB) + sin * (-0.283), 0, 0,
            lumR + cos * (-lumR) + sin * (-(1 - lumR)), lumG + cos * (-lumG) + sin * (lumG), lumB + cos * (1 - lumB) + sin * (lumB), 0, 0,
            0, 0, 0, 1, 0
          ]
        })
      } else if (f.type === 'saturate') {
        const x = (f.value - 1) * 2 / 3 + 1
        const y = -0.5 * (x - 1)
        filters.push({
          type: 'color matrix',
          value: [
            x, y, y, 0, 0,
            y, x, y, 0, 0,
            y, y, x, 0, 0,
            0, 0, 0, 1, 0
          ]
        })
      } else if (f.type === 'grayscale') {
        const m = 1 - f.value
        filters.push({
          type: 'color matrix',
          value: [
            0.2126 + 0.7874 * m, 0.7152 - 0.7152 * m, 0.0722 - 0.0722 * m, 0, 0,
            0.2126 - 0.2126 * m, 0.7152 + 0.2848 * m, 0.0722 - 0.0722 * m, 0, 0,
            0.2126 - 0.2126 * m, 0.7152 - 0.7152 * m, 0.0722 + 0.9278 * m, 0, 0,
            0, 0, 0, 1, 0
          ]
        })
      } else if (f.type === 'sepia') {
        const m = 1 - f.value
        filters.push({
          type: 'color matrix',
          value: [
            0.393 + 0.607 * m, 0.769 - 0.769 * m, 0.189 - 0.189 * m, 0, 0,
            0.349 - 0.349 * m, 0.686 + 0.314 * m, 0.168 - 0.168 * m, 0, 0,
            0.272 - 0.272 * m, 0.534 - 0.534 * m, 0.131 + 0.869 * m, 0, 0,
            0, 0, 0, 1, 0
          ]
        })
      } else if (f.type === 'invert') {
        const a = 1 - f.value * 2
        filters.push({
          type: 'color matrix',
          value: [
            a, 0, 0, 0, f.value,
            0, a, 0, 0, f.value,
            0, 0, a, 0, f.value,
            0, 0, 0, 1, 0
          ]
        })
      } else if (f.type === 'opacity') {
        filters.push({
          type: 'color matrix',
          value: [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, f.value, 0,
          ]
        })
      } else if (f.type === 'blur') {
        filters.push(
          {
            type: 'blur',
            value: [0, f.value * 3 / 7 / height],
          },
          {
            type: 'blur',
            value: [f.value * 3 / 7 / width, 0],
          },
        )
      }
    })
  }
  return {
    type: 'texture',
    x,
    y,
    width,
    height,
    src: image,
    opacity: options?.opacity,
    filters: filters.length > 0 ? filters : undefined,
  }
}

/**
 * @public
 */
export interface StrokeStyle {
  strokeColor: number
  strokeWidth: number
  dashArray: number[]
  dashOffset: number
  strokeOpacity: number
  strokePattern: PatternGraphic
  strokeLinearGradient: LinearGradient
  strokeRadialGradient: RadialGradient
}

/**
 * @public
 */
export interface FillStyle {
  fillColor: number
  fillOpacity: number
  fillPattern: PatternGraphic
  fillLinearGradient: LinearGradient
  fillRadialGradient: RadialGradient
}

const textCanvasCache = new WeakmapMapCache<object, string, { imageData: ImageData, textMetrics: TextMetrics, canvas: HTMLCanvasElement } | undefined>()
const polylineTrianglesCache = new WeakmapMap3Cache<Position[], number, LineCapWithClosed, LineJoinWithLimit, { points: number[], base: number[] }>()
const combinedTrianglesCache = new WeakmapMap3Cache<Position[][], number, LineCapWithClosed, LineJoinWithLimit, { points: number[], base: number[] }>()
const polylineLinesCache = new WeakmapMapCache<Position[], LineCapWithClosed, number[]>()
const combinedLinesCache = new WeakmapMapCache<Position[][], LineCapWithClosed, number[]>()

export function setCanvasLineDash(ctx: CanvasRenderingContext2D, options?: Partial<{ dashArray: number[], dashOffset: number }>) {
  if (options?.dashArray) {
    ctx.setLineDash(options.dashArray)
    if (options.dashOffset) {
      ctx.lineDashOffset = options.dashOffset
    }
  }
}

function getLinearGradientGraphic(linearGradient: LinearGradient, points: Position[]): Graphic {
  const { start, end } = linearGradient
  const offset = {
    x: end.x - start.x,
    y: end.y - start.y,
  }
  const line = twoPointLineToGeneralFormLine(start, end)
  if (!line) {
    return {
      type: 'triangle strip',
      points: [],
      colors: [],
    }
  }
  const stops = linearGradient.stops.slice(0).sort((a, b) => a.offset - b.offset)
  const distances: number[] = []
  let minOffset = stops[0].offset
  let maxOffset = stops[stops.length - 1].offset
  points.forEach(p => {
    const foot = getPerpendicularPoint(p, line)
    const side = getPointSideOfLine(p, line)
    if (isZero(side)) {
      distances.push(0)
    } else {
      const distance = getTwoPointsDistance(foot, p)
      if (side > 0) {
        distances.push(distance)
      } else if (side < 0) {
        distances.push(-distance)
      }
    }
    const pOffset = isSameNumber(foot.x, start.x) ? (foot.y - start.y) / offset.y : (foot.x - start.x) / offset.x
    if (pOffset < minOffset) {
      minOffset = pOffset
    } else if (pOffset > maxOffset) {
      maxOffset = pOffset
    }
  })
  if (!isSameNumber(minOffset, stops[0].offset)) {
    stops.unshift({
      offset: minOffset,
      color: stops[0].color,
    })
  }
  if (!isSameNumber(maxOffset, stops[stops.length - 1].offset)) {
    stops.push({
      offset: maxOffset,
      color: stops[stops.length - 1].color,
    })
  }
  const line1 = getParallelLinesByDistance(line, Math.max(...distances))[1]
  const line2 = getParallelLinesByDistance(line, Math.min(...distances))[1]
  const fillTriangles: number[] = []
  const fillColors: number[] = []
  stops.forEach(s => {
    const p = { x: start.x + offset.x * s.offset, y: start.y + offset.y * s.offset }
    const p1 = getPerpendicularPoint(p, line1)
    const p2 = getPerpendicularPoint(p, line2)
    const color = colorNumberToVec(s.color, s.opacity)
    fillTriangles.push(p1.x, p1.y, p2.x, p2.y)
    fillColors.push(...color, ...color)
  })
  return {
    type: 'triangle strip',
    points: fillTriangles,
    colors: fillColors,
  }
}

function getRadialGradientGraphic(radialGradient: RadialGradient, points: Position[]): Graphic {
  let { start, end, stops } = radialGradient
  if (start.r > end.r) {
    const tmp = start
    start = end
    end = tmp
    stops = stops.map(s => ({ offset: 1 - s.offset, color: s.color }))
  }
  const offset = { x: end.x - start.x, y: end.y - start.y, r: end.r - start.r }
  const stopPoints = stops.slice(0).sort((a, b) => a.offset - b.offset).map(s => {
    const circle = { x: start.x + offset.x * s.offset, y: start.y + offset.y * s.offset, r: start.r + offset.r * s.offset }
    return {
      color: colorNumberToVec(s.color, s.opacity),
      points: arcToPolyline(circleToArc(circle), 5),
    }
  })
  const maxDistance = Math.max(...points.map(p => getTwoPointsDistance(p, end)))
  if (maxDistance > end.r) {
    stopPoints.push({
      color: stopPoints[stopPoints.length - 1].color,
      points: arcToPolyline(circleToArc({ x: end.x, y: end.y, r: maxDistance }), 5),
    })
  }
  const fillTriangles: number[][] = []
  const fillColors: number[][] = []
  if (start.r > 0) {
    const stop = stopPoints[0]
    const triangles: number[] = []
    const colors: number[] = []
    stop.points.forEach(p => {
      triangles.push(p.x, p.y, start.x, start.y)
      colors.push(...stop.color, ...stop.color)
    })
    fillTriangles.push(triangles)
    fillColors.push(colors)
  }
  for (let i = 1; i < stopPoints.length; i++) {
    const stop1 = stopPoints[i - 1]
    const stop2 = stopPoints[i]
    const triangles: number[] = []
    const colors: number[] = []
    stop1.points.forEach((p1, j) => {
      const p2 = stop2.points[j]
      triangles.unshift(p1.x, p1.y, p2.x, p2.y)
      colors.unshift(...stop1.color, ...stop2.color)
    })
    fillTriangles.push(triangles)
    fillColors.push(colors)
  }
  return {
    type: 'triangle strip',
    points: combineStripTriangles(fillTriangles),
    colors: combineStripTriangleColors(fillColors),
  }
}

function numberArrayToPoints(num: number[]) {
  const result: Position[] = []
  for (let i = 0; i < num.length; i += 2) {
    result.push({ x: num[i], y: num[i + 1] })
  }
  return result
}

export function getNumArrayPointsBounding(points: number[]) {
  let xMin = Infinity
  let yMin = Infinity
  let xMax = -Infinity
  let yMax = -Infinity
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i]
    const y = points[i + 1]
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
  return {
    xMax,
    xMin,
    yMin,
    yMax,
  }
}

export function forEachPatternGraphicRepeatedGraphic(pattern: PatternGraphic, matrix: Matrix, bounding: Bounding, callback: (graphic: Graphic, matrix: Matrix) => void) {
  const { xMin, yMin, xMax, yMax } = bounding
  const patternWidth = pattern.width ?? Number.MAX_SAFE_INTEGER
  const patternHeight = pattern.height ?? Number.MAX_SAFE_INTEGER
  const columnStartIndex = Math.floor(xMin / patternWidth)
  const columnEndIndex = Math.floor(xMax / patternWidth)
  const rowStartIndex = Math.floor(yMin / patternHeight)
  const rowEndIndex = Math.floor(yMax / patternHeight)
  for (let i = columnStartIndex; i <= columnEndIndex; i++) {
    for (let j = rowStartIndex; j <= rowEndIndex; j++) {
      const baseMatrix = m3.multiply(matrix, m3.translation(i * patternWidth, j * patternHeight))
      for (const p of pattern.graphics) {
        callback(p, p.matrix ? m3.multiply(baseMatrix, p.matrix) : baseMatrix)
      }
    }
  }
}

export function getTextureGraphicMatrix(matrix: Matrix, graphic: TextureGraphic) {
  const textureMatrix = m3.multiply(matrix, m3.translation(graphic.x, graphic.y))
  const width = graphic.width ?? graphic.src.width
  const height = graphic.height ?? graphic.src.height
  return {
    textureMatrix: m3.multiply(textureMatrix, m3.scaling(width, height)),
    width,
    height,
  }
}

export function getWorldMatrix(size: Size, x: number, y: number, scale: number, rotate?: number) {
  let worldMatrix = m3.projection(size.width, size.height)
  worldMatrix = m3.multiply(worldMatrix, m3.translation(x, y))
  if (scale !== 1) {
    worldMatrix = m3.multiply(worldMatrix, m3.translation(size.width / 2, size.height / 2));
    worldMatrix = m3.multiply(worldMatrix, m3.scaling(scale, scale));
    worldMatrix = m3.multiply(worldMatrix, m3.translation(-size.width / 2, -size.height / 2));
  }
  if (rotate) {
    worldMatrix = m3.multiply(worldMatrix, m3.rotation(-rotate));
  }
  return worldMatrix
}
