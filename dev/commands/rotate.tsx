import { getTwoPointsDistance, useDragRotate } from "../../src"
import { rotateContent } from "../util-2"
import { Command } from "./command"

export const rotateCommand: Command = {
  name: 'rotate',
  useCommand(onEnd, transform, getAngleSnap) {
    const { offset, onStart, mask, center: startPostion } = useDragRotate(
      onEnd,
      {
        transform,
        transformOffset: (f) => f - 90,
        getAngleSnap,
      },
    )
    return {
      onStart,
      mask,
      updateContent(content) {
        if (startPostion && offset?.angle !== undefined) {
          rotateContent(content, startPostion, offset.angle)
          const r = getTwoPointsDistance(startPostion, offset)
          return {
            assistentContents: [
              {
                type: 'line',
                dashArray: [4],
                points: [startPostion, offset]
              },
              {
                type: 'arc',
                x: startPostion.x,
                y: startPostion.y,
                r,
                dashArray: [4],
                startAngle: offset.angle > 180 || offset.angle < 0 ? offset.angle : 0,
                endAngle: offset.angle > 180 || offset.angle < 0 ? 0 : offset.angle,
              },
              {
                type: 'line',
                dashArray: [4],
                points: [startPostion, { x: startPostion.x + r, y: startPostion.y }]
              }
            ]
          }
        }
        return {}
      }
    }
  }
}
