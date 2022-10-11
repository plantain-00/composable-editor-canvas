import produce, { produceWithPatches } from "immer"
import React from "react"
import { getTwoPointsDistance, useCursorInput, useDragRotate } from "../../src"
import { ArcContent } from "../models/arc-model"
import { LineContent } from "../models/line-model"
import { getModel } from "../models/model"
import { Command } from "./command"

export const rotateCommand: Command = {
  name: 'rotate',
  useCommand({ onEnd, transform, type, scale }) {
    const [changeOriginal, setChangeOriginal] = React.useState(true)
    const { offset, onStart, mask, center: startPosition } = useDragRotate(
      onEnd,
      {
        transform,
        transformOffset: (f) => f - 90,
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
      subcommand: type ? (
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
        if (startPosition && offset?.angle !== undefined) {
          const angle = offset.angle
          if (!changeOriginal) {
            return {
              newContents: [
                produce(content, (d) => {
                  getModel(d.type)?.rotate?.(d, startPosition, angle, contents)
                }),
              ]
            }
          }
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
