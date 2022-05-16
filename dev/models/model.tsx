import React from 'react'
import { Circle, getLineSegmentCircleIntersectionPoints, getTwoCircleIntersectionPoints, getTwoLinesIntersectionPoint, getTwoNumbersDistance, Position, ReactRenderTarget } from '../../src'
import { CircleContent } from './circle-model'
import { LineContent } from './line-model'
import { RectContent } from './rect-model'

export interface BaseContent<T extends string = string> {
  type: T
  dashArray?: number[]
}

export interface Model<T> {
  type: string
  move?(content: Omit<T, 'type'>, offset: Position): void
  rotate?(content: Omit<T, 'type'>, center: Position, angle: number): void
  explode?(content: Omit<T, 'type'>): BaseContent[]
  mirror?(content: Omit<T, 'type'>, p1: Position, p2: Position): void
  render?<V>(props: { content: Omit<T, 'type'>, stroke: number, target: ReactRenderTarget<V> }): V
  renderIfSelected?<V>(props: { content: Omit<T, 'type'>, stroke: number, target: ReactRenderTarget<V> }): V
  renderOperator?<V>(props: { content: Omit<T, 'type'>, stroke: number, target: ReactRenderTarget<V>, text: string, fontSize: number }): V
  useEdit?(onEnd: () => void, transform: (p: Position) => Position, getAngleSnap?: (angle: number) => number | undefined, scale?: number): {
    mask?: JSX.Element
    updatePreview(contents: T[]): {
      assistentContents?: BaseContent[]
    }
    editBar(props: { content: T, index: number }): JSX.Element
  }
  useCreate?(type: string | undefined, onEnd: (contents: T[]) => void, getAngleSnap?: (angle: number) => number | undefined): {
    input?: JSX.Element
    subcommand?: JSX.Element
    updatePreview(contents: T[]): void
    assistentContents?: BaseContent[]
    onClick: (p: Position) => void
    onMove: (p: Position, viewportPosition?: Position) => void
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

export function useModelsEdit(onEnd: () => void, transform: (p: Position) => Position, angleSnapEnabled: boolean, scale?: number) {
  const editMasks: JSX.Element[] = []
  const updateEditPreviews: ((contents: BaseContent[]) => { assistentContents?: BaseContent[] })[] = []
  const editBarMap: Record<string, (props: { content: BaseContent, index: number }) => JSX.Element> = {}
  Object.values(modelCenter).forEach((model) => {
    if (!model.useEdit) {
      return
    }
    const { mask, updatePreview, editBar } = model.useEdit(onEnd, transform, angleSnapEnabled ? getAngleSnap : undefined, scale)
    if (mask) {
      editMasks.push(React.cloneElement(mask, { key: model.type }))
    }
    updateEditPreviews.push(updatePreview)
    editBarMap[model.type] = editBar
  })
  return {
    editMasks,
    updateEditPreview(contents: BaseContent[]) {
      const assistentContents: BaseContent[] = []
      for (const updateEditPreview of updateEditPreviews) {
        const result = updateEditPreview(contents)
        if (result.assistentContents) {
          assistentContents.push(...result.assistentContents)
        }
      }
      return {
        assistentContents,
      }
    },
    editBarMap,
  }
}

export function useModelsCreate(operation: string | undefined, onEnd: (contents: BaseContent[]) => void, angleSnapEnabled: boolean) {
  const createInputs: JSX.Element[] = []
  const createSubcommands: JSX.Element[] = []
  const updateCreatePreviews: ((contents: BaseContent[]) => void)[] = []
  const onClicks: ((p: Position) => void)[] = []
  const onMoves: ((p: Position, viewportPosition?: Position) => void)[] = []
  const createAssistentContents: BaseContent[] = []
  Object.entries(modelCenter).forEach(([type, model]) => {
    if (!model.useCreate) {
      return
    }
    const { input, updatePreview, onClick, onMove, subcommand, assistentContents } = model.useCreate(operation, onEnd, angleSnapEnabled ? getAngleSnap : undefined)
    if (input) {
      createInputs.push(React.cloneElement(input, { key: type }))
    }
    if (subcommand) {
      createSubcommands.push(React.cloneElement(subcommand, { key: type }))
    }
    updateCreatePreviews.push(updatePreview)
    onClicks.push(onClick)
    onMoves.push(onMove)
    if (assistentContents) {
      createAssistentContents.push(...assistentContents)
    }
  })
  return {
    createInputs,
    createSubcommands,
    updateCreatePreview(contents: BaseContent[]) {
      for (const updateCreatePreview of updateCreatePreviews) {
        updateCreatePreview(contents)
      }
    },
    onStartCreate(p: Position) {
      for (const onClick of onClicks) {
        onClick(p)
      }
    },
    onCreatingMove(p: Position, viewportPosition?: Position) {
      for (const onMove of onMoves) {
        onMove(p, viewportPosition)
      }
    },
    createAssistentContents,
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
    snapPoint,
    snapAssistentContents: assistentContents,
    getSnapPoint(p: Position, contents: BaseContent[], types: string[], forceEnabled?: boolean) {
      if (!enabled && !forceEnabled) {
        setSnapPoint(undefined)
        return p
      }
      for (const content of contents) {
        const iterate = getModel(content.type)?.getSnapPoints
        if (iterate) {
          const snapPoints = getSnapPointsFromCache(content, iterate)
          for (const point of snapPoints) {
            if (
              types.includes(point.type) &&
              getTwoNumbersDistance(p.x, point.x) <= delta &&
              getTwoNumbersDistance(p.y, point.y) <= delta
            ) {
              setSnapPoint(point)
              return point
            }
          }
        }
      }
      if (types.includes('intersection')) {
        for (let i = 0; i < contents.length; i++) {
          const content1 = contents[i]
          for (let j = i + 1; j < contents.length; j++) {
            const content2 = contents[j]
            for (const point of getIntersectionPoints(content1, content2)) {
              if (
                getTwoNumbersDistance(p.x, point.x) <= delta &&
                getTwoNumbersDistance(p.y, point.y) <= delta
              ) {
                setSnapPoint({ ...point, type: 'intersection' })
                return point
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

export function getLinesAndPointsFromCache<T>(content: Omit<T, 'type'>, func: () => { lines: [Position, Position][], points: Position[] }) {
  let result = linesCache.get(content)
  if (!result) {
    result = func()
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

const intersectionPointsCache = new WeakMap<BaseContent, WeakMap<BaseContent, Position[]>>()

function getIntersectionPoints(content1: BaseContent, content2: BaseContent) {
  let map = intersectionPointsCache.get(content1)
  if (!map) {
    map = new WeakMap<BaseContent, Position[]>()
    intersectionPointsCache.set(content1, map)
  }
  let result = map.get(content2)
  if (!result) {
    result = Array.from(iterateIntersectionPoints(content1, content2))
    map.set(content2, result)
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
      for (const line of model2.getLines(content2).lines) {
        yield* getLineSegmentCircleIntersectionPoints(...line, model1.getCircle(content1))
      }
    } else if (model1.getLines && model2.getCircle) {
      for (const line of model1.getLines(content1).lines) {
        yield* getLineSegmentCircleIntersectionPoints(...line, model2.getCircle(content2))
      }
    } else if (model1.getLines && model2.getLines) {
      for (const line1 of model1.getLines(content1).lines) {
        for (const line2 of model2.getLines(content2).lines) {
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
  const snap = Math.round(angle / 45) * 45
  if (snap !== angle && Math.abs(snap - angle) < 5) {
    return snap
  }
  return undefined
}

export interface Transform extends Position {
  center: Position
  scale: number
}

export function reverseTransformPosition(position: Position, transform: Transform | undefined) {
  if (!transform) {
    return position
  }
  return {
    x: (position.x - transform.center.x) / transform.scale + transform.center.x - transform.x / transform.scale,
    y: (position.y - transform.center.y) / transform.scale + transform.center.y - transform.y / transform.scale,
  }
}
