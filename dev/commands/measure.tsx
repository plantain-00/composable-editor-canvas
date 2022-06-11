import { getTwoPointsDistance, useCursorInput, useDragMove } from "../../src"
import { ArcContent } from "../models/arc-model"
import { LineContent } from "../models/line-model"
import { TextContent } from "../models/text-model"
import { Command } from "./command"

export const measureCommand: Command = {
  name: 'measure',
  useCommand({ transform, getAngleSnap, type, scale }) {
    const { onStart, mask, startPosition } = useDragMove(undefined, {
      transform,
      ignoreLeavingEvent: true,
      getAngleSnap,
    })
    let message = ''
    if (type) {
      message = startPosition ? 'specify end point' : 'specify start point'
    }
    const { input, setInputPosition, cursorPosition, setCursorPosition } = useCursorInput(message)

    const assistentContents: (LineContent | ArcContent | TextContent)[] = []
    if (startPosition && cursorPosition) {
      const start = startPosition
      const end = cursorPosition
      const r = getTwoPointsDistance(start, end)
      const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI
      assistentContents.push(
        {
          type: 'arc',
          x: start.x,
          y: start.y,
          r,
          dashArray: [4 / scale],
          startAngle: angle > 180 || angle < 0 ? angle : 0,
          endAngle: angle > 180 || angle < 0 ? 0 : angle,
        },
        {
          type: 'line',
          dashArray: [4 / scale],
          points: [start, { x: start.x + r, y: start.y }]
        },
        {
          type: 'text',
          x: (start.x + end.x) / 2 - 20,
          y: (start.y + end.y) / 2 + 4,
          text: r.toFixed(2),
          color: 0xff0000,
          fontSize: 16 / scale,
          fontFamily: 'monospace',
        },
        {
          type: 'text',
          x: end.x + 10,
          y: end.y - 10,
          text: `${angle.toFixed(1)}°`,
          color: 0xff0000,
          fontSize: 16 / scale,
          fontFamily: 'monospace',
        },
        {
          type: 'line',
          points: [startPosition, cursorPosition]
        },
      )
    }

    return {
      onStart,
      mask,
      input,
      onMove(p, viewportPosition) {
        setCursorPosition(p)
        setInputPosition(viewportPosition ?? p)
      },
      assistentContents,
    }
  },
  selectCount: 0,
}
