import { deduplicatePosition, Position } from "../../src"
import { getIntersectionPoints, getModel } from "../models/model"
import { Command } from "./command"

export const breakCommand: Command = {
  name: 'break',
  executeCommand(content, contents, index) {
    let intersectionPoints: Position[] = []
    for (let i = 0; i < contents.length; i++) {
      const c = contents[i]
      if (i !== index) {
        const p = i < index ? [c, content] as const : [content, c] as const
        intersectionPoints.push(...getIntersectionPoints(...p, contents))
      }
    }
    intersectionPoints = deduplicatePosition(intersectionPoints)
    if (intersectionPoints.length === 0) {
      return {}
    }
    const newContents = getModel(content.type)?.break?.(content, intersectionPoints)
    if (!newContents) {
      return {}
    }
    return {
      removed: true,
      newContents: newContents,
    }
  },
  contentSelectable(content, contents) {
    const model = getModel(content.type)
    return model?.break !== undefined && (model.deletable?.(content, contents) ?? true)
  },
  hotkey: 'BR',
}
