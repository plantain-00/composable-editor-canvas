import type { PluginContext } from './types'
import type { Command } from '../commands/command'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="9,91 38,46 9,10" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
      <polyline points="50,0 50,100" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polygon points="90,91 62,46 91,10" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'mirror',
    useCommand({ onEnd, transform, type, scale }) {
      const [changeOriginal, setChangeOriginal] = React.useState(false)
      const { offset, onStart, mask, startPosition, reset } = ctx.useDragMove(onEnd, {
        transform,
        ignoreLeavingEvent: true,
      })
      let message = ''
      if (type) {
        message = startPosition ? 'specify second point' : 'specify first point'
      }
      const { input, setInputPosition, clearText, setCursorPosition } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === 'Enter') {
          if (text.toLowerCase() === 'y' || text.toLowerCase() === 'n') {
            setChangeOriginal(!changeOriginal)
            clearText()
          }
        }
      } : undefined)
      return {
        onStart,
        mask: type ? mask : undefined,
        input,
        reset,
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
        updateSelectedContent(content, contents) {
          if (startPosition && offset && (offset.x !== 0 || offset.y !== 0)) {
            const end = { x: startPosition.x + offset.x, y: startPosition.y + offset.y }
            const line = ctx.twoPointLineToGeneralFormLine(startPosition, end)
            const angle = Math.atan2(end.y - startPosition.y, end.x - startPosition.x) * 180 / Math.PI
            if (changeOriginal) {
              const [, ...patches] = ctx.produceWithPatches(content, (draft) => {
                ctx.getContentModel(content)?.mirror?.(draft, line, angle, contents)
              })
              return {
                patches,
              }
            }
            return {
              newContents: [
                ctx.produce(content, (d) => {
                  ctx.getContentModel(d)?.mirror?.(d, line, angle, contents)
                }),
              ]
            }
          }
          return {}
        },
        onMove(p, viewportPosition) {
          setCursorPosition(p)
          setInputPosition(viewportPosition || p)
        },
        assistentContents: startPosition && offset && (offset.x !== 0 || offset.y !== 0) ? [
          {
            type: 'line',
            dashArray: [4 / scale],
            points: [startPosition, { x: startPosition.x + offset.x, y: startPosition.y + offset.y }]
          },
        ] : undefined,
      }
    },
    contentSelectable(content) {
      return ctx.getContentModel(content)?.mirror !== undefined
    },
    hotkey: 'MI',
    icon,
  }
}
