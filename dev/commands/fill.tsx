import { isSelected } from "../../src"
import { isFillContent } from "../models/model"
import { Command } from "./command"

export const fillCommand: Command = {
  name: 'fill',
  execute(contents, selected) {
    contents.forEach((content, index) => {
      if (content && isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
        if (isFillContent(content)) {
          content.fillColor = 0x000000
        }
      }
    })
  },
  contentSelectable: isFillContent,
}
