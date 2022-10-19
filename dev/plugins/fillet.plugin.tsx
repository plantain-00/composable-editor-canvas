import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import { isLineContent } from './line-polyline.plugin'
import type { ArcContent } from './circle-arc.plugin'

export function getCommand(ctx: PluginContext): Command {
  function getFillets(content1: model.BaseContent, content2: model.BaseContent, radius: number) {
    const result: core.Arc[] = []
    if (isLineContent(content1) && isLineContent(content2)) {
      result.push(...ctx.getCirclesTangentTo2Lines(content1.points[0], content1.points[1], content2.points[0], content2.points[1], radius).map((c) => {
        const foot1 = ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1]))
        const foot2 = ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]))
        const angle1 = Math.atan2(foot1.y - c.y, foot1.x - c.x) * 180 / Math.PI
        const angle2 = Math.atan2(foot2.y - c.y, foot2.x - c.x) * 180 / Math.PI
        const min = Math.min(angle1, angle2)
        const max = Math.max(angle1, angle2)
        if (max - min < 180) {
          return { ...c, r: radius, startAngle: min, endAngle: max }
        }
        return { ...c, r: radius, startAngle: max, endAngle: min + 360 }
      }))
    }
    return result
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="9,10 92.02409288875128,10" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="92.02409288875128,10 92.02409288875128,93.02467676553937" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <path d="M 92.02409288875128 60.000000000000014 A 50 50 0 0 0 42.024092888751284 10.000000000000014" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></path>
    </svg>
  )
  return {
    name: 'fillet',
    useCommand({ onEnd, type, selected, scale }) {
      const [candidates, setCandidates] = React.useState<core.Arc[]>([])
      const [result, setResult] = React.useState<core.Arc>()
      let message = ''
      if (type) {
        if (candidates.length > 0) {
          message = 'select one result'
        } else {
          message = 'input radius'
        }
      }
      const assistentContents: ArcContent[] = candidates.map((c) => ({
        ...c,
        type: 'arc',
        dashArray: c === result ? undefined : [4 / scale],
      }))
      const { input, setInputPosition, setCursorPosition, clearText, resetInput } = ctx.useCursorInput(message, type && candidates.length == 0 ? (e, text) => {
        if (e.key === 'Enter') {
          const radius = +text
          if (!isNaN(radius)) {
            setCandidates(getFillets(selected[0].content, selected[1].content, radius))
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
      ctx.useKey((e) => e.key === 'Escape', reset, [setCandidates])

      return {
        onStart(p) {
          setCursorPosition(p)
          if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: 'arc', ...result } as ArcContent)
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
    contentSelectable: (c) => isLineContent(c),
    selectType: 'select part',
    hotkey: 'F',
    icon,
  }
}
