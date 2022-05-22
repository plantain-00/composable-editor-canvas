import { BaseContent, getModel } from "../models/model"
import { Command } from "./command"

export const explodeCommand: Command = {
  name: 'explode',
  executeCommand(content, contents) {
    return {
      removed: true,
      newContents: getModel(content.type)?.explode?.(content, contents),
    }
  },
  contentSelectable(content: BaseContent) {
    return getModel(content.type)?.explode !== undefined
  },
}
