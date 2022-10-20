import type { PluginContext } from './types'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import type * as core from '../../src'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="10.000000000000007" y="44.006943105369096" width="81" height="20" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></rect>
      <rect x="9" y="69" width="81" height="20" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></rect>
      <polygon points="42.02315889327355,6.083985542473695 57.02315889327355,6.083985542473695 57.02315889327355,31.083985542473695 73.02315889327355,31.083985542473695 51.714259038694095,44.09092864784279 27.023158893273553,32.0839855424737 42.05645527164646,32.0839855424737" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'compress',
    execute(contents) {
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
    },
    selectCount: 0,
    icon,
  }
}
