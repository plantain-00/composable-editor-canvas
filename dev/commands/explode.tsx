import { canExplodeContent, explodeContent } from "../util-2"
import { Command } from "./command"

export const explodeCommand: Command = {
  name: 'explode',
  executeCommand(content, contents) {
    if (canExplodeContent(content)) {
      return {
        removed: true,
        newContents: explodeContent(content, contents),
      }
    }
    return {}
  },
  contentSelectable: canExplodeContent,
}
