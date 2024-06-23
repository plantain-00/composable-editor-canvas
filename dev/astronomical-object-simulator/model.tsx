import { getArrow, getPointByLengthAndRadian, getTwoPointsDistance, Position3D, ReactRenderTarget } from "../../src";

export interface BaseContent<T extends string = string> {
  type: T
}

export interface RenderContext<V> {
  target: ReactRenderTarget<V>
  transformRadius: (radius: number) => number
  yz: boolean
}

export type Model<T> = {
  type: string
  render?<V>(content: T, ctx: RenderContext<V>): V
}

export type SphereContent = BaseContent<'sphere'> & Position3D & {
  radius: number
  mass: number
  speed: Position3D
  color: number
  acceleration?: Position3D
}

export function isSphereContent(content: BaseContent): content is SphereContent {
  return content.type === 'sphere'
}

export const sphereModel: Model<SphereContent> = {
  type: 'sphere',
  render(content, { target, transformRadius, yz }) {
    const radius = transformRadius(content.radius)
    const contentX = yz ? content.z : content.x
    const pos = { x: contentX, y: content.y }
    const circle = target.renderCircle(contentX, content.y, radius, { fillColor: content.color, strokeWidth: 0 })
    const children = [circle]
    const speedX = yz ? content.speed.z : content.speed.x
    if (speedX || content.speed.y) {
      const speedPos = { x: speedX, y: content.speed.y }
      const p = getPointByLengthAndRadian(pos, content.radius + getTwoPointsDistance(speedPos), Math.atan2(content.speed.y, speedX))
      const { arrowPoints, endPoint } = getArrow(pos, p, 10, 15)
      children.push(
        target.renderPolyline([pos, endPoint], { strokeColor: content.color }),
        target.renderPolygon(arrowPoints, { fillColor: content.color, strokeWidth: 0 })
      )
    }
    if (content.acceleration) {
      const accelerationX = yz ? content.acceleration.z : content.acceleration.x
      if (accelerationX || content.acceleration.y) {
        const accelerationPos = { x: accelerationX, y: content.acceleration.y }
        const p = getPointByLengthAndRadian(pos, content.radius + getTwoPointsDistance(accelerationPos), Math.atan2(content.acceleration.y, accelerationX))
        const { arrowPoints, endPoint } = getArrow(pos, p, 10, 15)
        children.push(
          target.renderPolyline([pos, endPoint], { strokeColor: content.color, dashArray: [5] }),
          target.renderPolygon(arrowPoints, { fillColor: content.color, strokeWidth: 0 })
        )
      }
    }
    return target.renderGroup(children)
  },
}

export const modelCenter: Record<string, Model<BaseContent>> = {}

export function registerModel<T extends BaseContent>(model: Model<T>) {
  modelCenter[model.type] = model
}

export function getContentModel(content: BaseContent): Model<BaseContent> | undefined {
  return modelCenter[content.type]
}

registerModel(sphereModel)
