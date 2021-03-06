import { produceWithPatches } from "immer"
import { getTwoPointsDistance, useCursorInput, useDragRotate } from "../../src"
import { ArcContent } from "../models/arc-model"
import { LineContent } from "../models/line-model"
import { getModel } from "../models/model"
import { Command } from "./command"

export const rotateCommand: Command = {
  name: 'rotate',
  useCommand({ onEnd, transform, getAngleSnap, type, scale }) {
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
    if (type) {
      message = startPosition ? 'specify angle point' : 'specify center point'
    }
    const { input, setInputPosition } = useCursorInput(message)
    let assistentContents: (LineContent | ArcContent)[] | undefined
    if (startPosition && offset?.angle !== undefined) {
      const r = getTwoPointsDistance(startPosition, offset)
      assistentContents = [
        {
          type: 'line',
          dashArray: [4 / scale],
          points: [startPosition, offset]
        },
        {
          type: 'arc',
          x: startPosition.x,
          y: startPosition.y,
          r,
          dashArray: [4 / scale],
          startAngle: offset.angle > 180 || offset.angle < 0 ? offset.angle : 0,
          endAngle: offset.angle > 180 || offset.angle < 0 ? 0 : offset.angle,
        },
        {
          type: 'line',
          dashArray: [4 / scale],
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
          const angle = offset.angle
          const [, ...patches] = produceWithPatches(content, (draft) => {
            getModel(content.type)?.rotate?.(draft, startPosition, angle, contents)
          })
          return {
            patches,
          }
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
