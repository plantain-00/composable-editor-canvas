import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

export function getCommand(ctx: PluginContext): Command {
  return {
    name: 'break',
    execute(contents, selected) {
      const newContents: model.BaseContent<string>[] = []
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          let intersectionPoints: core.Position[] = []
          for (let i = 0; i < contents.length; i++) {
            const c = contents[i]
            if (c && i !== index) {
              const p = i < index ? [c, content] as const : [content, c] as const
              intersectionPoints.push(...ctx.getIntersectionPoints(...p, contents))
            }
          }
          intersectionPoints = ctx.deduplicatePosition(intersectionPoints)
          if (intersectionPoints.length > 0) {
            const result = ctx.getModel(content.type)?.break?.(content, intersectionPoints)
            if (result) {
              newContents.push(...result)
              contents[index] = undefined
            }
          }
        }
      })
      contents.push(...newContents)
    },
    contentSelectable(content, contents) {
      const model = ctx.getModel(content.type)
      return model?.break !== undefined && !ctx.contentIsReferenced(content, contents)
    },
    hotkey: 'BR',
  }
}
