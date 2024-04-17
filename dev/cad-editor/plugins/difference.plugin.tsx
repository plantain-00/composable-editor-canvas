import type { PluginContext } from './types'
import type { Command } from '../command'
import type * as model from '../model'
import type { GeometryLinesContent } from './geometry-lines.plugin'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="32" cy="50" r="32" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <circle cx="65" cy="50" r="32" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <pattern id="difference" patternUnits="userSpaceOnUse" width="10" height="10">
        <path d="M 0 5 L 5 0 M 10 5 L 5 10" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor" fillRule="evenodd"></path>
      </pattern>
      <path d="M 49 78 L 46 79 L 44 81 L 41 81 L 38 82 L 35 82 L 32 82 L 30 82 L 27 82 L 24 81 L 21 81 L 19 79 L 16 78 L 14 77 L 12 75 L 10 73 L 8 71 L 6 69 L 4 66 L 3 64 L 2 61 L 1 58 L 0 56 L 0 53 L 0 50 L 0 47 L 0 44 L 1 42 L 2 39 L 3 36 L 4 34 L 6 31 L 8 29 L 10 27 L 12 25 L 14 23 L 16 22 L 19 21 L 21 19 L 24 19 L 27 18 L 30 18 L 32 18 L 35 18 L 38 18 L 41 19 L 44 19 L 46 21 L 49 22 L 49 22 L 46 23 L 44 25 L 42 27 L 40 29 L 38 31 L 37 34 L 36 36 L 34 39 L 34 42 L 33 44 L 33 47 L 32 50 L 33 53 L 33 56 L 34 58 L 34 61 L 36 64 L 37 66 L 38 69 L 40 71 L 42 73 L 44 75 L 46 77 L 49 78" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" fill="url(#difference)" stroke="currentColor" fillRule="evenodd"></path>
    </svg>
  )
  return {
    name: 'difference',
    execute({ contents, selected }) {
      const first = contents[selected[0][0]]
      if (!first) return
      const firstLines = ctx.getContentModel(first)?.getGeometries?.(first, contents).lines
      if (!firstLines) return
      const second = contents[selected[1][0]]
      if (!second) return
      const secondLines = ctx.getContentModel(second)?.getGeometries?.(second, contents).lines
      if (!secondLines) return
      const lines = ctx.getGeometryLinesDifferenceLines(firstLines, secondLines)
      ctx.deleteSelectedContents(contents, selected.map(s => s[0]))
      const allLines = ctx.getSeparatedGeometryLines(lines)
      contents.push(...allLines.map(n => ({ type: 'geometry lines', lines: n } as GeometryLinesContent)))
    },
    contentSelectable(content: model.BaseContent, contents: readonly model.BaseContent[]) {
      return ctx.contentIsDeletable(content, contents)
    },
    selectCount: 2,
    icon,
  }
}
