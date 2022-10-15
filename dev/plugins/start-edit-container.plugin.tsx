import type { PluginContext } from './types'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

export function getCommand(ctx: PluginContext): Command {
  function contentSelectable(c: model.BaseContent) {
    return ctx.isContainerContent(c)
  }
  return {
    name: 'start edit container',
    execute(contents, selected, setEditingContentPath) {
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          setEditingContentPath(contentSelectable(content) ? [index, 'contents'] : undefined)
        }
      })
    },
    contentSelectable,
    selectCount: 1,
  }
}
