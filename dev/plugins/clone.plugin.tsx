import type { Command } from '../commands/command'
import type { PluginContext } from './types'

export function getCommand(ctx: PluginContext): Command {
  return {
    name: 'clone',
    useCommand({ onEnd, transform, type, scale }) {
      const { offset, onStart, mask, startPosition } = ctx.useDragMove(
        () => onEnd({ repeatedly: true }),
        {
          repeatedly: true,
          transform,
          ignoreLeavingEvent: true,
        },
      )
      let message = ''
      if (type) {
        message = startPosition ? 'specify end point' : 'specify start point'
      }
      const { input, setInputPosition } = ctx.useCursorInput(message)

      return {
        onStart,
        mask,
        input,
        onMove(_, p) {
          setInputPosition(p)
        },
        updateContent(content) {
          if (startPosition && (offset.x !== 0 || offset.y !== 0)) {
            return {
              newContents: [
                ctx.produce(content, (d) => {
                  ctx.getModel(d.type)?.move?.(d, offset)
                }),
              ],
            }
          }
          return {}
        },
        assistentContents: startPosition && (offset.x !== 0 || offset.y !== 0) ? [
          {
            type: 'line',
            dashArray: [4 / scale],
            points: [startPosition, { x: startPosition.x + offset.x, y: startPosition.y + offset.y }]
          },
        ] : undefined,
      }
    },
    contentSelectable(content) {
      return ctx.getModel(content.type)?.move !== undefined
    },
    hotkey: 'CO',
  }
}
