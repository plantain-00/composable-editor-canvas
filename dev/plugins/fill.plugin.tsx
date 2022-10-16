import type { PluginContext } from './types'
import type { Command } from '../commands/command'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40.45985664828782" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
    </svg>
  )
  return {
    name: 'fill',
    execute(contents, selected) {
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          if (ctx.isFillContent(content)) {
            content.fillColor = 0x000000
          }
        }
      })
    },
    contentSelectable: ctx.isFillContent,
    icon,
  }
}
