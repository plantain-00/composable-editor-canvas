import { Circle, getPointAndLineMinimumDistance, getPointAndRegionMaximumDistance, getPointAndRegionMinimumDistance, getTwoNumbersDistance, getTwoPointsDistance, getTwoPointsFormRegion, lineIntersectWithTwoPointsFormRegion, pointIsInRegion, Position } from '../src'
import { rotatePositionByCenter } from './util'

export type Content =
  | { type: 'circle' } & Circle
  | { type: 'polyline', points: Position[] }
  | { type: 'line', points: Position[] }

export function getContentByClickPosition(
  contents: Content[],
  position: Position,
  selectedContents: number[],
  delta = 3,
) {
  for (let i = 0; i < contents.length; i++) {
    if (selectedContents.includes(i)) {
      continue
    }
    const content = contents[i]
    if (content.type === 'circle') {
      if (getTwoNumbersDistance(getTwoPointsDistance(content, position), content.r) <= delta) {
        return i
      }
    } else if (content.type === 'polyline' || content.type === 'line') {
      for (let j = 1; j < content.points.length; j++) {
        const minDistance = getPointAndLineMinimumDistance(position, content.points[j - 1], content.points[j])
        if (minDistance <= delta) {
          return i
        }
      }
    }
  }
  return -1
}

export function getContentsByClickTwoPositions(
  contents: Content[],
  startPosition: Position,
  endPosition: Position,
) {
  const result: number[] = []
  const region = getTwoPointsFormRegion(startPosition, endPosition)
  const partial = startPosition.x > endPosition.x
  contents.forEach((content, i) => {
    if (content.type === 'circle') {
      if ([
        { x: content.x - content.r, y: content.y - content.r },
        { x: content.x + content.r, y: content.y + content.r },
      ].every((p) => pointIsInRegion(p, region))) {
        result.push(i)
      } else if (partial) {
        const minDistance = getPointAndRegionMinimumDistance(content, region)
        const maxDistance = getPointAndRegionMaximumDistance(content, region)
        if (minDistance <= content.r && maxDistance >= content.r) {
          result.push(i)
        }
      }
    } else if (content.type === 'polyline' || content.type === 'line') {
      if (content.points.every((p) => pointIsInRegion(p, region))) {
        result.push(i)
      } else if (partial) {
        for (let j = 1; j < content.points.length; j++) {
          if (lineIntersectWithTwoPointsFormRegion(content.points[j - 1], content.points[j], region)) {
            result.push(i)
            break
          }
        }
      }
    }
  })
  return result
}

export function moveContent(content: Content, offset: Position) {
  if (content.type === 'circle') {
    content.x += offset.x
    content.y += offset.y
  } else if (content.type === 'line' || content.type === 'polyline') {
    for (const point of content.points) {
      point.x += offset.x
      point.y += offset.y
    }
  }
}

export function rotateContent(content: Content, center: Position, angle: number) {
  if (content.type === 'circle') {
    const p = rotatePositionByCenter(content, center, angle)
    content.x = p.x
    content.y = p.y
  } else if (content.type === 'line' || content.type === 'polyline') {
    content.points = content.points.map((p) => rotatePositionByCenter(p, center, angle))
  }
}
