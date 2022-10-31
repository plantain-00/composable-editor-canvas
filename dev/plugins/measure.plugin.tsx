import type { PluginContext } from './types'
import type { Command } from '../commands/command'
import type { LineContent } from './line-polyline.plugin'
import type { ArcContent } from './circle-arc.plugin'
import type { TextContent } from './text.plugin'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="9,14 43,92" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="94,14 93,21 92,28 91,36 88,43 86,49 82,56 78,62 74,68 69,74 63,79 57,83 51,87 44,91" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="9,14 94,14" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'measure',
    useCommand({ transform, type, scale }) {
      const { onStart, mask, startPosition, reset } = ctx.useDragMove(undefined, {
        transform,
        ignoreLeavingEvent: true,
      })
      let message = ''
      if (type) {
        message = startPosition ? 'specify end point' : 'specify start point'
      }
      const { input, setInputPosition, cursorPosition, setCursorPosition } = ctx.useCursorInput(message)

      const assistentContents: (LineContent | ArcContent | TextContent)[] = []
      if (startPosition && cursorPosition) {
        const start = startPosition
        const end = cursorPosition
        const r = ctx.getTwoPointsDistance(start, end)
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
          ...ctx.getAssistentText(
            r.toFixed(2),
            16 / scale,
            (start.x + end.x) / 2 - 20,
            (start.y + end.y) / 2 + 4,
          ),
          ...ctx.getAssistentText(
            `${angle.toFixed(1)}°`,
            16 / scale,
            end.x + 10,
            end.y - 10,
          ),
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
        reset,
        onMove(p, viewportPosition) {
          setCursorPosition(p)
          setInputPosition(viewportPosition ?? p)
        },
        assistentContents,
      }
    },
    selectCount: 0,
    icon,
  }
}
