import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { isLineContent, LineContent } from './line-polyline.plugin'
import { ArcContent, CircleContent, isArcContent, isCircleContent } from './circle-arc.plugin'

export function getCommand(ctx: PluginContext): Command {
  function getFillets(content1: model.BaseContent, content2: model.BaseContent, radius: number) {
    const result: core.Arc[] = []
    if (!contentSelectable(content1) || !contentSelectable(content2)) {
      return result
    }
    const circles: { center: core.Position, foot1: core.Position, foot2: core.Position }[] = []
    if (isLineContent(content1) && isLineContent(content2)) {
      circles.push(...ctx.getCirclesTangentTo2Lines(content1.points[0], content1.points[1], content2.points[0], content2.points[1], radius).map((c) => ({
        center: c,
        foot1: ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1])),
        foot2: ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1])),
      })))
    } else if ((isCircleContent(content1) || isArcContent(content1)) && (isCircleContent(content2) || isArcContent(content2))) {
      circles.push(...ctx.getCirclesTangentTo2Circles(content1, content2, radius).map((c) => ({
        center: c,
        foot1: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content1)[0],
        foot2: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content2)[0],
      })))
    } else if (isLineContent(content1) && (isCircleContent(content2) || isArcContent(content2))) {
      circles.push(...ctx.getCirclesTangentToLineAndCircle(content1.points[0], content1.points[1], content2, radius).map((c) => ({
        center: c,
        foot1: ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1])),
        foot2: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content2)[0],
      })))
    } else if (isLineContent(content2) && (isCircleContent(content1) || isArcContent(content1))) {
      circles.push(...ctx.getCirclesTangentToLineAndCircle(content2.points[0], content2.points[1], content1, radius).map((c) => ({
        center: c,
        foot1: ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1])),
        foot2: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content1)[0],
      })))
    }
    return circles.map(({ foot1, foot2, center: c }) => {
      const angle1 = ctx.radianToAngle(ctx.getTwoPointsAngle(foot1, c))
      const angle2 = ctx.radianToAngle(ctx.getTwoPointsAngle(foot2, c))
      const min = Math.min(angle1, angle2)
      const max = Math.max(angle1, angle2)
      if (max - min < 180) {
        return { ...c, r: radius, startAngle: min, endAngle: max }
      }
      return { ...c, r: radius, startAngle: max, endAngle: min + 360 }
    })
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="9,10 92,10" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="92,10 92,93" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <path d="M 92 60 A 50 50 0 0 0 42 10" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></path>
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
    contentSelectable,
    selectType: 'select part',
    hotkey: 'F',
    icon,
  }
}

function contentSelectable(content: model.BaseContent): content is LineContent | CircleContent | ArcContent {
  return isLineContent(content) || isCircleContent(content) || isArcContent(content)
}
