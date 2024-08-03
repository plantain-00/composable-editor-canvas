import * as React from "react"
import { produce } from 'immer'
import * as twgl from 'twgl.js'
import { createWebgl3DRenderer, Graphic3d, useWindowSize, angleToRadian, Vec3, useGlobalKeyDown, Nullable, useUndoRedo, metaKeyIfMacElseCtrlKey, colorNumberToVec, NumberEditor, vecToColorNumber, SphereGeometry, CubeGeometry, Vec4, WeakmapCache, useLocalStorageState, Position3D, getLineAndSphereIntersectionPoints, position3DToVec3, vec3ToPosition3D, Button, GeneralFormPlane, CylinderGeometry, getLineAndPlaneIntersectionPoint, getThreePointPlane, getLineAndCylinderIntersectionPoints, getTwoLine3DIntersectionPoint, v3, getVerticesTriangles, getLineAndTrianglesIntersectionPoint, ConeGeometry, getLineAndConeIntersectionPoints, getPlaneSphereIntersection, getTwoSpheresIntersection, getPlaneCylinderIntersection, getAxesGraphics, useWheelScroll, useWheelZoom, bindMultipleRefs, updateCamera, ObjectEditor, getPlaneByPointAndNormal, Cylinder, Sphere, Cone, Tuple3, getPerpendicularDistanceToLine3D, reverse3dPosition } from "../src"

export function Combination8() {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<ReturnType<typeof createWebgl3DRenderer>>()
  const { x, y, setX, setY, ref: wheelScrollRef } = useWheelScroll<HTMLDivElement>()
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>()
  const size = useWindowSize()
  const width = size.width
  const height = size.height
  const [status, setStatus] = React.useState<Status>()
  const graphicCache = React.useRef(new WeakmapCache<State, Graphic3d>())
  const hoveringContentCache = React.useRef(new WeakmapCache<State, State>())
  const axis = React.useRef<Graphic3d[]>(
    getAxesGraphics(),
  )
  const [, onChange, initialState] = useLocalStorageState<readonly State[]>('composable-editor-canvas-combination8-data', [])
  const { state, setState, undo, redo } = useUndoRedo<readonly State[]>(initialState, {
    onChange: (({ newState }) => {
      onChange(newState)
    })
  })
  const [preview, setPreview] = React.useState<State>()
  const colorRef = React.useRef(0xff0000)
  const opacityRef = React.useRef(1)
  const sizeRef = React.useRef(5)
  const distanceRef = React.useRef(0)
  const [hovering, setHovering] = React.useState<number>()
  const [selected, setSelected] = React.useState<number>()
  const [hoveringGridPoint, setHoveringGripPoint] = React.useState<{ point: Position3D, updatePoint: (draft: State, p: Position3D) => void }>()

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
      } else if (e.code === 'Digit0' && !e.shiftKey) {
        setScale(1)
        setX(0)
        setY(0)
        e.preventDefault()
      }
    } else if (e.key === 'Escape') {
      setStatus(undefined)
      setPreview(undefined)
      setHovering(undefined)
      setSelected(undefined)
      setHoveringGripPoint(undefined)
    } else if (e.key === 'Delete' || e.key === 'Backspace' || e.code === 'KeyE') {
      if (selected !== undefined) {
        setState(draft => {
          draft.splice(selected, 1)
        })
        setSelected(undefined)
      }
    }
  })
  const { position, up } = updateCamera(0, 0, 200 / scale, -0.3 * x, -0.3 * y)
  const eye: Vec3 = position3DToVec3(position)
  const targetPosition: Vec3 = [0, 0, 0]
  const getCurrentPositionPlane = (point?: Vec3): GeneralFormPlane => {
    const normal = v3.substract(eye, targetPosition)
    if (point) {
      return getPlaneByPointAndNormal(point, normal)
    }
    return { a: normal[0], b: normal[1], c: normal[2], d: -distanceRef.current * v3.length(normal) }
  }
  let panel: JSX.Element | undefined
  if (selected !== undefined) {
    const propertyPanels: Record<string, JSX.Element> = {}
    const geometry = state[selected].geometry
    propertyPanels.color = <NumberEditor
      value={vecToColorNumber(state[selected].color)}
      type='color'
      setValue={v => {
        setState(draft => {
          draft[selected].color = colorNumberToVec(v, state[selected].color[3])
        })
      }}
    />
    propertyPanels.opacity = <NumberEditor
      value={state[selected].color[3] * 100}
      setValue={v => {
        setState(draft => {
          draft[selected].color[3] = v * 0.01
        })
      }}
    />
    if (geometry.type === 'cube') {
      propertyPanels.size = <NumberEditor
        value={geometry.size}
        setValue={v => {
          setState(draft => {
            if (draft[selected].geometry.type === 'cube') {
              draft[selected].geometry.size = v
            }
          })
        }}
      />
    } else if (geometry.type === 'sphere') {
      propertyPanels.radius = <NumberEditor
        value={geometry.radius}
        setValue={v => {
          setState(draft => {
            if (draft[selected].geometry.type === 'sphere') {
              draft[selected].geometry.radius = v
            }
          })
        }}
      />
    } else if (geometry.type === 'cylinder') {
      propertyPanels.radius = <NumberEditor
        value={geometry.radius}
        setValue={v => {
          setState(draft => {
            if (draft[selected].geometry.type === 'cylinder') {
              draft[selected].geometry.radius = v
            }
          })
        }}
      />
      propertyPanels.height = <NumberEditor
        value={geometry.height}
        setValue={v => {
          setState(draft => {
            if (draft[selected].geometry.type === 'cylinder') {
              draft[selected].geometry.height = v
            }
          })
        }}
      />
    } else if (geometry.type === 'cone') {
      propertyPanels.topRadius = <NumberEditor
        value={geometry.topRadius}
        setValue={v => {
          setState(draft => {
            if (draft[selected].geometry.type === 'cone') {
              draft[selected].geometry.topRadius = v
            }
          })
        }}
      />
      propertyPanels.bottomRadius = <NumberEditor
        value={geometry.bottomRadius}
        setValue={v => {
          setState(draft => {
            if (draft[selected].geometry.type === 'cone') {
              draft[selected].geometry.bottomRadius = v
            }
          })
        }}
      />
      propertyPanels.height = <NumberEditor
        value={geometry.height}
        setValue={v => {
          setState(draft => {
            if (draft[selected].geometry.type === 'cone') {
              draft[selected].geometry.height = v
            }
          })
        }}
      />
    } else if (geometry.type === 'point') {
      for (const f of ['x', 'y', 'z'] as const) {
        propertyPanels[`point ${f}`] = <NumberEditor
          value={geometry.position[f]}
          setValue={v => {
            setState(draft => {
              if (draft[selected].geometry.type === 'point') {
                draft[selected].geometry.position[f] = v
              }
            })
          }}
        />
      }
      propertyPanels.point = <Button onClick={() => {
        setStatus({
          type: 'update point',
          plane: getCurrentPositionPlane(position3DToVec3(geometry.position)),
          updatePoint(p) {
            setPreview(produce(state[selected], draft => {
              if (draft.geometry.type === 'point') {
                draft.geometry.position = p
              }
            }))
          },
        })
      }}>update</Button>
    } else if (geometry.type === 'triangle') {
      for (const e of ['p1', 'p2'] as const) {
        for (const f of ['x', 'y', 'z'] as const) {
          propertyPanels[`${e} ${f}`] = <NumberEditor
            value={geometry[e][f]}
            setValue={v => {
              setState(draft => {
                if (draft[selected].geometry.type === 'triangle') {
                  draft[selected].geometry[e][f] = v
                }
              })
            }}
          />
        }
        propertyPanels[e] = <Button onClick={() => {
          setStatus({
            type: 'update point',
            plane: getCurrentPositionPlane(position3DToVec3(geometry[e])),
            updatePoint(p) {
              setPreview(produce(state[selected], draft => {
                if (draft.geometry.type === 'triangle') {
                  draft.geometry[e] = p
                }
              }))
            },
          })
        }}>update</Button>
      }
    }
    for (const f of ['x', 'y', 'z'] as const) {
      propertyPanels[`position ${f}`] = <NumberEditor
        value={state[selected].position[f]}
        setValue={v => {
          setState(draft => {
            draft[selected].position[f] = v
          })
        }}
      />
    }
    propertyPanels.position = <Button onClick={() => {
      setStatus({
        type: 'update point',
        plane: getCurrentPositionPlane(position3DToVec3(state[selected].position)),
        updatePoint(p) {
          setPreview(produce(state[selected], draft => {
            draft.position = p
          }))
        },
      })
    }}>update</Button>
    panel = (
      <div style={{ position: 'absolute', right: '0px', top: '40px', bottom: '0px', width: '360px', overflowY: 'auto', background: 'white' }}>
        <ObjectEditor inline properties={propertyPanels} />
      </div>
    )
  }
  const render = (g: Nullable<Graphic3d>[]) => {
    renderer.current?.render?.(
      g,
      {
        eye,
        up: position3DToVec3(up),
        target: targetPosition,
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
  }
  const getGraphic = (s: State): Graphic3d => graphicCache.current.get(s, () => {
    if (s.geometry.type === 'point') {
      return {
        geometry: {
          type: 'lines',
          points: [...position3DToVec3(s.position), ...position3DToVec3(s.geometry.position)],
        },
        color: s.color,
      }
    }
    if (s.geometry.type === 'triangle') {
      return {
        geometry: {
          type: 'triangles',
          points: [...position3DToVec3(s.position), ...position3DToVec3(s.geometry.p1), ...position3DToVec3(s.geometry.p2)],
        },
        color: s.color,
      }
    }
    if (s.geometry.type === 'line strip') {
      return {
        geometry: {
          type: 'line strip',
          points: s.geometry.points.flat(),
        },
        color: s.color,
      }
    }
    return {
      geometry: s.geometry,
      color: s.color,
      position: position3DToVec3(s.position),
    }
  })

  React.useEffect(() => {
    const graphics = [...state.map((s, i) => {
      if (hovering === i || selected === i) {
        s = hoveringContentCache.current.get(s, () => {
          return produce(s, draft => {
            draft.color[3] *= 0.5
          })
        })
      }
      return getGraphic(s)
    })]
    graphics.push(...axis.current)
    if (preview) {
      graphics.push(getGraphic(preview))
    }
    render(graphics)
  }, [state, preview, hovering, selected, x, y, scale, width, height])

  return (
    <div
      ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}
      style={{
        position: 'absolute',
        inset: '0px',
        cursor: hoveringGridPoint ? 'pointer' : undefined,
      }}
    >
      <canvas
        ref={ref}
        width={width}
        height={height}
        onMouseMove={e => {
          if (!status && selected !== undefined && renderer.current) {
            const info = renderer.current.pickingDrawObjectsInfo[selected]
            const content = state[selected]
            if (info && content) {
              const p = reverse3dPosition(e.clientX, e.clientY, renderer.current.canvas, info.reversedProjection)
              const points = [{
                point: content.position,
                updatePoint(draft: State, p: Position3D) {
                  draft.position = p
                },
              }]
              if (content.geometry.type === 'point') {
                points.push({
                  point: content.geometry.position,
                  updatePoint(draft: State, p: Position3D) {
                    if (draft.geometry.type === 'point') {
                      draft.geometry.position = p
                    }
                  },
                })
              } else if (content.geometry.type === 'triangle') {
                points.push(
                  {
                    point: content.geometry.p1,
                    updatePoint(draft: State, p: Position3D) {
                      if (draft.geometry.type === 'triangle') {
                        draft.geometry.p1 = p
                      }
                    },
                  },
                  {
                    point: content.geometry.p2,
                    updatePoint(draft: State, p: Position3D) {
                      if (draft.geometry.type === 'triangle') {
                        draft.geometry.p2 = p
                      }
                    },
                  },
                )
              }
              for (const point of points) {
                const distance = getPerpendicularDistanceToLine3D(position3DToVec3(point.point), p, v3.substract(eye, p))
                if (distance < 3) {
                  setHoveringGripPoint(point)
                  return
                }
              }
              setHoveringGripPoint(undefined)
            }
          }
          if (!status || status === 'intersect') {
            const index = renderer.current?.pick(e.clientX, e.clientY)
            setHovering(index)
            return
          }
          if (renderer.current) {
            const info = renderer.current.pickingDrawObjectsInfo[0]
            if (info) {
              if (typeof status !== 'string') {
                if (status.type === 'update point') {
                  const target = renderer.current.getTarget(e.clientX, e.clientY, eye, status.plane, info.reversedProjection)
                  if (target) {
                    status.updatePoint(vec3ToPosition3D(target))
                  }
                  return
                }
              }
              const target = renderer.current.getTarget(e.clientX, e.clientY, eye, getCurrentPositionPlane(), info.reversedProjection)
              if (!target) return
              const color = colorNumberToVec(colorRef.current, opacityRef.current)
              const position = vec3ToPosition3D(target)
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
              } else if (status === 'cylinder') {
                setPreview({
                  geometry: {
                    type: 'cylinder',
                    radius: sizeRef.current,
                    height: sizeRef.current,
                  },
                  color,
                  position,
                })
              } else if (status === 'cone') {
                setPreview({
                  geometry: {
                    type: 'cone',
                    topRadius: 0,
                    bottomRadius: sizeRef.current,
                    height: sizeRef.current * 2,
                  },
                  color,
                  position,
                })
              }
              if (typeof status === 'string') return
              if (status.type === 'line start') {
                setStatus({ ...status, position })
              } else if (status.type === 'line end') {
                setPreview({
                  geometry: {
                    type: 'point',
                    position: status.position,
                  },
                  color,
                  position,
                })
              } else if (status.type === 'plane 1st point') {
                setStatus({ ...status, p1: position })
              } else if (status.type === 'plane 2nd point') {
                setStatus({ ...status, p2: position })
                {
                  setPreview({
                    geometry: {
                      type: 'point',
                      position: status.p1,
                    },
                    color,
                    position,
                  })
                }
              } else if (status.type === 'plane 3rd point') {
                {
                  setPreview({
                    geometry: {
                      type: 'triangle',
                      p1: status.p1,
                      p2: status.p2,
                    },
                    color,
                    position,
                  })
                }
              }
            }
          }
        }}
        onMouseDown={() => {
          if (!status) {
            if (selected !== undefined && hoveringGridPoint) {
              const content = state[selected]
              if (content) {
                setStatus({
                  type: 'update point',
                  plane: getCurrentPositionPlane(position3DToVec3(hoveringGridPoint.point)),
                  updatePoint(p) {
                    setPreview(produce(content, draft => {
                      hoveringGridPoint.updatePoint(draft, p)
                    }))
                  },
                })
                return
              }
            }
            if (hovering !== undefined) {
              setSelected(hovering)
            }
            return
          }
          if (typeof status !== 'string' && status.type === 'plane 2nd point' && status.p2) {
            setStatus({
              type: 'plane 3rd point',
              p1: status.p1,
              p2: status.p2,
            })
            return
          }
          if (preview) {
            if (
              typeof status !== 'string' &&
              status.type === 'update point' &&
              selected !== undefined) {
              setState(draft => {
                draft[selected] = preview
              })
              setStatus(undefined)
            } else {
              setState(draft => {
                draft.push(preview)
              })
            }
            setPreview(undefined)
            if (typeof status !== 'string' && (status.type === 'line end' || status.type === 'plane 3rd point')) {
              setStatus(undefined)
            }
          } else if (typeof status !== 'string' && status.type === 'line start' && status.position) {
            setStatus({
              type: 'line end',
              position: status.position
            })
          } else if (typeof status !== 'string' && status.type === 'plane 1st point' && status.p1) {
            setStatus({
              type: 'plane 2nd point',
              p1: status.p1
            })
          } else if (status === 'intersect') {
            if (
              hovering !== undefined &&
              selected !== undefined &&
              hovering !== selected
            ) {
              const state1 = state[hovering]
              const state2 = state[selected]
              let points: Vec3[] | undefined
              let lines: Vec3[] | undefined
              if (state1.geometry.type === 'point') {
                if (state2.geometry.type === 'point') {
                  const p = getTwoLine3DIntersectionPoint(
                    ...getLine(state1.geometry, state1.position),
                    ...getLine(state2.geometry, state2.position),
                  )
                  if (p) {
                    points = [p]
                  }
                } else if (state2.geometry.type === 'sphere') {
                  points = getLineAndSphereIntersectionPoints(
                    getLine(state1.geometry, state1.position),
                    getSphere(state2.geometry, state2.position),
                  )
                } else if (state2.geometry.type === 'cylinder') {
                  points = getLineAndCylinderIntersectionPoints(
                    getLine(state1.geometry, state1.position),
                    getCylinder(state2.geometry, state2.position)
                  )
                } else if (state2.geometry.type === 'cone') {
                  points = getLineAndConeIntersectionPoints(
                    getLine(state1.geometry, state1.position),
                    getCone(state2.geometry, state2.position),
                  )
                } else if (state2.geometry.type === 'triangle') {
                  const plane = getPlane(state2.geometry, state2.position)
                  if (plane) {
                    const p = getLineAndPlaneIntersectionPoint(getLine(state1.geometry, state1.position), plane)
                    if (p) {
                      points = [p]
                    }
                  }
                } else if (state2.geometry.type === 'cube') {
                  const triangles = getCube(state2.geometry, state2.position)
                  points = getLineAndTrianglesIntersectionPoint(getLine(state1.geometry, state1.position), triangles)
                }
              } else if (state1.geometry.type === 'sphere') {
                if (state2.geometry.type === 'point') {
                  points = getLineAndSphereIntersectionPoints(
                    getLine(state2.geometry, state2.position),
                    getSphere(state1.geometry, state1.position),
                  )
                } else if (state2.geometry.type === 'triangle') {
                  const plane = getPlane(state2.geometry, state2.position)
                  if (plane) {
                    lines = getPlaneSphereIntersection(plane, getSphere(state1.geometry, state1.position))
                  }
                } else if (state2.geometry.type === 'sphere') {
                  lines = getTwoSpheresIntersection(
                    getSphere(state1.geometry, state1.position),
                    getSphere(state2.geometry, state2.position),
                  )
                }
              } else if (state1.geometry.type === 'cylinder') {
                if (state2.geometry.type === 'point') {
                  points = getLineAndCylinderIntersectionPoints(
                    getLine(state2.geometry, state2.position),
                    getCylinder(state1.geometry, state1.position),
                  )
                } else if (state2.geometry.type === 'triangle') {
                  const plane = getPlane(state2.geometry, state2.position)
                  if (plane) {
                    lines = getPlaneCylinderIntersection(plane, getCylinder(state1.geometry, state1.position))
                  }
                }
              } else if (state1.geometry.type === 'cone') {
                if (state2.geometry.type === 'point') {
                  points = getLineAndConeIntersectionPoints(
                    getLine(state2.geometry, state2.position),
                    getCone(state1.geometry, state1.position),
                  )
                }
              } else if (state1.geometry.type === 'triangle') {
                if (state2.geometry.type === 'point') {
                  const plane = getPlane(state1.geometry, state1.position)
                  if (plane) {
                    const p = getLineAndPlaneIntersectionPoint(getLine(state2.geometry, state2.position), plane)
                    if (p) {
                      points = [p]
                    }
                  }
                } else if (state2.geometry.type === 'sphere') {
                  const plane = getPlane(state1.geometry, state1.position)
                  if (plane) {
                    lines = getPlaneSphereIntersection(plane, getSphere(state2.geometry, state2.position))
                  }
                } else if (state2.geometry.type === 'cylinder') {
                  const plane = getPlane(state1.geometry, state1.position)
                  if (plane) {
                    lines = getPlaneCylinderIntersection(plane, getCylinder(state2.geometry, state2.position))
                  }
                }
              } else if (state1.geometry.type === 'cube') {
                if (state2.geometry.type === 'point') {
                  const triangles = getCube(state1.geometry, state1.position)
                  points = getLineAndTrianglesIntersectionPoint(getLine(state2.geometry, state2.position), triangles)
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
              if (lines && lines.length > 0) {
                setState(draft => {
                  draft.push({
                    geometry: {
                      type: 'line strip',
                      points: lines,
                    },
                    color: [0, 1, 0, 1],
                    position: { x: 0, y: 0, z: 0 },
                  })
                })
                setStatus(undefined)
              }
            }
          }
        }}
      />
      <div style={{ position: 'absolute', top: '0px' }}>
        {(['cube', 'sphere', 'cylinder', 'cone'] as const).map(s => <Button key={s} style={{ color: status === s ? 'red' : undefined }} onClick={() => setStatus(s)}>{s}</Button>)}
        <Button style={{ color: typeof status !== 'string' && status?.type === 'line start' ? 'red' : undefined }} onClick={() => setStatus({ type: 'line start' })}>line</Button>
        <Button style={{ color: typeof status !== 'string' && status?.type === 'plane 1st point' ? 'red' : undefined }} onClick={() => setStatus({ type: 'plane 1st point' })}>plane</Button>
        {selected !== undefined && <Button onClick={() => {
          setState(draft => {
            draft.splice(selected, 1)
          })
          setSelected(undefined)
        }}>delete</Button>}
        {selected !== undefined && <Button onClick={() => setStatus('intersect')}>intersect</Button>}
        <NumberEditor
          value={distanceRef.current}
          style={{ width: '50px', position: 'relative' }}
          setValue={v => {
            distanceRef.current = v
          }}
        />
        <NumberEditor
          value={sizeRef.current}
          style={{ width: '40px', position: 'relative' }}
          setValue={v => {
            sizeRef.current = v
          }}
        />
        <NumberEditor
          value={opacityRef.current * 100}
          style={{ width: '50px', position: 'relative' }}
          setValue={v => {
            opacityRef.current = v * 0.01
          }}
        />
        <NumberEditor
          value={colorRef.current}
          type='color'
          style={{ width: '50px', position: 'relative' }}
          setValue={v => {
            colorRef.current = v
          }}
        />
      </div>
      {panel}
    </div>
  )
}

type Status = 'cube' | 'sphere' | 'cylinder' | 'cone' | {
  type: 'line start'
  position?: Position3D
} | {
  type: 'line end'
  position: Position3D
} | 'intersect' | {
  type: 'plane 1st point'
  p1?: Position3D
} | {
  type: 'plane 2nd point'
  p1: Position3D
  p2?: Position3D
} | {
  type: 'plane 3rd point'
  p1: Position3D
  p2: Position3D
} | {
  type: 'update point'
  plane: GeneralFormPlane
  updatePoint: (p: Position3D) => void
}

interface State {
  geometry: SphereGeometry | CubeGeometry | CylinderGeometry | ConeGeometry | {
    type: 'point'
    position: Position3D
  } | {
    type: 'triangle'
    p1: Position3D
    p2: Position3D
  } | {
    type: 'line strip'
    points: Vec3[]
  }
  color: Vec4
  position: Position3D
}

function getCube(geometry: CubeGeometry, position: Position3D): Tuple3<Vec3>[] {
  return getVerticesTriangles(twgl.primitives.createCubeVertices(geometry.size), position3DToVec3(position))
}

function getLine(geometry: { position: Position3D }, position: Position3D): [Vec3, Vec3] {
  const p = position3DToVec3(position)
  return [p, v3.substract(position3DToVec3(geometry.position), p)]
}

function getPlane(geometry: { p1: Position3D, p2: Position3D }, position: Position3D): GeneralFormPlane | undefined {
  return getThreePointPlane(
    position3DToVec3(position),
    position3DToVec3(geometry.p1),
    position3DToVec3(geometry.p2),
  )
}

function getCylinder(geometry: CylinderGeometry, position: Position3D): Cylinder {
  return {
    base: position3DToVec3(position),
    radius: geometry.radius,
    direction: [0, 1, 0],
    height1: -geometry.height / 2,
    height2: geometry.height / 2,
  }
}

function getSphere(geometry: SphereGeometry, position: Position3D): Sphere {
  return {
    radius: geometry.radius,
    ...position,
  }
}

function getCone(geometry: ConeGeometry, position: Position3D): Cone {
  return {
    base: [position.x, position.y + geometry.height / 2, position.z],
    radiusHeightRate: geometry.bottomRadius / geometry.height,
    direction: [0, 1, 0],
    height1: 0,
    height2: geometry.height,
  }
}
