import { useCursorInput } from "../../src"
import { BlockContent, isBlockContent } from "../models/block-model"
import { Command } from "./command"

export const createBlockReferenceCommand: Command = {
  name: 'create block reference',
  useCommand(onEnd, _t, _s, enabled) {
    let message = ''
    if (enabled) {
      message = 'specify target point'
    }
    const { input, setInputPosition, cursorPosition, setCursorPosition, resetInput } = useCursorInput(message)
    
    return {
      onStart(p) {
        resetInput()
        onEnd((contents, isSelected) => {
          contents.push(...contents
            .filter((c, i): c is BlockContent => isSelected(i) && isBlockContent(c))
            .map((block) => ({
              type: 'block reference',
              id: block.id,
              x: p.x - block.base.x,
              y: p.y - block.base.y,
              angle: 0,
            }))
          )
        })
      },
      input,
      onMove(p, viewportPosition) {
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
                dashArray: [4],
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
  selectOperation: 'select one',
}
