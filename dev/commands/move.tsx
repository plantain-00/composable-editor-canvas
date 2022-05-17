import { useCursorInput, useDragMove } from "../../src"
import { moveContent } from "../util-2"
import { Command } from "./command"

export const moveCommand: Command = {
  name: 'move',
  useCommand(onEnd, transform, getAngleSnap, enabled) {
    const { offset, onStart, mask, startPosition } = useDragMove(onEnd, {
      transform,
      ignoreLeavingEvent: true,
      getAngleSnap,
    })
    let message = ''
    if (enabled) {
      message = startPosition ? 'specify end point' : 'specify start point'
    }
    const { input, setInputPosition } = useCursorInput(message)

    return {
      onStart,
      mask,
      input,
      onMove(_, p) {
        setInputPosition(p)
      },
      updateContent(content) {
        if (startPosition && (offset.x !== 0 || offset.y !== 0)) {
          moveContent(content, offset)
          return {
            assistentContents: [
              {
                type: 'line',
                dashArray: [4],
                points: [startPosition, { x: startPosition.x + offset.x, y: startPosition.y + offset.y }]
              },
            ]
          }
        }
        return {}
      }
    }
  }
}
