import { isSelected, useCursorInput } from "../../src"
import { BlockContent, isBlockContent } from "../models/block-model"
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
        onEnd((contents, selected) => {
          contents.push(...contents
            .filter((c, i): c is BlockContent => isSelected([i], selected) && isBlockContent(c))
            .map((block) => ({
              type: 'block reference',
              id: block.id,
              x: p.x - block.base.x,
              y: p.y - block.base.y,
              angle: 0,
            }))
          )
          setCursorPosition(undefined)
        })
      },
      input,
      onMove(p, viewportPosition) {
        if (!type) {
          return
        }
        setCursorPosition(p)
        setInputPosition(viewportPosition || p)
      },
      updateContent(content) {
        if (!isBlockContent(content)) {
          return {}
        }
        if (cursorPosition) {
          return {
            newContents: [
              {
                type: 'block reference',
                id: content.id,
                x: cursorPosition.x - content.base.x,
                y: cursorPosition.y - content.base.y,
                angle: 0,
              },
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
