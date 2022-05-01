import produce from "immer"
import React from "react"
import { Position, useDragMove } from "../../src"
import { mirrorContent } from "../util-2"
import { Command } from "./command"

export const mirrorCommand: Command = {
  name: 'mirror',
  useCommand(onEnd) {
    const [startPostion, setStartPosition] = React.useState<Position>()
    const [mirrorOffset, setMirrorOffset] = React.useState<Position>()
    const { onStartMove: onStartMirror, dragMoveMask: dragMirrorMask } = useDragMove(setMirrorOffset, onEnd)
    return {
      start: onStartMirror,
      mask: dragMirrorMask,
      setStartPosition,
      updateContent(content) {
        if (startPostion && mirrorOffset && (mirrorOffset.x !== 0 || mirrorOffset.y !== 0)) {
          const end = { x: startPostion.x + mirrorOffset.x, y: startPostion.y + mirrorOffset.y }
          return {
            newContents: [
              produce(content, (d) => {
                mirrorContent(d, startPostion, end)
              }),
            ],
            assistentContents: [
              {
                type: 'line',
                points: [startPostion, end]
              },
            ]
          }
        }
        return {}
      }
    }
  }
}
