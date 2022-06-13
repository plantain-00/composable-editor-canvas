import { isSelected } from "../../src"
import { BaseContent, getModel } from "../models/model"
import { Command } from "./command"

export const deleteCommand: Command = {
  name: 'delete',
  execute(contents, selected) {
    const removedContents: number[] = []
    contents.forEach((content, index) => {
      if (isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
        removedContents.push(index)
      }
    })
    for (let i = contents.length; i >= 0; i--) {
      if (removedContents.includes(i)) {
        contents.splice(i, 1)
      }
    }
  },
  contentSelectable(content: BaseContent, contents: readonly BaseContent[]) {
    return getModel(content.type)?.deletable?.(content, contents) ?? true
  },
  hotkey: 'E',
}
