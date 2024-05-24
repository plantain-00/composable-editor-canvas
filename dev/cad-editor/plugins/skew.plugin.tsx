import type { PluginContext } from './types'
import type { Command } from '../command'
import type * as core from '../../../src'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="5" y="5" width="51" height="89" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></rect>
      <polygon points="40,5 92,5 57,95 5,95" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'skew',
    useCommand({ onEnd, scale, type, selected, contents }) {
      const [data, setData] = React.useState<{ center: core.Position, size: number }>()
      const [cursor, setCursor] = React.useState<core.Position>()
      let message = ''
      if (type) {
        message = data ? 'specify skew' : 'specify center point'
      }
      const { input, setInputPosition, resetInput, setCursorPosition } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === 'Enter' && data) {
          const value = +text
          if (!isNaN(value)) {
            onEnd({
              updateContents(contents, selected) {
                contents.forEach((content, index) => {
                  if (content && ctx.isSelected([index], selected)) {
                    const result = ctx.getContentModel(content)?.skew?.(content, data.center, value, 0, contents)
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
            const sx = (cursor.x - data.center.x) / data.size
            if (!sx) {
              return {}
            }
            const sy = (cursor.y - data.center.y) / data.size
            const [newContent, ...patches] = ctx.produceWithPatches(content, (draft) => {
              return ctx.getContentModel(content)?.skew?.(draft, data.center, sx, sy, contents)
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
      return !content.readonly && ctx.getContentModel(content)?.skew !== undefined
    },
    icon,
  }
}
