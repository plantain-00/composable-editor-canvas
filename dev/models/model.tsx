import React from 'react'
import { ArrayEditor, BooleanEditor, breakPolylineToPolylines, Circle, EditPoint, GeneralFormLine, getArrayEditorProps, getPointsBounding, getTextSize, isSamePoint, iterateIntersectionPoints, MapCache2, Nullable, NumberEditor, Position, ReactRenderTarget, Size, TwoPointsFormRegion, WeakmapCache, WeakmapCache2, zoomToFit } from '../../src'
import { LineContent } from '../plugins/line-polyline.plugin'

export interface BaseContent<T extends string = string> {
  type: T
}

export interface StrokeFields {
  dashArray?: number[]
  strokeColor?: number
  strokeWidth?: number
}

export interface FillFields {
  fillColor?: number
}

export interface ContainerFields {
  contents: Nullable<BaseContent>[]
}

export interface ArrowFields {
  arrowAngle?: number
  arrowSize?: number
}

type StrokeContent<T extends string = string> = BaseContent<T> & StrokeFields

type FillContent<T extends string = string> = BaseContent<T> & FillFields

type ContainerContent<T extends string = string> = BaseContent<T> & ContainerFields

type ArrowContent<T extends string = string> = BaseContent<T> & ArrowFields

export const strokeModel = {
  isStroke: true,
}

export const fillModel = {
  isFill: true,
}

export const containerModel = {
  isContainer: true,
}

export const arrowModel = {
  isArrow: true,
}

export type Model<T> = Partial<typeof strokeModel & typeof fillModel & typeof containerModel & typeof arrowModel> & {
  type: string
  move?(content: Omit<T, 'type'>, offset: Position): void
  rotate?(content: Omit<T, 'type'>, center: Position, angle: number, contents: readonly Nullable<BaseContent>[]): void
  explode?(content: Omit<T, 'type'>, contents: readonly Nullable<BaseContent>[]): BaseContent[]
  break?(content: Omit<T, 'type'>, intersectionPoints: Position[]): BaseContent[] | undefined
  mirror?(content: Omit<T, 'type'>, line: GeneralFormLine, angle: number, contents: readonly Nullable<BaseContent>[]): void
  getColor?(content: Omit<T, 'type'>): number
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
  propertyPanel?(content: Omit<T, 'type'>, update: (recipe: (content: BaseContent) => void) => void): Record<string, JSX.Element | (JSX.Element | undefined)[]>
  getRefIds?(content: T): number[] | undefined
  updateRefId?(content: T, update: (id: number) => number | undefined): void
  isValid?(content: Omit<T, 'type'>): boolean
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

export function getContentModel(content: BaseContent): Model<BaseContent> | undefined {
  return modelCenter[content.type]
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
  const line = getContentModel(content)?.getGeometries?.(content)?.lines?.[index[1]]
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
  content: Omit<StrokeContent, 'type'>,
  update: (recipe: (content: BaseContent) => void) => void,
) {
  return {
    dashArray: [
      <BooleanEditor value={content.dashArray !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.dashArray = v ? [4] : undefined } })} style={{ marginRight: '5px' }} />,
      content.dashArray !== undefined ? <ArrayEditor
        inline
        {...getArrayEditorProps<number, typeof content>(v => v.dashArray || [], 4, (v) => update(c => { if (isStrokeContent(c)) { v(c) } }))}
        items={content.dashArray.map((f, i) => <NumberEditor value={f} setValue={(v) => update(c => { if (isStrokeContent(c) && c.dashArray) { c.dashArray[i] = v } })} />)}
      /> : undefined
    ],
    strokeColor: [
      <BooleanEditor value={content.strokeColor !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeColor = v ? 0 : undefined } })} style={{ marginRight: '5px' }} />,
      content.strokeColor !== undefined ? <NumberEditor type='color' value={content.strokeColor} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeColor = v } })} /> : undefined,
    ],
    strokeWidth: [
      <BooleanEditor value={content.strokeWidth !== undefined} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeWidth = v ? 2 : undefined } })} style={{ marginRight: '5px' }} />,
      content.strokeWidth !== undefined ? <NumberEditor value={content.strokeWidth} setValue={(v) => update(c => { if (isStrokeContent(c)) { c.strokeWidth = v } })} /> : undefined,
    ],
  }
}

export function getFillContentPropertyPanel(
  content: FillFields,
  update: (recipe: (content: BaseContent) => void) => void,
) {
  return {
    fillColor: [
      <BooleanEditor value={content.fillColor !== undefined} setValue={(v) => update(c => { if (isFillContent(c)) { c.fillColor = v ? 0 : undefined } })} style={{ marginRight: '5px' }} />,
      content.fillColor !== undefined ? <NumberEditor type='color' value={content.fillColor} setValue={(v) => update(c => { if (isFillContent(c)) { c.fillColor = v } })} /> : undefined,
    ],
  }
}

export function getArrowContentPropertyPanel(
  content: Omit<ArrowContent, 'type'>,
  update: (recipe: (content: BaseContent) => void) => void,
) {
  return {
    arrowAngle: [
      <BooleanEditor value={content.arrowAngle !== undefined} setValue={(v) => update(c => { if (isArrowContent(c)) { c.arrowAngle = v ? dimensionStyle.arrowAngle : undefined } })} style={{ marginRight: '5px' }} />,
      content.arrowAngle !== undefined ? <NumberEditor value={content.arrowAngle} setValue={(v) => update(c => { if (isArrowContent(c)) { c.arrowAngle = v } })} /> : undefined,
    ],
    arrowSize: [
      <BooleanEditor value={content.arrowSize !== undefined} setValue={(v) => update(c => { if (isArrowContent(c)) { c.arrowSize = v ? dimensionStyle.arrowSize : undefined } })} style={{ marginRight: '5px' }} />,
      content.arrowSize !== undefined ? <NumberEditor value={content.arrowSize} setValue={(v) => update(c => { if (isArrowContent(c)) { c.arrowSize = v } })} /> : undefined,
    ],
  }
}

export function isStrokeContent(content: BaseContent): content is StrokeContent {
  return !!getContentModel(content)?.isStroke
}

export function isFillContent(content: BaseContent): content is FillContent {
  return !!getContentModel(content)?.isFill
}

export function isContainerContent(content: BaseContent): content is ContainerContent {
  return !!getContentModel(content)?.isContainer
}

export function isArrowContent(content: BaseContent): content is ArrowContent {
  return !!getContentModel(content)?.isArrow
}

export function getStrokeWidth(content: BaseContent) {
  return (isStrokeContent(content) ? content.strokeWidth : undefined) ?? 1
}

export function getContentColor(content: BaseContent, defaultColor = 0x000000) {
  const model = getContentModel(content)
  if (model?.getColor) {
    return model.getColor(content)
  }
  if (isFillContent(content) && content.fillColor !== undefined) {
    return content.fillColor
  }
  return (isStrokeContent(content) ? content.strokeColor : undefined) ?? defaultColor
}

export const angleDelta = 5

export const dimensionStyle = {
  margin: 5,
  arrowAngle: 15,
  arrowSize: 10,
}

const textSizeMap = new MapCache2<string, string, Size | undefined>()
export function getTextSizeFromCache(font: string, text: string) {
  return textSizeMap.get(font, text, () => getTextSize(font, text))
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

export function getContentIndex(content: Omit<BaseContent, 'type'>, contents: readonly Nullable<BaseContent>[]) {
  return contents.findIndex(c => content === c)
}

export function contentIsReferenced(content: Omit<BaseContent, 'type'>, contents: readonly Nullable<BaseContent>[]): boolean {
  const id = getContentIndex(content, contents)
  for (const content of iterateAllContents(contents)) {
    if (getContentModel(content)?.getRefIds?.(content)?.includes(id)) {
      return true
    }
  }
  return false
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
  return getSnapPointsFromCache(content, () => {
    const result: SnapPoint[] = []
    content.contents.forEach((c) => {
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

export function renderContainerChildren<V>(block: ContainerFields, target: ReactRenderTarget<V>, strokeWidth: number, contents: readonly Nullable<BaseContent>[], color: number) {
  const children: (ReturnType<typeof target.renderGroup>)[] = []
  block.contents.forEach((content) => {
    if (!content) {
      return
    }
    const model = getContentModel(content)
    if (model?.render) {
      const ContentRender = model.render
      color = getContentColor(content, color)
      children.push(ContentRender({ content: content, color, target, strokeWidth, contents }))
    }
  })
  return children
}

export function getContainerGeometries(content: ContainerFields) {
  return getGeometriesFromCache(content, () => {
    const lines: [Position, Position][] = []
    const points: Position[] = []
    const renderingLines: Position[][] = []
    content.contents.forEach((c) => {
      if (!c) {
        return
      }
      const r = getContentModel(c)?.getGeometries?.(c)
      if (r) {
        lines.push(...r.lines)
        points.push(...r.points)
        if (r.renderingLines) {
          renderingLines.push(...r.renderingLines)
        }
      }
    })
    return {
      lines,
      points,
      bounding: getPointsBounding(points),
      renderingLines,
    }
  })
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
