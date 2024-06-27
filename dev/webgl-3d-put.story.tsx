import * as React from "react"
import { createWebgl3DRenderer, Graphic3d, useWindowSize, angleToRadian, Vec3, useGlobalKeyDown, Nullable, useUndoRedo, metaKeyIfMacElseCtrlKey, Menu, colorNumberToVec, NumberEditor, arcToPolyline, circleToArc, MenuItem, vecToColorNumber, SphereGeometry, CubeGeometry, Vec4, Position, WeakmapCache } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<ReturnType<typeof createWebgl3DRenderer>>()
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const eye: Vec3 = [0, -90, 90]
  const [status, setStatus] = React.useState<'cube' | 'sphere'>()
  const graphicCache = React.useRef(new WeakmapCache<State, Graphic3d>())
  const land = React.useRef<Graphic3d>(
    {
      geometry: {
        type: 'triangle strip',
        points: [-50, -50, 0, -50, 50, 0, 50, -50, 0, 50, 50, 0],
      },
      color: [0.6, 0.6, 0.6, 1],
      position: [0, 0, 0],
    },
  )
  const { state, setState, undo, redo } = useUndoRedo<State[]>([])
  const [contextMenu, setContextMenu] = React.useState<JSX.Element>()
  const [preview, setPreview] = React.useState<State>()
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
      if (selected !== undefined) {
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
  const getGraphic = (s: State): Graphic3d => graphicCache.current.get(s, () => {
    let z = 0
    if (s.geometry.type === 'cube') {
      z = sizeRef.current / 2
    } else if (s.geometry.type === 'sphere') {
      z = sizeRef.current
    }
    return {
      geometry: s.geometry,
      color: s.color,
      position: [s.position.x, s.position.y, z],
    }
  })

  React.useEffect(() => {
    const graphics = [land.current, ...state.map(s => getGraphic(s))]
    if (preview) {
      graphics.push(getGraphic(preview))
    }
    const items = new Set([hovering, selected])
    for (const item of items) {
      if (item === undefined) continue
      const g = state[item]
      if (!g) continue
      let radius: number | undefined
      if (g.geometry.type === 'sphere') {
        radius = g.geometry.radius
      } else if (g.geometry.type === 'cube') {
        radius = g.geometry.size * Math.SQRT1_2
      }
      if (radius) {
        const points = arcToPolyline(circleToArc({ x: 0, y: 0, r: radius }), 5)
        const result: number[] = []
        for (let i = 1; i < points.length; i++) {
          result.push(points[i - 1].x, points[i - 1].y, 0, points[i].x, points[i].y, 0)
        }
        graphics.push({
          geometry: {
            type: 'lines',
            points: result,
          },
          color: [0, 1, 0, 1],
          position: [g.position.x, g.position.y, 1],
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
            const index = renderer.current?.pick(e.clientX, e.clientY)
            setHovering(index ? index - 1 : undefined)
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
                  position: { x: target[0], y: target[1] },
                })
              } else if (status === 'sphere') {
                setPreview({
                  geometry: {
                    type: 'sphere',
                    radius: sizeRef.current,
                  },
                  color,
                  position: { x: target[0], y: target[1] },
                })
              }
            }
          }
        }}
        onMouseDown={() => {
          if (!status) {
            if (hovering !== undefined) {
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
          if (selected !== undefined) {
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
                        value={selected !== undefined ? vecToColorNumber(state[selected].color) : colorRef.current}
                        type='color'
                        style={{ width: '50px' }}
                        setValue={v => {
                          if (selected !== undefined) {
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
                        value={(selected !== undefined ? state[selected].color[3] : opacityRef.current) * 100}
                        style={{ width: '50px' }}
                        setValue={v => {
                          if (selected !== undefined) {
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
                        if (selected !== undefined) {
                          setState(draft => {
                            const graphic = draft[selected]
                            if (graphic.geometry.type === 'cube') {
                              graphic.geometry.size = v
                            } else if (graphic.geometry.type === 'sphere') {
                              graphic.geometry.radius = v
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

interface State {
  geometry: SphereGeometry | CubeGeometry
  color: Vec4
  position: Position
}
