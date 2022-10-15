import type { PluginContext } from './types'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

export function getCommand(ctx: PluginContext): Command {
  return {
    name: 'delete',
    execute(contents, selected) {
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
  }
}
