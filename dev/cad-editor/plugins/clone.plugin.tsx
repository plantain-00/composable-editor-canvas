import type { Command } from '../command'
import type { PluginContext } from './types'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="8" y="27" width="62" height="65" strokeWidth="3" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
      <rect x="30" y="8" width="62" height="65" strokeWidth="3" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
    </svg>
  )
  return {
    name: 'clone',
    useCommand({ onEnd, transform, type, scale }) {
      const { offset, onStart, mask, startPosition, resetDragMove } = ctx.useDragMove(
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
      const { input, setInputPosition, resetInput } = ctx.useCursorInput(message)
      const reset = () => {
        resetDragMove()
        resetInput()
      }

      return {
        onStart: s => onStart(s),
        mask,
        reset,
        input,
        onMove(_, p) {
          setInputPosition(p)
        },
        updateSelectedContent(content) {
          if (startPosition && (offset.x !== 0 || offset.y !== 0)) {
            return {
              newContents: [
                ctx.produce(content, (d) => {
                  ctx.getContentModel(d)?.move?.(d, offset)
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
      return ctx.getContentModel(content)?.move !== undefined
    },
    hotkey: 'CO',
    icon,
  }
}
