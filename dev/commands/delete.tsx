import { isSelected } from "../../src"
import { BaseContent, getModel } from "../models/model"
import { Command } from "./command"

export const deleteCommand: Command = {
  name: 'delete',
  execute(contents, selected) {
    contents.forEach((content, index) => {
      if (content && isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
        contents[index] = undefined
      }
    })
  },
  contentSelectable(content: BaseContent, contents: readonly BaseContent[]) {
    return getModel(content.type)?.deletable?.(content, contents) ?? true
  },
  hotkey: 'E',
}
