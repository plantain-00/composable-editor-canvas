import produce from "immer"
import React from "react"
import { useDragMove } from "../../src"
import { mirrorContent } from "../util-2"
import { Command } from "./command"

export const mirrorCommand: Command = {
  name: 'mirror',
  useCommand(onEnd, transform, getAngleSnap, enabled) {
    const [changeOriginal, setChangeOriginal] = React.useState(false)
    const { offset, onStart, mask, startPosition } = useDragMove(onEnd, {
      transform,
      ignoreLeavingEvent: true,
      getAngleSnap,
    })
    return {
      onStart,
      mask: enabled ? (
        <>
          {mask}
          <button onClick={() => setChangeOriginal(!changeOriginal)} style={{ position: 'relative' }}>{changeOriginal ? 'create new' : 'change original'}</button>
        </>
      ) : undefined,
      updateContent(content) {
        if (startPosition && offset && (offset.x !== 0 || offset.y !== 0)) {
          const end = { x: startPosition.x + offset.x, y: startPosition.y + offset.y }
          if (changeOriginal) {
            mirrorContent(content, startPosition, end)
          }
          return {
            newContents: !changeOriginal ? [
              produce(content, (d) => {
                mirrorContent(d, startPosition, end)
              }),
            ] : undefined,
            assistentContents: [
              {
                type: 'line',
                dashArray: [4],
                points: [startPosition, end]
              },
            ]
          }
        }
        return {}
      }
    }
  }
}
