import { isSelected } from "../../src"
import { BaseContent, getModel } from "../models/model"
import { Command } from "./command"

export const explodeCommand: Command = {
  name: 'explode',
  execute(contents, selected) {
    const removedContents: number[] = []
    const newContents: BaseContent<string>[] = []
    contents.forEach((content, index) => {
      if (isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
        const result = getModel(content.type)?.explode?.(content, contents)
        if (result) {
          newContents.push(...result)
          removedContents.push(index)
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
    return model?.explode !== undefined && (model.deletable?.(content, contents) ?? true)
  },
  hotkey: 'X',
}
