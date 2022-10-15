import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

export type GroupContent = model.BaseContent<'group'> & model.ContainerFields

export function getModel(ctx: PluginContext): model.Model<GroupContent> {
  return {
    type: 'group',
    ...ctx.containerModel,
    move(content, offset) {
      content.contents.forEach((c) => {
        if (!c) {
          return
        }
        ctx.getModel(c.type)?.move?.(c, offset)
      })
    },
    rotate(content, center, angle, contents) {
      content.contents.forEach((c) => {
        if (!c) {
          return
        }
        ctx.getModel(c?.type)?.rotate?.(c, center, angle, contents)
      })
    },
    explode(content) {
      return content.contents.filter((c): c is model.BaseContent => !!c)
    },
    mirror(content, line, angle, contents) {
      content.contents.forEach((c) => {
        if (!c) {
          return
        }
        ctx.getModel(c.type)?.mirror?.(c, line, angle, contents)
      })
    },
    render({ content, target, color, strokeWidth, contents }) {
      const children = ctx.renderContainerChildren(content, target, strokeWidth, contents, color)
      return target.renderGroup(children)
    },
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries: ctx.getContainerGeometries,
  }
}

export function getCommand(ctx: PluginContext): Command {
  function contentSelectable(content: model.BaseContent, contents: core.Nullable<model.BaseContent>[]) {
    return ctx.getContentModel(content)?.getRefIds === undefined && !ctx.contentIsReferenced(content, contents)
  }
  return {
    name: 'create group',
    execute(contents, selected) {
      const newContent: GroupContent = {
        type: 'group',
        contents: contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents)),
      }
      for (let i = contents.length; i >= 0; i--) {
        if (ctx.isSelected([i], selected)) {
          contents[i] = undefined
        }
      }
      contents.push(newContent)
    },
    contentSelectable,
    hotkey: 'G',
  }
}
