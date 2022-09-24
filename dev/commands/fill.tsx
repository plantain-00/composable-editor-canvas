import { isSelected } from "../../src"
import { getModel } from "../models/model"
import { Command } from "./command"

export const fillCommand: Command = {
  name: 'fill',
  execute(contents, selected) {
    contents.forEach((content, index) => {
      if (content && isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
        const fill = getModel(content.type)?.fill
        if (fill) {
          fill(content, 0x000000)
        }
      }
    })
  },
  contentSelectable: (content) => getModel(content.type)?.fill !== undefined,
}
