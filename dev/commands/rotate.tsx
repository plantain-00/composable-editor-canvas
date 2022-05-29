import { getTwoPointsDistance, useCursorInput, useDragRotate } from "../../src"
import { ArcContent } from "../models/arc-model"
import { LineContent } from "../models/line-model"
import { getModel } from "../models/model"
import { Command } from "./command"

export const rotateCommand: Command = {
  name: 'rotate',
  useCommand(onEnd, transform, getAngleSnap, enabled) {
    const { offset, onStart, mask, center: startPosition } = useDragRotate(
      onEnd,
      {
        transform,
        transformOffset: (f) => f - 90,
        getAngleSnap,
        ignoreLeavingEvent: true,
      },
    )
    let message = ''
    if (enabled) {
      message = startPosition ? 'specify angle point' : 'specify center point'
    }
    const { input, setInputPosition } = useCursorInput(message)
    let assistentContents: (LineContent | ArcContent)[] | undefined
    if (startPosition && offset?.angle !== undefined) {
      const r = getTwoPointsDistance(startPosition, offset)
      assistentContents = [
        {
          type: 'line',
          dashArray: [4],
          points: [startPosition, offset]
        },
        {
          type: 'arc',
          x: startPosition.x,
          y: startPosition.y,
          r,
          dashArray: [4],
          startAngle: offset.angle > 180 || offset.angle < 0 ? offset.angle : 0,
          endAngle: offset.angle > 180 || offset.angle < 0 ? 0 : offset.angle,
        },
        {
          type: 'line',
          dashArray: [4],
          points: [startPosition, { x: startPosition.x + r, y: startPosition.y }]
        }
      ]
    }

    return {
      onStart,
      mask,
      input,
      onMove(_, p) {
        setInputPosition(p)
      },
      updateContent(content, contents) {
        if (startPosition && offset?.angle !== undefined) {
          getModel(content.type)?.rotate?.(content, startPosition, offset.angle, contents)
        }
        return {}
      },
      assistentContents,
    }
  },
  contentSelectable(content) {
    return getModel(content.type)?.rotate !== undefined
  },
  hotkey: 'RO',
}
