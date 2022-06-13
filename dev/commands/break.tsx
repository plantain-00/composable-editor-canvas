import { deduplicatePosition, isSelected, Position } from "../../src"
import { BaseContent, getIntersectionPoints, getModel } from "../models/model"
import { Command } from "./command"

export const breakCommand: Command = {
  name: 'break',
  execute(contents, selected) {
    const removedContents: number[] = []
    const newContents: BaseContent<string>[] = []
    contents.forEach((content, index) => {
      if (isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
        let intersectionPoints: Position[] = []
        for (let i = 0; i < contents.length; i++) {
          const c = contents[i]
          if (i !== index) {
            const p = i < index ? [c, content] as const : [content, c] as const
            intersectionPoints.push(...getIntersectionPoints(...p, contents))
          }
        }
        intersectionPoints = deduplicatePosition(intersectionPoints)
        if (intersectionPoints.length > 0) {
          const result = getModel(content.type)?.break?.(content, intersectionPoints)
          if (result) {
            newContents.push(...result)
            removedContents.push(index)
          }
        }
      }
    })
    for (let i = contents.length; i >= 0; i--) {
      if (removedContents.includes(i)) {
        contents.splice(i, 1)
      }
    }
    contents.push(...newContents)
  },
  contentSelectable(content, contents) {
    const model = getModel(content.type)
    return model?.break !== undefined && (model.deletable?.(content, contents) ?? true)
  },
  hotkey: 'BR',
}
