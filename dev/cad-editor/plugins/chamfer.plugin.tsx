import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { isLineContent, LineContent } from './line-polyline.plugin'

export function getCommand(ctx: PluginContext): Command {
  function getChamfers(content1: model.BaseContent, content2: model.BaseContent, d1: number, d2: number) {
    const result: core.Position[][] = []
    if (isLineContent(content1) && isLineContent(content2)) {
      const point = ctx.getTwoLinesIntersectionPoint(content1.points[0], content1.points[1], content2.points[0], content2.points[1])
      if (point) {
        const p1: core.Position[] = []
        const a1 = ctx.getPointByLengthAndDirectionSafely(point, d1, content1.points[0])
        const b1 = ctx.getPointByLengthAndDirectionSafely(point, d1, content1.points[1])
        if (a1) {
          p1.push(a1)
        }
        if (b1 && (!a1 || !ctx.isSamePoint(a1, b1))) {
          p1.push(b1)
        }
        const p2: core.Position[] = []
        const a2 = ctx.getPointByLengthAndDirectionSafely(point, d2, content2.points[0])
        const b2 = ctx.getPointByLengthAndDirectionSafely(point, d2, content2.points[1])
        if (a2) {
          p2.push(a2)
        }
        if (b2 && (!a2 || !ctx.isSamePoint(a2, b2))) {
          p2.push(b2)
        }
        for (const c1 of p1) {
          for (const c2 of p2) {
            result.push([c1, c2])
          }
        }
      }
    }
    return result
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="11,12 57,12 86,41 86,86" strokeWidth="3" vectorEffect="non-scaling-stroke" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'chamfer',
    useCommand({ onEnd, type, selected, scale }) {
      const [candidates, setCandidates] = React.useState<core.Position[][]>([])
      const [result, setResult] = React.useState<core.Position[]>()
      let message = ''
      if (type) {
        if (candidates.length > 0) {
          message = 'select one result'
        } else {
          message = 'input distance'
        }
      }
      const assistentContents: LineContent[] = candidates.map((c) => ({
        type: 'line',
        points: c,
        dashArray: c === result ? undefined : [4 / scale],
      }))
      const { input, setInputPosition, setCursorPosition, clearText, resetInput } = ctx.useCursorInput(message, type && candidates.length == 0 ? (e, text) => {
        if (e.key === 'Enter') {
          const position = text.split(',')
          if (position.length === 2) {
            const d1 = +position[0]
            const d2 = +position[1]
            if (!isNaN(d1) && !isNaN(d2)) {
              setCandidates(getChamfers(selected[0].content, selected[1].content, d1, d2))
              clearText()
            }
          } else {
            const d = +text
            if (!isNaN(d)) {
              setCandidates(getChamfers(selected[0].content, selected[1].content, d, d))
              clearText()
            }
          }
        }
      } : undefined)
      const reset = () => {
        setCandidates([])
        setResult(undefined)
        clearText()
        resetInput()
      }

      return {
        onStart(p) {
          setCursorPosition(p)
          if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: 'line', points: result } as LineContent)
              }
            })
            setCandidates([])
          }
        },
        input,
        onMove(p, viewportPosition) {
          setCursorPosition(p)
          setInputPosition(viewportPosition || p)
          setResult(candidates.find((c) => ctx.getPointAndLineSegmentMinimumDistance(p, c[0], c[1]) < 5))
        },
        assistentContents,
        reset,
      }
    },
    selectCount: 2,
    contentSelectable: (c) => isLineContent(c),
    selectType: 'select part',
    hotkey: 'CHA',
    icon,
  }
}
