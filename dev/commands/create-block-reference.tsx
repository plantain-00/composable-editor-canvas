import { isSelected, useCursorInput } from "../../src"
import { BlockContent, getBlockIndex, isBlockContent } from "../models/block-model"
import { BlockReferenceContent } from "../models/block-reference-model"
import { Command } from "./command"

export const createBlockReferenceCommand: Command = {
  name: 'create block reference',
  useCommand({ onEnd, type, scale }) {
    let message = ''
    if (type) {
      message = 'specify target point'
    }
    const { input, setInputPosition, cursorPosition, setCursorPosition, resetInput } = useCursorInput(message)

    return {
      onStart(p) {
        resetInput()
        onEnd({
          updateContents: (contents, selected) => {
            contents.push(...contents
              .filter((c, i): c is BlockContent => !!c && isSelected([i], selected) && isBlockContent(c))
              .map((block) => ({
                type: 'block reference',
                refId: getBlockIndex(block, contents),
                x: p.x - block.base.x,
                y: p.y - block.base.y,
                angle: 0,
              } as BlockReferenceContent))
            )
            setCursorPosition(undefined)
          }
        })
      },
      input,
      onMove(p, viewportPosition) {
        setInputPosition(viewportPosition || p)
        if (!type) {
          return
        }
        setCursorPosition(p)
      },
      updateContent(content, contents) {
        if (!isBlockContent(content)) {
          return {}
        }
        if (cursorPosition) {
          return {
            newContents: [
              {
                type: 'block reference',
                refId: getBlockIndex(content, contents),
                x: cursorPosition.x - content.base.x,
                y: cursorPosition.y - content.base.y,
                angle: 0,
              } as BlockReferenceContent,
            ],
            assistentContents: [
              {
                type: 'line',
                dashArray: [4 / scale],
                points: [{ x: content.base.x, y: content.base.y }, cursorPosition]
              },
            ]
          }
        }
        return {}
      },
    }
  },
  contentSelectable: isBlockContent,
  selectCount: 1,
  hotkey: 'I',
}
