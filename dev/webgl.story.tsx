import * as React from "react"
import * as twgl from 'twgl.js'
import { bindMultipleRefs, combineStripTriangles, getPolylineTriangles, m3, metaKeyIfMacElseCtrlKey, scaleByCursorPosition, useDragMove, useKey, useWheelScroll, useWheelZoom, useWindowSize, useZoom } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const render = React.useRef<(g: typeof graphics, x: number, y: number, scale: number) => void>()
  const { x, y, ref: wheelScrollRef, setX, setY } = useWheelScroll<HTMLDivElement>()
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    onChange(oldScale, newScale, cursor) {
      const result = scaleByCursorPosition({ width, height }, newScale / oldScale, cursor)
      setX(result.setX)
      setY(result.setY)
    }
  })
  const { zoomIn, zoomOut } = useZoom(scale, setScale)
  useKey((k) => k.code === 'Minus' && metaKeyIfMacElseCtrlKey(k), zoomOut)
  useKey((k) => k.code === 'Equal' && metaKeyIfMacElseCtrlKey(k), zoomIn)
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask } = useDragMove(() => {
    setX((v) => v + offset.x)
    setY((v) => v + offset.y)
  })
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const generateGraphics = () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.font = "50px monospace";
      const t = ctx.measureText('abc');
      ctx.canvas.width = Math.ceil(t.width) + 2;
      ctx.canvas.height = 50;
      ctx.font = "50px monospace";
      ctx.fillStyle = 'white';
      ctx.fillText('abc', 0, ctx.canvas.height);
    }
    const lineWidth = 10
    const miterLimit = 2
    const closed = false
    return {
      backgroundColor: [Math.random(), Math.random(), Math.random(), 1] as [number, number, number, number],
      lines: [
        {
          points: combineStripTriangles([
            getPolylineTriangles([
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
            ], lineWidth, closed, miterLimit),
            getPolylineTriangles([
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
            ], lineWidth, closed, miterLimit),
          ]),
          color: [Math.random(), Math.random(), Math.random(), 1],
        },
        {
          points: combineStripTriangles([
            getPolylineTriangles([
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
            ], lineWidth, closed, miterLimit),
            getPolylineTriangles([
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
            ], lineWidth, closed, miterLimit),
          ]),
          color: [Math.random(), Math.random(), Math.random(), 1],
        },
      ],
      line: [
        Math.random() * 600,
        Math.random() * 400,
        Math.random() * 600,
        Math.random() * 400,
        Math.random() * 600,
        Math.random() * 400,
      ],
      canvas,
      color: [Math.random(), Math.random(), Math.random(), 1],
      position: { x: Math.random() * 600, y: Math.random() * 400 },
    }
  }
  const [graphics, setGraphics] = React.useState(generateGraphics())

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
    const programInfo2 = twgl.createProgramInfo(gl, [`
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
    const textBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
    const programInfo3 = twgl.createProgramInfo(gl, [`
    attribute vec4 position;
    varying vec2 texcoord;
    void main() {
      gl_Position = position;
      texcoord = position.xy * .5 + .5;
    }
    `, `
    precision mediump float;
    varying vec2 texcoord;
    uniform sampler2D texture;
    void main() {
      gl_FragColor = texture2D(texture, texcoord);  
    }
    `]);
    const imageBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
    const imageTexture = twgl.createTexture(gl, {
      src: "https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg",
      crossOrigin: "",
    });

    render.current = (gs, x, y, scale) => {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(programInfo.program);
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.clearColor(...gs.backgroundColor)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)

      let matrix = m3.projection(gl.canvas.width, gl.canvas.height)
      matrix = m3.multiply(matrix, m3.translation(x, y))
      if (scale !== 1) {
        matrix = m3.multiply(matrix, m3.translation(gl.canvas.width / 2, gl.canvas.height / 2));
        matrix = m3.multiply(matrix, m3.scaling(scale, scale));
        matrix = m3.multiply(matrix, m3.translation(-gl.canvas.width / 2, -gl.canvas.height / 2));
      }

      const objectsToDraw: twgl.DrawObject[] = []
      for (const line of gs.lines) {
        objectsToDraw.push({
          programInfo,
          bufferInfo: twgl.createBufferInfoFromArrays(gl, {
            position: {
              numComponents: 2,
              data: line.points
            },
          }),
          uniforms: {
            color: line.color,
            matrix,
          },
          type: gl.TRIANGLE_STRIP,
        })
      }
      const objectsToDraw2 = [{
        programInfo,
        bufferInfo: twgl.createBufferInfoFromArrays(gl, {
          position: {
            numComponents: 2,
            data: gs.line
          },
        }),
        uniforms: {
          color: gs.color,
          matrix,
        },
        type: gl.LINE_STRIP,
      }]

      matrix = m3.multiply(matrix, m3.translation(gs.position.x, gs.position.y))
      matrix = m3.multiply(matrix, m3.scaling(gs.canvas.width, gs.canvas.height))
      twgl.drawObjectList(gl, objectsToDraw)

      gl.enable(gl.STENCIL_TEST);
      gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      twgl.drawObjectList(gl, [
        {
          programInfo: programInfo2,
          bufferInfo: textBufferInfo,
          uniforms: {
            matrix,
            color: gs.color,
            texture: twgl.createTexture(gl, { src: gs.canvas }),
          },
        },
        {
          programInfo: programInfo2,
          bufferInfo: textBufferInfo,
          uniforms: {
            matrix: m3.multiply(matrix, m3.translation(1, 0)),
            color: gs.color,
            texture: twgl.createTexture(gl, { src: gs.canvas }),
          },
        },
        {
          programInfo: programInfo2,
          bufferInfo: textBufferInfo,
          uniforms: {
            matrix: m3.multiply(matrix, m3.translation(1, 1)),
            color: gs.color,
            texture: twgl.createTexture(gl, { src: gs.canvas }),
          },
        }
      ])

      gl.stencilFunc(gl.EQUAL, 1, 0xFF);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      twgl.drawObjectList(gl, [{
        programInfo: programInfo3,
        bufferInfo: imageBufferInfo,
        uniforms: {
          texture: imageTexture
        },
      }])
      gl.disable(gl.STENCIL_TEST);

      twgl.drawObjectList(gl, objectsToDraw2)
    }
  }, [ref.current])

  React.useEffect(() => {
    if (render.current) {
      render.current(graphics, x + offset.x, y + offset.y, scale)
    }
  }, [graphics, render.current, x, y, offset, scale])

  return (
    <div
      ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}
      style={{
        position: 'absolute',
        inset: '0px',
      }}
    >
      <canvas
        ref={ref}
        width={width}
        height={height}
        onMouseDown={e => onStartMoveCanvas({ x: e.clientX, y: e.clientY })}
      />
      <button style={{ position: 'fixed' }} onClick={() => setGraphics(generateGraphics())}>update</button>
      {moveCanvasMask}
    </div>
  )
}
