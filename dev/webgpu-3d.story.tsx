import * as React from "react"
import { bindMultipleRefs, Graphic3d, metaKeyIfMacElseCtrlKey, updateCamera, useDragMove, useWheelScroll, useWheelZoom, useWindowSize, angleToRadian, createWebgpu3DRenderer, getAxesGraphics, getDashedLine, useGlobalKeyDown, getNurbsSurfaceVertices, position3DToVec3 } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<Awaited<ReturnType<typeof createWebgpu3DRenderer>>>()
  const { x, y, setX, setY, ref: wheelScrollRef } = useWheelScroll<HTMLDivElement>()
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>()
  const [rotate, setRotate] = React.useState({ x: 0, y: 0 })
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask, resetDragMove } = useDragMove(() => {
    setRotate((v) => ({ x: v.x + offset.x, y: v.y + offset.y }))
  })
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      resetDragMove()
    } else if (e.code === 'Digit0' && !e.shiftKey && metaKeyIfMacElseCtrlKey(e)) {
      setScale(1)
      setX(0)
      setY(0)
      setRotate({ x: 0, y: 0 })
      e.preventDefault()
    }
  })
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const rotateX = offset.x + rotate.x
  const rotateY = offset.y + rotate.y
  const [hovering, setHovering] = React.useState<number>()
  const graphics = React.useRef<Graphic3d[]>([
    ...getAxesGraphics(),
    {
      geometry: {
        type: 'lines',
        points: getDashedLine([0, 0, 0], [100, 100, 100], 6).flat(),
      },
      color: [0, 0, 0, 1],
    },
    {
      geometry: {
        type: 'sphere',
        radius: 100,
      },
      color: [1, 0, 0, 1],
      position: [0, 250, 0],
    },
    {
      geometry: {
        type: 'cube',
        size: 150,
      },
      color: [0, 1, 0, 1],
      position: [250, 0, 0],
    },
    {
      geometry: {
        type: 'cylinder',
        radius: 100,
        height: 200,
      },
      color: [0, 0, 1, 1],
      position: [-250, 0, 0],
    },
    {
      geometry: {
        type: 'cone',
        topRadius: 0,
        bottomRadius: 100,
        height: 200,
      },
      color: [1, 0, 1, 1],
      position: [0, -250, 0],
    },
    {
      geometry: {
        type: 'triangles',
        points: [-50, -50, 50, 50, 50, 50, -50, 50, 50],
      },
      color: [0.5, 0, 0.5, 1],
      position: [250, 250, 250],
    },
    {
      geometry: {
        type: 'vertices',
        ...getNurbsSurfaceVertices([
          [[0, 0, -20], [20, 0, 0], [40, 0, 0], [60, 0, 0], [80, 0, 0], [100, 0, 0]],
          [[0, -20, 0], [20, -20, 10], [40, -20, 20], [60, -20, 0], [80, -20, 0], [100, -20, 0]],
          [[0, -40, 0], [20, -40, 10], [40, -40, 20], [60, -40, 0], [80, -40, -4], [100, -40, -24]],
          [[0, -50, 0], [20, -60, 0], [40, -60, -46], [60, -60, 0], [80, -60, 0], [100, -50, 0]],
          [[0, -80, 0], [20, -80, 0], [40, -80, 0], [60, -80, 8], [80, -80, -40], [100, -80, 0]],
          [[0, -100, 24], [20, -100, 0], [40, -100, 40], [60, -100, 0], [100, -100, -20], [100, -100, -30]],
        ], 3, [0, 0, 0, 0, 0.333, 0.666, 1, 1, 1, 1], 3, [0, 0, 0, 0, 0.333, 0.666, 1, 1, 1, 1]),
      },
      color: [0, 0.5, 0, 1],
      position: [250, 250, -250],
      rotateY: Math.PI,
    },
  ])

  React.useEffect(() => {
    if (!ref.current || renderer.current) {
      return
    }
    createWebgpu3DRenderer(ref.current).then(r => {
      renderer.current = r
      setHovering(-1)
    })
  }, [ref.current])

  React.useEffect(() => {
    const { position, up } = updateCamera(-x, y, 1000 / scale, -0.3 * rotateX, -0.3 * rotateY)
    graphics.current.forEach((g, i) => {
      g.color[3] = i === hovering ? 0.5 : 1
    })
    renderer.current?.render?.(
      graphics.current,
      {
        eye: position3DToVec3(position),
        up: position3DToVec3(up),
        target: [-x, y, 0],
        fov: angleToRadian(60),
        near: 0.1,
        far: 20000,
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
    <div
      ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}
      style={{ position: 'absolute', inset: '0px' }}
    >
      <canvas
        ref={ref}
        width={width}
        height={height}
        onMouseDown={e => onStartMoveCanvas({ x: e.clientX, y: e.clientY })}
        onMouseMove={async e => setHovering(await renderer.current?.pick?.(e.clientX, e.clientY, (g) => g.geometry.type !== 'lines' && g.geometry.type !== 'triangles'))}
      />
      {moveCanvasMask}
    </div>
  )
}
