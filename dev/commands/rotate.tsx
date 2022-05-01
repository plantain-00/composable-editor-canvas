import React from "react"
import { getTwoPointsDistance, Position, useDragRotate } from "../../src"
import { rotateContent } from "../util-2"
import { Command } from "./command"

export const rotateCommand: Command = {
  name: 'rotate',
  useCommand(onEnd) {
    const [startPostion, setStartPosition] = React.useState<Position>()
    const [rotateOffset, setRotateOffset] = React.useState<Position & { angle?: number }>()
    const { onStartRotate, dragRotateMask } = useDragRotate((f, e) => setRotateOffset(e ? { x: e.clientX, y: e.clientY, angle: f ? f - 90 : undefined } : undefined), onEnd)
    return {
      start: (e) => onStartRotate({ x: e.clientX, y: e.clientY }),
      mask: dragRotateMask,
      setStartPosition,
      updateContent(content) {
        if (startPostion && rotateOffset?.angle) {
          rotateContent(content, startPostion, rotateOffset.angle)
          const r = getTwoPointsDistance(startPostion, rotateOffset)
          return {
            assistentContents: [
              {
                type: 'line',
                points: [startPostion, rotateOffset]
              },
              {
                type: 'line',
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
