import { getArrow, getPointByLengthAndAngle, getTwoPointsDistance, Position, ReactRenderTarget } from "../../src";

export interface BaseContent<T extends string = string> {
  type: T
}

export interface RenderContext<V> {
  target: ReactRenderTarget<V>
  transformRadius: (radius: number) => number,
}

export type Model<T> = {
  type: string
  render?<V>(content: T, ctx: RenderContext<V>): V
}

export interface Position3D extends Position {
  z: number
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
  render(content, { target, transformRadius }) {
    const radius = transformRadius(content.radius)
    const circle = target.renderCircle(content.x, content.y, radius, { fillColor: content.color, strokeWidth: 0 })
    const children = [circle]
    if (content.speed.x || content.speed.y) {
      const p = getPointByLengthAndAngle(content, content.radius + getTwoPointsDistance(content.speed), Math.atan2(content.speed.y, content.speed.x))
      const { arrowPoints, endPoint } = getArrow(content, p, 10, 15)
      children.push(
        target.renderPolyline([content, endPoint], { strokeColor: content.color }),
        target.renderPolygon(arrowPoints, { fillColor: content.color, strokeWidth: 0 })
      )
    }
    if (content.acceleration) {
      if (content.acceleration.x || content.acceleration.y) {
        const p = getPointByLengthAndAngle(content, content.radius + getTwoPointsDistance(content.acceleration), Math.atan2(content.acceleration.y, content.acceleration.x))
        const { arrowPoints, endPoint } = getArrow(content, p, 10, 15)
        children.push(
          target.renderPolyline([content, endPoint], { strokeColor: content.color, dashArray: [5] }),
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
