import { Circle, getPointAndLineSegmentMinimumDistance, getPointAndRegionMaximumDistance, getPointAndRegionMinimumDistance, getTwoNumbersDistance, getTwoPointsDistance, getTwoPointsFormRegion, lineIntersectWithTwoPointsFormRegion, pointInPolygon, pointIsInRegion, Position, TwoPointsFormRegion } from "./geometry"

/**
 * @public
 */
export function getContentByClickPosition<T>(
  contents: readonly T[],
  position: Position,
  contentSelectable: (index: number[]) => boolean,
  getModel: (content: T) => {
    getCircle?: (content: T) => { circle: Circle },
    getGeometries?: (content: T, contents: readonly T[]) => {
      lines: [Position, Position][]
      regions?: {
        points: Position[]
      }[]
    },
    canSelectPart?: boolean,
  } | undefined,
  part = false,
  delta = 3,
): number[] | undefined {
  for (let i = 0; i < contents.length; i++) {
    const content = contents[i]
    const model = getModel(content)
    if (model?.getCircle) {
      const { circle } = model.getCircle(content)
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
  contents: readonly T[],
  startPosition: Position,
  endPosition: Position,
  getModel: (content: T) => {
    getCircle?: (content: T) => { circle: Circle, bounding: TwoPointsFormRegion },
    getGeometries?: (content: T, contents: readonly T[]) => {
      lines: [Position, Position][]
      bounding?: TwoPointsFormRegion
      regions?: {
        points: Position[]
        lines: [Position, Position][]
      }[]
    },
  } | undefined,
  contentSelectable?: (index: number[]) => boolean,
) {
  const result: number[][] = []
  const region = getTwoPointsFormRegion(startPosition, endPosition)
  const partial = startPosition.x > endPosition.x
  contents.forEach((content, i) => {
    if (contentSelectable?.([i])) {
      const model = getModel(content)
      if (model?.getCircle) {
        const { circle, bounding } = model.getCircle(content)
        if (pointIsInRegion(bounding.start, region) && pointIsInRegion(bounding.end, region)) {
          result.push([i])
        } else if (partial) {
          const minDistance = getPointAndRegionMinimumDistance(circle, region)
          const maxDistance = getPointAndRegionMaximumDistance(circle, region)
          if (minDistance <= circle.r && maxDistance >= circle.r) {
            result.push([i])
          }
        }
      } else if (model?.getGeometries) {
        const { lines, bounding, regions } = model.getGeometries(content, contents)
        if (bounding && pointIsInRegion(bounding.start, region) && pointIsInRegion(bounding.end, region)) {
          result.push([i])
        } else if (partial) {
          for (const line of lines) {
            if (lineIntersectWithTwoPointsFormRegion(...line, region)) {
              result.push([i])
              return
            }
          }
          if (regions) {
            for (const r of regions) {
              for (const line of r.lines) {
                if (lineIntersectWithTwoPointsFormRegion(...line, region)) {
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
