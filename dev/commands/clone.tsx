import produce from "immer"
import React from "react"
import { Position, useDragMove } from "../../src"
import { moveContent } from "../util-2"
import { Command } from "./command"

export const cloneCommand: Command = {
  name: 'clone',
  useCommand(onEnd, getSnapPoint) {
    const [startPostion, setStartPosition] = React.useState<Position>()
    const [cloneOffset, setCloneOffset] = React.useState<Position>({ x: 0, y: 0 })
    const { onStartMove: onStartClone, dragMoveMask: dragCloneMask } = useDragMove(setCloneOffset, onEnd, {
      clone: true,
      getSnapPoint,
      propagation: true,
    })
    return {
      start: onStartClone,
      mask: dragCloneMask,
      setStartPosition,
      updateContent(content) {
        if (startPostion && (cloneOffset.x !== 0 || cloneOffset.y !== 0)) {
          return {
            newContents: [
              produce(content, (d) => {
                moveContent(d, cloneOffset)
              }),
            ],
            assistentContents: [
              {
                type: 'line',
                dashArray: [4],
                points: [startPostion, { x: startPostion.x + cloneOffset.x, y: startPostion.y + cloneOffset.y }]
              },
            ]
          }
        }
        return {}
      }
    }
  }
}
