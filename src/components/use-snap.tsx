import * as React from "react"
import { Circle, getTwoNumbersDistance, Position, Region } from "../utils"

export function useSnap<T>(
  enabled: boolean,
  getIntersectionPoints: (content1: T, content2: T, contents: readonly T[]) => Position[],
  createCircle: (circle: Circle) => T,
  createRect: (rect: Region) => T,
  createPolyline: (points: Position[]) => T,
  getSnapPoints?: (content: T, contents: readonly T[]) => SnapPoint[] | undefined,
  delta = 5,
) {
  const [snapPoint, setSnapPoint] = React.useState<SnapPoint>()

  React.useEffect(() => {
    if (enabled === false) {
      setSnapPoint(undefined)
    }
  }, [enabled])

  const assistentContents: T[] = []
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

  return {
    snapPoint,
    snapAssistentContents: assistentContents,
    getSnapPoint(p: Position, contents: readonly T[], types: string[]) {
      if (!enabled) {
        setSnapPoint(undefined)
        return p
      }
      for (const content of contents) {
        const snapPoints = getSnapPoints?.(content, contents)
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

export type SnapPoint = Position & { type: 'endpoint' | 'midpoint' | 'center' | 'intersection' }
