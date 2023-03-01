import type { Command } from '../command'
import type { PluginContext } from './types'
import type * as model from '../model'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="8" y="9" width="82" height="82" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
      <rect x="22" y="23" width="55" height="55" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
    </svg>
  )
  function contentSelectable(content: model.BaseContent) {
    return ctx.getContentModel(content)?.offset !== undefined
  }
  return {
    name: 'offset',
    useCommand({ onEnd, type }) {
      let message = ''
      if (type) {
        message = 'input offset or click to end'
      }
      const [offset, setOffset] = React.useState(10)
      const { input, clearText, setInputPosition, cursorPosition, setCursorPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === 'Enter') {
          const offset = +text
          if (!isNaN(offset) && offset > 0) {
            setOffset(offset)
            clearText()
          }
        }
      } : undefined)
      return {
        onStart(p) {
          resetInput()
          onEnd({
            updateContents: (contents, selected) => {
              const target = contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c))
              for (const content of target) {
                if (content) {
                  const newContent = ctx.getContentModel(content)?.offset?.(content, p, offset)
                  if (newContent) {
                    contents.push(newContent)
                  }
                }
              }
              setCursorPosition(undefined)
            }
          })
        },
        input,
        onMove(p, viewportPosition) {
          setInputPosition(viewportPosition || p)
          if (!type) {
            return
          }
          setCursorPosition(p)
        },
        updateSelectedContent(content) {
          if (cursorPosition) {
            const newContent = ctx.getContentModel(content)?.offset?.(content, cursorPosition, offset)
            if (newContent) {
              return {
                newContents: [newContent],
              }
            }
          }
          return {}
        },
        reset: resetInput,
      }
    },
    contentSelectable,
    icon,
  }
}
