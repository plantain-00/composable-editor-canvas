import * as React from "react"
import { createWebgl3DRenderer, Graphic3d, useWindowSize, angleToRadian, Vec3, useGlobalKeyDown, Nullable, useUndoRedo, metaKeyIfMacElseCtrlKey } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<ReturnType<typeof createWebgl3DRenderer>>()
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const eye: Vec3 = [0, -90, 90]
  const { state, undo, redo } = useUndoRedo<Graphic3d[]>([
    {
      geometry: {
        type: 'triangle strip',
        points: [-50, -50, 0, -50, 50, 0, 50, -50, 0, 50, 50, 0],
      },
      color: [0.6, 0.6, 0.6, 1],
      position: [0, 0, 0],
    },
  ])
  const [preview, setPreview] = React.useState<Graphic3d>()

  React.useEffect(() => {
    if (!ref.current || renderer.current) {
      return
    }
    renderer.current = createWebgl3DRenderer(ref.current)
  }, [ref.current])

  useGlobalKeyDown(e => {
    if (metaKeyIfMacElseCtrlKey(e)) {
      if (e.code === 'KeyZ') {
        if (e.shiftKey) {
          redo(e)
        } else {
          undo(e)
        }
      }
    }
  })
  const render = (g: Nullable<Graphic3d>[]) => {
    renderer.current?.render?.(
      g,
      {
        eye,
        up: [0, 1, 0],
        target: [0, 0, 0],
        fov: angleToRadian(60),
        near: 0.1,
        far: 1000,
      },
      {
        position: [1000, -1000, 1000],
        color: [1, 1, 1, 1],
        specular: [1, 1, 1, 1],
        shininess: 50,
        specularFactor: 1,
      },
      [1, 1, 1, 1],
    )
  }

  React.useEffect(() => {
    const graphics = [...state]
    if (preview) {
      graphics.push(preview)
    }
    render(graphics)
  }, [state, preview])

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
          if (renderer.current) {
            const info = renderer.current.pickingDrawObjectsInfo[0]
            if (info) {
              const target = renderer.current.getTarget(e.clientX, e.clientY, eye, 0, info.reversedProjection)
              setPreview({
                geometry: {
                  type: 'cube',
                  size: 5,
                },
                color: [1, 0, 0, 1],
                position: [target[0], target[1], 5],
              })
            }
          }
        }}
      />
    </div>
  )
}
