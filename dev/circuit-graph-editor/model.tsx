import { produce } from 'immer'
import React from 'react';
import { BooleanEditor, EditPoint, getPointByLengthAndDirection, getTwoPointsRadian, isSamePoint, isZero, Nullable, Position, ReactRenderTarget, rotatePositionByCenter, WeakmapCache, WeakmapCache3 } from "../../src";

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
  value?: number
  equationResult?: number[]
}

export type Model<T> = {
  type: string
  isDevice?: boolean
  render?<V>(content: T, ctx: RenderContext<V>): V
  createPreview?(p: DevicePositionFields): T
  getGeometries?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): Geometries
  icon?: JSX.Element
  getRefIds?(content: T): number[] | undefined
  updateRefId?(content: T, update: (id: number | BaseContent) => number | undefined | JunctionContent): void
  getEditPoints?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): { editPoints: EditPoint<BaseContent>[] } | undefined
  propertyPanel?(
    content: Omit<T, 'type'>,
    update: ContentUpdater,
    contents: readonly Nullable<BaseContent>[],
  ): Record<string, JSX.Element>
  getEquationData?(content: Omit<T, 'type'>, index: number): EquationData
  getAction?(
    p: Position,
    content: Omit<T, 'type'>,
    contents: readonly Nullable<BaseContent>[],
  ): ((update: ContentUpdater) => void) | void
}

export type ContentUpdater = (recipe: (content: BaseContent, contents: readonly Nullable<BaseContent>[]) => void) => void

export interface EquationData {
  left: string
  right: string
}

export const deviceModel: Partial<Model<BaseDevice>> = {
  isDevice: true,
  getRefIds(content) {
    const ids: number[] = []
    if (typeof content.start === 'number') {
      ids.push(content.start)
    }
    if (typeof content.end === 'number') {
      ids.push(content.end)
    }
    return ids
  },
  updateRefId(content, update) {
    const newStart = update(content.start)
    if (newStart !== undefined) {
      content.start = newStart
    }
    const newEnd = update(content.end)
    if (newEnd !== undefined) {
      content.end = newEnd
    }
  },
  getEditPoints(s, contents) {
    return editPointsCache.get(s, () => {
      const points: { field: 'start' | 'end', content: JunctionContent }[] = []
      const start = getReference(s.start, contents, isJunctionContent)
      if (start) {
        points.push({ field: 'start', content: start })
      }
      const end = getReference(s.end, contents, isJunctionContent)
      if (end) {
        points.push({ field: 'end', content: end })
      }
      return {
        editPoints: points.map(({ field, content }) => ({
          x: content.position.x,
          y: content.position.y,
          cursor: 'move',
          update(c, { cursor }) {
            if (!isDeviceContent(c)) return
            const p = contents.findIndex(c => c && isJunctionContent(c) && isSamePoint(c.position, cursor))
            if (p >= 0) {
              c[field] = p
            } else {
              c[field] = {
                type: 'junction',
                position: {
                  x: cursor.x,
                  y: cursor.y,
                },
              }
            }
            return { assistentContents: [{ type: 'line', p1: content.position, p2: cursor } as LineContent] }
          }
        })),
      }
    })
  },
}

export type JunctionContent = BaseContent<'junction'> & {
  position: Position
  ground?: boolean
}

export type CircleContent = BaseContent<'circle'> & Position & {
  radius: number
}

export type LineContent = BaseContent<'line'> & {
  p1: Position
  p2: Position
}

export function isJunctionContent(content: BaseContent): content is JunctionContent {
  return content.type === 'junction'
}

export const junctionModel: Model<JunctionContent> = {
  type: 'junction',
  render(content, { target, transformStrokeWidth }) {
    const radius = transformStrokeWidth(3)
    const children = [
      target.renderCircle(content.position.x, content.position.y, radius, { fillColor: 0x000000 }),
    ]
    if (content.ground) {
      children.push(
        target.renderPolyline([{ x: content.position.x, y: content.position.y + 20 }, { x: content.position.x, y: content.position.y }]),
        target.renderPolyline([{ x: content.position.x - 12, y: content.position.y + 20 }, { x: content.position.x + 12, y: content.position.y + 20 }]),
        target.renderPolyline([{ x: content.position.x - 8, y: content.position.y + 23 }, { x: content.position.x + 8, y: content.position.y + 23 }]),
        target.renderPolyline([{ x: content.position.x - 4, y: content.position.y + 26 }, { x: content.position.x + 4, y: content.position.y + 26 }]),
      )
    }
    return target.renderGroup(children)
  },
  getEditPoints(s) {
    return editPointsCache.get(s, () => ({
      editPoints: [
        {
          x: s.position.x,
          y: s.position.y,
          cursor: 'move',
          update(c, { cursor }) {
            if (!isJunctionContent(c)) return
            c.position.x = cursor.x
            c.position.y = cursor.y
            return { assistentContents: [{ type: 'line', p1: s.position, p2: cursor } as LineContent] }
          }
        },
      ]
    }))
  },
  propertyPanel(content, update) {
    return {
      ground: <BooleanEditor value={content.ground ?? false} setValue={(v) => update(c => { if (isJunctionContent(c)) { c.ground = v ? true : undefined } })} />
    }
  },
}

export const circleModel: Model<CircleContent> = {
  type: 'circle',
  render(content, { target }) {
    return target.renderCircle(content.x, content.y, content.radius)
  },
}

export const lineModel: Model<LineContent> = {
  type: 'line',
  render(content, { target }) {
    return target.renderPolyline([content.p1, content.p2], { dashArray: [4] })
  },
}

export function isDeviceContent(content: BaseContent): content is BaseDevice {
  return !!getContentModel(content)?.isDevice
}

export interface Geometries {
  data?: {
    center: Position
    left: Position
    right: Position
  }
  lines: [Position, Position][]
}

export const deviceGeometryCache = new WeakmapCache3<Omit<BaseDevice, 'type'>, JunctionContent, JunctionContent, Geometries>()
export const editPointsCache = new WeakmapCache<object, { editPoints: EditPoint<BaseContent>[] } | undefined>()

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

export function getContentIndex(content: object, contents: readonly Nullable<BaseContent>[]) {
  return contentIndexCache.get(content, () => {
    return contents.findIndex(c => content === c)
  })
}

export const contentIndexCache = new WeakmapCache<object, number>()

export function updateReferencedContents(
  content: BaseContent,
  newContent: BaseContent,
  contents: readonly Nullable<BaseContent>[],
) {
  const assistentContents: BaseContent[] = []
  if (!isJunctionContent(newContent)) {
    return assistentContents
  }
  const id = getContentIndex(content, contents)
  for (const c of contents) {
    if (!c) continue
    const model = getContentModel(c)
    if (model?.getRefIds?.(c)?.includes(id)) {
      assistentContents.push(produce(c, (draft) => {
        model.updateRefId?.(draft, d => {
          if (d === id) {
            return newContent
          }
          return undefined
        })
      }))
    }
  }
  return assistentContents
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
registerModel(lineModel)

export function contentIsReferenced(id: number, contents: readonly Nullable<BaseContent>[]): boolean {
  for (const content of contents) {
    if (content && getContentModel(content)?.getRefIds?.(content)?.includes(id)) {
      return true
    }
  }
  return false
}

export function getDeviceText<V>(
  data: NonNullable<Geometries['data']>,
  target: ReactRenderTarget<V>,
  text?: string,
  currentValue?: number,
  unit = 'A',
) {
  const angle = Math.abs(getTwoPointsRadian(data.right, data.left)) / Math.PI
  let x = data.center.x
  let y = data.center.y
  let x2 = data.center.x
  let y2 = data.center.y
  let textAlign: 'left' | 'center'
  let textAlign2: 'right' | 'center'
  if (angle > 1 / 4 && angle < 3 / 4) {
    x += 10
    x2 -= 10
    textAlign = 'left'
    textAlign2 = 'right'
  } else {
    y -= 15
    y2 += 15
    textAlign = 'center'
    textAlign2 = 'center'
  }
  const result: V[] = []
  if (text) {
    result.push(target.renderText(x, y, text, 0x000000, 16, 'monospace', { textAlign, textBaseline: 'middle' }))
  }
  if (currentValue !== undefined) {
    const v = isZero(currentValue) ? 0 : +Math.abs(currentValue).toPrecision(3)
    result.push(target.renderText(x2, y2, v + unit, 0x000000, 16, 'monospace', { textAlign: textAlign2, textBaseline: 'middle' }))
    if (!isZero(currentValue) && unit === 'A') {
      const to = currentValue > 0 ? data.right : data.left
      const p1 = getPointByLengthAndDirection(data.center, 12, to)
      const p2 = getPointByLengthAndDirection(data.center, 20, to)
      result.push(target.renderPolyline([
        rotatePositionByCenter(p1, p2, 30),
        p2,
        rotatePositionByCenter(p1, p2, -30),
      ]))
    }
  }
  return result
}
