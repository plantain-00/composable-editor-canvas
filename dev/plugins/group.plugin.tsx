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
        ctx.getContentModel(c)?.move?.(c, offset)
      })
    },
    rotate(content, center, angle, contents) {
      content.contents.forEach((c) => {
        if (!c) {
          return
        }
        ctx.getContentModel(c)?.rotate?.(c, center, angle, contents)
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
        ctx.getContentModel(c)?.mirror?.(c, line, angle, contents)
      })
    },
    render({ content, target, color, contents }) {
      const children = ctx.renderContainerChildren(content, target, contents, color)
      return target.renderGroup(children)
    },
    renderIfSelected({ content, color, target, strokeWidth }) {
      return ctx.renderContainerIfSelected(content, target, strokeWidth, color)
    },
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries: ctx.getContainerGeometries,
  }
}

export function getCommand(ctx: PluginContext): Command {
  function contentSelectable(content: model.BaseContent, contents: core.Nullable<model.BaseContent>[]) {
    return ctx.getContentModel(content)?.getRefIds === undefined && !ctx.contentIsReferenced(content, contents)
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="28" cy="73" r="22.090722034374522" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <polygon points="93,78 97.68132319206183,48.443288605436294 71.01782864251547,34.85755955998643 49.85755955998643,56.01782864251546 63.44328860543629,82.68132319206183" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
      <rect x="7" y="8.5" width="50" height="37" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
    </svg>
  )
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
    icon,
  }
}
