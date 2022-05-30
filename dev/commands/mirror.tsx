import produce from "immer"
import React from "react"
import { twoPointLineToGeneralFormLine, useCursorInput, useDragMove } from "../../src"
import { getModel } from "../models/model"
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
    const { input, setInputPosition, clearText, setCursorPosition } = useCursorInput(message, enabled ? (e, text) => {
      if (e.key === 'Enter') {
        if (text.toLowerCase() === 'y' || text.toLowerCase() === 'n') {
          setChangeOriginal(!changeOriginal)
          clearText()
        }
      }
    } : undefined)
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
      updateContent(content, contents) {
        if (startPosition && offset && (offset.x !== 0 || offset.y !== 0)) {
          const end = { x: startPosition.x + offset.x, y: startPosition.y + offset.y }
          const line = twoPointLineToGeneralFormLine(startPosition, end)
          const angle = Math.atan2(end.y - startPosition.y, end.x - startPosition.x) * 180 / Math.PI
          if (changeOriginal) {
            getModel(content.type)?.mirror?.(content, line, angle, contents)
          }
          return {
            newContents: !changeOriginal ? [
              produce(content, (d) => {
                getModel(d.type)?.mirror?.(d, line, angle, contents)
              }),
            ] : undefined,
            
          }
        }
        return {}
      },
      onMove(p, viewportPosition) {
        setCursorPosition(p)
        setInputPosition(viewportPosition || p)
      },
      assistentContents: startPosition && offset && (offset.x !== 0 || offset.y !== 0) ? [
        {
          type: 'line',
          dashArray: [4],
          points: [startPosition, { x: startPosition.x + offset.x, y: startPosition.y + offset.y }]
        },
      ] : undefined,
    }
  },
  contentSelectable(content) {
    return getModel(content.type)?.mirror !== undefined
  },
  hotkey: 'MI',
}
