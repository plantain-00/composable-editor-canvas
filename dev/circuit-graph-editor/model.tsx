import { Nullable, Position, ReactRenderTarget, TwoPointsFormRegion, WeakmapCache3 } from "../../src";

export interface BaseContent<T extends string = string> {
  type: T
}

export interface DevicePositionFields {
  start: number | JunctionContent
  end: number | JunctionContent
}

export type BaseDevice<T extends string = string> = BaseContent<T> & DevicePositionFields

export interface RenderContext<V> {
  target: ReactRenderTarget<V>
  transformStrokeWidth: (strokeWidth: number) => number,
  contents: readonly Nullable<BaseContent>[]
}

export type Model<T> = {
  type: string
  render?<V>(content: T, ctx: RenderContext<V>): V
  createPreview?(p: DevicePositionFields): T
}

export type JunctionContent = BaseContent<'junction'> & {
  position: Position
}

export type CircleContent = BaseContent<'circle'> & Position & {
  radius: number
}

export function isJunctionContent(content: BaseContent): content is JunctionContent {
  return content.type === 'junction'
}

export const junctionModel: Model<JunctionContent> = {
  type: 'junction',
  render(content, { target, transformStrokeWidth }) {
    const radius = transformStrokeWidth(3)
    return target.renderCircle(content.position.x, content.position.y, radius, { fillColor: 0x000000 })
  },
}

export const circleModel: Model<CircleContent> = {
  type: 'circle',
  render(content, { target }) {
    return target.renderCircle(content.x, content.y, content.radius)
  },
}

export interface Geometries {
  lines: [Position, Position][]
  bounding?: TwoPointsFormRegion
}

export const deviceGeometryCache = new WeakmapCache3<Omit<BaseDevice, 'type'>, JunctionContent, JunctionContent, Geometries>()

export function getReference<T extends BaseContent>(
  id: number | BaseContent,
  contents: readonly Nullable<BaseContent>[],
  filter: (content: BaseContent) => content is T,
) {
  if (typeof id !== 'number') {
    if (filter(id)) {
      return id
    }
    return
  }
  const content = contents[id]
  if (content && filter(content)) {
    return content
  }
  return
}

export const modelCenter: Record<string, Model<BaseContent>> = {}

export function registerModel<T extends BaseContent>(model: Model<T>) {
  modelCenter[model.type] = model
}

export function getContentModel(content: BaseContent): Model<BaseContent> | undefined {
  return modelCenter[content.type]
}

registerModel(junctionModel)
registerModel(circleModel)
