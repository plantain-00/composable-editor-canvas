import * as React from "react"
import { axesGraphics, bindMultipleRefs, createWebgl3DRenderer, getDashedLine, Graphic3d, metaKeyIfMacElseCtrlKey, updateCamera, useDragMove, useKey, useWheelScroll, useWheelZoom, useWindowSize } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<ReturnType<typeof createWebgl3DRenderer>>()
  const { x, y, setX, setY, ref: wheelScrollRef } = useWheelScroll<HTMLDivElement>()
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>()
  const [rotate, setRotate] = React.useState({ x: 0, y: 0 })
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask } = useDragMove(() => {
    setRotate((v) => ({ x: v.x + offset.x, y: v.y + offset.y }))
  })
  useKey((k) => k.code === 'Digit0' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    setScale(1)
    setX(0)
    setY(0)
    setRotate({ x: 0, y: 0 })
    e.preventDefault()
  })
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const rotateX = offset.x + rotate.x
  const rotateY = offset.y + rotate.y
  const [hovering, setHovering] = React.useState<number>()
  const graphics = React.useRef<Graphic3d[]>([
    ...axesGraphics,
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
        type: 'cune',
        topRadius: 0,
        bottomRadius: 100,
        height: 200,
      },
      color: [1, 0, 1, 1],
      position: [0, -250, 0],
    },
  ])

  React.useEffect(() => {
    if (!ref.current) {
      return
    }
    renderer.current = createWebgl3DRenderer(ref.current)
  }, [ref.current])

  React.useEffect(() => {
    if (ref.current) {
      ref.current.width = width
      ref.current.height = height
    }
  }, [width, height])

  React.useEffect(() => {
    const { position, up } = updateCamera(-x, y, 1000 / scale, -0.3 * rotateX, -0.3 * rotateY)
    graphics.current.forEach((g, i) => {
      g.color[3] = i === hovering ? 0.5 : 1
    })
    renderer.current?.render?.(
      graphics.current,
      {
        eye: [position.x, position.y, position.z],
        up: [up.x, up.y, up.z],
        target: [0, 0, 0],
        fov: 60 * Math.PI / 180,
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
  }, [x, y, scale, rotateX, rotateY, hovering])

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
        onMouseMove={e => setHovering(renderer.current?.pick?.(e.clientX, e.clientY, (g) => g.geometry.type !== 'lines'))}
      />
      {moveCanvasMask}
    </div>
  )
}
