import { BaseContent, getModel } from "../models/model"
import { Command } from "./command"

export const deleteCommand: Command = {
  name: 'delete',
  executeCommand() {
    return {
      removed: true,
    }
  },
  contentSelectable(content: BaseContent, contents: readonly BaseContent[]) {
    return getModel(content.type)?.deletable?.(content, contents) ?? true
  },
  hotkey: 'E',
}
