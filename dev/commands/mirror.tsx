import produce from "immer"
import React from "react"
import { useCursorInput, useDragMove } from "../../src"
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
    let message = ''
    if (enabled) {
      message = startPosition ? 'specify second point' : 'specify first point'
    }
    const { input, setInputPosition, clearText, setCursorPosition } = useCursorInput(message, (e, text) => {
      if (e.key === 'Enter') {
        if (text.toLowerCase() === 'y' || text.toLowerCase() === 'n') {
          setChangeOriginal(!changeOriginal)
          clearText()
        }
      }
    })
    return {
      onStart,
      mask: enabled ? mask : undefined,
      input,
      subcommand: enabled ? (
        <button
          onClick={(e) => {
            setChangeOriginal(!changeOriginal)
            e.stopPropagation()
          }}
        >
          {changeOriginal ? 'create new(N)' : 'change original(Y)'}
        </button>
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
      },
      onMove(p, viewportPosition) {
        setCursorPosition(p)
        setInputPosition(viewportPosition || p)
      },
    }
  }
}
