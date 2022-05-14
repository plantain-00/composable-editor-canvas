import React from "react"
import { Position, useDragMove } from "../../src"
import { moveContent } from "../util-2"
import { Command } from "./command"

export const moveCommand: Command = {
  name: 'move',
  useCommand(onEnd, getSnapPoint) {
    const [startPostion, setStartPosition] = React.useState<Position>()
    const [moveOffset, setMoveOffset] = React.useState<Position>({ x: 0, y: 0 })
    const { onStartMove, dragMoveMask } = useDragMove(setMoveOffset, onEnd, {
      getSnapPoint,
      ignoreLeavingEvent: true,
    })
    return {
      start: onStartMove,
      mask: dragMoveMask,
      setStartPosition,
      updateContent(content) {
        if (startPostion && (moveOffset.x !== 0 || moveOffset.y !== 0)) {
          moveContent(content, moveOffset)
          return {
            assistentContents: [
              {
                type: 'line',
                dashArray: [4],
                points: [startPostion, { x: startPostion.x + moveOffset.x, y: startPostion.y + moveOffset.y }]
              },
            ]
          }
        }
        return {}
      }
    }
  }
}
