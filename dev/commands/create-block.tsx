import { isSelected, useCursorInput } from "../../src"
import { BlockContent, isBlockContent } from "../models/block-model"
import { isBlockReferenceContent } from "../models/block-reference-model"
import { BaseContent } from "../models/model"
import { Command } from "./command"

export const createBlockCommand: Command = {
  name: 'create block',
  useCommand({ onEnd, type }) {
    let message = ''
    if (type) {
      message = 'specify base point'
    }
    const { input, setInputPosition } = useCursorInput(message)

    return {
      onStart(p) {
        onEnd({
          updateContents: (contents, selected) => {
            const newContent: BlockContent = {
              type: 'block',
              contents: contents.filter((c, i) => c && isSelected([i], selected) && contentSelectable(c)),
              base: p,
            }
            contents.forEach((_, i) => {
              if (isSelected([i], selected)) {
                contents[i] = undefined
              }
            })
            contents.push(newContent)
          }
        })
      },
      input,
      onMove(_, p) {
        setInputPosition(p)
      },
    }
  },
  contentSelectable,
  hotkey: 'B',
}

function contentSelectable(content: BaseContent) {
  return !isBlockReferenceContent(content) && !isBlockContent(content)
}
