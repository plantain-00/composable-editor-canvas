import { getModel } from "../models/model"
import { Command } from "./command"

export const explodeCommand: Command = {
  name: 'explode',
  executeCommand(content, contents) {
    return {
      removed: true,
      newContents: getModel(content.type)?.explode?.(content, contents),
    }
  },
  contentSelectable(content, contents) {
    const model = getModel(content.type)
    return model?.explode !== undefined && (model.deletable?.(content, contents) ?? true)
  },
  hotkey: 'X',
}
