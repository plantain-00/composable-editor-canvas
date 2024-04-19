import type { PluginContext } from './types'
import type { Command } from '../command'
import type * as model from '../model'
import type { GeometryLinesContent } from './geometry-lines.plugin'
import type { PointContent } from './point.plugin'
import type { HatchContent } from './hatch.plugin'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="32" cy="50" r="32" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <circle cx="65" cy="50" r="32" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <pattern id="intersection" patternUnits="userSpaceOnUse" width="10" height="10">
        <path d="M 0 5 L 5 0 M 10 5 L 5 10" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor" fillRule="evenodd"></path>
      </pattern>
      <path d="M 49 78 L 46 77 L 44 75 L 42 73 L 40 71 L 38 69 L 37 66 L 36 64 L 34 61 L 34 58 L 33 56 L 33 53 L 32 50 L 33 47 L 33 44 L 34 42 L 34 39 L 36 36 L 37 34 L 38 31 L 40 29 L 42 27 L 44 25 L 46 23 L 49 22 L 49 22 L 51 23 L 53 25 L 55 27 L 57 29 L 59 31 L 61 34 L 62 36 L 63 39 L 64 42 L 64 44 L 65 47 L 65 50 L 65 53 L 64 56 L 64 58 L 63 61 L 62 64 L 61 66 L 59 69 L 57 71 L 55 73 L 53 75 L 51 77 L 49 78" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" fill="url(#intersection)" stroke="currentColor" fillRule="evenodd"></path>
    </svg>
  )
  return {
    name: 'intersection',
    execute({ contents, selected }) {
      const first = contents[selected[0][0]]
      if (!first) return
      const firstGeometries = ctx.getContentModel(first)?.getGeometries?.(first, contents)
      if (!firstGeometries) return
      const second = contents[selected[1][0]]
      if (!second) return
      const secondGeometries = ctx.getContentModel(second)?.getGeometries?.(second, contents)
      if (!secondGeometries) return
      if (firstGeometries.regions && secondGeometries.regions) {
        const result = firstGeometries.regions.map(r => ctx.getHatchesIntersection({ border: r.lines, holes: r.holes || [] }, (secondGeometries.regions || []).map(g => ({ border: g.lines, holes: g.holes || [] })))).flat()
        ctx.deleteSelectedContents(contents, selected.map(s => s[0]))
        contents.push(...result.map(r => ({ ...first, type: 'hatch', border: r.border, holes: r.holes, ref: undefined } as HatchContent)))
        return
      }
      let points = ctx.deduplicatePosition(ctx.getIntersectionPoints(first, second, contents))
      const lines = Array.from(ctx.iterateGeometryLinesIntersectionLines(firstGeometries.lines, secondGeometries.lines))
      const newContents: model.BaseContent[] = []
      if (lines.length > 0) {
        points = points.filter(p => !ctx.pointIsOnGeometryLines(p, lines))
        const allLines = ctx.getSeparatedGeometryLines(lines)
        newContents.push(...allLines.map(n => ({ type: 'geometry lines', lines: n } as GeometryLinesContent)))
      }
      newContents.push(...points.map(n => ({ type: 'point', x: n.x, y: n.y } as PointContent)))
      if (newContents.length > 0) {
        ctx.deleteSelectedContents(contents, selected.map(s => s[0]))
        contents.push(...newContents)
      }
    },
    contentSelectable(content: model.BaseContent, contents: readonly model.BaseContent[]) {
      return ctx.contentIsDeletable(content, contents)
    },
    selectCount: 2,
    icon,
  }
}
