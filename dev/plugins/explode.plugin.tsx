import type { PluginContext } from './types'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

export function getCommand(ctx: PluginContext): Command {
  return {
    name: 'explode',
    execute(contents, selected) {
      const newContents: model.BaseContent<string>[] = []
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          const result = ctx.getModel(content.type)?.explode?.(content, contents)
          if (result) {
            newContents.push(...result)
            contents[index] = undefined
          }
        }
      })
      contents.push(...newContents)
    },
    contentSelectable(content, contents) {
      const model = ctx.getModel(content.type)
      return model?.explode !== undefined && !ctx.contentIsReferenced(content, contents)
    },
    hotkey: 'X',
  }
}
