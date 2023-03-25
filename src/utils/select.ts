import { Circle, getPointAndLineSegmentMinimumDistance, getPointAndPolygonMaximumDistance, getPointAndPolygonMinimumDistance, getPolygonFromTwoPointsFormRegion, getTwoNumbersDistance, getTwoPointsDistance, getTwoPointsFormRegion, lineIntersectWithPolygon, pointInPolygon, Position, TwoPointsFormRegion } from "./geometry"
import { Nullable } from "./types"

/**
 * @public
 */
export function getContentByClickPosition<T>(
  contents: readonly Nullable<T>[],
  position: Position,
  contentSelectable: (path: number[]) => boolean,
  getModel: (content: T) => {
    getCircle?: (content: T) => { circle: Circle, fill?: boolean },
    getGeometries?: (content: T, contents: readonly Nullable<T>[]) => {
      lines: [Position, Position][]
      regions?: {
        points: Position[]
      }[]
    },
    canSelectPart?: boolean,
  } | undefined,
  part = false,
  contentVisible?: (content: T) => boolean,
  indexes = contents.map((_, i) => i),
  delta = 3,
): number[] | undefined {
  for (let j = indexes.length - 1; j >= 0; j--) {
    const i = indexes[j]
    const content = contents[i]
    if (!content) {
      continue
    }
    if (contentVisible && !contentVisible(content)) {
      continue
    }
    const model = getModel(content)
    if (model?.getCircle) {
      const { circle, fill } = model.getCircle(content)
      if (fill && contentSelectable([i]) && getTwoPointsDistance(circle, position) <= circle.r) {
        return [i]
      }
      if (contentSelectable([i]) && getTwoNumbersDistance(getTwoPointsDistance(circle, position), circle.r) <= delta) {
        return [i]
      }
    } else if (model?.getGeometries) {
      const { lines, regions } = model.getGeometries(content, contents)
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j]
        const minDistance = getPointAndLineSegmentMinimumDistance(position, ...line)
        if (minDistance <= delta) {
          if (part && model.canSelectPart && contentSelectable([i, j])) {
            return [i, j]
          }
          if (contentSelectable([i])) {
            return [i]
          }
        }
      }
      if (regions) {
        for (let j = 0; j < regions.length; j++) {
          if (pointInPolygon(position, regions[j].points)) {
            if (part && model.canSelectPart && contentSelectable([i, j])) {
              return [i, j + lines.length]
            }
            if (contentSelectable([i])) {
              return [i]
            }
          }
        }
      }
    }
  }
  return undefined
}

/**
 * @public
 */
export function getContentsByClickTwoPositions<T>(
  contents: readonly Nullable<T>[],
  startPosition: Position,
  endPosition: Position,
  getModel: (content: T) => {
    getCircle?: (content: T) => { circle: Circle, bounding: TwoPointsFormRegion },
    getGeometries?: (content: T, contents: readonly Nullable<T>[]) => {
      lines: [Position, Position][]
      bounding?: TwoPointsFormRegion
      regions?: {
        points: Position[]
        lines: [Position, Position][]
      }[]
    },
  } | undefined,
  contentSelectable?: (index: number[]) => boolean,
  contentVisible?: (content: T) => boolean,
) {
  const region = getTwoPointsFormRegion(startPosition, endPosition)
  const partial = startPosition.x > endPosition.x
  return getContentsByRegion(contents, getPolygonFromTwoPointsFormRegion(region), partial, false, getModel, contentSelectable, contentVisible)
}

export function getContentsByRegion<T>(
  contents: readonly Nullable<T>[],
  polygon: Position[],
  partial: boolean,
  rotated: boolean,
  getModel: (content: T) => {
    getCircle?: (content: T) => { circle: Circle, bounding: TwoPointsFormRegion },
    getGeometries?: (content: T, contents: readonly Nullable<T>[]) => {
      lines: [Position, Position][]
      bounding?: TwoPointsFormRegion
      regions?: {
        points: Position[]
        lines: [Position, Position][]
      }[]
    },
  } | undefined,
  contentSelectable?: (index: number[]) => boolean,
  contentVisible?: (content: T) => boolean,
) {
  const result: number[][] = []
  contents.forEach((content, i) => {
    if (!content) {
      return
    }
    if (contentVisible && !contentVisible(content)) {
      return
    }
    if (!contentSelectable || contentSelectable([i])) {
      const model = getModel(content)
      if (model?.getCircle) {
        const { circle, bounding } = model.getCircle(content)
        if (rotated
          ? pointInPolygon(circle, polygon) && getPointAndPolygonMinimumDistance(circle, polygon) >= circle.r
          : pointInPolygon(bounding.start, polygon) && pointInPolygon(bounding.end, polygon)) {
          result.push([i])
        } else if (partial) {
          const minDistance = getPointAndPolygonMinimumDistance(circle, polygon)
          const maxDistance = getPointAndPolygonMaximumDistance(circle, polygon)
          if (minDistance <= circle.r && maxDistance >= circle.r) {
            result.push([i])
          }
        }
      } else if (model?.getGeometries) {
        const { lines, bounding, regions } = model.getGeometries(content, contents)
        if (rotated
          ? lines.every(([p1, p2]) => pointInPolygon(p1, polygon) && pointInPolygon(p2, polygon))
          && (!regions || regions.every(r => r.points.every(p => pointInPolygon(p, polygon))))
          : bounding && pointInPolygon(bounding.start, polygon) && pointInPolygon(bounding.end, polygon)) {
          result.push([i])
        } else if (partial) {
          for (const line of lines) {
            if (lineIntersectWithPolygon(...line, polygon)) {
              result.push([i])
              return
            }
          }
          if (regions) {
            for (const r of regions) {
              for (const line of r.lines) {
                if (lineIntersectWithPolygon(...line, polygon)) {
                  result.push([i])
                  return
                }
              }
            }
          }
        }
      }
    }
  })
  return result
}
