import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

export type BlockContent = model.BaseContent<'block'> & model.ContainerFields & {
  base: core.Position
}

export function getModel(ctx: PluginContext): model.Model<BlockContent> {
  const React = ctx.React
  return {
    type: 'block',
    ...ctx.containerModel,
    explode(content) {
      return content.contents.filter((c): c is model.BaseContent => !!c)
    },
    render({ content, target, color, strokeWidth, contents }) {
      const children = ctx.renderContainerChildren(content, target, strokeWidth, contents, color)
      return target.renderGroup(children)
    },
    getOperatorRenderPosition(content) {
      return content.base
    },
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries: ctx.getContainerGeometries,
    propertyPanel(content, update) {
      return {
        base: <ctx.ObjectEditor
          inline
          properties={{
            x: <ctx.NumberEditor value={content.base.x} setValue={(v) => update(c => { if (isBlockContent(c)) { c.base.x = v } })} />,
            y: <ctx.NumberEditor value={content.base.y} setValue={(v) => update(c => { if (isBlockContent(c)) { c.base.y = v } })} />,
          }}
        />,
      }
    },
  }
}

export function isBlockContent(content: model.BaseContent): content is BlockContent {
  return content.type === 'block'
}

export function getCommand(ctx: PluginContext): Command {
  function contentSelectable(content: model.BaseContent, contents: core.Nullable<model.BaseContent>[]) {
    return ctx.getContentModel(content)?.getRefIds === undefined && !ctx.contentIsReferenced(content, contents)
  }
  return {
    name: 'create block',
    useCommand({ onEnd, type }) {
      let message = ''
      if (type) {
        message = 'specify base point'
      }
      const { input, setInputPosition } = ctx.useCursorInput(message)

      return {
        onStart(p) {
          onEnd({
            updateContents: (contents, selected) => {
              const newContent: BlockContent = {
                type: 'block',
                contents: contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents)),
                base: p,
              }
              contents.forEach((_, i) => {
                if (ctx.isSelected([i], selected)) {
                  contents[i] = undefined
                }
              })
              contents.push(newContent)
            }
          })
        },
        input,
        onMove(_, p) {
          setInputPosition(p)
        },
      }
    },
    contentSelectable,
    hotkey: 'B',
  }
}
