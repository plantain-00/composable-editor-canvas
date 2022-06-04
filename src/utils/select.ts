import { Circle, getPointAndLineMinimumDistance, getPointAndRegionMaximumDistance, getPointAndRegionMinimumDistance, getTwoNumbersDistance, getTwoPointsDistance, getTwoPointsFormRegion, lineIntersectWithTwoPointsFormRegion, pointIsInRegion, Position } from "./geometry"

/**
 * @public
 */
export function getContentByClickPosition<T>(
  contents: readonly T[],
  position: Position,
  contentSelectable: (index: number[]) => boolean,
  getModel: (content: T) => {
    getCircle?: (content: T) => Circle,
    getLines?: (content: T, contents: readonly T[]) => { lines: [Position, Position][] },
    canSelectPart?: boolean,
  } | undefined,
  part = false,
  delta = 3,
): number[] | undefined {
  for (let i = 0; i < contents.length; i++) {
    const content = contents[i]
    const model = getModel(content)
    if (model?.getCircle) {
      const circle = model.getCircle(content)
      if (contentSelectable([i]) && getTwoNumbersDistance(getTwoPointsDistance(circle, position), circle.r) <= delta) {
        return [i]
      }
    } else if (model?.getLines) {
      const lines = model.getLines(content, contents).lines
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j]
        const minDistance = getPointAndLineMinimumDistance(position, ...line)
        if (minDistance <= delta) {
          if (part && model.canSelectPart && contentSelectable([i, j])) {
            return [i, j]
          }
          if (contentSelectable([i])) {
            return [i]
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
    getCircle?: (content: T) => Circle,
    getLines?: (content: T, contents: readonly T[]) => { lines: [Position, Position][], points: Position[] },
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
        const circle = model.getCircle(content)
        if ([
          { x: circle.x - circle.r, y: circle.y - circle.r },
          { x: circle.x + circle.r, y: circle.y + circle.r },
        ].every((p) => pointIsInRegion(p, region))) {
          result.push([i])
        } else if (partial) {
          const minDistance = getPointAndRegionMinimumDistance(circle, region)
          const maxDistance = getPointAndRegionMaximumDistance(circle, region)
          if (minDistance <= circle.r && maxDistance >= circle.r) {
            result.push([i])
          }
        }
      } else if (model?.getLines) {
        const { lines, points } = model.getLines(content, contents)
        if (points.every((p) => pointIsInRegion(p, region))) {
          result.push([i])
        } else if (partial) {
          for (const line of lines) {
            if (lineIntersectWithTwoPointsFormRegion(...line, region)) {
              result.push([i])
              break
            }
          }
        }
      }
    }
  })
  return result
}
