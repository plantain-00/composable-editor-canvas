import React from 'react'
import { Circle, getLineSegmentCircleIntersectionPoints, getTwoCircleIntersectionPoints, getTwoLinesIntersectionPoint, getTwoNumbersDistance, Position, ReactRenderTarget } from '../../src'
import { CircleContent } from './circle-model'
import { LineContent } from './line-model'
import { RectContent } from './rect-model'

export interface BaseContent<T extends string = string> {
  type: T
}

export interface Model<T> {
  type: string
  move?(content: Omit<T, 'type'>, offset: Position): void
  rotate?(content: Omit<T, 'type'>, center: Position, angle: number): void
  explode?(content: Omit<T, 'type'>): BaseContent[]
  mirror?(content: Omit<T, 'type'>, p1: Position, p2: Position): void
  render?(props: { content: Omit<T, 'type'>, stroke: number, target: ReactRenderTarget }): JSX.Element
  useEdit?(onEnd: () => void): {
    mask?: JSX.Element
    updatePreview(contents: T[]): void
    editBar(props: { content: T, index: number }): JSX.Element
  }
  useCreate?(type: string | undefined, onEnd: (contents: T[]) => void): {
    input?: JSX.Element
    subcommand?: JSX.Element
    updatePreview(contents: T[]): void
    onClick: (e: { clientX: number, clientY: number }) => void
    onMove: (e: { clientX: number, clientY: number }) => void
  }
  getSnapPoints?(content: Omit<T, 'type'>): SnapPoint[]
  getLines?(content: Omit<T, 'type'>): {
    lines: [Position, Position][]
    points: Position[]
  }
  getCircle?(content: Omit<T, 'type'>): Circle
}

type SnapPoint = Position & { type: 'endpoint' | 'midpoint' | 'center' | 'intersection' }

const modelCenter: Record<string, Model<BaseContent>> = {}

export function getModel(type: string): Model<BaseContent> | undefined {
  return modelCenter[type]
}

export function useModelsEdit(onEnd: () => void) {
  const editMasks: JSX.Element[] = []
  const updateEditPreviews: ((contents: BaseContent[]) => void)[] = []
  const editBarMap: Record<string, (props: { content: BaseContent, index: number }) => JSX.Element> = {}
  Object.values(modelCenter).forEach((model) => {
    if (!model.useEdit) {
      return
    }
    const { mask, updatePreview, editBar } = model.useEdit(onEnd)
    if (mask) {
      editMasks.push(React.cloneElement(mask, { key: model.type }))
    }
    updateEditPreviews.push(updatePreview)
    editBarMap[model.type] = editBar
  })
  return {
    editMasks,
    updateEditPreview(contents: BaseContent[]) {
      for (const updateEditPreview of updateEditPreviews) {
        updateEditPreview(contents)
      }
    },
    editBarMap,
  }
}

export function useModelsCreate(operation: string | undefined, onEnd: (contents: BaseContent[]) => void) {
  const createInputs: JSX.Element[] = []
  const createSubcommands: JSX.Element[] = []
  const updateCreatePreviews: ((contents: BaseContent[]) => void)[] = []
  const onClicks: ((e: { clientX: number, clientY: number }) => void)[] = []
  const onMoves: ((e: { clientX: number, clientY: number }) => void)[] = []
  Object.entries(modelCenter).forEach(([type, model]) => {
    if (!model.useCreate) {
      return
    }
    const { input, updatePreview, onClick, onMove, subcommand } = model.useCreate(operation, onEnd)
    if (input) {
      createInputs.push(React.cloneElement(input, { key: type }))
    }
    if (subcommand) {
      createSubcommands.push(React.cloneElement(subcommand, { key: type }))
    }
    updateCreatePreviews.push(updatePreview)
    onClicks.push(onClick)
    onMoves.push(onMove)
  })
  return {
    createInputs,
    createSubcommands,
    updateCreatePreview(contents: BaseContent[]) {
      for (const updateCreatePreview of updateCreatePreviews) {
        updateCreatePreview(contents)
      }
    },
    onStartCreate(e: { clientX: number, clientY: number }) {
      for (const onClick of onClicks) {
        onClick(e)
      }
    },
    onCreatingMove(e: { clientX: number, clientY: number }) {
      for (const onMove of onMoves) {
        onMove(e)
      }
    },
  }
}

export function useSnap(enabled: boolean, delta = 5) {
  const [snapPoint, setSnapPoint] = React.useState<SnapPoint>()

  React.useEffect(() => {
    if (enabled === false) {
      setSnapPoint(undefined)
    }
  }, [enabled])

  const assistentContents: BaseContent[] = []
  if (snapPoint) {
    const contents: (LineContent | CircleContent | RectContent)[] = []
    if (snapPoint.type === 'center') {
      contents.push({
        type: 'circle',
        x: snapPoint.x,
        y: snapPoint.y,
        r: delta * 2,
      })
    } else if (snapPoint.type === 'endpoint') {
      contents.push({
        type: 'rect',
        x: snapPoint.x,
        y: snapPoint.y,
        width: delta * 4,
        height: delta * 4,
        angle: 0,
      })
    } else if (snapPoint.type === 'midpoint') {
      contents.push({
        type: 'polyline',
        points: [
          { x: snapPoint.x - delta * 2, y: snapPoint.y + delta * 2 },
          { x: snapPoint.x + delta * 2, y: snapPoint.y + delta * 2 },
          { x: snapPoint.x, y: snapPoint.y - delta * 2 },
          { x: snapPoint.x - delta * 2, y: snapPoint.y + delta * 2 },
        ],
      })
    } else if (snapPoint.type === 'intersection') {
      contents.push(
        {
          type: 'polyline',
          points: [
            { x: snapPoint.x - delta * 2, y: snapPoint.y - delta * 2 },
            { x: snapPoint.x + delta * 2, y: snapPoint.y + delta * 2 },
          ],
        },
        {
          type: 'polyline',
          points: [
            { x: snapPoint.x - delta * 2, y: snapPoint.y + delta * 2 },
            { x: snapPoint.x + delta * 2, y: snapPoint.y - delta * 2 },
          ],
        },
      )
    }
    assistentContents.push(...contents)
  }

  return {
    snapAssistentContents: assistentContents,
    getSnapPoint(p: { clientX: number, clientY: number }, contents: BaseContent[], types: string[]) {
      if (!enabled) {
        return p
      }
      for (const content of contents) {
        const iterate = getModel(content.type)?.getSnapPoints
        if (iterate) {
          const snapPoints = getSnapPointsFromCache(content, iterate)
          for (const point of snapPoints) {
            if (
              types.includes(point.type) &&
              getTwoNumbersDistance(p.clientX, point.x) <= delta &&
              getTwoNumbersDistance(p.clientY, point.y) <= delta
            ) {
              setSnapPoint(point)
              return {
                clientX: point.x,
                clientY: point.y,
              }
            }
          }
        }
      }
      if (types.includes('intersection')) {
        for (let i = 0; i < contents.length; i++) {
          const content1 = contents[i]
          for (let j = i + 1; j < contents.length; j++) {
            const content2 = contents[j]
            for (const point of iterateIntersectionPoints(content1, content2)) {
              if (
                getTwoNumbersDistance(p.clientX, point.x) <= delta &&
                getTwoNumbersDistance(p.clientY, point.y) <= delta
              ) {
                setSnapPoint({ ...point, type: 'intersection' })
                return {
                  clientX: point.x,
                  clientY: point.y,
                }
              }
            }
          }
        }
      }
      setSnapPoint(undefined)
      return p
    }
  }
}

export function registerModel<T extends BaseContent>(model: Model<T>) {
  modelCenter[model.type] = model
}

const linesCache = new WeakMap<Omit<BaseContent, 'type'>, { lines: [Position, Position][], points: Position[] }>()
const snapPointsCache = new WeakMap<Omit<BaseContent, 'type'>, SnapPoint[]>()

export function getLinesAndPointsFromCache<T>(content: Omit<T, 'type'>, func: (content: Omit<T, 'type'>) => { lines: [Position, Position][], points: Position[] }) {
  let result = linesCache.get(content)
  if (!result) {
    result = func(content)
    linesCache.set(content, result)
  }
  return result
}

export function getSnapPointsFromCache<T>(content: Omit<T, 'type'>, func: (content: Omit<T, 'type'>) => SnapPoint[]) {
  let result = snapPointsCache.get(content)
  if (!result) {
    result = func(content)
    snapPointsCache.set(content, result)
  }
  return result
}

function* iterateIntersectionPoints(content1: BaseContent, content2: BaseContent) {
  const model1 = getModel(content1.type)
  const model2 = getModel(content2.type)
  if (model1 && model2) {
    if (model1.getCircle && model2.getCircle) {
      yield* getTwoCircleIntersectionPoints(model1.getCircle(content1), model1.getCircle(content2))
    } else if (model1.getCircle && model2.getLines) {
      for (const line of getLinesAndPointsFromCache(content2, model2.getLines).lines) {
        yield* getLineSegmentCircleIntersectionPoints(...line, model1.getCircle(content1))
      }
    } else if (model1.getLines && model2.getCircle) {
      for (const line of getLinesAndPointsFromCache(content1, model1.getLines).lines) {
        yield* getLineSegmentCircleIntersectionPoints(...line, model2.getCircle(content2))
      }
    } else if (model1.getLines && model2.getLines) {
      for (const line1 of getLinesAndPointsFromCache(content1, model1.getLines).lines) {
        for (const line2 of getLinesAndPointsFromCache(content2, model2.getLines).lines) {
          const point = getTwoLinesIntersectionPoint(...line1, ...line2)
          if (point) {
            yield point
          }
        }
      }
    }
  }
}

export function getAngleSnap(angle: number) {
  const snap = Math.round(angle / 90) * 90
  if (snap !== angle && Math.abs(snap - angle) < 5) {
    return snap
  }
  return undefined
}
