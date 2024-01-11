import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { isLineContent } from './line-polyline.plugin'
import { CircleContent, isArcContent, isCircleContent } from './circle-arc.plugin'

export function getCommand(ctx: PluginContext): Command {
  function getTangentTangentTangentCircles(content1: model.BaseContent, content2: model.BaseContent, content3: model.BaseContent) {
    const result: core.Circle[] = []
    if (isLineContent(content1)) {
      const line1 = ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1])
      if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1])
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1])
          result.push(...ctx.getCirclesTangentTo3Lines(line1, line2, line3))
        } else if (isCircleContent(content3) || isArcContent(content3)) {
          result.push(...ctx.getCirclesTangentToLineLineCircle(line1, line2, content3))
        }
      } else if (isCircleContent(content2) || isArcContent(content2)) {
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1])
          result.push(...ctx.getCirclesTangentToLineLineCircle(line1, line3, content2))
        } else if (isCircleContent(content3) || isArcContent(content3)) {
          result.push(...ctx.getCirclesTangentToLineCircleCircle(line1, content2, content3))
        }
      }
    } else if (isCircleContent(content1) || isArcContent(content1)) {
      if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1])
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1])
          result.push(...ctx.getCirclesTangentToLineLineCircle(line2, line3, content1))
        } else if (isCircleContent(content3) || isArcContent(content3)) {
          result.push(...ctx.getCirclesTangentToLineCircleCircle(line2, content1, content3))
        }
      } else if (isCircleContent(content2) || isArcContent(content2)) {
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1])
          result.push(...ctx.getCirclesTangentToLineCircleCircle(line3, content1, content2))
        } else if (isCircleContent(content3) || isArcContent(content3)) {
          result.push(...ctx.getCirclesTangentTo3Circles(content1, content2, content3))
        }
      }
    }
    return result
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="0,8 100,8" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="99,19 60,100" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="0,22 44,98" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <circle cx="50" cy="42" r="34" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
    </svg>
  )
  return {
    name: 'create tangent tangent tangent circle',
    useCommand({ onEnd, type, selected, scale }) {
      const [candidates, setCandidates] = React.useState<core.Circle[]>()
      const [result, setResult] = React.useState<core.Circle>()
      const assistentContents: CircleContent[] = (candidates || []).map((c) => ({
        ...c,
        type: 'circle',
        dashArray: c === result ? undefined : [4 / scale],
      }))
      const reset = () => {
        setCandidates(undefined)
        setResult(undefined)
      }
      React.useEffect(() => {
        if (type && !candidates) {
          setCandidates(getTangentTangentTangentCircles(selected[0].content, selected[1].content, selected[2].content))
        }
      }, [type, selected])
      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: 'circle', ...result } as CircleContent)
              }
            })
            setCandidates([])
          }
        },
        onMove(p) {
          setResult(candidates?.find((c) => ctx.getTwoNumbersDistance(ctx.getTwoPointsDistance(c, p), c.r) < 5))
        },
        assistentContents,
        reset,
      }
    },
    selectCount: 3,
    contentSelectable: (c) => isLineContent(c) || isCircleContent(c) || isArcContent(c),
    selectType: 'select part',
    icon,
  }
}
