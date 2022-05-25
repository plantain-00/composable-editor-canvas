import { isBlockContent } from "../models/block-model"
import { Command } from "./command"

export const startEditBlockCommand: Command = {
  name: 'start edit block',
  executeCommand(content, _, index) {
    return {
      editingStatePath: isBlockContent(content) ? [index, 'contents'] : undefined,
    }
  },
  contentSelectable: isBlockContent,
  selectCount: 1,
}
