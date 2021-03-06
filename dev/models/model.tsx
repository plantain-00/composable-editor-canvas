import React from 'react'
import { Circle, EditPoint, GeneralFormLine, getPointsBounding, iterateIntersectionPoints, Position, ReactRenderTarget, TwoPointsFormRegion, WeakmapCache, WeakmapCache2, zoomToFit } from '../../src'
import { isArcContent } from './arc-model'
import { isBlockContent } from './block-model'
import { isCircleContent } from './circle-model'
import { LineContent } from './line-model'

export interface BaseContent<T extends string = string> {
  type: T
}

export interface StrokeBaseContent<T extends string = string> extends BaseContent<T> {
  dashArray?: number[]
  strokeColor?: number
}

export interface FillFields {
  fillColor?: number
}

export interface Model<T> {
  type: string
  move?(content: Omit<T, 'type'>, offset: Position): void
  rotate?(content: Omit<T, 'type'>, center: Position, angle: number, contents: readonly BaseContent[]): void
  explode?(content: Omit<T, 'type'>, contents: readonly BaseContent[]): BaseContent[]
  break?(content: Omit<T, 'type'>, intersectionPoints: Position[]): BaseContent[] | undefined
  mirror?(content: Omit<T, 'type'>, line: GeneralFormLine, angle: number, contents: readonly BaseContent[]): void
  deletable?(content: Omit<T, 'type'>, contents: readonly BaseContent[]): boolean
  getDefaultColor?(content: Omit<T, 'type'>): number | undefined
  render?<V>(props: {
    content: Omit<T, 'type'>
    color: number
    target: ReactRenderTarget<V>
    strokeWidth: number
    contents: readonly BaseContent[]
  }): V
  renderIfSelected?<V>(props: { content: Omit<T, 'type'>, color: number, target: ReactRenderTarget<V>, strokeWidth: number }): V
  getOperatorRenderPosition?(content: Omit<T, 'type'>, contents: readonly BaseContent[]): Position
  getEditPoints?(content: Omit<T, 'type'>, contents: readonly BaseContent[]): {
    editPoints: EditPoint<BaseContent>[]
    angleSnapStartPoint?: Position
  } | undefined
  getSnapPoints?(content: Omit<T, 'type'>, contents: readonly BaseContent[]): SnapPoint[]
  getGeometries?(content: Omit<T, 'type'>, contents?: readonly BaseContent[]): Geometries
  getCircle?(content: Omit<T, 'type'>): { circle: Circle, bounding: TwoPointsFormRegion }
  canSelectPart?: boolean
  fill?(content: Omit<T, 'type'>, color: number): void
}

export type SnapPoint = Position & { type: 'endpoint' | 'midpoint' | 'center' | 'intersection' }

const modelCenter: Record<string, Model<BaseContent>> = {}

export function getModel(type: string): Model<BaseContent> | undefined {
  return modelCenter[type]
}

export function registerModel<T extends BaseContent>(model: Model<T>) {
  modelCenter[model.type] = model
}

export interface Geometries {
  lines: [Position, Position][]
  points: Position[]
  bounding?: TwoPointsFormRegion
  regions?: {
    points: Position[]
    lines: [Position, Position][]
  }[]
  renderingLines?: Position[][]
}

const geometriesCache = new WeakmapCache<Omit<BaseContent, 'type'>, Geometries>()
const snapPointsCache = new WeakmapCache<Omit<BaseContent, 'type'>, SnapPoint[]>()
const editPointsCache = new WeakmapCache<Omit<BaseContent, 'type'>, { editPoints: EditPoint<BaseContent>[], angleSnapStartPoint?: Position } | undefined>()

export const getGeometriesFromCache = geometriesCache.get.bind(geometriesCache)
export const getSnapPointsFromCache = snapPointsCache.get.bind(snapPointsCache)
export const getEditPointsFromCache = editPointsCache.get.bind(editPointsCache)

const intersectionPointsCache = new WeakmapCache2<BaseContent, BaseContent, Position[]>()
export function getIntersectionPoints(content1: BaseContent, content2: BaseContent, contents: readonly BaseContent[]) {
  return intersectionPointsCache.get(content1, content2, () => Array.from(iterateIntersectionPoints(content1, content2, contents, getContentModel)))
}

export function getContentModel(content: BaseContent) {
  return getModel(content.type)
}

export function getAngleSnap(angle: number) {
  const snap = Math.round(angle / 45) * 45
  if (snap !== angle && Math.abs(snap - angle) < 5) {
    return snap
  }
  return undefined
}

export const fixedInputStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '10px',
  left: '25%',
  transform: 'translate(-50%, 0px)',
}

export function getContentByIndex(state: readonly BaseContent[], index: readonly number[]) {
  const content = state[index[0]]
  if (index.length === 1) {
    return content
  }
  const line = getModel(content.type)?.getGeometries?.(content)?.lines?.[index[1]]
  if (line) {
    return { type: 'line', points: line } as LineContent
  }
  return undefined
}

export function getNextId(contents: BaseContent[]) {
  let id = 1
  contents.forEach((content) => {
    if (isBlockContent(content)) {
      id = Math.max(id, content.id + 1)
    } else if (isCircleContent(content) || isArcContent(content)) {
      if (content.id) {
        id = Math.max(id, content.id + 1)
      }
    }
  })
  return id
}

export function zoomContentsToFit(
  width: number,
  height: number,
  editingContent: readonly BaseContent[],
  state: readonly BaseContent[],
  paddingScale = 0.8,
) {
  const points: Position[] = []
  editingContent.forEach((c) => {
    const model = getModel(c.type)
    if (model?.getCircle) {
      const { bounding } = model.getCircle(c)
      points.push(bounding.start, bounding.end)
    } else if (model?.getGeometries) {
      const { bounding } = model.getGeometries(c, state)
      if (bounding) {
        points.push(bounding.start, bounding.end)
      }
    }
  })
  const bounding = getPointsBounding(points)
  if (!bounding) {
    return
  }
  const result = zoomToFit(bounding, { width, height }, { x: width / 2, y: height / 2 }, paddingScale)
  if (!result) {
    return
  }
  return {
    bounding,
    ...result,
  }
}
