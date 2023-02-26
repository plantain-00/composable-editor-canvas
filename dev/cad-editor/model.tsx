import { evaluateExpression, Expression, parseExpression, tokenizeExpression } from 'expression-engine'
import produce from 'immer'
import React from 'react'
import { ArrayEditor, BooleanEditor, EnumEditor, getArrayEditorProps, NumberEditor, ObjectArrayEditor, ObjectEditor, and, boolean, breakPolylineToPolylines, Circle, EditPoint, exclusiveMinimum, GeneralFormLine, getColorString, getPointsBounding, isRecord, isSamePoint, iterateIntersectionPoints, MapCache3, minimum, Nullable, number, optional, or, Path, Pattern, Position, ReactRenderTarget, Region, Size, string, TwoPointsFormRegion, ValidationResult, Validator, WeakmapCache, WeakmapCache2, zoomToFit, record, StringEditor, MapCache, getArrow, getPointAndLineSegmentMinimumDistance, isZero, getTwoPointsDistance, getPointByLengthAndDirection } from '../../src'
import type { LineContent } from './plugins/line-polyline.plugin'
import type { TextContent } from './plugins/text.plugin'

export interface BaseContent<T extends string = string> {
  type: T
  z?: number
  visible?: boolean
}

export const BaseContent = (type: Validator = string) => ({
  type,
  z: optional(number),
  visible: optional(boolean),
})

export const Content = (v: unknown, path: Path): ValidationResult => {
  if (!isRecord(v)) {
    return { path, expect: 'object' }
  }
  const t = v.type
  if (typeof t !== 'string') {
    return { path, expect: 'type' }
  }
  const model = modelCenter[t]
  if (!model?.isValid) {
    return true
  }
  return model.isValid(v, path)
}

export interface StrokeFields {
  dashArray?: number[]
  strokeColor?: number
  strokeWidth?: number
  strokeStyleId?: number | BaseContent
  trueStrokeColor?: boolean
}

export const StrokeFields = {
  dashArray: optional([minimum(0, number)]),
  strokeColor: optional(minimum(0, number)),
  strokeWidth: optional(minimum(0, number)),
  strokeStyleId: optional(or(number, Content)),
  trueStrokeColor: optional(boolean),
}

export interface FillFields {
  fillColor?: number
  fillPattern?: Size & {
    lines: Position[][]
    strokeColor?: number
  }
  fillStyleId?: number | BaseContent
}

export const FillFields = {
  fillColor: optional(minimum(0, number)),
  fillPattern: optional(and(Size, {
    lines: [[Position]],
    strokeColor: optional(minimum(0, number)),
  })),
  fillStyleId: optional(or(number, Content)),
}

export interface VariableValuesFields {
  variableValues?: Record<string, string>
}

export const VariableValuesFields = {
  variableValues: optional(record(string, string)),
}

export interface ContainerFields extends VariableValuesFields {
  contents: Nullable<BaseContent>[]
}

export const ContainerFields: { [key: string]: Validator } = {
  ...VariableValuesFields,
  contents: [Nullable(Content)],
}

export interface ArrowFields {
  arrowAngle?: number
  arrowSize?: number
}

export const ArrowFields = {
  arrowAngle: optional(number),
  arrowSize: optional(minimum(0, number)),
}

export interface SegmentCountFields {
  segmentCount?: number
}

export const SegmentCountFields = {
  segmentCount: optional(number)
}

export interface AngleDeltaFields {
  angleDelta?: number
}

export const AngleDeltaFields = {
  angleDelta: optional(exclusiveMinimum(0, number)),
}

export const strokeModel = {
  isStroke: true,
}

export const fillModel = {
  isFill: true,
}

export const variableValuesModel = {
  isVariableValues: true,
}

export const containerModel = {
  ...variableValuesModel,
  isContainer: true,
}

export const arrowModel = {
  isArrow: true,
}

export const segmentCountModel = {
  isSegmentCount: true,
}

export const angleDeltaModel = {
  isAngleDelta: true,
}

type FeatureModels = typeof strokeModel &
  typeof fillModel &
  typeof containerModel &
  typeof arrowModel &
  typeof segmentCountModel &
  typeof angleDeltaModel &
  typeof variableValuesModel

export type Model<T> = Partial<FeatureModels> & {
  type: string
  move?(content: Omit<T, 'type'>, offset: Position): void
  rotate?(content: Omit<T, 'type'>, center: Position, angle: number, contents: readonly Nullable<BaseContent>[]): void
  explode?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): BaseContent[]
  break?(content: Omit<T, 'type'>, intersectionPoints: Position[], contents: readonly Nullable<BaseContent>[]): BaseContent[] | undefined
  mirror?(content: Omit<T, 'type'>, line: GeneralFormLine, angle: number, contents: readonly Nullable<BaseContent>[]): void
  render?<V>(content: T, ctx: RenderContext<V>): V
  renderIfSelected?<V>(content: Omit<T, 'type'>, ctx: RenderIfSelectedContext<V>): V
  getOperatorRenderPosition?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): Position
  getEditPoints?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): {
    editPoints: (EditPoint<BaseContent> & { type?: 'move' })[]
    angleSnapStartPoint?: Position
  } | undefined
  getSnapPoints?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): SnapPoint[]
  getGeometries?(content: Omit<T, 'type'>, contents?: readonly Nullable<BaseContent>[]): Geometries
  getCircle?(content: Omit<T, 'type'>): { circle: Circle, bounding: TwoPointsFormRegion }
  canSelectPart?: boolean
  propertyPanel?(
    content: Omit<T, 'type'>,
    update: (recipe: (content: BaseContent, contents: readonly Nullable<BaseContent>[]) => void) => void,
    contents: readonly Nullable<BaseContent>[],
    options: {
      startTime: (max: number) => void,
      acquirePoint: (handle: (point: Position, target?: SnapTarget) => void) => void,
    },
  ): Record<string, JSX.Element | (JSX.Element | undefined)[]>
  getRefIds?(content: T): number[] | undefined
  updateRefId?(content: T, update: (id: number | BaseContent) => number | undefined | BaseContent): void
  isValid?(content: Omit<T, 'type'>, path?: Path): ValidationResult
  getVariableNames?(content: Omit<T, 'type'>): string[]
  isPointIn?(content: T, point: Position): boolean
  getStartPoint?(content: T): Position
  getEndPoint?(content: T): Position
  getParam?(content: T, point: Position): number
  getPoint?(content: T, param: number): Position
}

export interface RenderContext<V> {
  transformColor: (color: number) => number
  target: ReactRenderTarget<V>
  transformStrokeWidth: (strokeWidth: number) => number,
  contents: readonly Nullable<BaseContent>[]
  getStrokeColor(content: StrokeFields & FillFields): number | undefined
  getFillColor(content: FillFields): number | undefined
  getFillPattern: (content: FillFields) => Pattern<V> | undefined
  isAssistence?: boolean
  variableContext?: Record<string, unknown>
  clip?: () => V
  isHoveringOrSelected?: boolean
  time?: number
}
interface RenderIfSelectedContext<V> {
  color: number
  target: ReactRenderTarget<V>
  strokeWidth: number
  contents: readonly Nullable<BaseContent>[]
}

export type SnapPoint = Position & { type: 'endpoint' | 'midpoint' | 'center' | 'intersection' }

const modelCenter: Record<string, Model<BaseContent>> = {}

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

const geometriesCache = new WeakmapCache<object, Geometries>()
const snapPointsCache = new WeakmapCache<object, SnapPoint[]>()
const editPointsCache = new WeakmapCache<object, { editPoints: (EditPoint<BaseContent> & { type?: 'move' })[], angleSnapStartPoint?: Position } | undefined>()
export const allContentsCache = new WeakmapCache<object, Nullable<BaseContent>[]>()

export const getGeometriesFromCache = geometriesCache.get.bind(geometriesCache)
export const getSnapPointsFromCache = snapPointsCache.get.bind(snapPointsCache)
export const getEditPointsFromCache = editPointsCache.get.bind(editPointsCache)

const timeExpresionCache = new MapCache<string, Expression | null>()
export function getTimeExpressionValue(expression: string | undefined, time: number | undefined, fallback: number) {
  if (!expression || !time) return fallback
  const e = timeExpresionCache.get(expression, () => {
    try {
      return parseExpression(tokenizeExpression(expression))
    } catch (error) {
      console.info(error)
      return null
    }
  })
  if (e) {
    try {
      const value = evaluateExpression(e, { t: time })
      if (typeof value === 'number' && !isNaN(value)) {
        return value
      }
    } catch (error) {
      console.info(error)
    }
  }

  return fallback
}

const intersectionPointsCache = new WeakmapCache2<BaseContent, BaseContent, Position[]>()
export function getIntersectionPoints(content1: BaseContent, content2: BaseContent, contents: readonly Nullable<BaseContent>[]) {
  return intersectionPointsCache.get(content1, content2, () => Array.from(iterateIntersectionPoints(content1, content2, contents, getContentModel)))
}

export function getContentModel(content: BaseContent): Model<BaseContent> | undefined {
  return modelCenter[content.type]
}

export const fixedInputStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '10px',
  left: '190px',
}

export function getContentByIndex(state: readonly Nullable<BaseContent>[], index: readonly number[]) {
  const content = state[index[0]]
  if (!content) {
    return undefined
  }
  if (index.length === 1) {
    return content
  }
  const line = getContentModel(content)?.getGeometries?.(content)?.lines?.[index[1]]
  if (line) {
    return { type: 'line', points: line } as LineContent
  }
  return undefined
}

export function getContentsPoints(
  editingContent: readonly Nullable<BaseContent>[],
  state: readonly Nullable<BaseContent>[],
  filter: (c: BaseContent) => boolean = () => true,
) {
  const points: Position[] = []
  editingContent.forEach((c) => {
    if (!c) {
      return
    }
    if (!filter(c)) return
    const model = getContentModel(c)
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
  return points
}

export function zoomContentsToFit(
  width: number,
  height: number,
  editingContent: readonly Nullable<BaseContent>[],
  state: readonly Nullable<BaseContent>[],
  paddingScale = 0.8,
) {
  const bounding = getPointsBounding(getContentsPoints(editingContent, state))
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
  content: StrokeFields,
  update: (recipe: (content: BaseContent) => void) => void,
  contents?: readonly Nullable<BaseContent>[],
): Record<string, JSX.Element | (JSX.Element | undefined)[]> {
  const strokeStyleId: (JSX.Element | undefined)[] = []
  if (contents) {
    const strokeStyles = getStrokeStyles(contents)
    if (strokeStyles.length > 0) {
      strokeStyleId.push(<BooleanEditor value={content.strokeStyleId !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeStyleId = v ? strokeStyles[0].index : undefined } })} />)
      if (typeof content.strokeStyleId === 'number') {
        strokeStyleId.push(
          <EnumEditor
            select
            enums={strokeStyles.map(s => s.index)}
            enumTitles={strokeStyles.map(s => s.label)}
            value={content.strokeStyleId}
            setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeStyleId = v } })}
          />
        )
      }
    }
  }
  if (strokeStyleId.length > 1) {
    return {
      strokeStyleId,
    }
  }
  return {
    strokeStyleId,
    dashArray: [
      <BooleanEditor value={content.dashArray !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.dashArray = v ? [4] : undefined } })} />,
      content.dashArray !== undefined ? <ArrayEditor
        inline
        {...getArrayEditorProps<number, typeof content>(v => v.dashArray || [], 4, (v) => update(c => { if (isStrokeContent(c)) { v(c) } }))}
        items={content.dashArray.map((f, i) => <NumberEditor value={f} setValue={(v) => update(c => { if (isStrokeContent(c) && c.dashArray) { c.dashArray[i] = v } })} />)}
      /> : undefined
    ],
    strokeColor: [
      <BooleanEditor value={content.strokeColor !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeColor = v ? 0 : undefined } })} />,
      content.strokeColor !== undefined ? <NumberEditor type='color' value={content.strokeColor} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeColor = v } })} /> : undefined,
    ],
    trueStrokeColor: <BooleanEditor value={content.trueStrokeColor !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.trueStrokeColor = v ? true : undefined } })} />,
    strokeWidth: [
      <BooleanEditor value={content.strokeWidth !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeWidth = v ? 2 : undefined } })} />,
      content.strokeWidth !== undefined ? <NumberEditor value={content.strokeWidth} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeWidth = v } })} /> : undefined,
    ],
  }
}

const strokeStylesCache = new WeakmapCache<readonly Nullable<BaseContent>[], { label: string, index: number, content: StrokeStyleContent }[]>()
export function getStrokeStyles(contents: readonly Nullable<BaseContent>[]) {
  return strokeStylesCache.get(contents, () => {
    return contents.map((c, i) => ({ c, i }))
      .filter((c): c is { c: StrokeStyleContent, i: number } => !!c.c && isStrokeStyleContent(c.c))
      .map(({ c, i }) => ({
        index: i,
        content: c,
        label: `${c.strokeWidth ?? 1}px ${c.dashArray?.join(',') ?? 'solid'} ${getColorString(c.strokeColor ?? 0)}`,
      }))
  })
}

const fillStylesCache = new WeakmapCache<readonly Nullable<BaseContent>[], { label: string, index: number, content: FillStyleContent }[]>()
export function getFillStyles(contents: readonly Nullable<BaseContent>[]) {
  return fillStylesCache.get(contents, () => {
    return contents.map((c, i) => ({ c, i }))
      .filter((c): c is { c: FillStyleContent, i: number } => !!c.c && isFillStyleContent(c.c))
      .map(({ c, i }) => {
        let label = ''
        if (c.fillPattern) {
          label = `${c.fillPattern.width}*${c.fillPattern.height} ${getColorString(c.fillPattern.strokeColor ?? 0)} ${JSON.stringify(c.fillPattern.lines)}`
        } else if (c.fillColor !== undefined) {
          label = getColorString(c.fillColor)
        }
        return {
          index: i,
          content: c,
          label,
        }
      })
  })
}

export type StrokeStyleContent = BaseContent<'stroke style'> & StrokeFields & Region & {
  isCurrent?: boolean
}

export const StrokeStyleContent = and(BaseContent('stroke style'), StrokeFields, Region, {
  isCurrent: optional(boolean),
})

export function isStrokeStyleContent(content: BaseContent): content is StrokeStyleContent {
  return content.type === 'stroke style'
}

export type FillStyleContent = BaseContent<'fill style'> & FillFields & Region & {
  isCurrent?: boolean
}

export const FillStyleContent = and(BaseContent('fill style'), FillFields, Region, {
  isCurrent: optional(boolean),
})

export function isFillStyleContent(content: BaseContent): content is FillStyleContent {
  return content.type === 'fill style'
}

export type ViewportContent = BaseContent<'viewport'> & Position & StrokeFields & {
  border: BaseContent
  scale: number
}

export const ViewportContent = and(BaseContent('viewport'), Position, StrokeFields, {
  border: Content,
  scale: number,
})

export function isViewportContent(content: BaseContent): content is ViewportContent {
  return content.type === 'viewport'
}

export function getFillContentPropertyPanel(
  content: FillFields,
  update: (recipe: (content: BaseContent) => void) => void,
  contents?: readonly Nullable<BaseContent>[],
): Record<string, JSX.Element | (JSX.Element | undefined)[]> {
  const fillStyleId: (JSX.Element | undefined)[] = []
  if (contents) {
    const fillStyles = getFillStyles(contents)
    if (fillStyles.length > 0) {
      fillStyleId.push(<BooleanEditor value={content.fillStyleId !== undefined} setValue={(v) => update(c => { if (isFillContent(c)) { c.fillStyleId = v ? fillStyles[0].index : undefined } })} />)
      if (typeof content.fillStyleId === 'number') {
        fillStyleId.push(
          <EnumEditor
            select
            enums={fillStyles.map(s => s.index)}
            enumTitles={fillStyles.map(s => s.label)}
            value={content.fillStyleId}
            setValue={(v) => update(c => { if (isFillContent(c)) { c.fillStyleId = v } })}
          />
        )
      }
    }
  }
  if (fillStyleId.length > 1) {
    return {
      fillStyleId,
    }
  }
  return {
    fillStyleId,
    fillColor: [
      <BooleanEditor value={content.fillColor !== undefined} setValue={(v) => update(c => { if (isFillContent(c)) { c.fillColor = v ? 0 : undefined } })} />,
      content.fillColor !== undefined ? <NumberEditor type='color' value={content.fillColor} setValue={(v) => update(c => { if (isFillContent(c)) { c.fillColor = v } })} /> : undefined,
    ],
    fillPattern: [
      <BooleanEditor value={content.fillPattern !== undefined} setValue={(v) => update(c => { if (isFillContent(c)) { c.fillPattern = v ? { width: 10, height: 10, lines: [[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]] } : undefined } })} />,
      content.fillPattern !== undefined
        ? (
          <ObjectEditor
            properties={{
              width: <NumberEditor value={content.fillPattern.width} setValue={(v) => update(c => { if (isFillContent(c) && c.fillPattern) { c.fillPattern.width = v } })} />,
              height: <NumberEditor value={content.fillPattern.height} setValue={(v) => update(c => { if (isFillContent(c) && c.fillPattern) { c.fillPattern.height = v } })} />,
              strokeColor: [
                <BooleanEditor value={content.fillPattern.strokeColor !== undefined} setValue={(v) => update(c => { if (isFillContent(c) && c.fillPattern) { c.fillPattern.strokeColor = v ? 0 : undefined } })} />,
                content.fillPattern.strokeColor !== undefined ? <NumberEditor type='color' value={content.fillPattern.strokeColor} setValue={(v) => update(c => { if (isFillContent(c) && c.fillPattern) { c.fillPattern.strokeColor = v } })} /> : undefined,
              ],
              lines: <ArrayEditor
                {...getArrayEditorProps<Position[], typeof content>(v => v.fillPattern?.lines || [], [{ x: 0, y: 5 }, { x: 5, y: 0 }], (v) => update(c => { if (isFillContent(c) && c.fillPattern) { v(c) } }))}
                items={content.fillPattern.lines.map((f, i) => <ObjectArrayEditor
                  {...getArrayEditorProps<Position, typeof f>(v => v, { x: 0, y: 5 }, (v) => update(c => { if (isFillContent(c) && c.fillPattern) { v(c.fillPattern.lines[i]) } }))}
                  properties={f.map((g, j) => ({
                    x: <NumberEditor value={g.x} setValue={(v) => update(c => { if (isFillContent(c) && c.fillPattern) { c.fillPattern.lines[i][j].x = v } })} style={{ width: '70px' }} />,
                    y: <NumberEditor value={g.y} setValue={(v) => update(c => { if (isFillContent(c) && c.fillPattern) { c.fillPattern.lines[i][j].y = v } })} style={{ width: '70px' }} />,
                  }))}
                />)}
              />
            }}
          />
        )
        : undefined,
    ],
  }
}

export function getArrowContentPropertyPanel(
  content: ArrowFields,
  update: (recipe: (content: BaseContent) => void) => void,
) {
  return {
    arrowAngle: [
      <BooleanEditor value={content.arrowAngle !== undefined} setValue={(v) => update(c => { if (isArrowContent(c)) { c.arrowAngle = v ? dimensionStyle.arrowAngle : undefined } })} />,
      content.arrowAngle !== undefined ? <NumberEditor value={content.arrowAngle} setValue={(v) => update(c => { if (isArrowContent(c)) { c.arrowAngle = v } })} /> : undefined,
    ],
    arrowSize: [
      <BooleanEditor value={content.arrowSize !== undefined} setValue={(v) => update(c => { if (isArrowContent(c)) { c.arrowSize = v ? dimensionStyle.arrowSize : undefined } })} />,
      content.arrowSize !== undefined ? <NumberEditor value={content.arrowSize} setValue={(v) => update(c => { if (isArrowContent(c)) { c.arrowSize = v } })} /> : undefined,
    ],
  }
}

export function getSegmentCountContentPropertyPanel(
  content: SegmentCountFields,
  update: (recipe: (content: BaseContent) => void) => void,
) {
  return {
    segmentCount: [
      <BooleanEditor value={content.segmentCount !== undefined} setValue={(v) => update(c => { if (isSegmentCountContent(c)) { c.segmentCount = v ? defaultSegmentCount : undefined } })} />,
      content.segmentCount !== undefined ? <NumberEditor value={content.segmentCount} setValue={(v) => update(c => { if (isSegmentCountContent(c)) { c.segmentCount = v } })} /> : undefined,
    ],
  }
}

export function getAngleDeltaContentPropertyPanel(
  content: AngleDeltaFields,
  update: (recipe: (content: BaseContent) => void) => void,
) {
  return {
    angleDelta: [
      <BooleanEditor value={content.angleDelta !== undefined} setValue={(v) => update(c => { if (isAngleDeltaContent(c)) { c.angleDelta = v ? defaultAngleDelta : undefined } })} />,
      content.angleDelta !== undefined ? <NumberEditor value={content.angleDelta} setValue={(v) => update(c => { if (isAngleDeltaContent(c)) { c.angleDelta = v } })} /> : undefined,
    ],
  }
}

export function getVariableValuesContentPropertyPanel(
  content: VariableValuesFields,
  variableNames: string[],
  update: (recipe: (content: BaseContent) => void) => void,
) {
  return {
    variableValues: variableNames.length > 0
      ? <ObjectEditor properties={Object.assign({}, ...variableNames.map(f => ({
        [f]: <StringEditor value={content.variableValues?.[f] ?? ''} setValue={(v) => update(c => {
          if (isVariableValuesContent(c)) {
            if (!c.variableValues) c.variableValues = {}
            c.variableValues[f] = v
          }
        })} />
      })))} />
      : [],
  }
}

export function isStrokeContent(content: BaseContent): content is (BaseContent & StrokeFields) {
  return !!getContentModel(content)?.isStroke
}

export function isFillContent(content: BaseContent): content is (BaseContent & FillFields) {
  return !!getContentModel(content)?.isFill
}

export function isContainerContent(content: BaseContent): content is (BaseContent & ContainerFields) {
  return !!getContentModel(content)?.isContainer
}

export function isArrowContent(content: BaseContent): content is (BaseContent & ArrowFields) {
  return !!getContentModel(content)?.isArrow
}
export function isSegmentCountContent(content: BaseContent): content is (BaseContent & SegmentCountFields) {
  return !!getContentModel(content)?.isSegmentCount
}
export function isAngleDeltaContent(content: BaseContent): content is (BaseContent & AngleDeltaFields) {
  return !!getContentModel(content)?.isAngleDelta
}
export function isVariableValuesContent(content: BaseContent): content is (BaseContent & VariableValuesFields) {
  return !!getContentModel(content)?.isVariableValues
}

export function hasFill(content: FillFields) {
  return content.fillColor !== undefined || content.fillPattern !== undefined || content.fillStyleId !== undefined
}
export function getDefaultStrokeWidth(content: BaseContent): number {
  return isFillContent(content) && hasFill(content) ? 0 : 1
}
export function getStrokeStyleContent(content: StrokeFields, contents: readonly Nullable<BaseContent>[]) {
  if (content.strokeStyleId !== undefined) {
    const strokeStyleContent = typeof content.strokeStyleId === 'number' ? contents[content.strokeStyleId] : content.strokeStyleId
    if (strokeStyleContent && isStrokeStyleContent(strokeStyleContent)) {
      return strokeStyleContent
    }
  }
  return content
}
export function getFillStyleContent(content: FillFields, contents: readonly Nullable<BaseContent>[]) {
  if (content.fillStyleId !== undefined) {
    const fillStyleContent = typeof content.fillStyleId === 'number' ? contents[content.fillStyleId] : content.fillStyleId
    if (fillStyleContent && isFillStyleContent(fillStyleContent)) {
      return fillStyleContent
    }
  }
  return content
}

export const defaultSegmentCount = 100
export const defaultStrokeColor = 0x000000
export const defaultAngleDelta = 5

export const dimensionStyle = {
  margin: 5,
  arrowAngle: 15,
  arrowSize: 10,
}

export function getPolylineEditPoints(
  content: { points: Position[] },
  isPolyLineContent: (content: BaseContent<string>) => content is { type: string, points: Position[] },
  isPolygon?: boolean,
  midpointDisabled?: boolean,
) {
  const points = content.points
  const isClosed = !isPolygon &&
    points.length > 2 &&
    isSamePoint(points[0], points[points.length - 1])

  const positions: (Position & { pointIndexes: number[] })[] = []
  points.forEach((point, i) => {
    if (isPolygon || i !== points.length - 1 || !isClosed) {
      positions.push({
        pointIndexes: [i],
        x: point.x,
        y: point.y,
      })
    }
    if (!midpointDisabled && i !== points.length - 1) {
      const nextPoint = points[i + 1]
      positions.push({
        pointIndexes: [i, i + 1],
        x: (point.x + nextPoint.x) / 2,
        y: (point.y + nextPoint.y) / 2,
      })
    }
    if (isPolygon && i === points.length - 1) {
      const nextPoint = points[0]
      positions.push({
        pointIndexes: [points.length - 1, 0],
        x: (point.x + nextPoint.x) / 2,
        y: (point.y + nextPoint.y) / 2,
      })
    }
  })
  if (isClosed) {
    for (const position of positions) {
      if (position.pointIndexes.includes(0)) {
        position.pointIndexes.push(points.length - 1)
      } else if (position.pointIndexes.includes(points.length - 1)) {
        position.pointIndexes.push(0)
      }
    }
  }
  return positions.map((p) => ({
    x: p.x,
    y: p.y,
    cursor: 'move',
    update(c: BaseContent, { cursor, start, scale }: { cursor: Position, start: Position, scale: number }) {
      if (!isPolyLineContent(c)) {
        return
      }
      const offsetX = cursor.x - start.x
      const offsetY = cursor.y - start.y
      for (const pointIndex of p.pointIndexes) {
        c.points[pointIndex].x += offsetX
        c.points[pointIndex].y += offsetY
      }
      return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
    },
  }))
}

export function getContentIndex(content: object, contents: readonly Nullable<BaseContent>[]) {
  return contentIndexCache.get(content, () => {
    return contents.findIndex(c => content === c)
  })
}

export const contentIndexCache = new WeakmapCache<object, number>()

const sortedContentsCache = new WeakmapCache<readonly Nullable<BaseContent>[], {
  contents: readonly Nullable<BaseContent>[]
  indexes: number[]
}>()

export function getSortedContents(contents: readonly Nullable<BaseContent>[]) {
  return sortedContentsCache.get(contents, () => {
    const contentsWithOrder = contents.map((c, i) => {
      return {
        content: c,
        index: i,
        z: c?.z ?? i,
      }
    })
    const result = produce(contentsWithOrder, draft => {
      draft.sort((a, b) => a.z - b.z)
    })
    return {
      contents: result.map(r => r.content),
      indexes: result.map(r => r.index),
    }
  })
}

export function getReference<T extends BaseContent>(
  id: number | BaseContent,
  contents: readonly Nullable<BaseContent>[],
  filter: (content: BaseContent) => content is T = (c): c is T => true,
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

export function contentIsReferenced(content: object, contents: readonly Nullable<BaseContent>[]): boolean {
  const id = getContentIndex(content, contents)
  for (const content of iterateAllContents(contents)) {
    if (getContentModel(content)?.getRefIds?.(content)?.includes(id)) {
      return true
    }
  }
  return false
}

export function updateReferencedContents(
  content: BaseContent,
  newContent: BaseContent,
  contents: readonly Nullable<BaseContent>[],
) {
  const assistentContents: BaseContent[] = []
  const id = getContentIndex(content, contents)
  for (const c of iterateAllContents(contents)) {
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

export function* iterateAllContents(contents: readonly Nullable<BaseContent>[]): Generator<BaseContent, void, unknown> {
  for (const content of contents) {
    if (!content) {
      continue
    }
    yield content
    if (isContainerContent(content)) {
      yield* iterateAllContents(content.contents)
    }
  }
}

export function getContainerSnapPoints(content: ContainerFields, contents: readonly BaseContent[]) {
  return getContentsSnapPoints(content, contents)
}

export function getContentsSnapPoints<T extends ContainerFields>(
  content: T,
  contents: readonly Nullable<BaseContent>[],
  getAllContents = (c: T) => c.contents,
) {
  return getSnapPointsFromCache(content, () => {
    const result: SnapPoint[] = []
    getAllContents(content).forEach((c) => {
      if (!c) {
        return
      }
      const r = getContentModel(c)?.getSnapPoints?.(c, contents)
      if (r) {
        result.push(...r)
      }
    })
    return result
  })
}

export function renderContainerChildren<V>(
  container: ContainerFields,
  ctx: RenderContext<V>,
) {
  ctx = {
    ...ctx,
    variableContext: {
      ...ctx.variableContext,
      ...container.variableValues,
    },
  }
  const children: (ReturnType<typeof ctx.target.renderGroup>)[] = []
  const sortedContents = getSortedContents(container.contents).contents
  sortedContents.forEach((content) => {
    if (!content) {
      return
    }
    const model = getContentModel(content)
    if (model?.render) {
      const ContentRender = model.render
      children.push(ContentRender(content, ctx))
    }
  })
  return children
}

export function getContainerVariableNames(container: ContainerFields) {
  const result = new Set<string>
  for (const content of container.contents) {
    if (content) {
      const variableNames = getContentModel(content)?.getVariableNames?.(content)
      if (variableNames) {
        variableNames.forEach(v => result.add(v))
      }
    }
  }
  return Array.from(result)
}

export function renderContainerIfSelected<V>(container: ContainerFields, ctx: RenderIfSelectedContext<V>) {
  const { bounding } = getContainerGeometries(container)
  if (!bounding) {
    return ctx.target.renderEmpty()
  }
  return ctx.target.renderRect(
    bounding.start.x,
    bounding.start.y,
    bounding.end.x - bounding.start.x,
    bounding.end.y - bounding.start.y,
    { strokeColor: ctx.color, dashArray: [4], strokeWidth: ctx.strokeWidth },
  )
}

export function getContainerGeometries(content: ContainerFields) {
  return getContentsGeometries(content)
}

export function getContentsGeometries<T extends ContainerFields>(
  content: T,
  getAllContents = (c: T) => c.contents,
) {
  return getGeometriesFromCache(content, () => {
    const lines: [Position, Position][] = []
    const points: Position[] = []
    const renderingLines: Position[][] = []
    const boundings: Position[] = []
    const regions: NonNullable<Geometries['regions']> = []
    getAllContents(content).forEach((c) => {
      if (!c) {
        return
      }
      const r = getContentModel(c)?.getGeometries?.(c)
      if (r) {
        lines.push(...r.lines)
        points.push(...r.points)
        if (r.bounding) {
          boundings.push(r.bounding.start, r.bounding.end)
        }
        if (r.renderingLines) {
          renderingLines.push(...r.renderingLines)
        }
        if (r.regions) [
          regions.push(...r.regions)
        ]
      }
    })
    return {
      lines,
      points,
      bounding: getPointsBounding(boundings),
      renderingLines,
      regions: regions.length > 0 ? regions : undefined,
    }
  })
}

export function getContentsBounding(contents: Nullable<BaseContent>[]) {
  const points: Position[] = []
  contents.forEach(content => {
    if (content) {
      const bounding = getContentModel(content)?.getGeometries?.(content).bounding
      if (bounding) {
        points.push(bounding.start, bounding.end)
      }
    }
  })
  return getPointsBounding(points)
}

export function getContainerMove(content: ContainerFields, offset: Position) {
  content.contents.forEach((c) => {
    if (!c) {
      return
    }
    getContentModel(c)?.move?.(c, offset)
  })
}
export function getContainerRotate(content: ContainerFields, center: Position, angle: number, contents: readonly Nullable<BaseContent>[]) {
  content.contents.forEach((c) => {
    if (!c) {
      return
    }
    getContentModel(c)?.rotate?.(c, center, angle, contents)
  })
}
export function getContainerExplode(content: ContainerFields) {
  return getContentsExplode(content.contents)
}
export function getContainerMirror(content: ContainerFields, line: GeneralFormLine, angle: number, contents: readonly Nullable<BaseContent>[]) {
  content.contents.forEach((c) => {
    if (!c) {
      return
    }
    getContentModel(c)?.mirror?.(c, line, angle, contents)
  })
}
export function getContainerRender<V>(content: ContainerFields, ctx: RenderContext<V>) {
  const children = renderContainerChildren(content, ctx)
  return ctx.target.renderGroup(children)
}
export function getContainerRenderIfSelected<V>(content: ContainerFields, ctx: RenderIfSelectedContext<V>) {
  return renderContainerIfSelected(content, ctx)
}
export function getContentsExplode(array: Nullable<BaseContent>[]) {
  return array.filter((c): c is BaseContent => !!c)
}
export function getContentsBreak(array: Nullable<BaseContent>[], points: Position[], contents: readonly Nullable<BaseContent>[]) {
  const result: BaseContent[] = []
  for (const c of array) {
    if (c) {
      const model = getContentModel(c)
      if (model?.break && model.getGeometries) {
        const geometries = model.getGeometries(c, contents)
        const s = points.filter(p => geometries.lines.some(line => isZero(getPointAndLineSegmentMinimumDistance(p, ...line), 0.1)))
        const r = model.break(c, s, contents)
        if (r) {
          result.push(...r)
        } else {
          result.push(c)
        }
      }
    }
  }
  return result
}

export function getStrokeRefIds(content: StrokeFields) {
  return typeof content.strokeStyleId === 'number' ? [content.strokeStyleId] : []
}
export function updateStrokeRefIds(content: StrokeFields, update: (id: number | BaseContent) => number | BaseContent | undefined) {
  if (content.strokeStyleId !== undefined) {
    const newRefId = update(content.strokeStyleId)
    if (newRefId !== undefined) {
      content.strokeStyleId = newRefId
    }
  }
}
function getFillRefIds(content: FillFields) {
  return typeof content.fillStyleId === 'number' ? [content.fillStyleId] : []
}
function updateFillRefIds(content: FillFields, update: (id: number | BaseContent) => number | BaseContent | undefined) {
  if (content.fillStyleId !== undefined) {
    const newRefId = update(content.fillStyleId)
    if (newRefId !== undefined) {
      content.fillStyleId = newRefId
    }
  }
}
export function getStrokeAndFillRefIds(content: StrokeFields & FillFields) {
  return [...getStrokeRefIds(content), ...getFillRefIds(content)]
}
export function updateStrokeAndFillRefIds(content: StrokeFields & FillFields, update: (id: number | BaseContent) => number | BaseContent | undefined) {
  updateStrokeRefIds(content, update)
  updateFillRefIds(content, update)
}

export function breakPolyline(
  lines: [Position, Position][],
  intersectionPoints: Position[],
) {
  const result: LineContent[] = breakPolylineToPolylines(lines, intersectionPoints).map(r => ({
    type: 'polyline',
    points: r
  }))
  for (const r of result) {
    if (r.points.length === 2) {
      r.type === 'line'
    }
  }
  return undefined
}

export function getArrowPoints(from: Position, to: Position, content: ArrowFields & StrokeFields) {
  const arrowSize = content.arrowSize ?? dimensionStyle.arrowSize
  const arrowAngle = content.arrowAngle ?? dimensionStyle.arrowAngle
  return getArrow(from, to, arrowSize, arrowAngle, content.strokeWidth)
}

export const assistentTextCache = new MapCache3<string, number, number, object>()
export function getAssistentText(text: string, fontSize: number, x: number, y: number, color = 0xff0000): TextContent[] {
  fontSize = Math.round(fontSize)
  if (fontSize < 12) {
    fontSize = 12
  }
  const texts: TextContent[] = []
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    assistentTextCache.get(c, fontSize, color, () => ({}))
    texts.push({
      type: 'text',
      x: x + i * fontSize * 0.6,
      y: y,
      text: c,
      color,
      fontSize,
      fontFamily: 'monospace',
    })
  }
  return texts
}

export interface SnapTarget {
  snapIndex: number
  param?: number
  id: number
}

export const SnapTarget = {
  snapIndex: number,
  param: optional(number),
  id: number,
}

export interface SnapResult {
  position: Position
  target?: SnapTarget
}

export const SnapResult = {
  position: Position,
  target: optional(SnapTarget),
}

export function getDefaultViewport(content: BaseContent, contents: readonly Nullable<BaseContent<string>>[]) {
  const contentsBounding = getPointsBounding(getContentsPoints(contents, contents, c => !isViewportContent(c)))
  if (!contentsBounding) return
  return getViewportByRegion(content, contentsBounding)
}

export function getViewportByRegion(content: BaseContent, contentsBounding: TwoPointsFormRegion) {
  const borderBounding = getContentModel(content)?.getGeometries?.(content).bounding
  if (!borderBounding) return
  const viewportWidth = borderBounding.end.x - borderBounding.start.x
  const viewportHeight = borderBounding.end.y - borderBounding.start.y
  const contentWidth = contentsBounding.end.x - contentsBounding.start.x
  const contentHeight = contentsBounding.end.y - contentsBounding.start.y
  const xRatio = viewportWidth / contentWidth
  const yRatio = viewportHeight / contentHeight
  let xOffset = 0
  let yOffset = 0
  let ratio: number
  if (xRatio < yRatio) {
    ratio = xRatio
    yOffset = (viewportHeight - ratio * contentHeight) / 2
  } else {
    ratio = yRatio
    xOffset = (viewportWidth - ratio * contentWidth) / 2
  }
  return {
    x: borderBounding.start.x - contentsBounding.start.x * ratio + xOffset,
    y: borderBounding.start.y - contentsBounding.start.y * ratio + yOffset,
    scale: ratio,
  }
}

export function getLinesParamAtPoint(point: Position, lines: [Position, Position][]) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isZero(getPointAndLineSegmentMinimumDistance(point, ...line))) {
      return i + getTwoPointsDistance(line[0], point) / getTwoPointsDistance(...line)
    }
  }
  return 0
}

export function getLinesPointAtParam(param: number, lines: [Position, Position][]) {
  const index = Math.floor(param)
  const line = lines[index]
  const distance = (param - index) * getTwoPointsDistance(...line)
  return getPointByLengthAndDirection(line[0], distance, line[1])
}
