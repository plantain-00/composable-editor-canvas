import { useCursorInput } from "../../src"
import { BlockContent, BlockReferenceContent } from "../models/block-model"
import { Command } from "./command"

export const createBlockCommand: Command = {
  name: 'create block',
  useCommand(onEnd, _t, _s, enabled) {
    let message = ''
    if (enabled) {
      message = 'specify base point'
    }
    const { input, setInputPosition } = useCursorInput(message)

    return {
      onStart(p) {
        onEnd((contents, selectedContents) => {
          let id = 1
          const removedContents: number[] = []
          contents.forEach((content, i) => {
            if (content.type === 'block') {
              id = Math.max(id, (content as BlockContent).id + 1)
            }
            if (selectedContents.includes(i)) {
              removedContents.push(i)
            }
          })
          const newContents: (BlockContent | BlockReferenceContent)[] = [
            {
              type: 'block',
              id,
              contents: contents.filter((c, i) => selectedContents.includes(i) && c.type !== 'block reference'),
              base: p,
            },
            {
              type: 'block reference',
              id,
              x: 0,
              y: 0,
              angle: 0,
            },
          ]
          for (let i = contents.length; i >= 0; i--) {
            if (removedContents.includes(i)) {
              contents.splice(i, 1)
            }
          }
          contents.push(...newContents)
        })
      },
      input,
      onMove(_, p) {
        setInputPosition(p)
      },
    }
  },
  contentSelectable: (content) => content.type !== 'block reference',
}
