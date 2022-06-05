import * as React from "react"
import { Circle, getTwoNumbersDistance, Position, Region } from "../utils"

export function usePointSnap<T>(
  enabled: boolean,
  getIntersectionPoints: (content1: T, content2: T, contents: readonly T[]) => Position[],
  types: readonly SnapPointType[],
  getSnapPoints?: (content: T) => SnapPoint[] | undefined,
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
        if (snapPoint.type === 'center') {
          assistentContents.push(createCircle({
            x: snapPoint.x,
            y: snapPoint.y,
            r: delta * 2,
          }))
        } else if (snapPoint.type === 'endpoint') {
          assistentContents.push(createRect({
            x: snapPoint.x,
            y: snapPoint.y,
            width: delta * 4,
            height: delta * 4,
          }))
        } else if (snapPoint.type === 'midpoint') {
          assistentContents.push(createPolyline([
            { x: snapPoint.x - delta * 2, y: snapPoint.y + delta * 2 },
            { x: snapPoint.x + delta * 2, y: snapPoint.y + delta * 2 },
            { x: snapPoint.x, y: snapPoint.y - delta * 2 },
            { x: snapPoint.x - delta * 2, y: snapPoint.y + delta * 2 },
          ]))
        } else if (snapPoint.type === 'intersection') {
          assistentContents.push(
            createPolyline([
              { x: snapPoint.x - delta * 2, y: snapPoint.y - delta * 2 },
              { x: snapPoint.x + delta * 2, y: snapPoint.y + delta * 2 },
            ]),
            createPolyline([
              { x: snapPoint.x - delta * 2, y: snapPoint.y + delta * 2 },
              { x: snapPoint.x + delta * 2, y: snapPoint.y - delta * 2 },
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
        const snapPoints = getSnapPoints?.(content)
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
      setSnapPoint(undefined)
      return p
    }
  }
}

export type SnapPoint = Position & { type: SnapPointType }
export const allSnapTypes = ['endpoint', 'midpoint', 'center', 'intersection'] as const
export type SnapPointType = typeof allSnapTypes[number]
