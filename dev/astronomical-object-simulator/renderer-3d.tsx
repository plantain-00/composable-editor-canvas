import React from 'react';
import { v3 } from 'twgl.js'
import { getAxesGraphics, colorNumberToVec, createWebgl3DRenderer, getDashedLine, Graphic3d, MapCache, Nullable, Position, updateCamera, WeakmapCache, angleToRadian, position3DToVec3 } from '../../src';
import { BaseContent, isSphereContent, SphereContent } from './model';

export const Renderer3d = React.forwardRef((props: {
  x: number
  y: number
  scale: number
  rotateX: number
  rotateY: number
  width: number
  height: number
  hovering?: number
  selected?: number
  contents: readonly Nullable<BaseContent>[]
} & React.HTMLAttributes<HTMLOrSVGElement>, ref: React.ForwardedRef<Renderer3dRef>) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const renderer = React.useRef<ReturnType<typeof createWebgl3DRenderer>>()
  const sphereGeometryCache = React.useRef(new MapCache<number, Graphic3d['geometry']>())
  const speedGeometryCache = React.useRef(new WeakmapCache<SphereContent, Graphic3d['geometry']>())
  const accelerationGeometryCache = React.useRef(new WeakmapCache<SphereContent, Graphic3d['geometry']>())

  React.useEffect(() => {
    if (!canvasRef.current) return
    renderer.current = createWebgl3DRenderer(canvasRef.current)
  }, [canvasRef.current])

  React.useEffect(() => {
    if (!renderer.current) return
    const graphics: Nullable<Graphic3d>[] = []
    const assistentGraphics: Nullable<Graphic3d>[] = [...getAxesGraphics()]
    const { position, up } = updateCamera(-props.x, props.y, 1000 / props.scale, -0.3 * props.rotateX, -0.3 * props.rotateY)
    props.contents.forEach((content, i) => {
      if (content && isSphereContent(content)) {
        const color = colorNumberToVec(content.color)
        if (props.hovering === i || props.selected === i) {
          color[3] = 0.5
        }
        graphics.push({
          geometry: sphereGeometryCache.current.get(content.radius, () => ({
            type: 'sphere',
            radius: content.radius,
          })),
          color,
          position: position3DToVec3(content),
        })
        const start = v3.create(content.x, content.y, content.z)
        const speed = v3.create(content.speed.x, content.speed.y, content.speed.z)
        const speedEnd = v3.add(start, v3.mulScalar(v3.normalize(speed), v3.length(speed) + content.radius))
        assistentGraphics.push({
          geometry: speedGeometryCache.current.get(content, () => ({
            type: 'lines',
            points: [...start, ...speedEnd],
          })),
          color,
        })
        if (content.acceleration) {
          const acceleration = v3.create(content.acceleration.x, content.acceleration.y, content.acceleration.z)
          const accelerationEnd = v3.add(start, v3.mulScalar(v3.normalize(acceleration), v3.length(acceleration) + content.radius))
          assistentGraphics.push({
            geometry: accelerationGeometryCache.current.get(content, () => ({
              type: 'lines',
              points: getDashedLine([start[0], start[1], start[2]], [accelerationEnd[0], accelerationEnd[1], accelerationEnd[2]], 6).flat(),
            })),
            color,
          })
        }
      } else {
        graphics.push(undefined)
      }
    })
    graphics.push(...assistentGraphics)
    renderer.current.render(
      graphics,
      {
        eye: position3DToVec3(position),
        up: position3DToVec3(up),
        target: [-props.x, props.y, 0],
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
  }, [props.x, props.y, props.scale, props.rotateX, props.rotateY, props.contents, props.hovering, props.selected, props.width, props.height])

  React.useImperativeHandle<Renderer3dRef, Renderer3dRef>(ref, () => ({
    getContentByPosition(position: Position) {
      return renderer.current?.pick?.(position.x, position.y, (g) => g.geometry.type === 'sphere')
    },
  }), [])

  return (
    <canvas ref={canvasRef} width={props.width} height={props.height} onClick={props.onClick} onMouseDown={props.onMouseDown} />
  )
})

export interface Renderer3dRef {
  getContentByPosition(position: Position): number | undefined
}
