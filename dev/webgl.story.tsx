import * as React from "react"
import * as twgl from 'twgl.js'
import { bindMultipleRefs, combineStripTriangles, getPolylineTriangles, m3, metaKeyIfMacElseCtrlKey, scaleByCursorPosition, useDragMove, useKey, useWheelScroll, useWheelZoom, useWindowSize, useZoom } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const ref2 = React.useRef<HTMLCanvasElement | null>(null)
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
    if (ref2.current) {
      const ctx = ref2.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.font = "50px monospace";
        const t = ctx.measureText('abc');
        ctx.canvas.width = Math.ceil(t.width) + 2;
        ctx.canvas.height = 50;
        ctx.font = "50px monospace";
        ctx.fillStyle = 'white';
        ctx.fillText('abc', 0, ctx.canvas.height);
      }
    }
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
            ], 10),
            getPolylineTriangles([
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
            ], 10),
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
            ], 10),
            getPolylineTriangles([
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
              { x: Math.random() * 600, y: Math.random() * 400 },
            ], 10),
          ]),
          color: [Math.random(), Math.random(), Math.random(), 1],
        },
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
    const programInfo2 = twgl.createProgramInfo(gl, [`
    attribute vec4 position;
    attribute vec2 texcoord;
    uniform mat3 matrix;
    varying vec2 v_texcoord;
    
    void main() {
      v_texcoord = texcoord;
      gl_Position = vec4((matrix * vec3(position.xy, 1)).xy, 0, 1);
    }
    `, `
    precision mediump float;

    varying vec2 v_texcoord;
    uniform sampler2D texture;
    uniform vec4 color;

    void main() {
      vec4 color = texture2D(texture, v_texcoord) * color;
      if (color.a < 0.1) {
        discard;
      }
      gl_FragColor = color;
    }`]);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    const textBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, twgl.m4.rotationX(Math.PI * 0.5));

    render.current = (gs, x, y, scale) => {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(programInfo.program);
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.clearColor(...gs.backgroundColor)
      gl.clear(gl.COLOR_BUFFER_BIT)

      let matrix = m3.projection(gl.canvas.width, gl.canvas.height)
      matrix = m3.multiply(matrix, m3.translation(x, y))
      if (scale !== 1) {
        matrix = m3.multiply(matrix, m3.translation(gl.canvas.width / 2, gl.canvas.height / 2));
        matrix = m3.multiply(matrix, m3.scaling(scale, scale));
        matrix = m3.multiply(matrix, m3.translation(-gl.canvas.width / 2, -gl.canvas.height / 2));
      }

      for (const line of gs.lines) {
        const arrays = {
          position: {
            numComponents: 2,
            data: line.points
          },
        };
        const uniforms = {
          color: line.color,
          matrix,
        };
        const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLE_STRIP);
      }

      const scaleX = gs.canvas.width / gl.canvas.width * scale
      const scaleY = gs.canvas.height / gl.canvas.height * scale
      let textMatrix = m3.translation(
        (x + gs.position.x * scale) / gl.canvas.width * 2 - scale + scaleX,
        -(y + gs.position.y * scale) / gl.canvas.height * 2 + scale - scaleY,
      )
      textMatrix = m3.multiply(textMatrix, m3.scaling(scaleX * 2, scaleY * 2))
      const uniforms = {
        texture: twgl.createTexture(gl, { src: gs.canvas }),
        color: gs.color,
        matrix: textMatrix,
      };
      twgl.drawObjectList(gl, [{
        programInfo: programInfo2,
        bufferInfo: textBufferInfo,
        uniforms: uniforms,
      }]);
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
      <canvas
        ref={ref2}
        style={{ position: 'absolute', left: 0 }}
      />
      <button style={{ position: 'fixed' }} onClick={() => setGraphics(generateGraphics())}>update</button>
      {moveCanvasMask}
    </div>
  )
}
