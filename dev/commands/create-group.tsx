import { isSelected } from "../../src"
import { isBlockContent } from "../models/block-model"
import { isBlockReferenceContent } from "../models/block-reference-model"
import { GroupContent } from "../models/group-model"
import { BaseContent } from "../models/model"
import { Command } from "./command"

export const createGroupCommand: Command = {
  name: 'create group',
  execute(contents, selected) {
    const newContent: GroupContent = {
      type: 'group',
      contents: contents.filter((c, i) => isSelected([i], selected) && contentSelectable(c)),
    }
    for (let i = contents.length; i >= 0; i--) {
      if (isSelected([i], selected)) {
        contents.splice(i, 1)
      }
    }
    contents.push(newContent)
  },
  contentSelectable,
  hotkey: 'B',
}

function contentSelectable(content: BaseContent) {
  return !isBlockReferenceContent(content) && !isBlockContent(content)
}
