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
    render({ content, target, color, contents }) {
      const children = ctx.renderContainerChildren(content, target, contents, color)
      return target.renderGroup(children)
    },
    renderIfSelected({ content, color, target, strokeWidth }) {
      return ctx.renderContainerIfSelected(content, target, strokeWidth, color)
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
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
      <path fill="currentColor" d="M32 119.4C12.9 108.4 0 87.7 0 64C0 28.7 28.7 0 64 0c23.7 0 44.4 12.9 55.4 32H456.6C467.6 12.9 488.3 0 512 0c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V392.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H119.4c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V119.4zM456.6 96H119.4c-5.6 9.7-13.7 17.8-23.4 23.4V392.6c9.7 5.6 17.8 13.7 23.4 23.4H456.6c5.6-9.7 13.7-17.8 23.4-23.4V119.4c-9.7-5.6-17.8-13.7-23.4-23.4zM128 160c0-17.7 14.3-32 32-32H288c17.7 0 32 14.3 32 32v96c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32V160zM256 320h32c35.3 0 64-28.7 64-64V224h64c17.7 0 32 14.3 32 32v96c0 17.7-14.3 32-32 32H288c-17.7 0-32-14.3-32-32V320z" />
    </svg>
  )
  return {
    name: 'create block',
    useCommand({ onEnd, type }) {
      let message = ''
      if (type) {
        message = 'specify base point'
      }
      const { input, setInputPosition, resetInput } = ctx.useCursorInput(message)

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
        reset: resetInput,
      }
    },
    contentSelectable,
    hotkey: 'B',
    icon,
  }
}
