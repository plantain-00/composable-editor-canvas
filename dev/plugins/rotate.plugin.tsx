import type { PluginContext } from './types'
import type { Command } from '../commands/command'
import type { LineContent } from './line-polyline.plugin'
import type { ArcContent } from './circle-arc.plugin'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="5,66 66,66 66,94 5,94" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
      <rect x="35" y="26" width="61" height="28" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor" transform="rotate(56,66,40)"></rect>
    </svg>
  )
  return {
    name: 'rotate',
    icon,
    useCommand({ onEnd, transform, type, scale }) {
      const [changeOriginal, setChangeOriginal] = React.useState(true)
      const { offset, onStart, mask, center: startPosition, reset } = ctx.useDragRotate(
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
      const { input, setInputPosition } = ctx.useCursorInput(message)
      let assistentContents: (LineContent | ArcContent)[] | undefined
      if (startPosition && offset?.angle !== undefined) {
        const r = ctx.getTwoPointsDistance(startPosition, offset)
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
          if (startPosition && offset?.angle !== undefined) {
            const angle = offset.angle
            if (!changeOriginal) {
              return {
                newContents: [
                  ctx.produce(content, (d) => {
                    ctx.getContentModel(d)?.rotate?.(d, startPosition, angle, contents)
                  }),
                ]
              }
            }
            const [, ...patches] = ctx.produceWithPatches(content, (draft) => {
              ctx.getContentModel(content)?.rotate?.(draft, startPosition, angle, contents)
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
      return ctx.getContentModel(content)?.rotate !== undefined
    },
    hotkey: 'RO',
  }
}
