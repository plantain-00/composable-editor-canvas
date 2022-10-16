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
      <polyline points="94.0881895447306,14 93.76440329468612,21.41592435882452 92.795508753423,28.775409055420823 91.18887979343477,36.022443967469464 88.95674383121603,43.10187478341042 86.1160887692398,49.9598227600572 82.68853370776218,56.54409477236529 78.70016441041528,62.80458053462891 74.1813347757952,68.69363397001257 69.1664358259653,74.1664358259653 63.69363397001257,79.1813347757952 57.80458053462891,83.70016441041528 51.544094772365305,87.68853370776216 44.9598227600572,91.1160887692398" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="9,14 94.0881895447306,14" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
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
    icon,
  }
}
