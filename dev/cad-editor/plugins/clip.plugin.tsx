import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { PluginContext } from './types'

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <mask id="clip">
        <path d="M 1 1 L 1 100 L 103 100 L 103 1" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="white" stroke="currentColor" fillRule="evenodd"></path>
        <path d="M 91 70 L 91 73 L 91 75 L 90 78 L 90 80 L 89 82 L 88 84 L 86 86 L 85 88 L 83 90 L 81 91 L 79 93 L 77 94 L 75 95 L 73 96 L 71 97 L 68 97 L 66 98 L 64 98 L 61 98 L 59 97 L 57 97 L 54 96 L 52 95 L 50 94 L 48 93 L 46 91 L 44 90 L 43 88 L 41 86 L 40 84 L 39 82 L 38 80 L 37 78 L 37 75 L 36 73 L 36 70 L 36 68 L 37 66 L 37 63 L 38 61 L 39 59 L 40 57 L 41 55 L 43 53 L 44 51 L 46 49 L 48 48 L 50 47 L 52 46 L 54 45 L 57 44 L 59 43 L 61 43 L 64 43 L 66 43 L 68 43 L 71 44 L 73 45 L 75 46 L 77 47 L 79 48 L 81 49 L 83 51 L 85 53 L 86 55 L 88 57 L 89 59 L 90 61 L 90 63 L 91 66 L 91 68 L 91 70" fill="black"></path>
      </mask>
      <g mask="url(#clip)">
        <polygon points="83,99 77,64 103,38 67,33 51,1 35,33 1,39 25,64 19,100 51,83" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="currentColor"></polygon>
      </g>
    </svg>
  )
  return {
    name: 'clip',
    icon,
    useCommand({ type, onEnd, acquireContent, selected, contents }) {
      const target = React.useRef<core.ContentPath>()
      const border = React.useRef<model.BaseContent>()
      const reset = () => {
        target.current = undefined
        border.current = undefined
      }
      React.useEffect(() => {
        if (!type) return
        if (!target.current) {
          target.current = selected[0].path
          acquireContent(
            {
              count: 1,
              selectable: (v) => {
                const content = ctx.getContentByIndex(contents, v)
                if (!content) return false
                const geometries = ctx.getContentModel(content)?.getGeometries?.(content, contents)
                if (!geometries) return false
                return geometries.lines.length > 0
              }
            },
            r => {
              border.current = ctx.getRefPart(r[0], contents, (c): c is model.BaseContent => c !== selected[0].content)
            },
          )
        } else if (border.current) {
          onEnd({
            updateContents(contents) {
              if (target.current) {
                const content = contents[target.current[0]]
                if (content && ctx.isClipContent(content) && border.current) {
                  content.clip = {
                    border: border.current,
                  }
                }
              }
            },
          })
          reset()
        }
      }, [type])
      return {
        onStart() { },
        reset,
      }
    },
    selectCount: 1,
    contentSelectable(content) {
      return ctx.isClipContent(content) && !content.readonly
    },
  }
}
