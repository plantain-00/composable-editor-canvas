import { getTwoPointsFormRegion, Position } from '../src'
import { BaseContent, getModel } from './model-2'

export function getContentByClickPosition(
  contents: BaseContent[],
  position: Position,
  selectedContents: number[],
  delta = 3,
) {
  for (let i = 0; i < contents.length; i++) {
    if (selectedContents.includes(i)) {
      continue
    }
    const content = contents[i]
    if (getModel(content.type)?.canSelectByPosition(content, position, delta)) {
      return i
    }
  }
  return -1
}

export function getContentsByClickTwoPositions(
  contents: BaseContent[],
  startPosition: Position,
  endPosition: Position,
) {
  const result: number[] = []
  const region = getTwoPointsFormRegion(startPosition, endPosition)
  const partial = startPosition.x > endPosition.x
  contents.forEach((content, i) => {
    if (getModel(content.type)?.canSelectByTwoPositions(content, region, partial)) {
      result.push(i)
    }
  })
  return result
}

export function moveContent(content: BaseContent, offset: Position) {
  getModel(content.type)?.move(content, offset)
}

export function rotateContent(content: BaseContent, center: Position, angle: number) {
  getModel(content.type)?.rotate(content, center, angle)
}
