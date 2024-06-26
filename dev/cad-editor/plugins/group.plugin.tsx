import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type GroupContent = model.BaseContent<'group'> & model.ContainerFields & model.ClipFields

export function getModel(ctx: PluginContext): model.Model<GroupContent> {
  const GroupContent = ctx.and(ctx.BaseContent('group'), ctx.ContainerFields, ctx.ClipFields)
  const getRefIds = (content: Omit<GroupContent, "type">): model.RefId[] => ctx.toRefIds(content.contents)
  return {
    type: 'group',
    ...ctx.containerModel,
    ...ctx.clipModel,
    move(content, offset) {
      ctx.getContainerMove(content, offset)
      if (content.clip) {
        ctx.getContentModel(content.clip.border)?.move?.(content.clip.border, offset)
      }
    },
    rotate(content, center, angle, contents) {
      ctx.getContainerRotate(content, center, angle, contents)
      if (content.clip) {
        ctx.getContentModel(content.clip.border)?.rotate?.(content.clip.border, center, angle, contents)
      }
    },
    scale(content, center, sx, sy, contents) {
      ctx.getContainerScale(content, center, sx, sy, contents)
      if (content.clip) {
        return ctx.getContentModel(content.clip.border)?.scale?.(content.clip.border, center, sx, sy, contents)
      }
    },
    skew(content, center, sx, sy, contents) {
      ctx.getContainerSkew(content, center, sx, sy, contents)
      if (content.clip) {
        return ctx.getContentModel(content.clip.border)?.skew?.(content.clip.border, center, sx, sy, contents)
      }
    },
    explode: ctx.getContainerExplode,
    mirror(content, line, angle, contents) {
      ctx.getContainerMirror(content, line, angle, contents)
      if (content.clip) {
        ctx.getContentModel(content.clip.border)?.mirror?.(content.clip.border, line, angle, contents)
      }
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: ctx.getClipContentEditPoints(content, contents),
        }
      })
    },
    render: (content, renderCtx) => {
      return ctx.renderClipContent(content, ctx.getContainerRender(content, renderCtx), renderCtx)
    },
    renderIfSelected(content, renderCtx) {
      const result = ctx.getContainerRenderIfSelected(content, renderCtx, [content], getRefIds)
      return ctx.renderClipContentIfSelected(content, result, renderCtx)
    },
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries: (content, contents) => ctx.getContainerGeometries(content, contents, getRefIds, [content]),
    propertyPanel: (content, update, contents, { acquireContent }) => {
      return {
        ...ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update),
        ...ctx.getClipContentPropertyPanel(content, contents, acquireContent, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, GroupContent, p),
    getRefIds,
  }
}

export function getCommand(ctx: PluginContext): Command {
  function contentSelectable(content: model.BaseContent, contents: core.Nullable<model.BaseContent>[]) {
    return ctx.contentIsDeletable(content, contents)
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="28" cy="73" r="22" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <polygon points="93,78 97,48 71,34 49,56 63,82" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
      <rect x="7" y="8" width="50" height="37" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
    </svg>
  )
  return {
    name: 'create group',
    execute({ contents, selected }) {
      const newContent: GroupContent = {
        type: 'group',
        contents: contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents)),
      }
      ctx.deleteSelectedContents(contents, selected.map(s => s[0]))
      contents.push(newContent)
    },
    contentSelectable,
    hotkey: 'G',
    icon,
  }
}
