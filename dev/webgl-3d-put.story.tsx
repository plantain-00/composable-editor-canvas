import * as React from "react"
import { createWebgl3DRenderer, Graphic3d, useWindowSize, angleToRadian, Vec3, useGlobalKeyDown, Nullable, useUndoRedo, metaKeyIfMacElseCtrlKey, Menu, colorNumberToVec, NumberEditor } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<ReturnType<typeof createWebgl3DRenderer>>()
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const eye: Vec3 = [0, -90, 90]
  const [status, setStatus] = React.useState<'cube' | 'sphere'>()
  const { state, setState, undo, redo } = useUndoRedo<Graphic3d[]>([
    {
      geometry: {
        type: 'triangle strip',
        points: [-50, -50, 0, -50, 50, 0, 50, -50, 0, 50, 50, 0],
      },
      color: [0.6, 0.6, 0.6, 1],
      position: [0, 0, 0],
    },
  ])
  const [contextMenu, setContextMenu] = React.useState<JSX.Element>()
  const [preview, setPreview] = React.useState<Graphic3d>()
  const colorRef = React.useRef(0xff0000)
  const opacityRef = React.useRef(1)
  const sizeRef = React.useRef(5)

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
    } else if (e.key === 'Escape') {
      setStatus(undefined)
      setContextMenu(undefined)
      setPreview(undefined)
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
          if (!status) return
          if (renderer.current) {
            const info = renderer.current.pickingDrawObjectsInfo[0]
            if (info) {
              const target = renderer.current.getTarget(e.clientX, e.clientY, eye, 0, info.reversedProjection)
              const color = colorNumberToVec(colorRef.current, opacityRef.current)
              if (status === 'cube') {
                setPreview({
                  geometry: {
                    type: 'cube',
                    size: sizeRef.current,
                  },
                  color,
                  position: [target[0], target[1], sizeRef.current],
                })
              } else if (status === 'sphere') {
                setPreview({
                  geometry: {
                    type: 'sphere',
                    radius: sizeRef.current,
                  },
                  color,
                  position: [target[0], target[1], sizeRef.current],
                })
              }
            }
          }
        }}
        onMouseDown={() => {
          if (!status) return
          if (preview) {
            setState(draft => {
              draft.push(preview)
            })
            setPreview(undefined)
          }
        }}
        onContextMenu={e => {
          e.preventDefault()
          const viewportPosition = { x: e.clientX, y: e.clientY }
          if (contextMenu) {
            setContextMenu(undefined)
            return
          }
          setContextMenu(
            <Menu
              items={[
                {
                  title: (
                    <>
                      <NumberEditor
                        value={colorRef.current}
                        type='color'
                        style={{ width: '50px' }}
                        setValue={v => colorRef.current = v}
                      />
                    </>
                  ),
                  height: 33,
                },
                {
                  title: (
                    <>
                      <NumberEditor
                        value={opacityRef.current * 100}
                        style={{ width: '50px' }}
                        setValue={v => opacityRef.current = v * 0.01}
                      />
                    </>
                  ),
                  height: 41,
                },
                {
                  title: <>
                    <NumberEditor
                      value={sizeRef.current}
                      style={{ width: '40px' }}
                      setValue={v => sizeRef.current = v}
                    />
                  </>,
                  height: 41,
                },
                {
                  title: 'cube',
                  onClick() {
                    setStatus('cube')
                    setContextMenu(undefined)
                  },
                },
                {
                  title: 'sphere',
                  onClick() {
                    setStatus('sphere')
                    setContextMenu(undefined)
                  },
                },
              ]}
              y={viewportPosition.y}
              height={height}
              style={{
                left: viewportPosition.x + 'px',
              }}
            />
          )
        }}
      />
      {contextMenu}
    </div>
  )
}
