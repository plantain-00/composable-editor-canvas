import * as React from "react"
import { Circle, getLineCircleIntersectionPoints, getPointAndLineSegmentNearestPointAndDistance, getTwoNumbersDistance, getTwoPointsDistance, pointIsInRegion, Position, Region, TwoPointsFormRegion } from "../utils"

export function usePointSnap<T>(
  enabled: boolean,
  getIntersectionPoints: (content1: T, content2: T, contents: readonly T[]) => Position[],
  types: readonly SnapPointType[],
  getModel: (content: T) => {
    getSnapPoints?: (content: T, contents: readonly T[]) => SnapPoint[]
    getLines?: (content: T, contents: readonly T[]) => { lines: [Position, Position][], bounding?: TwoPointsFormRegion }
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
        }
      }
      return assistentContents
    },
    getSnapPoint(p: Position, contents: readonly T[]) {
      if (!enabled) {
        setSnapPoint(undefined)
        return p
      }
      for (const content of contents) {
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
        for (let i = 0; i < contents.length; i++) {
          const content1 = contents[i]
          for (let j = i + 1; j < contents.length; j++) {
            const content2 = contents[j]
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
      if (types.includes('nearest')) {
        for (const content of contents) {
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
            } else if (model.getLines) {
              const { bounding, lines } = model.getLines(content, contents)
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

export type SnapPoint = Position & { type: SnapPointType }
export const allSnapTypes = ['endpoint', 'midpoint', 'center', 'intersection', 'nearest'] as const
export type SnapPointType = typeof allSnapTypes[number]
