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
            let id = 1
            const removedContents: number[] = []
            contents.forEach((content, i) => {
              if (isBlockContent(content)) {
                id = Math.max(id, content.id + 1)
              }
              if (isSelected([i], selected)) {
                removedContents.push(i)
              }
            })
            const newContents: BlockContent[] = [
              {
                type: 'block',
                id,
                contents: contents.filter((c, i) => isSelected([i], selected) && contentSelectable(c)),
                base: p,
              },
            ]
            for (let i = contents.length; i >= 0; i--) {
              if (removedContents.includes(i)) {
                contents.splice(i, 1)
              }
            }
            contents.push(...newContents)
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
