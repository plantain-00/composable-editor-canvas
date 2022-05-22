import { getPointAndLineMinimumDistance, getPointAndRegionMaximumDistance, getPointAndRegionMinimumDistance, getTwoNumbersDistance, getTwoPointsDistance, getTwoPointsFormRegion, lineIntersectWithTwoPointsFormRegion, pointIsInRegion, Position } from '../src'
import { BaseContent, getModel } from './models/model'

export function getContentByClickPosition(
  contents: readonly BaseContent[],
  position: Position,
  contentSelectable?: (content: BaseContent, index: number) => boolean,
  delta = 3,
) {
  for (let i = 0; i < contents.length; i++) {
    const content = contents[i]
    if (contentSelectable?.(content, i)) {
      const model = getModel(content.type)
      if (model?.getCircle) {
        const circle = model.getCircle(content)
        if (getTwoNumbersDistance(getTwoPointsDistance(circle, position), circle.r) <= delta) {
          return i
        }
      } else if (model?.getLines) {
        const lines = model.getLines(content, contents).lines
        for (const line of lines) {
          const minDistance = getPointAndLineMinimumDistance(position, ...line)
          if (minDistance <= delta) {
            return i
          }
        }
      }
    }
  }
  return -1
}

export function getContentsByClickTwoPositions(
  contents: readonly BaseContent[],
  startPosition: Position,
  endPosition: Position,
  contentSelectable?: (content: BaseContent, index: number) => boolean,
) {
  const result: number[] = []
  const region = getTwoPointsFormRegion(startPosition, endPosition)
  const partial = startPosition.x > endPosition.x
  contents.forEach((content, i) => {
    if (contentSelectable?.(content, i)) {
      const model = getModel(content.type)
      if (model?.getCircle) {
        const circle = model.getCircle(content)
        if ([
          { x: circle.x - circle.r, y: circle.y - circle.r },
          { x: circle.x + circle.r, y: circle.y + circle.r },
        ].every((p) => pointIsInRegion(p, region))) {
          result.push(i)
        } else if (partial) {
          const minDistance = getPointAndRegionMinimumDistance(circle, region)
          const maxDistance = getPointAndRegionMaximumDistance(circle, region)
          if (minDistance <= circle.r && maxDistance >= circle.r) {
            result.push(i)
          }
        }
      } else if (model?.getLines) {
        const { lines, points } = model.getLines(content, contents)
        if (points.every((p) => pointIsInRegion(p, region))) {
          result.push(i)
        } else if (partial) {
          for (const line of lines) {
            if (lineIntersectWithTwoPointsFormRegion(...line, region)) {
              result.push(i)
              break
            }
          }
        }
      }
    }
  })
  return result
}
