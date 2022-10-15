import type { PluginContext } from './types'
import type { Command } from '../commands/command'

export function getCommand(ctx: PluginContext): Command {
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
  }
}
