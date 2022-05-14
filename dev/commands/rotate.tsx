import React from "react"
import { getTwoPointsDistance, Position, useDragRotate } from "../../src"
import { rotateContent } from "../util-2"
import { Command } from "./command"

export const rotateCommand: Command = {
  name: 'rotate',
  useCommand(onEnd, getSnapPoint, transform) {
    const [startPostion, setStartPosition] = React.useState<Position>()
    const [rotateOffset, setRotateOffset] = React.useState<Position & { angle?: number }>()
    const { onStartRotate, dragRotateMask } = useDragRotate(
      (f, e) => {
        setRotateOffset(e ? { ...transform({ x: e.clientX, y: e.clientY }), angle: f !== undefined ? f - 90 : undefined } : undefined)
      },
      onEnd,
      {
        getSnapPoint,
      },
    )
    return {
      start: onStartRotate,
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
                dashArray: [4],
                points: [startPostion, rotateOffset]
              },
              {
                type: 'arc',
                x: startPostion.x,
                y: startPostion.y,
                r,
                dashArray: [4],
                startAngle: rotateOffset.angle > 180 || rotateOffset.angle < 0 ? rotateOffset.angle : 0,
                endAngle: rotateOffset.angle > 180 || rotateOffset.angle < 0 ? 0 : rotateOffset.angle,
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
