import { isSelected } from "../../src"
import { BaseContent, getModel } from "../models/model"
import { Command } from "./command"

export const explodeCommand: Command = {
  name: 'explode',
  execute(contents, selected) {
    const newContents: BaseContent<string>[] = []
    contents.forEach((content, index) => {
      if (content && isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
        const result = getModel(content.type)?.explode?.(content, contents)
        if (result) {
          newContents.push(...result)
          contents[index] = undefined
        }
      }
    })
    contents.push(...newContents)
  },
  contentSelectable(content, contents) {
    const model = getModel(content.type)
    return model?.explode !== undefined && (model.deletable?.(content, contents) ?? true)
  },
  hotkey: 'X',
}
