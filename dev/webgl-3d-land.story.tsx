import * as React from "react"
import * as verb from 'verb-nurbs-web'
import { produce } from 'immer'
import { createWebgl3DRenderer, Graphic3d, useWindowSize, angleToRadian, getNurbsSurfaceVertices, Vec3, Menu, useGlobalKeyDown, Nullable, getDefaultNurbsKnots, NumberEditor, Button, useUndoRedo, metaKeyIfMacElseCtrlKey } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<ReturnType<typeof createWebgl3DRenderer>>()
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const [point, setPoint] = React.useState<Vec3>()
  const eye: Vec3 = [0, -90, 90]
  const count = 10
  const step = 5
  const minZ = -100
  const zStep = 5
  const degree = 3
  const { state, setState, undo, redo } = useUndoRedo<Graphic3d[]>(getInitialData(getMapPoints(step, count), degree))
  const [contextMenu, setContextMenu] = React.useState<JSX.Element>()
  const [status, setStatus] = React.useState<'up' | 'down' | 'set'>()
  const [z, setZ] = React.useState(5)

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
    render([...state, ...pointGraphics])
  }, [point, state])

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
          if (status) {
            setPoint(undefined)
            return
          }
          setPoint(renderer.current?.pickPoint?.(e.clientX, e.clientY, eye, minZ, g => g.geometry.type === 'vertices'))
        }}
        onMouseDown={e => {
          if (!status) return
          const geometry = state[0].geometry
          if (geometry.type === 'vertices') {
            const p = renderer.current?.pickPoint?.(e.clientX, e.clientY, eye, minZ, g => g.geometry.type === 'vertices')
            if (p) {
              const x = Math.round(p[0] / step) + count
              if (x >= 0 && x < geometry.points.length) {
                const y = Math.round(p[1] / step) + count
                if (y >= 0 && y < geometry.points.length) {
                  const newPoints = produce(geometry.points, draft => {
                    const point = draft[x][y]
                    if (status === 'set') {
                      point[2] = z
                    } else if (status === 'up') {
                      point[2] += zStep
                    } else if (point[2] - zStep < minZ) {
                      return
                    } else {
                      point[2] -= zStep
                    }
                  })
                  if (newPoints !== geometry.points) {
                    setState(() => getInitialData(newPoints, degree))
                  }
                }
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
          setContextMenu(
            <Menu
              items={[
                {
                  title: 'up',
                  onClick() {
                    setStatus('up')
                    setContextMenu(undefined)
                  },
                },
                {
                  title: 'down',
                  onClick() {
                    setStatus('down')
                    setContextMenu(undefined)
                  },
                },
                {
                  title: (
                    <>
                      <NumberEditor
                        value={z}
                        style={{ width: '50px' }}
                        setValue={setZ}
                      />
                      <Button
                        onClick={() => {
                          setStatus('set')
                          setContextMenu(undefined)
                        }}
                      >set</Button>
                    </>
                  ),
                  height: 41,
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

function getMapPoints(step: number, count: number) {
  const result: Vec3[][] = []
  for (let x = -count; x <= count; x++) {
    const i = x * step
    const row: Vec3[] = []
    for (let j = -count; j <= count; j++) {
      row.push([i, j * step, 0])
    }
    result.push(row)
  }
  return result
}

function getInitialData(points: Vec3[][], degree: number) {
  const nurbs = getNurbsSurfaceVertices(points, degree)
  const result: Graphic3d[] = [
    {
      geometry: {
        type: 'vertices',
        ...nurbs,
      },
      color: [0, 1, 0, 1],
    },
  ]
  const knots = getDefaultNurbsKnots(points.length, degree)
  for (let i = 0; i < points.length; i++) {
    const row = points[i]
    const rowCurve = verb.geom.NurbsCurve.byKnotsControlPointsWeights(degree, knots, row)
    result.push({
      color: [0, 0, 1, 1],
      geometry: {
        type: 'lines',
        points: rowCurve.tessellate().map(p => [p[0], p[1], p[2] + 0.1]).flat(),
      }
    })

    const column = points.map(p => p[i])
    const columnCurve = verb.geom.NurbsCurve.byKnotsControlPointsWeights(degree, knots, column)
    result.push({
      color: [0, 0, 1, 1],
      geometry: {
        type: 'lines',
        points: columnCurve.tessellate().map(p => [p[0], p[1], p[2] + 0.1]).flat(),
      }
    })
  }
  return result
}
