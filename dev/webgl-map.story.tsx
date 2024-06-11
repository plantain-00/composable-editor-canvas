import * as React from "react"
import { createWebgl3DRenderer, Graphic3d, useWindowSize, angleToRadian, getNurbsSurfaceVertices, Vec3 } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<ReturnType<typeof createWebgl3DRenderer>>()
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const [point, setPoint] = React.useState<Vec3>()
  const eye: Vec3 = [0, 0, 120]
  const graphics = React.useRef<Graphic3d[]>([
    {
      geometry: {
        type: 'vertices',
        ...getNurbsSurfaceVertices([
          [[-50, 50, -20], [-30, 50, 0], [-10, 50, 0], [10, 50, 0], [30, 50, 0], [50, 50, 0]],
          [[-50, 30, 0], [-30, 30, 10], [-10, 30, 20], [10, 30, 0], [30, 30, 0], [50, 30, 0]],
          [[-50, 10, 0], [-30, 10, 10], [-10, 10, 20], [10, 10, 0], [30, 10, -4], [50, 10, -24]],
          [[-50, -10, 0], [-30, -10, 0], [-10, -10, -46], [10, -10, 0], [30, -10, 0], [50, -10, 0]],
          [[-50, -30, 0], [-30, -30, 0], [-10, -30, 0], [10, -30, 8], [30, -30, -40], [50, -30, 0]],
          [[-50, -50, 24], [-30, -50, 0], [-10, -50, 40], [10, -50, 0], [30, -50, -20], [50, -50, -30]],
        ], 3, [0, 0, 0, 0, 0.333, 0.666, 1, 1, 1, 1], 3, [0, 0, 0, 0, 0.333, 0.666, 1, 1, 1, 1]),
      },
      color: [0, 1, 0, 1],
    },
  ])

  React.useEffect(() => {
    if (!ref.current) {
      return
    }
    renderer.current = createWebgl3DRenderer(ref.current)
  }, [ref.current])

  React.useEffect(() => {
    const pointGraphics: Graphic3d[] = []
    if (point) {
      pointGraphics.push({
        geometry: {
          type: 'sphere',
          radius: 1,
        },
        color: [1, 0, 0, 1],
        position: point,
      })
    }
    renderer.current?.render?.(
      [...graphics.current, ...pointGraphics],
      {
        eye,
        up: [0, 1, 0],
        target: [0, 0, 0],
        fov: angleToRadian(60),
        near: 0.1,
        far: 1000,
      },
      {
        position: [1000, 1000, 1000],
        color: [1, 1, 1, 1],
        specular: [1, 1, 1, 1],
        shininess: 50,
        specularFactor: 1,
      },
      [1, 1, 1, 1],
    )
  }, [point])

  return (
    <div
      style={{
        position: 'absolute',
        inset: '0px',
      }}
    >
      <canvas
        ref={ref}
        width={width}
        height={height}
        onMouseMove={e => {
          setPoint(renderer.current?.pickPoint?.(e.clientX, e.clientY, eye, -100))
        }}
      />
    </div>
  )
}
