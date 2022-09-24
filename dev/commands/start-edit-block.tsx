import { isSelected } from "../../src"
import { isBlockContent } from "../models/block-model"
import { isGroupContent } from "../models/group-model"
import { BaseContent } from "../models/model"
import { Command } from "./command"

export const startEditBlockCommand: Command = {
  name: 'start edit block',
  execute(contents, selected, setEditingContentPath) {
    contents.forEach((content, index) => {
      if (content && isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
        setEditingContentPath(contentSelectable(content) ? [index, 'contents'] : undefined)
      }
    })
  },
  contentSelectable,
  selectCount: 1,
}

function contentSelectable(c: BaseContent) {
  return isBlockContent(c) || isGroupContent(c)
}
