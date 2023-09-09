import * as React from "react"
import { Circle, isSamePoint, getLineCircleIntersectionPoints, getPerpendicularPoint, getPointAndLineSegmentNearestPointAndDistance, getTwoNumbersDistance, getTwoPointsDistance, Nullable, pointIsInRegion, pointIsOnLineSegment, Position, Region, twoPointLineToGeneralFormLine, TwoPointsFormRegion } from "../utils"
import { getAngleSnapPosition } from "../utils/snap"

/**
 * @public
 */
export function usePointSnap<T>(
  enabled: boolean,
  getIntersectionPoints: (content1: T, content2: T, contents: readonly Nullable<T>[]) => Position[],
  types: readonly SnapPointType[],
  getModel: (content: T) => {
    getSnapPoints?: (content: T, contents: readonly Nullable<T>[]) => SnapPoint[]
    getGeometries?: (content: T, contents: readonly Nullable<T>[]) => { lines: [Position, Position][], bounding?: TwoPointsFormRegion }
    getCircle?: (content: T) => { circle: Circle, bounding?: TwoPointsFormRegion }
    getParam?(content: T, point: Position): number
  } | undefined,
  offset?: Position,
  delta = 5,
  getGridSnap = (p: Position) => ({ x: Math.round(p.x), y: Math.round(p.y) }),
  getAngleSnap = (angle: number) => {
    const snap = Math.round(angle / 45) * 45
    if (snap !== angle && Math.abs(snap - angle) < 5) {
      return snap
    }
    return undefined
  },
) {
  const [snapPoint, setSnapPoint] = React.useState<SnapPoint>()

  React.useEffect(() => {
    if (enabled === false) {
      setSnapPoint(undefined)
    }
  }, [enabled])

  const getOffsetSnapPoint = (p: Position) => {
    if (offset) {
      return {
        position: {
          x: p.x + offset.x,
          y: p.y + offset.y,
        },
      }
    }
    return { position: p }
  }

  const getSnapTarget = (model: ReturnType<typeof getModel>, content: T, point: Position) => {
    const param = model?.getParam?.(content, point)
    if (param !== undefined) {
      return {
        target: {
          snapIndex: -1,
          content,
          param,
        },
      }
    }
    return
  }

  const transformResult = (transformSnapPosition: ((p: Position) => Position) | undefined, r: SnapResult<T>): SnapResult<T> => {
    if (transformSnapPosition) {
      return {
        ...r,
        position: transformSnapPosition(r.position),
      }
    }
    return r
  }

  const saveSnapPoint = (transformSnapPosition?: (p: Position) => Position, p?: SnapPoint) => {
    if (p && transformSnapPosition) {
      setSnapPoint({
        ...p,
        ...transformSnapPosition(p),
      })
    } else {
      setSnapPoint(p)
    }
  }

  return {
    snapPoint,
    getSnapAssistentContents<TCircle = T, TRect = T, TPolyline = T>(
      createCircle: (circle: Circle) => TCircle,
      createRect: (rect: Region) => TRect,
      createPolyline: (points: Position[]) => TPolyline,
    ) {
      const assistentContents: (TCircle | TRect | TPolyline)[] = []
      const snapPoints: SnapPoint[] = []
      if (snapPoint) {
        snapPoints.push(snapPoint)
        if (offset) {
          snapPoints.push({
            ...snapPoint,
            x: snapPoint.x + offset.x,
            y: snapPoint.y + offset.y,
          })
        }
      }
      for (const snapPoint of snapPoints) {
        const d = delta * 2
        if (snapPoint.type === 'center') {
          assistentContents.push(createCircle({
            x: snapPoint.x,
            y: snapPoint.y,
            r: d,
          }))
        } else if (snapPoint.type === 'endpoint') {
          assistentContents.push(createRect({
            x: snapPoint.x,
            y: snapPoint.y,
            width: d * 2,
            height: d * 2,
          }))
        } else if (snapPoint.type === 'midpoint') {
          assistentContents.push(createPolyline([
            { x: snapPoint.x - d, y: snapPoint.y + d },
            { x: snapPoint.x + d, y: snapPoint.y + d },
            { x: snapPoint.x, y: snapPoint.y - d },
            { x: snapPoint.x - d, y: snapPoint.y + d },
          ]))
        } else if (snapPoint.type === 'intersection') {
          assistentContents.push(
            createPolyline([
              { x: snapPoint.x - d, y: snapPoint.y - d },
              { x: snapPoint.x + d, y: snapPoint.y + d },
            ]),
            createPolyline([
              { x: snapPoint.x - d, y: snapPoint.y + d },
              { x: snapPoint.x + d, y: snapPoint.y - d },
            ]),
          )
        } else if (snapPoint.type === 'nearest') {
          assistentContents.push(
            createPolyline([
              { x: snapPoint.x - d, y: snapPoint.y - d },
              { x: snapPoint.x + d, y: snapPoint.y + d },
              { x: snapPoint.x - d, y: snapPoint.y + d },
              { x: snapPoint.x + d, y: snapPoint.y - d },
              { x: snapPoint.x - d, y: snapPoint.y - d },
            ]),
          )
        } else if (snapPoint.type === 'perpendicular') {
          assistentContents.push(createPolyline([
            { x: snapPoint.x - d * 1.5, y: snapPoint.y },
            { x: snapPoint.x + d * 1.5, y: snapPoint.y },
          ]))
          assistentContents.push(createPolyline([
            { x: snapPoint.x, y: snapPoint.y - d * 1.5 },
            { x: snapPoint.x, y: snapPoint.y },
          ]))
        }
      }
      return assistentContents
    },
    getSnapPoint(
      p: Position,
      contents: readonly Nullable<T>[],
      getContentsInRange?: (region: TwoPointsFormRegion) => readonly T[],
      lastPosition?: Position,
      transformSnapPosition?: (p: Position) => Position
    ): SnapResult<T> {
      if (!enabled) {
        saveSnapPoint(transformSnapPosition, undefined)
        return transformResult(transformSnapPosition, getOffsetSnapPoint(p))
      }
      let contentsInRange = contents
      if (getContentsInRange) {
        contentsInRange = getContentsInRange({ start: { x: p.x - delta, y: p.y - delta }, end: { x: p.x + delta, y: p.y + delta } })
      }
      for (const content of contentsInRange) {
        if (!content) {
          continue
        }
        const snapPoints = getModel(content)?.getSnapPoints?.(content, contents)
        if (snapPoints) {
          for (let i = 0; i < snapPoints.length; i++) {
            const point = snapPoints[i]
            if (
              types.includes(point.type) &&
              getTwoNumbersDistance(p.x, point.x) <= delta &&
              getTwoNumbersDistance(p.y, point.y) <= delta
            ) {
              saveSnapPoint(transformSnapPosition, point)
              return transformResult(transformSnapPosition, {
                ...getOffsetSnapPoint(point),
                target: {
                  snapIndex: i,
                  content,
                },
              })
            }
          }
        }
      }
      if (types.includes('intersection')) {
        for (let i = 0; i < contentsInRange.length; i++) {
          const content1 = contentsInRange[i]
          if (!content1) {
            continue
          }
          for (let j = i + 1; j < contentsInRange.length; j++) {
            const content2 = contentsInRange[j]
            if (!content2) {
              continue
            }
            for (const point of getIntersectionPoints(content1, content2, contents)) {
              if (
                getTwoNumbersDistance(p.x, point.x) <= delta &&
                getTwoNumbersDistance(p.y, point.y) <= delta
              ) {
                saveSnapPoint(transformSnapPosition, { ...point, type: 'intersection' })
                return transformResult(transformSnapPosition, getOffsetSnapPoint(point))
              }
            }
          }
        }
      }
      if (lastPosition && types.includes('perpendicular')) {
        for (const content of contentsInRange) {
          if (!content) {
            continue
          }
          const model = getModel(content)
          if (model) {
            if (model.getCircle) {
              const { bounding, circle } = model.getCircle(content)
              if (
                bounding &&
                pointIsInRegion(
                  p,
                  {
                    start: {
                      x: bounding.start.x - delta,
                      y: bounding.start.y - delta,
                    },
                    end: {
                      x: bounding.end.x + delta,
                      y: bounding.end.y + delta,
                    },
                  },
                ) &&
                !isSamePoint(circle, lastPosition) &&
                getTwoNumbersDistance(getTwoPointsDistance(p, circle), circle.r) <= delta
              ) {
                const points = getLineCircleIntersectionPoints(lastPosition, circle, circle)
                for (const point of points) {
                  if (getTwoPointsDistance(p, point) <= delta) {
                    saveSnapPoint(transformSnapPosition, { ...point, type: 'perpendicular' })
                    return transformResult(transformSnapPosition, {
                      ...getOffsetSnapPoint(point),
                      ...getSnapTarget(model, content, point),
                    })
                  }
                }
              }
            } else if (model.getGeometries) {
              const { bounding, lines } = model.getGeometries(content, contents)
              if (
                bounding &&
                pointIsInRegion(
                  p,
                  {
                    start: {
                      x: bounding.start.x - delta,
                      y: bounding.start.y - delta,
                    },
                    end: {
                      x: bounding.end.x + delta,
                      y: bounding.end.y + delta,
                    },
                  },
                )
              ) {
                for (const line of lines) {
                  const perpendicularPoint = getPerpendicularPoint(lastPosition, twoPointLineToGeneralFormLine(...line))
                  if (pointIsOnLineSegment(perpendicularPoint, ...line)) {
                    const distance = getTwoPointsDistance(p, perpendicularPoint)
                    if (distance <= delta) {
                      saveSnapPoint(transformSnapPosition, { ...perpendicularPoint, type: 'perpendicular' })
                      return transformResult(transformSnapPosition, {
                        ...getOffsetSnapPoint(perpendicularPoint),
                        ...getSnapTarget(model, content, perpendicularPoint),
                      })
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (types.includes('nearest')) {
        for (const content of contentsInRange) {
          if (!content) {
            continue
          }
          const model = getModel(content)
          if (model) {
            if (model.getCircle) {
              const { bounding, circle } = model.getCircle(content)
              if (
                bounding &&
                pointIsInRegion(
                  p,
                  {
                    start: {
                      x: bounding.start.x - delta,
                      y: bounding.start.y - delta,
                    },
                    end: {
                      x: bounding.end.x + delta,
                      y: bounding.end.y + delta,
                    },
                  },
                ) &&
                getTwoNumbersDistance(getTwoPointsDistance(p, circle), circle.r) <= delta
              ) {
                const points = getLineCircleIntersectionPoints(p, circle, circle)
                for (const point of points) {
                  if (getTwoPointsDistance(p, point) <= delta) {
                    saveSnapPoint(transformSnapPosition, { ...point, type: 'nearest' })
                    return transformResult(transformSnapPosition, {
                      ...getOffsetSnapPoint(point),
                      ...getSnapTarget(model, content, point),
                    })
                  }
                }
              }
            } else if (model.getGeometries) {
              const { bounding, lines } = model.getGeometries(content, contents)
              if (
                bounding &&
                pointIsInRegion(
                  p,
                  {
                    start: {
                      x: bounding.start.x - delta,
                      y: bounding.start.y - delta,
                    },
                    end: {
                      x: bounding.end.x + delta,
                      y: bounding.end.y + delta,
                    },
                  },
                )
              ) {
                for (const line of lines) {
                  const { point, distance } = getPointAndLineSegmentNearestPointAndDistance(p, ...line)
                  if (distance <= delta) {
                    saveSnapPoint(transformSnapPosition, { ...point, type: 'nearest' })
                    return transformResult(transformSnapPosition, {
                      ...getOffsetSnapPoint(point),
                      ...getSnapTarget(model, content, point),
                    })
                  }
                }
              }
            }
          }
        }
      }
      if (types.includes('grid')) {
        p = getGridSnap(p)
      }
      if (lastPosition && types.includes('angle')) {
        p = getAngleSnapPosition(lastPosition, p, getAngleSnap)
      }
      saveSnapPoint(transformSnapPosition, undefined)
      return transformResult(transformSnapPosition, getOffsetSnapPoint(p))
    }
  }
}

/**
 * @public
 */
export interface SnapResult<T> {
  position: Position
  target?: SnapTarget<T>
}

export interface SnapTarget<T> {
  snapIndex: number
  param?: number
  content: T
}

/**
 * @public
 */
export type SnapPoint = Position & { type: SnapPointType }

/**
 * @public
 */
export const allSnapTypes = ['endpoint', 'midpoint', 'center', 'intersection', 'nearest', 'perpendicular', 'grid', 'angle'] as const

/**
 * @public
 */
export type SnapPointType = typeof allSnapTypes[number]
