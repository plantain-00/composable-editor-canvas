import { getTwoPointsFormRegion, Position } from '../src'
import { getCommand } from './commands/command'
import { BaseContent, getModel } from './models/model'

export function getContentByClickPosition(
  contents: BaseContent[],
  position: Position,
  contentSelectable?: (content: BaseContent, index: number) => boolean,
  delta = 3,
) {
  for (let i = 0; i < contents.length; i++) {
    const content = contents[i]
    if (
      contentSelectable?.(content, i) &&
      getModel(content.type)?.canSelectByPosition(content, position, delta)
    ) {
      return i
    }
  }
  return -1
}

export function getContentsByClickTwoPositions(
  contents: BaseContent[],
  startPosition: Position,
  endPosition: Position,
  contentSelectable?: (content: BaseContent, index: number) => boolean,
) {
  const result: number[] = []
  const region = getTwoPointsFormRegion(startPosition, endPosition)
  const partial = startPosition.x > endPosition.x
  contents.forEach((content, i) => {
    if (
      contentSelectable?.(content, i) &&
      getModel(content.type)?.canSelectByTwoPositions(content, region, partial)
    ) {
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

export function canExplodeContent(content: BaseContent) {
  return getModel(content.type)?.explode !== undefined
}

export function explodeContent(content: BaseContent) {
  return getModel(content.type)?.explode?.(content)
}

export function mirrorContent(content: BaseContent, p1: Position, p2: Position) {
  getModel(content.type)?.mirror(content, p1, p2)
}

export function isCommand(name: string) {
  return !!getCommand(name)
}

export function isExecutableCommand(name: string) {
  return !!getCommand(name)?.execuateCommand
}

export function executeCommand(name: string, content: BaseContent) {
  return getCommand(name)?.execuateCommand?.(content)
}

export function isContentSelectable(name: string, content: BaseContent) {
  return getCommand(name)?.contentSelectable?.(content) ?? true
}
