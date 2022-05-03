import produce from "immer"
import React from "react"
import { Position, useDragMove } from "../../src"
import { mirrorContent } from "../util-2"
import { Command } from "./command"

export const mirrorCommand: Command = {
  name: 'mirror',
  useCommand(onEnd, getSnapPoint, enabled) {
    const [startPostion, setStartPosition] = React.useState<Position>()
    const [mirrorOffset, setMirrorOffset] = React.useState<Position>()
    const [changeOriginal, setChangeOriginal] = React.useState(false)
    const { onStartMove: onStartMirror, dragMoveMask: dragMirrorMask } = useDragMove(setMirrorOffset, onEnd, {
      getSnapPoint,
      propagation: true,
    })
    return {
      start: onStartMirror,
      mask: enabled ? (
        <>
          {dragMirrorMask}
          <button onClick={() => setChangeOriginal(!changeOriginal)} style={{ position: 'relative' }}>{changeOriginal ? 'create new' : 'change original'}</button>
        </>
      ) : undefined,
      setStartPosition,
      updateContent(content) {
        if (startPostion && mirrorOffset && (mirrorOffset.x !== 0 || mirrorOffset.y !== 0)) {
          const end = { x: startPostion.x + mirrorOffset.x, y: startPostion.y + mirrorOffset.y }
          if (changeOriginal) {
            mirrorContent(content, startPostion, end)
          }
          return {
            newContents: !changeOriginal ? [
              produce(content, (d) => {
                mirrorContent(d, startPostion, end)
              }),
            ] : undefined,
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
