import React from 'react'
import { ArrayEditor, BooleanEditor, Circle, EditPoint, GeneralFormLine, getArrayEditorProps, getPointsBounding, iterateIntersectionPoints, Nullable, NumberEditor, Position, ReactRenderTarget, TwoPointsFormRegion, WeakmapCache, WeakmapCache2, zoomToFit } from '../../src'
import { LineContent } from './line-model'

export interface BaseContent<T extends string = string> {
  type: T
}

export interface StrokeBaseContent<T extends string = string> extends BaseContent<T> {
  dashArray?: number[]
  strokeColor?: number
  strokeWidth?: number
}

export interface FillFields {
  fillColor?: number
}

export interface Model<T> {
  type: string
  subTypes?: ('stroke' | 'fill')[]
  move?(content: Omit<T, 'type'>, offset: Position): void
  rotate?(content: Omit<T, 'type'>, center: Position, angle: number, contents: readonly Nullable<BaseContent>[]): void
  explode?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): BaseContent[]
  break?(content: Omit<T, 'type'>, intersectionPoints: Position[]): BaseContent[] | undefined
  mirror?(content: Omit<T, 'type'>, line: GeneralFormLine, angle: number, contents: readonly Nullable<BaseContent>[]): void
  deletable?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): boolean
  getDefaultColor?(content: Omit<T, 'type'>): number | undefined
  getDefaultStrokeWidth?(content: Omit<T, 'type'>): number | undefined
  render?<V>(props: {
    content: Omit<T, 'type'>
    color: number
    target: ReactRenderTarget<V>
    strokeWidth: number
    contents: readonly Nullable<BaseContent>[]
  }): V
  renderIfSelected?<V>(props: { content: Omit<T, 'type'>, color: number, target: ReactRenderTarget<V>, strokeWidth: number }): V
  getOperatorRenderPosition?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): Position
  getEditPoints?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): {
    editPoints: EditPoint<BaseContent>[]
    angleSnapStartPoint?: Position
  } | undefined
  getSnapPoints?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): SnapPoint[]
  getGeometries?(content: Omit<T, 'type'>, contents?: readonly Nullable<BaseContent>[]): Geometries
  getCircle?(content: Omit<T, 'type'>): { circle: Circle, bounding: TwoPointsFormRegion }
  canSelectPart?: boolean
  propertyPanel?(content: Omit<T, 'type'>, update: (recipe: (content: BaseContent) => void) => void): Record<string, JSX.Element>
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
  /**
   * Used for (1)line intersection, (2)select line by click, (3)select line by box, (4)snap point
   */
  lines: [Position, Position][]
  points: Position[]
  /**
   * Used for (1)select line by box, (2)snap point, (3)rtree
   */
  bounding?: TwoPointsFormRegion
  regions?: {
    /**
     * Used for (1)select region by click
     */
    points: Position[]
    /**
     * Used for (1)select region by box
     */
    lines: [Position, Position][]
  }[]
  /**
   * Used for (1)line rendering
   */
  renderingLines: Position[][]
}

const geometriesCache = new WeakmapCache<Omit<BaseContent, 'type'>, Geometries>()
const snapPointsCache = new WeakmapCache<Omit<BaseContent, 'type'>, SnapPoint[]>()
const editPointsCache = new WeakmapCache<Omit<BaseContent, 'type'>, { editPoints: EditPoint<BaseContent>[], angleSnapStartPoint?: Position } | undefined>()

export const getGeometriesFromCache = geometriesCache.get.bind(geometriesCache)
export const getSnapPointsFromCache = snapPointsCache.get.bind(snapPointsCache)
export const getEditPointsFromCache = editPointsCache.get.bind(editPointsCache)

const intersectionPointsCache = new WeakmapCache2<BaseContent, BaseContent, Position[]>()
export function getIntersectionPoints(content1: BaseContent, content2: BaseContent, contents: readonly Nullable<BaseContent>[]) {
  return intersectionPointsCache.get(content1, content2, () => Array.from(iterateIntersectionPoints(content1, content2, contents, getContentModel)))
}

export function getContentModel(content: BaseContent) {
  return getModel(content.type)
}

export const fixedInputStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '10px',
  left: '25%',
  transform: 'translate(-50%, 0px)',
}

export function getContentByIndex(state: readonly Nullable<BaseContent>[], index: readonly number[]) {
  const content = state[index[0]]
  if (!content) {
    return undefined
  }
  if (index.length === 1) {
    return content
  }
  const line = getModel(content.type)?.getGeometries?.(content)?.lines?.[index[1]]
  if (line) {
    return { type: 'line', points: line } as LineContent
  }
  return undefined
}

export function zoomContentsToFit(
  width: number,
  height: number,
  editingContent: readonly Nullable<BaseContent>[],
  state: readonly Nullable<BaseContent>[],
  paddingScale = 0.8,
) {
  const points: Position[] = []
  editingContent.forEach((c) => {
    if (!c) {
      return
    }
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

export function getStrokeContentPropertyPanel(
  content: Omit<StrokeBaseContent, 'type'>,
  update: (recipe: (content: BaseContent) => void) => void,
) {
  return {
    dashArray: <>
      <BooleanEditor value={content.dashArray !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.dashArray = v ? [4] : undefined } })} style={{ marginRight: '5px' }} />
      {content.dashArray !== undefined && <ArrayEditor
        inline
        {...getArrayEditorProps<number, typeof content>(v => v.dashArray || [], 4, (v) => update(c => { if (isStrokeContent(c)) { v(c) } }))}
        items={content.dashArray.map((f, i) => <NumberEditor value={f} setValue={(v) => update(c => { if (isStrokeContent(c) && c.dashArray) { c.dashArray[i] = v } })} />)}
      />}
    </>,
    strokeColor: <>
      <BooleanEditor value={content.strokeColor !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeColor = v ? 0 : undefined } })} style={{ marginRight: '5px' }} />
      {content.strokeColor !== undefined && <NumberEditor type='color' value={content.strokeColor} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeColor = v } })} />}
    </>,
    strokeWidth: <>
      <BooleanEditor value={content.strokeWidth !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeWidth = v ? 2 : undefined } })} style={{ marginRight: '5px' }} />
      {content.strokeWidth !== undefined && <NumberEditor value={content.strokeWidth} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeWidth = v } })} />}
    </>,
  }
}

export function getFillContentPropertyPanel(
  content: FillFields,
  update: (recipe: (content: BaseContent) => void) => void,
) {
  return {
    fillColor: <>
      <BooleanEditor value={content.fillColor !== undefined} setValue={(v) => update(c => { if (isFillContent(c)) { c.fillColor = v ? 0 : undefined } })} style={{ marginRight: '5px' }} />
      {content.fillColor !== undefined && <NumberEditor type='color' value={content.fillColor} setValue={(v) => update(c => { if (isFillContent(c)) { c.fillColor = v } })} />}
    </>,
  }
}

interface FillContent extends FillFields {
  type: string
}

export function isStrokeContent(content: BaseContent): content is StrokeBaseContent {
  return !!getModel(content.type)?.subTypes?.includes?.('stroke')
}

export function isFillContent(content: BaseContent): content is FillContent {
  return !!getModel(content.type)?.subTypes?.includes?.('fill')
}

export { angleDelta } from './ellipse-model'
