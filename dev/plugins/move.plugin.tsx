import type { PluginContext } from './types'
import type { Command } from '../commands/command'

export function getCommand(ctx: PluginContext): Command {
  return {
    name: 'move',
    useCommand({ onEnd, transform, type, scale }) {
      const { offset, onStart, mask, startPosition } = ctx.useDragMove(onEnd, {
        transform,
        ignoreLeavingEvent: true,
      })
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
            const [, ...patches] = ctx.produceWithPatches(content, (draft) => {
              ctx.getModel(content.type)?.move?.(draft, offset)
            })
            return {
              patches,
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
    hotkey: 'M',
  }
}
