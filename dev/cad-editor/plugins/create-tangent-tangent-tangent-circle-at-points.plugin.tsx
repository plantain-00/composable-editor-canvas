import type { PluginContext } from './types'
import type * as core from '../../../src'
import type * as model from '../model'
import type { Command } from '../command'
import type { LineContent } from './line-polyline.plugin'
import type { CircleContent } from './circle-arc.plugin'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="0,8 100,8" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="99,19 60,100" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="0,22 44,98" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <circle cx="50" cy="42" r="34" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <circle cx="82" cy="60" r="8" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="none"></circle>
      <circle cx="48" cy="8" r="8" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="none"></circle>
      <circle cx="22" cy="60" r="8" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="none"></circle>
    </svg>
  )
  return {
    name: 'create tangent tangent tangent circle at points',
    useCommand({ onEnd, type, scale, contents }) {
      const [start, setStart] = React.useState<core.GeometryLinePoint>()
      const [second, setSecond] = React.useState<core.GeometryLinePoint>()
      const [cursor, setCursor] = React.useState<core.Position>()
      const [result, setResult] = React.useState<core.Circle>()
      const assistentContents: (LineContent | CircleContent)[] = []
      if (start && cursor && type) {
        if (second) {
          assistentContents.push({
            points: [start.point, second.point, cursor],
            type: 'polyline',
            dashArray: [4 / scale],
          })
        } else {
          assistentContents.push({
            points: [start.point, cursor],
            type: 'line',
            dashArray: [4 / scale],
          })
        }
      }
      if (result) {
        assistentContents.push({
          ...result,
          type: 'circle',
        })
      }
      const reset = () => {
        setStart(undefined)
        setSecond(undefined)
        setResult(undefined)
        setCursor(undefined)
      }
      const getTarget = (point: core.Position, target?: model.SnapTarget): core.GeometryLinePoint | undefined => {
        if (!target || target.param === undefined) {
          return { point }
        }
        const content = contents[target.id]
        if (!content) return
        const lines = ctx.getContentModel(content)?.getGeometries?.(content, contents)?.lines
        if (!lines) return
        const index = Math.floor(target.param)
        return { point, on: { line: lines[index], param: target.param - index } }
      }
      return {
        onStart(p, target) {
          if (!type) return
          if (!start) {
            setStart(getTarget(p, target))
          } else if (!second) {
            setSecond(getTarget(p, target))
          } else if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: 'circle', ...result } as CircleContent)
              }
            })
            reset()
          }
        },
        onMove(p, _, target) {
          if (!type) return
          setCursor(p)
          setResult(undefined)
          if (!start) return
          if (!second) return
          const end = getTarget(p, target)
          if (!end) return
          const circle = ctx.getCircleTangentToThreeGeometryLinesOrPoints(start, second, end)
          if (circle) {
            setResult(circle)
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
