import { canExplodeContent, explodeContent } from "../util-2"
import { Command } from "./command"

export const explodeCommand: Command = {
  name: 'explode',
  execuateCommand(content) {
    if (canExplodeContent(content)) {
      return {
        removed: true,
        newContents: explodeContent(content),
      }
    }
    return {}
  },
  contentSelectable: canExplodeContent,
}
