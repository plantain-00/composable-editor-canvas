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
      <pattern id="union" patternUnits="userSpaceOnUse" width="10" height="10">
        <path d="M 0 5 L 5 0 M 10 5 L 5 10" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor" fillRule="evenodd"></path>
      </pattern>
      <path d="M 50 78 L 47 79 L 45 81 L 42 81 L 39 82 L 37 82 L 34 82 L 31 82 L 28 82 L 25 81 L 23 81 L 20 79 L 18 78 L 15 77 L 13 75 L 11 73 L 9 71 L 7 69 L 6 66 L 4 64 L 3 61 L 2 58 L 2 56 L 1 53 L 1 50 L 1 47 L 2 44 L 2 42 L 3 39 L 4 36 L 6 34 L 7 31 L 9 29 L 11 27 L 13 25 L 15 23 L 18 22 L 20 21 L 23 19 L 25 19 L 28 18 L 31 18 L 34 18 L 37 18 L 39 18 L 42 19 L 45 19 L 47 21 L 50 22 L 50 22 L 53 21 L 55 19 L 58 19 L 61 18 L 63 18 L 66 18 L 69 18 L 72 18 L 75 19 L 77 19 L 80 21 L 82 22 L 85 23 L 87 25 L 89 27 L 91 29 L 93 31 L 94 34 L 96 36 L 97 39 L 98 42 L 98 44 L 99 47 L 99 50 L 99 53 L 98 56 L 98 58 L 97 61 L 96 64 L 94 66 L 93 69 L 91 71 L 89 73 L 87 75 L 85 77 L 82 78 L 80 79 L 77 81 L 75 81 L 72 82 L 69 82 L 66 82 L 63 82 L 61 82 L 58 81 L 55 81 L 53 79 L 50 78" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" fill="url(#union)" stroke="currentColor" fillRule="evenodd"></path>
    </svg>
  )
  return {
    name: 'union',
    execute({ contents, selected }) {
      const first = contents[selected[0][0]]
      if (!first) return
      const firstLines = ctx.getContentModel(first)?.getGeometries?.(first, contents).lines
      if (!firstLines) return
      const second = contents[selected[1][0]]
      if (!second) return
      const secondLines = ctx.getContentModel(second)?.getGeometries?.(second, contents).lines
      if (!secondLines) return
      const lines = ctx.mergeItems([...firstLines, ...secondLines], ctx.getTwoGeometryLinesUnionLine)
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
