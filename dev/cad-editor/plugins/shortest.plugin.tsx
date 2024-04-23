import type { PluginContext } from './types'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="24,50 24,56 23,61 22,67 20,72 18,77 15,82 12,87 9,91 5,95 1,99 -3,102 -8,105 -13,108 -18,110 -23,112 -29,113 -34,114 -40,114 -46,114 -51,113 -57,112 -62,110 -67,108 -72,105 -77,102 -81,99 -85,95 -89,91 -92,87 -95,82 -98,77 -100,72 -102,67 -103,61 -104,56 -104,50 -104,44 -103,39 -102,33 -100,28 -98,23 -95,18 -92,13 -89,9 -85,5 -81,1 -77,-2 -72,-5 -67,-8 -62,-10 -57,-12 -51,-13 -46,-14 -40,-14 -34,-14 -29,-13 -23,-12 -18,-10 -13,-8 -8,-5 -3,-2 1,1 5,5 9,9 12,13 15,18 18,23 20,28 22,33 23,39 24,44 24,50" strokeWidth="4" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="204,50 204,56 203,61 202,67 200,72 198,77 195,82 192,87 189,91 185,95 181,99 177,102 172,105 167,108 162,110 157,112 151,113 146,114 140,114 134,114 129,113 123,112 118,110 113,108 108,105 103,102 99,99 95,95 91,91 88,87 85,82 82,77 80,72 78,67 77,61 76,56 76,50 76,44 77,39 78,33 80,28 82,23 85,18 88,13 91,9 95,5 99,1 103,-2 108,-5 113,-8 118,-10 123,-12 129,-13 134,-14 140,-14 146,-14 151,-13 157,-12 162,-10 167,-8 172,-5 177,-2 181,1 185,5 189,9 192,13 195,18 198,23 200,28 202,33 203,39 204,44 204,50" strokeWidth="4" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="24,50 76,50" strokeWidth="4" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <circle cx="24" cy="50" r="6" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="76" cy="50" r="6" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="currentColor"></circle>
    </svg>
  )
  return {
    name: 'shortest',
    execute({ contents, selected }) {
      const first = contents[selected[0][0]]
      if (!first) return
      const firstGeometries = ctx.getContentModel(first)?.getGeometries?.(first, contents)
      if (!firstGeometries) return
      const second = contents[selected[1][0]]
      if (!second) return
      const secondGeometries = ctx.getContentModel(second)?.getGeometries?.(second, contents)
      if (!secondGeometries) return
      const result = ctx.getShortestDistanceOfTwoGeometryLines(firstGeometries.lines, secondGeometries.lines)
      if (result && ctx.largerThan(result.distance, 0)) {
        contents.push({ type: 'line', points: result.points } as LineContent)
      }
    },
    contentSelectable(content: model.BaseContent, contents: readonly model.BaseContent[]) {
      return ctx.contentIsDeletable(content, contents)
    },
    selectCount: 2,
    icon,
  }
}
