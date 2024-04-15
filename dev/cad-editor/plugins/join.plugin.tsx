import type { PluginContext } from './types'
import type { Command } from '../command'
import type * as model from '../model'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="0,49 100,49" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="51,49 76,32 76,64" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="currentColor"></polyline>
      <polyline points="54,49 27,32 28,65" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'join',
    execute({ contents, selected }) {
      const source = new Set(contents.filter((content, index): content is model.BaseContent => !!content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)))
      const newContents = ctx.mergeItems(Array.from(source), (item1, item2) => ctx.getContentModel(item1)?.join?.(item1, item2, contents))
      ctx.deleteSelectedContents(contents, selected.map(s => s[0]))
      contents.push(...newContents)
    },
    contentSelectable(content, contents) {
      const model = ctx.getContentModel(content)
      return model?.join !== undefined && ctx.contentIsDeletable(content, contents)
    },
    icon,
  }
}
