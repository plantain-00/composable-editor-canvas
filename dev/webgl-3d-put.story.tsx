import * as React from "react"
import { createWebgl3DRenderer, Graphic3d, useWindowSize, angleToRadian, Vec3, useGlobalKeyDown, Nullable, useUndoRedo, metaKeyIfMacElseCtrlKey, Menu, colorNumberToVec, NumberEditor, arcToPolyline, circleToArc, MenuItem, vecToColorNumber } from "../src"

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
  const [hovering, setHovering] = React.useState<number>()
  const [selected, setSelected] = React.useState<number>()

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
      setHovering(undefined)
      setSelected(undefined)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selected) {
        setState(draft => {
          draft.splice(selected, 1)
        })
        setSelected(undefined)
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
        position: [1000, -500, 800],
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
    const items = new Set([hovering, selected])
    for (const item of items) {
      if (!item) continue
      const g = state[item]
      if (!g) continue
      if (g.geometry.type === 'sphere') {
        const points = arcToPolyline(circleToArc({ x: 0, y: 0, r: g.geometry.radius }), 5)
        const result: number[] = []
        const z = 1 - g.geometry.radius
        for (let i = 1; i < points.length; i++) {
          result.push(points[i - 1].x, points[i - 1].y, z, points[i].x, points[i].y, z)
        }
        graphics.push({
          geometry: {
            type: 'lines',
            points: result,
          },
          color: [0, 1, 0, 1],
          position: g.position,
        })
      } else if (g.geometry.type === 'cube') {
        const points = arcToPolyline(circleToArc({ x: 0, y: 0, r: g.geometry.size * Math.SQRT1_2 }), 5)
        const result: number[] = []
        const z = 1 - g.geometry.size / 2
        for (let i = 1; i < points.length; i++) {
          result.push(points[i - 1].x, points[i - 1].y, z, points[i].x, points[i].y, z)
        }
        graphics.push({
          geometry: {
            type: 'lines',
            points: result,
          },
          color: [0, 1, 0, 1],
          position: g.position,
        })
      }
    }
    render(graphics)
  }, [state, preview, hovering, selected])

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
          if (!status) {
            setHovering(renderer.current?.pick(e.clientX, e.clientY))
            return
          }
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
                  position: [target[0], target[1], sizeRef.current / 2],
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
          if (!status) {
            if (hovering) {
              setSelected(hovering)
            }
            return
          }
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
          const items: MenuItem[] = []
          let size: number | undefined
          if (selected) {
            items.push({
              title: 'delete',
              onClick() {
                setState(draft => {
                  draft.splice(selected, 1)
                })
                setSelected(undefined)
                setContextMenu(undefined)
              },
            })
            const geometry = state[selected].geometry
            if (geometry.type === 'cube') {
              size = geometry.size
            } else if (geometry.type === 'sphere') {
              size = geometry.radius
            }
          }
          setContextMenu(
            <Menu
              items={[
                ...items,
                {
                  title: (
                    <>
                      <NumberEditor
                        value={selected ? vecToColorNumber(state[selected].color) : colorRef.current}
                        type='color'
                        style={{ width: '50px' }}
                        setValue={v => {
                          if (selected) {
                            const color = state[selected].color
                            setState(draft => {
                              draft[selected].color = colorNumberToVec(v, color[3])
                            })
                            setContextMenu(undefined)
                          }
                          colorRef.current = v
                        }}
                      />
                    </>
                  ),
                  height: 33,
                },
                {
                  title: (
                    <>
                      <NumberEditor
                        value={(selected ? state[selected].color[3] : opacityRef.current) * 100}
                        style={{ width: '50px' }}
                        setValue={v => {
                          if (selected) {
                            setState(draft => {
                              draft[selected].color[3] = v * 0.01
                            })
                            setContextMenu(undefined)
                          }
                          opacityRef.current = v * 0.01
                        }}
                      />
                    </>
                  ),
                  height: 41,
                },
                {
                  title: <>
                    <NumberEditor
                      value={size ?? sizeRef.current}
                      style={{ width: '40px' }}
                      setValue={v => {
                        if (selected) {
                          setState(draft => {
                            const graphic = draft[selected]
                            if (graphic.geometry.type === 'cube') {
                              graphic.geometry.size = v
                              if (graphic.position) {
                                graphic.position[2] = v / 2
                              }
                            } else if (graphic.geometry.type === 'sphere') {
                              graphic.geometry.radius = v
                              if (graphic.position) {
                                graphic.position[2] = v
                              }
                            }
                          })
                          setContextMenu(undefined)
                        }
                        sizeRef.current = v
                      }}
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
