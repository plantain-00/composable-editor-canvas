import { evaluateExpression, Expression, parseExpression, tokenizeExpression } from 'expression-engine'
import { produce, Patch } from 'immer'
import React from 'react'
import { ArrayEditor, BooleanEditor, EnumEditor, getArrayEditorProps, NumberEditor, ObjectArrayEditor, ObjectEditor, and, boolean, breakPolylineToPolylines, EditPoint, exclusiveMinimum, GeneralFormLine, getColorString, getPointsBounding, isRecord, isSamePoint, iterateIntersectionPoints, MapCache3, minimum, Nullable, number, optional, or, Path, Pattern, Position, ReactRenderTarget, Region, Size, string, TwoPointsFormRegion, ValidationResult, Validator, WeakmapCache, WeakmapCache2, record, StringEditor, MapCache, getArrow, isZero, SnapTarget as CoreSnapTarget, mergePolylinesToPolyline, getTwoLineSegmentsIntersectionPoint, deduplicatePosition, iteratePolylineLines, zoomToFitPoints, Align, VerticalAlign, TextStyle, aligns, verticalAligns, rotatePosition, m3, GeometryLine, getPointAndGeometryLineMinimumDistance, breakGeometryLines, geometryLineToPathCommands, getGeometryLinesPointAtParam, PathOptions, maximum, ContentPath, Button, getGeometryLinesPoints, mergeBoundingsUnsafe, getPolygonFromTwoPointsFormRegion, HatchGeometries, defaultLineJoin, defaultLineCap, defaultMiterLimit, LineJoin, LineCap, getGeometryLineBounding, getArcPointAtAngle, getArcBulge, WeakmapValuesCache, getTwoPointsFormRegionSize } from '../../src'
import type { LineContent } from './plugins/line-polyline.plugin'
import type { TextContent } from './plugins/text.plugin'
import type { ArcContent } from './plugins/circle-arc.plugin'
import type { EllipseArcContent } from './plugins/ellipse.plugin'
import type { PathContent } from './plugins/path.plugin'
import type { NurbsContent } from './plugins/nurbs.plugin'
import type { RayContent } from './plugins/ray.plugin'
import type { PlineContent } from './plugins/pline.plugin'
import type { HyperbolaContent } from './plugins/hyperbola.plugin'
export { math } from '../expression/math'

export interface BaseContent<T extends string = string> {
  type: T
  z?: number
  visible?: boolean
  readonly?: boolean
}

export const BaseContent = (type: Validator = string) => ({
  type,
  z: optional(number),
  visible: optional(boolean),
  readonly: optional(boolean),
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
  if (!model) {
    return { path, expect: 'register' }
  }
  return model.isValid(v, path)
}

export interface StrokeFields {
  dashArray?: number[]
  strokeColor?: number
  strokeWidth?: number
  strokeStyleId?: ContentRef
  trueStrokeColor?: boolean
  strokeOpacity?: number
  lineJoin?: LineJoin
  miterLimit?: number
  lineCap?: LineCap
}

export const StrokeFields = {
  dashArray: optional([minimum(0, number)]),
  strokeColor: optional(minimum(0, number)),
  strokeWidth: optional(minimum(0, number)),
  strokeStyleId: optional(or(number, Content)),
  trueStrokeColor: optional(boolean),
  strokeOpacity: optional(maximum(1, minimum(0, number))),
  lineJoin: optional(or('round', 'bevel', 'miter')),
  miterLimit: optional(number),
  lineCap: optional(or('butt', 'round', 'square')),
}

export interface FillFields {
  fillColor?: number
  fillPattern?: Size & {
    lines: Position[][]
    strokeColor?: number
    strokeOpacity?: number
  }
  fillStyleId?: ContentRef
  trueFillColor?: boolean
  fillOpacity?: number
}

export const FillFields = {
  fillColor: optional(minimum(0, number)),
  fillPattern: optional(and(Size, {
    lines: [[Position]],
    strokeColor: optional(minimum(0, number)),
    strokeOpacity: optional(maximum(1, minimum(0, number))),
  })),
  fillStyleId: optional(or(number, Content)),
  trueFillColor: optional(boolean),
  fillOpacity: optional(maximum(1, minimum(0, number))),
}

export interface TextFields extends TextStyle {
  color: number
  textStyleId?: ContentRef
  lineHeight?: number
  align?: Align
  verticalAlign?: VerticalAlign
}

export const TextFields = and(TextStyle, {
  color: number,
  textStyleId: optional(or(number, Content)),
  lineHeight: optional(number),
  align: optional(Align),
  verticalAlign: optional(VerticalAlign),
})

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

export interface ClipFields {
  clip?: {
    border: BaseContent
    reverse?: boolean
  }
}

export const ClipFields = {
  clip: optional({
    border: Content,
    reverse: optional(boolean),
  }),
}

export const strokeModel = {
  isStroke: true,
}

export const fillModel = {
  isFill: true,
}

export const textModel = {
  isText: true,
}

export const variableValuesModel = {
  isVariableValues: true,
}

export const containerModel = {
  ...variableValuesModel,
  isContainer: true,
  canSelectPart: true,
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

export const clipModel = {
  isClip: true,
}

type FeatureModels = typeof strokeModel &
  typeof fillModel &
  typeof containerModel &
  typeof arrowModel &
  typeof segmentCountModel &
  typeof angleDeltaModel &
  typeof textModel &
  typeof clipModel &
  typeof variableValuesModel

export type Model<T> = Partial<FeatureModels> & {
  type: string
  move?(content: Omit<T, 'type'>, offset: Position): void
  rotate?(content: Omit<T, 'type'>, center: Position, angle: number, contents: readonly Nullable<BaseContent>[]): void
  scale?(content: Omit<T, 'type'>, center: Position, sx: number, sy: number, contents: readonly Nullable<BaseContent>[]): void | BaseContent
  skew?(content: Omit<T, 'type'>, center: Position, sx: number, sy: number, contents: readonly Nullable<BaseContent>[]): void | BaseContent
  explode?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): BaseContent[]
  break?(content: Omit<T, 'type'>, intersectionPoints: Position[], contents: readonly Nullable<BaseContent>[]): BaseContent[] | undefined
  mirror?(content: Omit<T, 'type'>, line: GeneralFormLine, angle: number, contents: readonly Nullable<BaseContent>[]): void
  offset?(content: T, point: Position, distance: number, contents: readonly Nullable<BaseContent>[], lineJoin?: LineJoin): BaseContent | BaseContent[] | void
  join?(content: T, target: BaseContent, contents: readonly Nullable<BaseContent>[]): BaseContent | void
  extend?(content: T, point: Position, contents: readonly Nullable<BaseContent>[]): void
  render?<V, P>(content: T, ctx: RenderContext<V, P>): V
  renderIfSelected?<V>(content: Omit<T, 'type'>, ctx: RenderIfSelectedContext<V>): V
  getOperatorRenderPosition?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): Position
  getEditPoints?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): {
    editPoints: (EditPoint<BaseContent> & { type?: 'move' })[]
    angleSnapStartPoint?: Position
  } | undefined
  getSnapPoints?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): SnapPoint[]
  getGeometries?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): Geometries
  canSelectPart?: boolean
  propertyPanel?(
    content: Omit<T, 'type'>,
    update: (recipe: (content: BaseContent, contents: readonly Nullable<BaseContent>[]) => void) => void,
    contents: readonly Nullable<BaseContent>[],
    options: {
      startTime: (max: number) => void,
      acquirePoint: (handle: (point: Position, target?: SnapTarget) => void) => void,
      acquireContent: (select: Select, handle: (refs: readonly PartRef[]) => void) => void,
      activeChild?: number[]
    },
  ): Record<string, JSX.Element | (JSX.Element | undefined)[]>
  editPanel?(
    content: Omit<T, 'type'>,
    scale: number,
    update: (recipe: (content: BaseContent, contents: readonly Nullable<BaseContent>[]) => void) => void,
    contents: readonly Nullable<BaseContent>[],
    cancel: () => void,
    transformPosition: (p: Position) => Position,
    activeChild?: number[],
  ): JSX.Element
  getRefIds?(content: T): Nullable<RefId>[] | undefined
  updateRefId?(content: T, update: (id: ContentRef) => ContentRef | undefined): void
  deleteRefId?(content: T, ids: ContentRef[]): void
  isValid(content: Omit<T, 'type'>, path?: Path): ValidationResult
  getVariableNames?(content: Omit<T, 'type'>): string[]
  isPointIn?(content: T, point: Position, contents: readonly Nullable<BaseContent>[]): boolean
  getChildByPoint?(content: T, point: Position, contents: readonly Nullable<BaseContent>[], options: { textStyleId?: number }): { child: number[], patches?: [Patch[], Patch[]] } | undefined
  getArea?(content: T): number
  reverse?(content: T, contents: readonly Nullable<BaseContent>[]): T
}

export interface Select {
  count?: number
  part?: boolean
  selectable?: (index: ContentPath) => boolean
}

export interface RenderContext<V, T = V> {
  transformColor: (color: number) => number
  target: ReactRenderTarget<V, T>
  transformStrokeWidth: (strokeWidth: number) => number,
  contents: readonly Nullable<BaseContent>[]
  patches?: Patch[]
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

export type Geometries<T extends object = object> = T & {
  /**
   * Used for (1)line intersection, (2)select line by click, (3)select line by box, (4)snap point, (5)select child line
   */
  lines: GeometryLine[]
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
     * Used for (1)select region by box, (2) hatch border
     */
    lines: GeometryLine[]
    /**
     * Used for (1)select region by click
     */
    holesPoints?: Position[][]
    /**
     * Used for (1)hatch holes
     */
    holes?: GeometryLine[][]
  }[]
  /**
   * Used for (1)line rendering
   */
  renderingLines: Position[][]
}

const geometriesCache = new WeakmapValuesCache<object, BaseContent, Geometries>()
const snapPointsCache = new WeakmapCache<object, SnapPoint[]>()
const editPointsCache = new WeakmapCache<object, { editPoints: (EditPoint<BaseContent> & { type?: 'move' })[], angleSnapStartPoint?: Position } | undefined>()
export const allContentsCache = new WeakmapCache<object, Nullable<BaseContent>[]>()
export const lengthCache = new WeakmapCache<BaseContent, number>()

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

export const fixedButtomStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '30px',
  left: '190px',
}

export function getContentByIndex(state: readonly Nullable<BaseContent>[], index: ContentPath) {
  const content = state[index[0]]
  if (!content) {
    return undefined
  }
  if (index.length === 1) {
    return content
  }
  const line = getContentModel(content)?.getGeometries?.(content, state)?.lines?.[index[1]]
  if (line) {
    return geometryLineToContent(line)
  }
  return undefined
}

export function geometryLineToContent(line: GeometryLine): BaseContent {
  if (Array.isArray(line)) {
    return { type: 'line', points: line } as LineContent
  }
  if (line.type === 'arc') {
    return { type: 'arc', ...line.curve } as ArcContent
  }
  if (line.type === 'ellipse arc') {
    return { type: 'ellipse arc', ...line.curve } as EllipseArcContent
  }
  if (line.type === 'quadratic curve') {
    return { type: 'path', commands: [{ type: 'move', to: line.curve.from }, { type: 'quadraticCurve', cp: line.curve.cp, to: line.curve.to }] } as PathContent
  }
  if (line.type === 'bezier curve') {
    return { type: 'path', commands: [{ type: 'move', to: line.curve.from }, { type: 'bezierCurve', cp1: line.curve.cp1, cp2: line.curve.cp2, to: line.curve.to }] } as PathContent
  }
  if (line.type === 'ray') {
    return { type: 'ray', ...line.line } as RayContent
  }
  if (line.type === 'hyperbola curve') {
    return { type: 'hyperbola', ...line.curve } as HyperbolaContent
  }
  return { type: 'nurbs', ...line.curve } as NurbsContent
}

export function geometryLinesToPline(line: GeometryLine[]) {
  if (line.length === 1) {
    return geometryLineToContent(line[0])
  }
  const pline: PlineContent = { type: 'pline', points: [] }
  for (let i = 0; i < line.length; i++) {
    const n = line[i]
    if (Array.isArray(n)) {
      pline.points.push({ point: n[0], bulge: 0 })
      if (i === line.length - 1) {
        pline.points.push({ point: n[1], bulge: 0 })
      }
    } else if (n.type === 'arc') {
      pline.points.push({ point: getArcPointAtAngle(n.curve, n.curve.startAngle), bulge: getArcBulge(n.curve) })
      if (i === line.length - 1) {
        pline.points.push({ point: getArcPointAtAngle(n.curve, n.curve.endAngle), bulge: 0 })
      }
    }
  }
  return pline
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
    if (model?.getGeometries) {
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
  rotate?: number,
) {
  const points = getContentsPoints(editingContent, state)
  const bounding = getPointsBounding(points)
  if (!bounding) {
    return
  }
  const result = zoomToFitPoints(points, { width, height }, { x: width / 2, y: height / 2 }, paddingScale, rotate)
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
    strokeOpacity: <NumberEditor value={content.strokeOpacity ?? 1} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeOpacity = v === 1 ? undefined : v } })} />,
    lineJoin: [
      <BooleanEditor value={content.lineJoin !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.lineJoin = v ? defaultLineJoin : undefined } })} />,
      content.lineJoin !== undefined ? <EnumEditor enums={['round', 'bevel', 'miter']} value={content.lineJoin} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.lineJoin = v } })} /> : undefined,
    ],
    miterLimit: [
      <BooleanEditor value={content.miterLimit !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.miterLimit = v ? defaultMiterLimit : undefined } })} />,
      content.miterLimit !== undefined ? <NumberEditor value={content.miterLimit} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.miterLimit = v } })} /> : undefined,
    ],
    lineCap: [
      <BooleanEditor value={content.lineCap !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.lineCap = v ? defaultLineCap : undefined } })} />,
      content.lineCap !== undefined ? <EnumEditor enums={['butt', 'round', 'square']} value={content.lineCap} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.lineCap = v } })} /> : undefined,
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
        label: `${c.strokeWidth ?? 1}px ${c.dashArray?.join(',') ?? 'solid'} ${getColorString(c.strokeColor ?? 0)} ${c.strokeOpacity ?? defaultOpacity}`,
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
          label: `${label} ${c.fillOpacity ?? defaultOpacity}`,
        }
      })
  })
}

const textStylesCache = new WeakmapCache<readonly Nullable<BaseContent>[], { label: string, index: number, content: TextStyleContent }[]>()
export function getTextStyles(contents: readonly Nullable<BaseContent>[]) {
  return textStylesCache.get(contents, () => {
    return contents.map((c, i) => ({ c, i }))
      .filter((c): c is { c: TextStyleContent, i: number } => !!c.c && isTextStyleContent(c.c))
      .map(({ c, i }) => ({
        index: i,
        content: c,
        label: `${c.fontFamily} ${c.fontSize} ${getColorString(c.color)}`,
      }))
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

export type TextStyleContent = BaseContent<'text style'> & TextFields & Position & {
  isCurrent?: boolean
}

export const TextStyleContent = and(BaseContent('text style'), TextFields, Position, {
  isCurrent: optional(boolean),
})

export function isTextStyleContent(content: BaseContent): content is TextStyleContent {
  return content.type === 'text style'
}

export type ViewportContent = BaseContent<'viewport'> & Position & StrokeFields & {
  border: BaseContent
  scale: number
  rotate?: number
  locked?: boolean
  hidden?: boolean
}

export const ViewportContent = and(BaseContent('viewport'), Position, StrokeFields, {
  border: Content,
  scale: number,
  rotate: optional(number),
  locked: optional(boolean),
  hidden: optional(boolean),
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
    trueFillColor: <BooleanEditor value={content.trueFillColor !== undefined} setValue={(v) => update(c => { if (isFillContent(c)) { c.trueFillColor = v ? true : undefined } })} />,
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
              strokeOpacity: <NumberEditor value={content.fillPattern.strokeOpacity ?? 1} setValue={(v) => update(c => { if (isFillContent(c) && c.fillPattern) { c.fillPattern.strokeOpacity = v === 1 ? undefined : v } })} />,
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
    fillOpacity: <NumberEditor value={content.fillOpacity ?? 1} setValue={(v) => update(c => { if (isFillContent(c)) { c.fillOpacity = v === 1 ? undefined : v } })} />,
  }
}

export function getTextContentPropertyPanel(
  content: TextFields,
  update: (recipe: (content: BaseContent) => void) => void,
  contents?: readonly Nullable<BaseContent>[],
): Record<string, JSX.Element | (JSX.Element | undefined)[]> {
  const textStyleId: (JSX.Element | undefined)[] = []
  if (contents) {
    const textStyles = getTextStyles(contents)
    if (textStyles.length > 0) {
      textStyleId.push(<BooleanEditor value={content.textStyleId !== undefined} setValue={(v) => update(c => { if (isTextContent(c)) { c.textStyleId = v ? textStyles[0].index : undefined } })} />)
      if (typeof content.textStyleId === 'number') {
        textStyleId.push(
          <EnumEditor
            select
            enums={textStyles.map(s => s.index)}
            enumTitles={textStyles.map(s => s.label)}
            value={content.textStyleId}
            setValue={(v) => update(c => { if (isTextContent(c)) { c.textStyleId = v } })}
          />
        )
      }
    }
  }
  if (textStyleId.length > 1) {
    return {
      textStyleId,
    }
  }
  return {
    textStyleId,
    fontSize: <NumberEditor value={content.fontSize} setValue={(v) => update(c => { if (isTextContent(c)) { c.fontSize = v } })} />,
    fontFamily: <StringEditor value={content.fontFamily} setValue={(v) => update(c => { if (isTextContent(c)) { c.fontFamily = v } })} />,
    color: <NumberEditor type='color' value={content.color} setValue={(v) => update(c => { if (isTextContent(c)) { c.color = v } })} />,
    lineHeight: [
      <BooleanEditor value={content.lineHeight !== undefined} setValue={(v) => update(c => { if (isTextContent(c)) { c.lineHeight = v ? content.fontSize * 1.2 : undefined } })} />,
      content.lineHeight !== undefined ? <NumberEditor value={content.lineHeight} setValue={(v) => update(c => { if (isTextContent(c)) { c.lineHeight = v } })} /> : undefined,
    ],
    align: <EnumEditor enums={aligns} value={content.align ?? 'center'} setValue={(v) => update(c => { if (isTextContent(c)) { c.align = v } })} />,
    verticalAlign: <EnumEditor enums={verticalAligns} value={content.verticalAlign ?? 'middle'} setValue={(v) => update(c => { if (isTextContent(c)) { c.verticalAlign = v } })} />,
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

export function getClipContentPropertyPanel(
  content: ClipFields,
  contents: readonly Nullable<BaseContent>[],
  acquireContent: (select: Select, handle: (refs: readonly PartRef[]) => void) => void,
  update: (recipe: (content: BaseContent) => void) => void,
) {
  const picker = <Button onClick={() => acquireContent({ count: 1, selectable: (v) => contentIsClosedPath(getContentByIndex(contents, v)) }, r => update(c => {
    if (isClipContent(c)) {
      const border = getRefPart(r[0], contents, (c): c is BaseContent => c !== content)
      if (border) {
        c.clip = {
          border: border,
        }
      }
    }
  }))}>select border</Button>
  let properties: Record<string, JSX.Element | (JSX.Element | undefined)[]> = {}
  if (content.clip) {
    properties = {
      change: picker,
      border: <Button onClick={() => update(c => { if (isClipContent(c)) { c.clip = undefined } })}>remove</Button>,
      reverse: <BooleanEditor value={!!content.clip.reverse} setValue={(v) => update(c => { if (isClipContent(c) && c.clip) { c.clip.reverse = v ? true : undefined } })} />
    }
  } else {
    properties = {
      add: picker,
    }
  }
  return {
    clip: <ObjectEditor properties={properties} />,
  }
}

export function isStrokeContent(content: BaseContent): content is (BaseContent & StrokeFields) {
  return !!getContentModel(content)?.isStroke
}

export function isFillContent(content: BaseContent): content is (BaseContent & FillFields) {
  return !!getContentModel(content)?.isFill
}

export function isTextContent(content: BaseContent): content is (BaseContent & TextFields) {
  return !!getContentModel(content)?.isText
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
export function isClipContent(content: BaseContent): content is (BaseContent & ClipFields) {
  return !!getContentModel(content)?.isClip
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
export function getTextStyleContent(content: TextFields, contents: readonly Nullable<BaseContent>[]) {
  if (content.textStyleId !== undefined) {
    const textStyleContent = typeof content.textStyleId === 'number' ? contents[content.textStyleId] : content.textStyleId
    if (textStyleContent && isTextStyleContent(textStyleContent)) {
      return textStyleContent
    }
  }
  return content
}

export const defaultSegmentCount = 100
export const defaultStrokeColor = 0x000000
export const defaultOpacity = 1
export const defaultAngleDelta = 5

export const dimensionStyle = {
  margin: 5,
  arrowAngle: 15,
  arrowSize: 10,
}

export function getPolylineEditPoints(
  content: { points: Position[] },
  isPolyLineContent: (content: BaseContent) => content is { type: string, points: Position[] },
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
  id: ContentRef | undefined,
  contents: readonly Nullable<BaseContent>[],
  filter: (content: BaseContent) => content is T = (c): c is T => true,
  patches?: Patch[],
) {
  if (typeof id !== 'number') {
    if (id && filter(id)) {
      return id
    }
    return
  }
  let content = contents[id]
  if (!content && patches && patches.length > 0) {
    // type-coverage:ignore-next-line
    content = patches.find(p => p.op === 'add' && p.path[0] === id)?.value
  }
  if (content && filter(content)) {
    return content
  }
  return
}

export function contentIsDeletable(content: BaseContent, contents: readonly Nullable<BaseContent>[]): boolean {
  if (content.readonly) return false
  const id = getContentIndex(content, contents)
  for (const content of iterateAllContents(contents)) {
    if (getContentModel(content)?.getRefIds?.(content)?.some(d => d?.id === id && d.required)) {
      return false
    }
  }
  return true
}
export function contentIsClosedPath(content: Nullable<BaseContent>) {
  return !!content && !content.readonly && getContentModel(content)?.isPointIn !== undefined
}

export function* iterateRefIds(ids: Nullable<ContentRef>[] | undefined, contents: readonly Nullable<BaseContent>[]): Generator<number, void, unknown> {
  if (!ids) {
    return
  }
  for (const id of ids) {
    if (id === undefined) continue
    if (id === null) continue
    if (typeof id === 'number') {
      yield id
    }
    const content = typeof id !== 'number' ? id : contents[id]
    if (content) {
      const refIds = getContentModel(content)?.getRefIds?.(content)
      yield* iterateRefIds(refIds?.map(d => d?.id), contents)
    }
  }
}

export function* iterateRefContents(
  ids: Nullable<RefId>[] | undefined,
  contents: readonly Nullable<BaseContent>[],
  parents: Omit<BaseContent, 'type'>[],
): Generator<BaseContent, void, unknown> {
  if (!ids) {
    return
  }
  for (const id of ids) {
    if (id === undefined) continue
    if (id === null) continue
    const content = typeof id.id !== 'number' ? id.id : contents[id.id]
    if (content && !parents.includes(content)) {
      yield content
      const refIds = getContentModel(content)?.getRefIds?.(content)
      yield* iterateRefContents(refIds, contents, [...parents, content])
    }
  }
}

export function deleteSelectedContents(contents: Nullable<BaseContent>[], indexes: number[]) {
  for (const index of indexes) {
    contents[index] = undefined
  }
  contents.forEach((content, index) => {
    if (content && !indexes.includes(index)) {
      getContentModel(content)?.deleteRefId?.(content, indexes)
    }
  })
}

export function updateReferencedContents(
  content: BaseContent,
  newContent: BaseContent,
  contents: readonly Nullable<BaseContent>[],
  selected?: BaseContent[],
) {
  const assistentContents: BaseContent[] = []
  const id = getContentIndex(content, contents)
  for (const c of iterateAllContents(contents)) {
    if (selected?.includes(c)) continue
    const model = getContentModel(c)
    if (model?.getRefIds?.(c)?.some(d => d?.id === id)) {
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

export function renderContainerChildren<V, P>(
  container: ContainerFields,
  ctx: RenderContext<V, P>,
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

export function renderContainerIfSelected<V, T extends ContainerFields>(
  container: T,
  ctx: RenderIfSelectedContext<V>,
  parents: Omit<BaseContent, 'type'>[],
  getRefIds: (content: T) => Nullable<RefId>[],
) {
  const { bounding } = getContainerGeometries<T>(container, ctx.contents, getRefIds, parents)
  if (!bounding) {
    return ctx.target.renderEmpty()
  }
  const size = getTwoPointsFormRegionSize(bounding)
  return ctx.target.renderRect(
    bounding.start.x,
    bounding.start.y,
    size.width,
    size.height,
    { strokeColor: ctx.color, dashArray: [4], strokeWidth: ctx.strokeWidth },
  )
}

export function getContainerGeometries<T extends ContainerFields>(
  content: T,
  contents: readonly Nullable<BaseContent>[],
  getRefIds: (content: T) => Nullable<RefId>[],
  parents: Omit<BaseContent, 'type'>[],
) {
  return getContentsGeometries<T>(content, contents, getRefIds, parents)
}

export function getContentsGeometries<T extends ContainerFields>(
  content: T,
  contents: readonly Nullable<BaseContent>[],
  getRefIds: (content: T) => Nullable<RefId>[],
  parents: Omit<BaseContent, 'type'>[],
  getAllContents = (c: T) => c.contents,
) {
  const refs = new Set(iterateRefContents(getRefIds(content), contents, parents))
  return getGeometriesFromCache(content, refs, () => {
    const lines: GeometryLine[] = []
    const renderingLines: Position[][] = []
    const boundings: Position[] = []
    const regions: NonNullable<Geometries['regions']> = []
    getAllContents(content).forEach((c) => {
      if (!c) {
        return
      }
      const r = getContentModel(c)?.getGeometries?.(c, contents)
      if (r) {
        lines.push(...r.lines)
        if (r.bounding) {
          boundings.push(r.bounding.start, r.bounding.end)
        }
        if (r.renderingLines) {
          renderingLines.push(...r.renderingLines)
        }
        if (r.regions) {
          regions.push(...r.regions)
        }
      }
    })
    return {
      lines,
      bounding: getPointsBounding(boundings),
      renderingLines,
      regions: regions.length > 0 ? regions : undefined,
    }
  })
}

export function getContentsBounding(contents: Nullable<BaseContent>[], state: readonly Nullable<BaseContent>[]) {
  const points: Position[] = []
  contents.forEach(content => {
    if (content) {
      const bounding = getContentModel(content)?.getGeometries?.(content, state).bounding
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
export function getContainerScale(content: ContainerFields, center: Position, sx: number, sy: number, contents: readonly Nullable<BaseContent>[]) {
  for (let i = 0; i < content.contents.length; i++) {
    const c = content.contents[i]
    if (!c) {
      return
    }
    const result = getContentModel(c)?.scale?.(c, center, sx, sy, contents)
    if (result) {
      content.contents[i] = result
    }
  }
}
export function getContainerSkew(content: ContainerFields, center: Position, sx: number, sy: number, contents: readonly Nullable<BaseContent>[]) {
  for (let i = 0; i < content.contents.length; i++) {
    const c = content.contents[i]
    if (!c) {
      return
    }
    const result = getContentModel(c)?.skew?.(c, center, sx, sy, contents)
    if (result) {
      content.contents[i] = result
    }
  }
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
export function getContainerRender<V, P>(content: ContainerFields, ctx: RenderContext<V, P>) {
  const children = renderContainerChildren(content, ctx)
  return ctx.target.renderGroup(children)
}
export function getContainerRenderIfSelected<V, T extends ContainerFields>(
  content: T,
  ctx: RenderIfSelectedContext<V>,
  parents: Omit<BaseContent, 'type'>[],
  getRefIds: (content: T) => Nullable<RefId>[]
) {
  return renderContainerIfSelected(content, ctx, parents, getRefIds)
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
        const s = points.filter(p => geometries.lines.some(line => isZero(getPointAndGeometryLineMinimumDistance(p, line), 0.1)))
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

export function toRefId(id?: ContentRef, required?: boolean): RefId[] {
  return id !== undefined ? [{ id, required }] : []
}

export function toRefIds(ids?: Nullable<ContentRef>[], required?: boolean): RefId[] {
  const result: RefId[] = []
  if (ids) {
    for (const id of ids) {
      if (id) {
        result.push({ id, required })
      }
    }
  }
  return result
}

export function getStrokeRefIds(content: StrokeFields): RefId[] {
  return toRefId(content.strokeStyleId)
}

export function getFillRefIds(content: FillFields): RefId[] {
  return toRefId(content.fillStyleId)
}

export function getStrokeAndFillRefIds(content: StrokeFields & FillFields): RefId[] {
  return [...toRefId(content.strokeStyleId), ...toRefId(content.fillStyleId)]
}

export function deleteStrokeRefIds(content: StrokeFields, ids: ContentRef[]) {
  if (content.strokeStyleId !== undefined && ids.includes(content.strokeStyleId)) {
    content.strokeStyleId = undefined
  }
}

export function deleteFillRefIds(content: FillFields, ids: ContentRef[]) {
  if (content.fillStyleId !== undefined && ids.includes(content.fillStyleId)) {
    content.fillStyleId = undefined
  }
}

export function deleteStrokeAndFillRefIds(content: StrokeFields & FillFields, ids: ContentRef[]) {
  deleteStrokeRefIds(content, ids)
  deleteFillRefIds(content, ids)
}

export function deleteTextStyleRefIds(content: TextFields, ids: ContentRef[]) {
  if (content.textStyleId !== undefined && ids.includes(content.textStyleId)) {
    content.textStyleId = undefined
  }
}

export function updateStrokeRefIds(content: StrokeFields, update: (id: ContentRef) => ContentRef | undefined) {
  if (content.strokeStyleId !== undefined) {
    const newRefId = update(content.strokeStyleId)
    if (newRefId !== undefined) {
      content.strokeStyleId = newRefId
    }
  }
}

export function updateFillRefIds(content: FillFields, update: (id: ContentRef) => ContentRef | undefined) {
  if (content.fillStyleId !== undefined) {
    const newRefId = update(content.fillStyleId)
    if (newRefId !== undefined) {
      content.fillStyleId = newRefId
    }
  }
}
export function updateStrokeAndFillRefIds(content: StrokeFields & FillFields, update: (id: ContentRef) => ContentRef | undefined) {
  updateStrokeRefIds(content, update)
  updateFillRefIds(content, update)
}

export function updateTextStyleRefIds(content: TextFields, update: (id: ContentRef) => ContentRef | undefined) {
  if (content.textStyleId !== undefined) {
    const newRefId = update(content.textStyleId)
    if (newRefId !== undefined) {
      content.textStyleId = newRefId
    }
  }
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
      r.type = 'line'
    }
  }
  return result
}

export function mergePolylines(lines: LineContent[]) {
  mergePolylinesToPolyline(lines)
  for (const r of lines) {
    if (r.points.length > 2) {
      r.type = 'polyline'
    }
  }
}

export function breakGeometryLinesToPathCommands(lines: GeometryLine[], intersectionPoints: Position[],) {
  const result = breakGeometryLines(lines, intersectionPoints)
  return result.map(r => ({ type: 'path', commands: geometryLineToPathCommands(r) }) as PathContent)
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

export function getDefaultViewport(content: BaseContent, contents: readonly Nullable<BaseContent>[], rotate?: number) {
  const points = getContentsPoints(contents, contents, c => !isViewportContent(c))
  return getViewportByPoints(content, points, contents, rotate)
}

export function getViewportByPoints(content: BaseContent, points: Position[], contents: readonly Nullable<BaseContent>[], rotate?: number) {
  if (rotate) {
    points = points.map(p => rotatePosition(p, { x: 0, y: 0 }, rotate))
  }
  const contentsBounding = getPointsBounding(points)
  if (!contentsBounding) return
  return getViewportByRegion(content, contentsBounding, contents)
}

export function getViewportByRegion(content: BaseContent, contentsBounding: TwoPointsFormRegion, contents: readonly Nullable<BaseContent>[]) {
  const borderBounding = getContentModel(content)?.getGeometries?.(content, contents).bounding
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

export interface RefId {
  id: ContentRef
  required?: boolean
}

export type ContentRef = number | BaseContent

export const ContentRef = or(number, Content)

export interface PositionRef {
  id: ContentRef
  snapIndex: number
  param?: number
}

export const PositionRef = {
  id: ContentRef,
  snapIndex: number,
  param: optional(number),
}

export function getRefPosition(
  positionRef: PositionRef | undefined,
  contents: readonly Nullable<BaseContent>[],
  parents: Omit<BaseContent, 'type'>[] = [],
  patches?: Patch[],
) {
  if (positionRef !== undefined) {
    const ref = getReference(positionRef.id, contents, (c): c is BaseContent => !parents.includes(c), patches)
    if (ref) {
      const model = getContentModel(ref)
      let p: Position | undefined = model?.getSnapPoints?.(ref, contents)?.[positionRef.snapIndex]
      if (!p && positionRef.param !== undefined) {
        const lines = model?.getGeometries?.(ref, contents).lines
        if (lines) {
          p = getGeometryLinesPointAtParam(positionRef.param, lines)
        }
      }
      return p
    }
  }
  return
}

export interface PartRef {
  id: ContentRef
  partIndex?: number
}

export const PartRef = {
  id: ContentRef,
  partIndex: optional(number),
}

export function getRefPart<T extends BaseContent = BaseContent>(
  partRef: PartRef | undefined,
  contents: readonly Nullable<BaseContent>[],
  filter: (content: BaseContent) => content is T = (c): c is T => true,
  patches?: Patch[],
) {
  if (partRef !== undefined) {
    const ref = getReference(partRef.id, contents, filter, patches)
    if (ref) {
      const model = getContentModel(ref)
      if (partRef.partIndex !== undefined) {
        const line = model?.getGeometries?.(ref, contents)?.lines?.[partRef.partIndex]
        if (line) {
          const content = geometryLineToContent(line)
          if (content && filter(content)) {
            return content
          }
        }
      }
      if (filter(ref)) {
        return ref
      }
    }
  }
  return
}

export function getSnapTargetRef(target: CoreSnapTarget<BaseContent> | undefined, contents: readonly Nullable<BaseContent>[]) {
  return target ? {
    id: getContentIndex(target.content, contents),
    snapIndex: target.snapIndex,
    param: target.param,
  } : undefined
}

export function trimOffsetResult(points: Position[], point: Position, closed: boolean, contents: readonly Nullable<BaseContent>[]) {
  let intersectionPoints: Position[] = []
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 2; j < points.length - 1; j++) {
      if (closed && i === 0 && j === points.length - 2) continue
      const p = getTwoLineSegmentsIntersectionPoint(points[i], points[i + 1], points[j], points[j + 1])
      if (p) {
        intersectionPoints.push(p)
      }
    }
  }
  intersectionPoints = deduplicatePosition(intersectionPoints)
  if (intersectionPoints.length > 0) {
    let newLines = breakPolyline(Array.from(iteratePolylineLines(points)), intersectionPoints)
    const newLines1 = newLines.filter((_, i) => i % 2 === 0)
    const newLines2 = newLines.filter((_, i) => i % 2 === 1)
    const distance1 = Math.min(...newLines1.map(line => (getContentModel(line)?.getGeometries?.(line, contents)?.lines ?? [])?.map(line => getPointAndGeometryLineMinimumDistance(point, line))).flat(2))
    const distance2 = Math.min(...newLines2.map(line => (getContentModel(line)?.getGeometries?.(line, contents)?.lines ?? [])?.map(line => getPointAndGeometryLineMinimumDistance(point, line))).flat(2))
    newLines = distance1 > distance2 ? newLines2 : newLines1
    mergePolylines(newLines)
    return newLines.map(line => line.points)
  }
  return [points]
}

export function getViewportMatrix(p: ViewportContent) {
  return m3.multiply(m3.multiply(m3.translation(p.x, p.y), m3.scaling(p.scale, p.scale)), m3.rotation(-(p.rotate || 0)))
}

export function transformPositionByViewport(p: Position, viewport: ViewportContent) {
  p = rotatePosition(p, { x: 0, y: 0 }, viewport.rotate || 0)
  return {
    x: p.x * viewport.scale + viewport.x,
    y: p.y * viewport.scale + viewport.y,
  }
}

export function reverseTransformPositionByViewport(p: Position, viewport: ViewportContent) {
  return rotatePosition({
    x: (p.x - viewport.x) / viewport.scale,
    y: (p.y - viewport.y) / viewport.scale,
  }, { x: 0, y: 0 }, -(viewport.rotate || 0))
}

export const fuzzyStyle = {
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
  strokeOpacity: 0.25
}

export function getStrokeRenderOptionsFromRenderContext<V, P>(
  content: StrokeFields & BaseContent,
  { getStrokeColor, time, transformStrokeWidth, isHoveringOrSelected, target, contents }: RenderContext<V, P>,
) {
  const strokeStyleContent = getStrokeStyleContent(content, contents)
  const strokeWidth = strokeStyleContent.strokeWidth ?? getDefaultStrokeWidth(content)
  const transformedStrokeWidth = transformStrokeWidth(strokeWidth)
  const fuzzy = isHoveringOrSelected && transformedStrokeWidth !== strokeWidth
  const strokeColor = getStrokeColor(strokeStyleContent)
  const strokeOpacity = strokeStyleContent.strokeOpacity ?? defaultOpacity
  const options: Partial<PathOptions<V>> = {
    strokeColor,
    strokeWidth: transformedStrokeWidth,
    strokeOpacity,
    dashArray: strokeStyleContent.dashArray,
    lineJoin: strokeStyleContent.lineJoin,
    miterLimit: strokeStyleContent.miterLimit,
    lineCap: strokeStyleContent.lineCap,
    ...(fuzzy ? fuzzyStyle : {}),
  }
  const fillOptions: Partial<PathOptions<V>> = {
    strokeColor: fuzzy ? strokeColor : undefined,
    strokeWidth: fuzzy ? transformStrokeWidth(0) : 0,
    fillColor: fuzzy ? undefined : strokeColor,
    ...(fuzzy ? fuzzyStyle : {}),
  }
  return {
    options,
    time,
    contents,
    target,
    fillOptions,
    strokeColor,
    strokeOpacity,
  }
}

export function getStrokeFillRenderOptionsFromRenderContext<V, P>(
  content: StrokeFields & FillFields & BaseContent,
  { getStrokeColor, getFillColor, getFillPattern, transformStrokeWidth, isHoveringOrSelected, time, target, contents, clip }: RenderContext<V, P>,
) {
  const strokeStyleContent = getStrokeStyleContent(content, contents)
  const fillStyleContent = getFillStyleContent(content, contents)
  const strokeWidth = strokeStyleContent.strokeWidth ?? getDefaultStrokeWidth(content)
  const transformedStrokeWidth = transformStrokeWidth(strokeWidth)
  const fuzzy = isHoveringOrSelected && transformedStrokeWidth !== strokeWidth
  const strokeColor = fuzzy && !strokeWidth && fillStyleContent.fillColor !== undefined ? fillStyleContent.fillColor : getStrokeColor(strokeStyleContent)
  const strokeOpacity = strokeStyleContent.strokeOpacity ?? defaultOpacity
  const fillOpacity = fillStyleContent.fillOpacity ?? defaultOpacity
  const options: Partial<PathOptions<V>> = {
    fillColor: getFillColor(fillStyleContent),
    strokeColor,
    strokeWidth: transformedStrokeWidth,
    strokeOpacity,
    fillPattern: getFillPattern(fillStyleContent),
    fillOpacity,
    dashArray: strokeStyleContent.dashArray,
    lineJoin: strokeStyleContent.lineJoin,
    miterLimit: strokeStyleContent.miterLimit,
    lineCap: strokeStyleContent.lineCap,
    clip,
    ...(fuzzy ? fuzzyStyle : {}),
  }
  return {
    options,
    time,
    contents,
    target,
    strokeColor,
    strokeOpacity,
    dashed: !!strokeStyleContent.dashArray,
  }
}

export function getFillRenderOptionsFromRenderContext<V, P>(
  content: FillFields & BaseContent,
  { getFillColor, getFillPattern, transformStrokeWidth, isHoveringOrSelected, time, target, contents, clip }: RenderContext<V, P>,
) {
  const fillStyleContent = getFillStyleContent(content, contents)
  const strokeWidth = transformStrokeWidth(1)
  const fuzzy = isHoveringOrSelected && strokeWidth !== 1
  const fillOpacity = fillStyleContent.fillOpacity ?? defaultOpacity
  const fillColor = getFillColor(fillStyleContent) ?? defaultStrokeColor
  const options: Partial<PathOptions<V>> = {
    fillColor,
    fillPattern: getFillPattern(fillStyleContent),
    fillOpacity,
    clip,
    strokeColor: fuzzy ? fillColor : undefined,
    strokeWidth: fuzzy ? strokeWidth : 0,
    ...(fuzzy ? fuzzyStyle : {}),
  }
  return {
    options,
    time,
    contents,
    target,
  }
}

export function getTextStyleRenderOptionsFromRenderContext<V, P>(
  strokeColor: number | undefined,
  { transformStrokeWidth, isHoveringOrSelected }: RenderContext<V, P>,
) {
  const strokeWidth = transformStrokeWidth(0)
  const fuzzy = isHoveringOrSelected && strokeWidth !== 0
  const options: Partial<PathOptions<V>> = {
    ...(fuzzy ? fuzzyStyle : {}),
    strokeColor: fuzzy ? strokeColor : undefined,
    strokeWidth: fuzzy ? strokeWidth : undefined,
  }
  return options
}

export function renderClipContent<V, P>(content: ClipFields & BaseContent, target: V, renderCtx: RenderContext<V, P>): V {
  if (content.clip) {
    const model = getContentModel(content.clip.border)
    const render = model?.render
    if (render) {
      if (content.clip.reverse) {
        const borderGeometries = model.getGeometries?.(content.clip.border, renderCtx.contents)
        if (!borderGeometries?.bounding) return target
        const contentModel = getContentModel(content)
        if (!contentModel) return target
        const geometries = contentModel.getGeometries?.(content, renderCtx.contents)
        if (!geometries?.bounding) return target
        return renderCtx.target.renderPath([
          getPolygonFromTwoPointsFormRegion(mergeBoundingsUnsafe([geometries.bounding, borderGeometries.bounding])),
          getGeometryLinesPoints(borderGeometries.lines),
        ], {
          ...renderCtx,
          strokeWidth: 0,
          clip: () => target,
        })
      }
      return render(content.clip.border, {
        ...renderCtx,
        transformStrokeWidth: () => 0,
        clip: () => target,
      })
    }
  }
  return target
}

export function renderClipContentIfSelected<V>(content: ClipFields, target: V, renderCtx: RenderIfSelectedContext<V>): V {
  if (content.clip) {
    const model = getContentModel(content.clip.border)
    const render = model?.render
    if (render) {
      return renderCtx.target.renderGroup([
        target,
        render(content.clip.border, {
          ...renderCtx,
          transformColor: c => c,
          transformStrokeWidth: () => renderCtx.strokeWidth,
          getStrokeColor: () => renderCtx.color,
          getFillColor: () => undefined,
          getFillPattern: () => undefined,
        }),
      ])
    }
  }
  return target
}

export function getClipContentEditPoints(content: ClipFields, contents: readonly Nullable<BaseContent>[]) {
  if (!content.clip) return []
  const borderEditPoints = getContentModel(content.clip.border)?.getEditPoints?.(content.clip.border, contents)
  if (!borderEditPoints) return []
  return borderEditPoints.editPoints.map(p => ({
    ...p,
    update(c, props) {
      if (!isClipContent(c)) {
        return
      }
      if (!c.clip) return
      let r: { assistentContents?: BaseContent[] } | void | undefined
      c.clip.border = produce(c.clip.border, d => {
        if (!p.update) return
        r = p.update(d, props)
      })
      if (r) {
        return r
      }
      return
    },
  } as EditPoint<BaseContent>))
}

export const contentsBoundingCache = new WeakmapCache<readonly Nullable<BaseContent>[], TwoPointsFormRegion>()
const geometryLineBoundingCache = new WeakmapCache<GeometryLine, TwoPointsFormRegion | undefined>()

export function getGeometryLineBoundingFromCache(line: GeometryLine) {
  if (!Array.isArray(line) && line.type === 'ray') return
  return geometryLineBoundingCache.get(line, () => {
    return getGeometryLineBounding(line)
  })
}

export function getContentHatchGeometries(content: Nullable<BaseContent>, contents: readonly Nullable<BaseContent>[]): HatchGeometries | undefined {
  if (!content) return undefined
  const geometries = getContentModel(content)?.getGeometries?.(content, contents)
  if (!geometries) return undefined
  if (geometries.lines.length > 30) return undefined
  return {
    lines: geometries.lines,
    id: getContentIndex(content, contents),
  }
}

export function boundingToRTreeBounding(bounding: TwoPointsFormRegion) {
  const size = getTwoPointsFormRegionSize(bounding)
  return {
    x: bounding.start.x - 1,
    y: bounding.start.y - 1,
    w: size.width + 2,
    h: size.height + 2,
  }
}
