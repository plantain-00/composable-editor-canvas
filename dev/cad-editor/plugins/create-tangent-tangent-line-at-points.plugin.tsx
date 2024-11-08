import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type { LineContent } from './line-polyline.plugin'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="78" cy="80" r="18" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <circle cx="29" cy="29" r="27" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <circle cx="92" cy="70" r="8" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="none"></circle>
      <circle cx="51" cy="13" r="8" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="none"></circle>
      <polyline points="92,70 51,13" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create tangent tangent line at points',
    useCommand({ onEnd, type, scale, contents }) {
      const [start, setStart] = React.useState<{ point: core.Position, param: number, line: core.GeometryLine }>()
      const [cursor, setCursor] = React.useState<core.Position>()
      const [result, setResult] = React.useState<[core.Position, core.Position]>()
      const assistentContents: LineContent[] = []
      if (start && cursor && type) {
        assistentContents.push({
          points: [start.point, cursor],
          type: 'line',
          dashArray: [4 / scale],
        })
      }
      if (result) {
        assistentContents.push({
          points: result,
          type: 'line',
        })
      }
      const reset = () => {
        setStart(undefined)
        setResult(undefined)
        setCursor(undefined)
      }
      const getTarget = (point: core.Position, id: number, param: number) => {
        const content = contents[id]
        if (!content) return
        const lines = ctx.getContentModel(content)?.getGeometries?.(content, contents)?.lines
        if (!lines) return
        const index = Math.floor(param)
        return { point, line: lines[index], param: param - index }
      }
      return {
        onStart(p, target) {
          if (!type) return
          if (!target) return
          if (target.param === undefined) return
          if (!start) {
            setStart(getTarget(p, target.id, target.param))
          } else if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: 'line', points: result } as LineContent)
              }
            })
            reset()
          }
        },
        onMove(p, _, target) {
          if (!type) return
          setCursor(p)
          setResult(undefined)
          if (!target) return
          if (target.param === undefined) return
          if (!start) return
          const end = getTarget(p, target.id, target.param)
          if (!end) return
          const params = ctx.getLineTangentToTwoGeometryLinesNearParam(start.line, end.line, start.param, end.param)
          if (params) {
            setResult([ctx.getGeometryLinePointAtParam(params[0], start.line), ctx.getGeometryLinePointAtParam(params[1], end.line)])
          }
        },
        assistentContents,
        reset,
      }
    },
    selectCount: 0,
    icon,
  }
}
