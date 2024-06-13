import * as React from "react"
import { createWebgl3DRenderer, Graphic3d, useWindowSize, angleToRadian, getNurbsSurfaceVertices, Vec3, Menu, useGlobalKeyDown, Nullable } from "../src"

export default () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<ReturnType<typeof createWebgl3DRenderer>>()
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const [point, setPoint] = React.useState<Vec3>()
  const eye: Vec3 = [0, -90, 90]
  const graphics = React.useRef<Graphic3d[]>([
    {
      geometry: {
        type: 'vertices',
        ...getNurbsSurfaceVertices(getMapPoints(), 3),
      },
      color: [0, 1, 0, 1],
    },
  ])
  const [contextMenu, setContextMenu] = React.useState<JSX.Element>()
  const [status, setStatus] = React.useState<'up' | 'down'>()

  React.useEffect(() => {
    if (!ref.current) {
      return
    }
    renderer.current = createWebgl3DRenderer(ref.current)
  }, [ref.current])

  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
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
    render([...graphics.current, ...pointGraphics])
  }, [point])

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
          setPoint(renderer.current?.pickPoint?.(e.clientX, e.clientY, eye, -100, g => g.geometry.type === 'vertices'))
        }}
        onMouseDown={e => {
          if (!status) return
          const geometry = graphics.current[0].geometry
          if (geometry.type === 'vertices') {
            const p = renderer.current?.pickPoint?.(e.clientX, e.clientY, eye, -100, g => g.geometry.type === 'vertices')
            if (p) {
              const x = Math.round(p[0] / 5) * 5
              const y = Math.round(p[1] / 5) * 5
              for (let i = 0; i < geometry.points.length; i++) {
                const row = geometry.points[i]
                for (let j = 0; j < row.length; j++) {
                  if (row[j][0] === x && row[j][1] === y) {
                    if (status === 'up') {
                      row[j][2] += 10
                    } else {
                      row[j][2] -= 10
                    }
                    graphics.current = [
                      {
                        ...graphics.current[0],
                        geometry: {
                          type: 'vertices',
                          ...getNurbsSurfaceVertices(geometry.points, 3),
                        }
                      }
                    ]
                    render(graphics.current)
                    return
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

function getMapPoints() {
  const result: Vec3[][] = []
  for (let i = -50; i <= 50; i += 5) {
    const row: Vec3[] = []
    for (let j = -50; j <= 50; j += 5) {
      row.push([i, j, 0])
    }
    result.push(row)
  }
  return result
}
