import type { PluginContext } from './types'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="17,11 83,11" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="80,91 16,91" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="9,84 9,19" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="90,19 90,85" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'explode',
    execute({ contents, selected }) {
      const newContents: model.BaseContent<string>[] = []
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          const result = ctx.getContentModel(content)?.explode?.(content, contents)
          if (result) {
            newContents.push(...result)
            contents[index] = undefined
          }
        }
      })
      contents.push(...newContents)
    },
    contentSelectable(content, contents) {
      const model = ctx.getContentModel(content)
      return model?.explode !== undefined && !ctx.contentIsReferenced(content, contents)
    },
    hotkey: 'X',
    icon,
  }
}
