import { getTwoPointsDistance, useCursorInput, useDragRotate } from "../../src"
import { rotateContent } from "../util-2"
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

    return {
      onStart,
      mask,
      input,
      onMove(_, p) {
        setInputPosition(p)
      },
      updateContent(content, contents) {
        if (startPosition && offset?.angle !== undefined) {
          rotateContent(content, startPosition, offset.angle, contents)
          const r = getTwoPointsDistance(startPosition, offset)
          return {
            assistentContents: [
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
        }
        return {}
      }
    }
  }
}
