import React from "react"
import { useWindowSize, createWebgl3DRenderer, useWheelScroll, useWheelZoom, useDragMove, Graphic3d, updateCamera, bindMultipleRefs, getAxesGraphics, getBezierSplinePoints3D, Position, ChartTooltip, Vec3, Vec4 } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<ReturnType<typeof createWebgl3DRenderer>>()
  const { x, y, ref: wheelScrollRef } = useWheelScroll<HTMLCanvasElement>()
  const { scale, ref: wheelZoomRef } = useWheelZoom<HTMLCanvasElement>()
  const [rotate, setRotate] = React.useState({ x: 0, y: 0 })
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask } = useDragMove(() => {
    setRotate((v) => ({ x: v.x + offset.x, y: v.y + offset.y }))
  })
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const [hovering, setHovering] = React.useState<Position & { value: Vec3 }>()
  const rotateX = offset.x + rotate.x
  const rotateY = offset.y + rotate.y
  const graphics = React.useRef<(Graphic3d)[]>(getAxesGraphics())
  const getXLabel = (x: number) => Intl.DateTimeFormat('zh', { month: 'long' }).format(new Date(x.toString()))

  React.useEffect(() => {
    if (!ref.current) return
    renderer.current = createWebgl3DRenderer(ref.current)
  }, [ref.current])

  React.useEffect(() => {
    const points1 = [65, 59, 80, 81, 56, 55, 40].map((s, i) => [(i + 1) * 20, s, 0] as Vec3)
    const points2 = [55, 49, 70, 71, 46, 45, 30].map((s, i) => [(i + 1) * 20, s, 20] as Vec3)
    graphics.current.push(
      { geometry: { type: 'line strip', points: points1.flat() }, color: [1, 0, 0, 1] },
      ...points1.map(p => ({ geometry: { type: 'sphere' as const, radius: 3 }, color: [1, 0, 0, 1] as Vec4, position: p })),
      { geometry: { type: 'line strip', points: getBezierSplinePoints3D(points2, 20).flat() }, color: [0, 1, 0, 1] },
      ...points2.map(p => ({ geometry: { type: 'sphere' as const, radius: 3 }, color: [0, 1, 0, 1] as Vec4, position: p })),
    )
  }, [])

  React.useEffect(() => {
    const { position, up } = updateCamera(-x, y, 200 / scale, -0.3 * rotateX, -0.3 * rotateY)
    renderer.current?.render?.(
      graphics.current,
      {
        eye: [position.x + 40, position.y + 40, position.z],
        up: [up.x, up.y, up.z],
        target: [-x + 40, y + 40, 0],
        fov: 60 * Math.PI / 180,
        near: 0.1,
        far: 2000,
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
  }, [x, y, scale, rotateX, rotateY, hovering, width, height])

  return (
    <div style={{ position: 'absolute', inset: '0px' }}>
      <canvas
        ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef, ref)}
        width={width}
        height={height}
        onMouseDown={e => onStartMoveCanvas({ x: e.clientX, y: e.clientY })}
        onMouseMove={e => {
          setHovering(undefined)
          const index = renderer.current?.pick?.(e.clientX, e.clientY, (g) => g.geometry.type === 'sphere')
          if (index !== undefined) {
            const graphic = graphics.current[index]
            if (graphic.position) {
              setHovering({ value: graphic.position, x: e.clientX, y: e.clientY })
            }
          }
        }}
      />
      {hovering && <ChartTooltip {...hovering} label={getXLabel(hovering.value[0] / 20)} value={hovering.value[1]} />}
      {moveCanvasMask}
    </div>
  )
}
