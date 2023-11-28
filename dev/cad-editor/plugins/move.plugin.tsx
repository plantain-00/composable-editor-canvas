import type { PluginContext } from './types'
import type { Command } from '../command'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="9,60 55,60 55,91 9,91" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
      <rect x="44" y="10" width="46" height="31" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
    </svg>
  )
  return {
    name: 'move',
    useCommand({ onEnd, transform, type, scale }) {
      const { offset, onStart, mask, startPosition, resetDragMove } = ctx.useDragMove(onEnd, {
        transform,
        ignoreLeavingEvent: true,
      })
      let message = ''
      if (type) {
        message = startPosition ? 'specify end point' : 'specify start point'
      }
      const { input, setInputPosition, resetInput } = ctx.useCursorInput(message)
      const reset = () => {
        resetDragMove()
        resetInput()
      }

      return {
        onStart: s => onStart(s),
        mask,
        input,
        onMove(_, p) {
          setInputPosition(p)
        },
        reset,
        updateSelectedContent(content, contents, selected) {
          if (startPosition && (offset.x !== 0 || offset.y !== 0)) {
            const [newContent, ...patches] = ctx.produceWithPatches(content, (draft) => {
              ctx.getContentModel(content)?.move?.(draft, offset)
            })
            const assistentContents = ctx.updateReferencedContents(content, newContent, contents, selected)
            return {
              patches,
              assistentContents,
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
      return !content.readonly && ctx.getContentModel(content)?.move !== undefined
    },
    hotkey: 'M',
    icon,
  }
}
