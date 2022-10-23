import type { PluginContext } from './types'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="17,21 80,84" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="77,23 19,81" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'delete',
    execute({ contents, selected }) {
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          contents[index] = undefined
        }
      })
    },
    contentSelectable(content: model.BaseContent, contents: readonly model.BaseContent[]) {
      return !ctx.contentIsReferenced(content, contents)
    },
    hotkey: 'E',
    icon,
  }
}
