import { Position, ReactRenderTarget } from "../../src";

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
}

export function isSphereContent(content: BaseContent): content is SphereContent {
  return content.type === 'sphere'
}

export const sphereModel: Model<SphereContent> = {
  type: 'sphere',
  render(content, { target, transformRadius }) {
    const radius = transformRadius(content.radius)
    return target.renderCircle(content.x, content.y, radius, { fillColor: content.color, strokeWidth: 0 })
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
