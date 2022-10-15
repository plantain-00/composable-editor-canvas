import type { PluginContext } from './types'
import type { Command } from '../commands/command'
import type { LineContent } from './line-polyline.plugin'
import type { ArcContent } from './circle-arc.plugin'
import type { TextContent } from './text.plugin'

export function getCommand(ctx: PluginContext): Command {
  return {
    name: 'measure',
    useCommand({ transform, type, scale }) {
      const { onStart, mask, startPosition } = ctx.useDragMove(undefined, {
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
}
