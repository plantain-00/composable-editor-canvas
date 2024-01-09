import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { isLineContent } from './line-polyline.plugin'
import { CircleContent, isArcContent, isCircleContent } from './circle-arc.plugin'

export function getCommand(ctx: PluginContext): Command {
  function getTangentTangentRadiusCircles(content1: model.BaseContent, content2: model.BaseContent, radius: number) {
    const result: core.Position[] = []
    if (isCircleContent(content1) || isArcContent(content1)) {
      if (isCircleContent(content2) || isArcContent(content2)) {
        result.push(...ctx.getCirclesTangentTo2Circles(content1, content2, radius))
      } else if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1])
        result.push(...ctx.getCirclesTangentToLineAndCircle(line2, content1, radius))
      }
    } else if (isLineContent(content1)) {
      const line1 = ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1])
      if (isCircleContent(content2) || isArcContent(content2)) {
        result.push(...ctx.getCirclesTangentToLineAndCircle(line1, content2, radius))
      } else if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1])
        result.push(...ctx.getCirclesTangentTo2Lines(line1, line2, radius))
      }
    }
    return result.map((c) => ({ ...c, r: radius }))
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="10,87 89,87" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <circle cx="17" cy="40" r="16" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <circle cx="60" cy="57" r="30" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
    </svg>
  )
  return {
    name: 'create tangent tangent radius circle',
    useCommand({ onEnd, type, selected, scale }) {
      const [candidates, setCandidates] = React.useState<core.Circle[]>([])
      const [result, setResult] = React.useState<core.Circle>()
      let message = ''
      if (type) {
        if (candidates.length > 0) {
          message = 'select one result'
        } else {
          message = 'input radius'
        }
      }
      const assistentContents: CircleContent[] = candidates.map((c) => ({
        ...c,
        type: 'circle',
        dashArray: c === result ? undefined : [4 / scale],
      }))
      const { input, setInputPosition, setCursorPosition, clearText, resetInput } = ctx.useCursorInput(message, type && candidates.length == 0 ? (e, text) => {
        if (e.key === 'Enter') {
          const radius = +text
          if (!isNaN(radius)) {
            setCandidates(getTangentTangentRadiusCircles(selected[0].content, selected[1].content, radius))
            clearText()
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
                contents.push({ type: 'circle', ...result } as CircleContent)
              }
            })
            setCandidates([])
          }
        },
        input,
        onMove(p, viewportPosition) {
          setCursorPosition(p)
          setInputPosition(viewportPosition || p)
          setResult(candidates.find((c) => ctx.getTwoNumbersDistance(ctx.getTwoPointsDistance(c, p), c.r) < 5))
        },
        assistentContents,
        reset,
      }
    },
    selectCount: 2,
    contentSelectable: (c) => isCircleContent(c) || isArcContent(c) || isLineContent(c),
    selectType: 'select part',
    icon,
  }
}
