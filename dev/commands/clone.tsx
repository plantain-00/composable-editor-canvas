import produce from "immer"
import { useDragMove } from "../../src"
import { moveContent } from "../util-2"
import { Command } from "./command"

export const cloneCommand: Command = {
  name: 'clone',
  useCommand(onEnd, transform, getAngleSnap) {
    const { offset, onStart, mask, startPosition } = useDragMove(onEnd, {
      repeatedly: true,
      transform,
      ignoreLeavingEvent: true,
      getAngleSnap,
    })
    return {
      onStart,
      mask,
      updateContent(content) {
        if (startPosition && (offset.x !== 0 || offset.y !== 0)) {
          return {
            newContents: [
              produce(content, (d) => {
                moveContent(d, offset)
              }),
            ],
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
