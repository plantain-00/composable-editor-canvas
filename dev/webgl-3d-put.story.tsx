import * as React from "react"
import { createWebgl3DRenderer, Graphic3d, useWindowSize, angleToRadian, Vec3, useGlobalKeyDown, Nullable, useUndoRedo, metaKeyIfMacElseCtrlKey, Menu, colorNumberToVec, NumberEditor, arcToPolyline, circleToArc, MenuItem, vecToColorNumber, SphereGeometry, CubeGeometry, Vec4, WeakmapCache, useLocalStorageState, Position3D, getLineAndSphereIntersectionPoints, position3DToVec3, slice3, vec3ToPosition3D } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<ReturnType<typeof createWebgl3DRenderer>>()
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const eye: Vec3 = [0, -90, 90]
  const [status, setStatus] = React.useState<'cube' | 'sphere' | 'line start' | 'line end' | 'intersect'>()
  const graphicCache = React.useRef(new WeakmapCache<State, Graphic3d>())
  const land = React.useRef<Graphic3d>(
    {
      geometry: {
        type: 'triangle strip',
        points: [-50, -50, 0, -50, 50, 0, 50, -50, 0, 50, 50, 0],
      },
      color: [0.6, 0.6, 0.6, 0.5],
      position: [0, 0, 0],
    },
  )
  const [, onChange, initialState] = useLocalStorageState<readonly State[]>('webgl-3d-put-data', [])
  const { state, setState, undo, redo } = useUndoRedo<readonly State[]>(initialState, {
    onChange: (({ newState }) => {
      onChange(newState)
    })
  })
  const [contextMenu, setContextMenu] = React.useState<JSX.Element>()
  const [preview, setPreview] = React.useState<State>()
  const colorRef = React.useRef(0xff0000)
  const opacityRef = React.useRef(1)
  const sizeRef = React.useRef(5)
  const zRef = React.useRef(0)
  const [hovering, setHovering] = React.useState<number>()
  const [selected, setSelected] = React.useState<number>()
  const [lineStart, setLineStart] = React.useState<Position3D>()

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
      setLineStart(undefined)
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
    let z = s.position.z
    if (s.geometry.type === 'cube') {
      z += s.geometry.size / 2
    } else if (s.geometry.type === 'sphere') {
      z += s.geometry.radius
    } else if (s.geometry.type === 'point') {
      return {
        geometry: {
          type: 'lines',
          points: [...position3DToVec3(s.position), ...position3DToVec3(s.geometry.position)],
        },
        color: s.color,
        position: [0, 0, 0],
      }
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
      } else if (g.geometry.type === 'point') {
        graphics.push({
          geometry: {
            type: 'lines',
            points: [...position3DToVec3(g.position), ...position3DToVec3(g.geometry.position)],
          },
          color: [0, 1, 0, 1],
          position: [0, 0, 0.5],
        })
      }
      if (radius) {
        const points = arcToPolyline(circleToArc({ x: 0, y: 0, r: radius }), 5)
        const result: number[] = []
        for (let i = 1; i < points.length; i++) {
          result.push(points[i - 1].x, points[i - 1].y, zRef.current, points[i].x, points[i].y, zRef.current)
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
          if (!status || status === 'intersect') {
            const index = renderer.current?.pick(e.clientX, e.clientY)
            setHovering(index ? index - 1 : undefined)
            return
          }
          if (renderer.current) {
            const info = renderer.current.pickingDrawObjectsInfo[0]
            if (info) {
              const target = renderer.current.getTarget(e.clientX, e.clientY, eye, zRef.current, info.reversedProjection)
              const color = colorNumberToVec(colorRef.current, opacityRef.current)
              const position = { x: target[0], y: target[1], z: zRef.current }
              if (status === 'cube') {
                setPreview({
                  geometry: {
                    type: 'cube',
                    size: sizeRef.current,
                  },
                  color,
                  position,
                })
              } else if (status === 'sphere') {
                setPreview({
                  geometry: {
                    type: 'sphere',
                    radius: sizeRef.current,
                  },
                  color,
                  position,
                })
              } else if (status === 'line start') {
                setLineStart(position)
              } else if (status === 'line end' && lineStart) {
                setPreview({
                  geometry: {
                    type: 'point',
                    position: lineStart,
                  },
                  color,
                  position,
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
            if (lineStart) {
              setLineStart(undefined)
              setStatus(undefined)
            }
          } else if (lineStart) {
            setStatus('line end')
          } else if (status === 'intersect') {
            if (
              hovering !== undefined &&
              selected !== undefined &&
              hovering !== selected
            ) {
              const target1 = getGraphic(state[hovering])
              const target2 = getGraphic(state[selected])
              let points: Vec3[] | undefined
              if (target1.geometry.type === 'lines') {
                if (target2.geometry.type === 'sphere') {
                  points = getLineAndSphereIntersectionPoints(
                    [slice3(target1.geometry.points), slice3(target1.geometry.points, 3)],
                    {
                      radius: target2.geometry.radius,
                      ...(vec3ToPosition3D(target2.position || [0, 0, 0])),
                    }
                  )
                }
              } else if (target1.geometry.type === 'sphere') {
                if (target2.geometry.type === 'lines') {
                  points = getLineAndSphereIntersectionPoints(
                    [slice3(target2.geometry.points), slice3(target2.geometry.points, 3)],
                    {
                      radius: target1.geometry.radius,
                      ...(vec3ToPosition3D(target1.position || [0, 0, 0])),
                    }
                  )
                }
              }
              if (points && points.length > 0) {
                setState(draft => {
                  draft.push(...points.map(p => ({
                    geometry: {
                      type: 'sphere',
                      radius: 0.5,
                    },
                    color: [0, 1, 0, 1],
                    position: vec3ToPosition3D(p),
                  } as State)))
                })
                setStatus(undefined)
              }
            }
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
            items.push({
              title: 'intersect',
              onClick() {
                setStatus('intersect')
                setContextMenu(undefined)
              },
            })
            const geometry = state[selected].geometry
            if (geometry.type === 'cube') {
              size = geometry.size
            } else if (geometry.type === 'sphere') {
              size = geometry.radius
            } else if (geometry.type === 'point') {
              items.push(
                ...(['x', 'y', 'z'] as const).map(f => ({
                  title: (
                    <>
                      start {f}
                      <NumberEditor
                        value={geometry.position[f]}
                        style={{ width: '100px' }}
                        setValue={v => {
                          setState(draft => {
                            const g = draft[selected].geometry
                            if (g.type === 'point') {
                              g.position[f] = v
                            }
                          })
                          setContextMenu(undefined)
                        }}
                      />
                    </>
                  ),
                  height: 33,
                })),
              )
            }
            items.push(
              ...(['x', 'y', 'z'] as const).map(f => ({
                title: (
                  <>
                    {f}
                    <NumberEditor
                      value={state[selected].position[f]}
                      style={{ width: '100px' }}
                      setValue={v => {
                        setState(draft => {
                          draft[selected].position[f] = v
                        })
                        setContextMenu(undefined)
                      }}
                    />
                  </>
                ),
                height: 33,
              })),
            )
          }
          setContextMenu(
            <Menu
              items={[
                ...items,
                {
                  title: (
                    <>
                      z
                      <NumberEditor
                        value={zRef.current}
                        style={{ width: '50px' }}
                        setValue={v => {
                          zRef.current = v
                          setContextMenu(undefined)
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
                {
                  title: 'line',
                  onClick() {
                    setStatus('line start')
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
  geometry: SphereGeometry | CubeGeometry | {
    type: 'point'
    position: Position3D
  }
  color: Vec4
  position: Position3D
}
