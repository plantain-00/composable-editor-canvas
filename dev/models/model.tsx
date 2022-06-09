import React from 'react'
import { Circle, EditPoint, GeneralFormLine, iterateIntersectionPoints, Position, ReactRenderTarget, WeakmapCache, WeakmapCache2 } from '../../src'
import { LineContent } from './line-model'

export interface BaseContent<T extends string = string> {
  type: T
}

export interface StrokeBaseContent<T extends string = string> extends BaseContent<T> {
  dashArray?: number[]
}

export interface Model<T> {
  type: string
  move?(content: Omit<T, 'type'>, offset: Position): void
  rotate?(content: Omit<T, 'type'>, center: Position, angle: number, contents: readonly BaseContent[]): void
  explode?(content: Omit<T, 'type'>, contents: readonly BaseContent[]): BaseContent[]
  break?(content: Omit<T, 'type'>, intersectionPoints: Position[]): BaseContent[] | undefined
  mirror?(content: Omit<T, 'type'>, line: GeneralFormLine, angle: number, contents: readonly BaseContent[]): void
  deletable?(content: Omit<T, 'type'>, contents: readonly BaseContent[]): boolean
  getDefaultColor?(content: Omit<T, 'type'>): number
  render?<V>(props: {
    content: Omit<T, 'type'>
    color: number
    target: ReactRenderTarget<V>
    strokeWidth: number
    contents: readonly BaseContent[]
    partsStyles: readonly { index: number, color: number }[]
  }): V
  renderIfSelected?<V>(props: { content: Omit<T, 'type'>, color: number, target: ReactRenderTarget<V>, strokeWidth: number, scale: number }): V
  getOperatorRenderPosition?(content: Omit<T, 'type'>, contents: readonly BaseContent[]): Position
  getEditPoints?(content: Omit<T, 'type'>, contents: readonly BaseContent[]): {
    editPoints: EditPoint<BaseContent>[]
    angleSnapStartPoint?: Position
  } | undefined
  getSnapPoints?(content: Omit<T, 'type'>, contents: readonly BaseContent[]): SnapPoint[]
  getLines?(content: Omit<T, 'type'>, contents?: readonly BaseContent[]): {
    lines: [Position, Position][]
    points: Position[]
  }
  getCircle?(content: Omit<T, 'type'>): Circle
  canSelectPart?: boolean
}

export type SnapPoint = Position & { type: 'endpoint' | 'midpoint' | 'center' | 'intersection' }

const modelCenter: Record<string, Model<BaseContent>> = {}

export function getModel(type: string): Model<BaseContent> | undefined {
  return modelCenter[type]
}

export function registerModel<T extends BaseContent>(model: Model<T>) {
  modelCenter[model.type] = model
}

const linesAndPointsCache = new WeakmapCache<Omit<BaseContent, 'type'>, { lines: [Position, Position][], points: Position[] }>()
const snapPointsCache = new WeakmapCache<Omit<BaseContent, 'type'>, SnapPoint[]>()
const editPointsCache = new WeakmapCache<Omit<BaseContent, 'type'>, { editPoints: EditPoint<BaseContent>[], angleSnapStartPoint?: Position } | undefined>()

export const getLinesAndPointsFromCache = linesAndPointsCache.get.bind(linesAndPointsCache)
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
  const line = getModel(content.type)?.getLines?.(content)?.lines?.[index[1]]
  if (line) {
    return { type: 'line', points: line } as LineContent
  }
  return undefined
}
