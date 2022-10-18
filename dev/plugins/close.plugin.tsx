import type { PluginContext } from './types'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import { isPolyLineContent } from './line-polyline.plugin'
import { PolygonContent } from './polygon.plugin'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="78,18 13.968757625671515,18.00000000000001 13.968757625671511,89.02905001183156 78.03032679046687,89.02905001183156" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <circle cx="78" cy="18" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="78.03032679046687" cy="89.02905001183156" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
    </svg>
  )
  return {
    name: 'close',
    execute(contents, selected) {
      const newContents: model.BaseContent<string>[] = []
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && isPolyLineContent(content)) {
          const p0 = content.points[0]
          const p1 = content.points[content.points.length - 1]
          if (ctx.isSamePoint(p0, p1)) {
            contents[index] = {
              type: 'polygon',
              points: content.points.slice(0, content.points.length - 1),
            } as PolygonContent
          } else {
            contents[index] = {
              type: 'polygon',
              points: content.points,
            } as PolygonContent
          }
        }
      })
      contents.push(...newContents)
    },
    contentSelectable(content) {
      return isPolyLineContent(content) && content.points.length > 2
    },
    hotkey: 'X',
    icon,
  }
}
