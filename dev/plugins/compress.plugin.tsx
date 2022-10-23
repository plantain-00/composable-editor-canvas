import type { PluginContext } from './types'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import type * as core from '../../src'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="10" y="44" width="81" height="20" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></rect>
      <rect x="9" y="69" width="81" height="20" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></rect>
      <polygon points="42,6 57,6 57,31 73,31 51,44 27,32 42,32" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'compress',
    execute({contents}) {
      const newIndexes: (number | undefined)[] = []
      let validContentCount = 0
      const invalidContentsIndex: number[] = []
      const contentIsValid = (d: core.Nullable<model.BaseContent>): d is model.BaseContent => !!d && (ctx.getContentModel(d)?.isValid?.(d) ?? true)
      contents.forEach((d, i) => {
        if (contentIsValid(d)) {
          newIndexes.push(validContentCount)
          if (ctx.isContainerContent(d)) {
            d.contents = d.contents.filter(c => contentIsValid(c))
          }
          validContentCount++
        } else {
          newIndexes.push(undefined)
          invalidContentsIndex.unshift(i)
        }
      })
      invalidContentsIndex.forEach(i => {
        contents.splice(i, 1)
      })
      for (const content of ctx.iterateAllContents(contents)) {
        ctx.getContentModel(content)?.updateRefId?.(content, refId => typeof refId === 'number' ? newIndexes[refId] : undefined)
      }
      ctx.contentIndexCache.clear()
    },
    selectCount: 0,
    icon,
  }
}
