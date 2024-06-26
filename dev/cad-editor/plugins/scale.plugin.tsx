import type { PluginContext } from './types'
import type { Command } from '../command'
import type * as core from '../../../src'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="12,11 91,11 91,90 12,90" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></polygon>
      <rect x="40" y="37" width="42" height="42" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></rect>
    </svg>
  )
  return {
    name: 'scale',
    useCommand({ onEnd, scale, type, selected, contents }) {
      const [data, setData] = React.useState<{ center: core.Position, size: number }>()
      const [cursor, setCursor] = React.useState<core.Position>()
      let message = ''
      if (type) {
        message = data ? 'specify scale' : 'specify center point'
      }
      const { input, setInputPosition, resetInput, setCursorPosition } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === 'Enter' && data) {
          const value = +text
          if (!isNaN(value) && value > 0) {
            onEnd({
              updateContents(contents, selected) {
                contents.forEach((content, index) => {
                  if (content && ctx.isSelected([index], selected)) {
                    const result = ctx.getContentModel(content)?.scale?.(content, data.center, value, value, contents)
                    if (result) {
                      contents[index] = result
                    }
                  }
                })
              },
            })
            reset()
          }
        }
      } : undefined)
      const reset = () => {
        setData(undefined)
        setCursor(undefined)
        resetInput()
      }
      return {
        onStart(s) {
          if (!type) return
          if (!data) {
            const boundings: core.TwoPointsFormRegion[] = []
            for (const c of selected) {
              const bounding = ctx.getContentModel(c.content)?.getGeometries?.(c.content, contents)?.bounding
              if (bounding) {
                boundings.push(bounding)
              }
            }
            const bounding = ctx.mergeBoundings(boundings)
            if (bounding) {
              const size = ctx.getTwoPointsFormRegionSize(bounding)
              setData({ center: s, size: Math.max(size.width, size.height) })
            }
          } else {
            onEnd()
            reset()
          }
        },
        onMove(p, c) {
          if (!type) return
          setInputPosition(c || p)
          setCursorPosition(c || p)
          if (data) {
            setCursor(p)
          }
        },
        reset,
        input,
        updateSelectedContent(content, contents, selected) {
          if (data && cursor) {
            const sx = ctx.getTwoNumbersDistance(cursor.x, data.center.x) / data.size
            const sy = ctx.getTwoNumbersDistance(cursor.y, data.center.y) / data.size
            if (!sx || !sy) {
              return {}
            }
            const [newContent, ...patches] = ctx.produceWithPatches(content, (draft) => {
              return ctx.getContentModel(content)?.scale?.(draft, data.center, sx, sy, contents)
            })
            const assistentContents = ctx.updateReferencedContents(content, newContent, contents, selected)
            return {
              patches,
              assistentContents,
            }
          }
          return {}
        },
        assistentContents: data && cursor ? [
          {
            type: 'line',
            dashArray: [4 / scale],
            points: [data.center, cursor]
          },
        ] : undefined,
      }
    },
    contentSelectable(content) {
      return !content.readonly && ctx.getContentModel(content)?.scale !== undefined
    },
    icon,
  }
}
