import * as React from "react"
import { Circle, isSamePoint, getLineCircleIntersectionPoints, getPerpendicularPoint, getPointAndLineSegmentNearestPointAndDistance, getTwoNumbersDistance, getTwoPointsDistance, Nullable, pointIsInRegion, pointIsOnLineSegment, Position, Region, twoPointLineToGeneralFormLine, TwoPointsFormRegion } from "../utils"

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
  } | undefined,
  scale = 1,
  delta = 5,
) {
  const [snapPoint, setSnapPoint] = React.useState<SnapPoint>()

  React.useEffect(() => {
    if (enabled === false) {
      setSnapPoint(undefined)
    }
  }, [enabled])

  return {
    snapPoint,
    getSnapAssistentContents<TCircle = T, TRect = T, TPolyline = T>(
      createCircle: (circle: Circle) => TCircle,
      createRect: (rect: Region) => TRect,
      createPolyline: (points: Position[]) => TPolyline,
    ) {
      const assistentContents: (TCircle | TRect | TPolyline)[] = []
      if (snapPoint) {
        const d = delta * 2 / scale
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
    ) {
      if (!enabled) {
        setSnapPoint(undefined)
        return p
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
                setSnapPoint({ ...point, type: 'intersection' })
                return point
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
                    setSnapPoint({ ...point, type: 'perpendicular' })
                    return point
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
                      setSnapPoint({ ...perpendicularPoint, type: 'perpendicular' })
                      return perpendicularPoint
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
                    setSnapPoint({ ...point, type: 'nearest' })
                    return point
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
                    setSnapPoint({ ...point, type: 'nearest' })
                    return point
                  }
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

/**
 * @public
 */
export type SnapPoint = Position & { type: SnapPointType }

/**
 * @public
 */
export const allSnapTypes = ['endpoint', 'midpoint', 'center', 'intersection', 'nearest', 'perpendicular'] as const

/**
 * @public
 */
export type SnapPointType = typeof allSnapTypes[number]
