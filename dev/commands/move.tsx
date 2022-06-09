import { useCursorInput, useDragMove } from "../../src"
import { getModel } from "../models/model"
import { Command } from "./command"

export const moveCommand: Command = {
  name: 'move',
  useCommand({ onEnd, transform, getAngleSnap, type, scale }) {
    const { offset, onStart, mask, startPosition } = useDragMove(onEnd, {
      transform,
      ignoreLeavingEvent: true,
      getAngleSnap,
    })
    let message = ''
    if (type) {
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
          getModel(content.type)?.move?.(content, offset)
        }
        return {}
      },
      assistentContents: startPosition && (offset.x !== 0 || offset.y !== 0) ? [
        {
          type: 'line',
          dashArray: [4 / scale],
          points: [startPosition, { x: startPosition.x + offset.x, y: startPosition.y + offset.y }]
        },
      ] : undefined,
    }
  },
  contentSelectable(content) {
    return getModel(content.type)?.move !== undefined
  },
  hotkey: 'M',
}
