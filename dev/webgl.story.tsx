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

    render.current = (gs, x, y, scale) => {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(programInfo.program);
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.clearColor(...gs.backgroundColor)
      gl.clear(gl.COLOR_BUFFER_BIT)

      let matrix = m3.translation(x, y)
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
          resolution: [gl.canvas.width, gl.canvas.height],
          color: line.color,
          matrix,
        };
        const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLE_STRIP);
      }
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
