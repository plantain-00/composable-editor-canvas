import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type { LineContent } from './line-polyline.plugin'

export function getCommand(ctx: PluginContext): Command {
  function getTangentTangentLines(line1?: core.GeometryLine, line2?: core.GeometryLine) {
    if (line1 && line2) {
      return ctx.getLinesTangentTo2GeometryLines(line1, line2)
    }
    return []
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="78" cy="80" r="18" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <circle cx="29" cy="29" r="27" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <polyline points="92,70 51,13" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create tangent tangent line',
    useCommand({ onEnd, type, selected, scale }) {
      const [candidates, setCandidates] = React.useState<[core.Position, core.Position][]>()
      const [result, setResult] = React.useState<[core.Position, core.Position]>()
      const assistentContents: LineContent[] = (candidates || []).map((c) => ({
        points: c,
        type: 'line',
        dashArray: c === result ? undefined : [4 / scale],
      }))
      React.useEffect(() => {
        if (type && !candidates) {
          setCandidates(getTangentTangentLines(selected[0].lines?.[0], selected[1].lines?.[0]))
        }
      }, [type, selected])
      const reset = () => {
        setCandidates(undefined)
        setResult(undefined)
      }

      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: 'line', points: result } as LineContent)
              }
            })
            reset()
          }
        },
        onMove(p) {
          setResult(candidates?.find((c) => ctx.getPointAndLineSegmentMinimumDistance(p, ...c) < 5))
        },
        assistentContents,
        reset,
      }
    },
    selectCount: 2,
    selectType: 'select part',
    icon,
  }
}
