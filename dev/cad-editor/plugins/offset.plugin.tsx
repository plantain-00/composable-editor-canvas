import type { Command } from '../command'
import type * as core from '../../../src'
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
  function getOffsetResult(content: model.BaseContent, p: core.Position, offset: number, contents: readonly core.Nullable<model.BaseContent>[]) {
    const model = ctx.getContentModel(content)
    if (model?.offset) {
      const newContent = model.offset(content, p, offset, contents)
      if (Array.isArray(newContent)) {
        return newContent.filter(c => model.isValid(c) === true)
      }
      if (newContent && model.isValid(newContent) === true) {
        return [newContent]
      }
    }
    return []
  }
  return {
    name: 'offset',
    useCommand({ onEnd, type, contents }) {
      let message = ''
      if (type) {
        message = 'input offset or click to end'
      }
      const [offset, setOffset] = React.useState(0)
      const { input, clearText, setInputPosition, cursorPosition, setCursorPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === 'Enter') {
          const offset = +text
          if (!isNaN(offset) && offset >= 0) {
            setOffset(offset)
            clearText()
          } else if (text.toUpperCase() === 'T') {
            setOffset(0)
            clearText()
          }
        }
      } : undefined)
      return {
        onStart(p) {
          resetInput()
          onEnd({
            nextCommand: 'offset',
            updateContents: (contents, selected) => {
              const target = contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c))
              for (const content of target) {
                if (content) {
                  contents.push(...getOffsetResult(content, p, offset, contents))
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
            const newContents = getOffsetResult(content, cursorPosition, offset, contents)
            if (newContents.length > 0) {
              return {
                newContents,
              }
            }
          }
          return {}
        },
        reset: resetInput,
      }
    },
    contentSelectable,
    selectCount: 1,
    icon,
  }
}
