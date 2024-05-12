import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { GeometryLinesContent } from './geometry-lines.plugin'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="30" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <polyline points="50,20 50,0" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="29,29 15,15" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="20,50 0,50" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="29,71 15,85" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="50,80 50,100" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="71,29 85,15" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="71,71 85,85" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="80,50 100,50" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'light',
    useCommand({ type, getContentsInRange, contents }) {
      const [startPosition, setStartPosition] = React.useState<core.Position>()
      const [path, setPath] = React.useState<core.GeometryLine[]>()
      const reset = () => {
        setStartPosition(undefined)
        setPath(undefined)
      }
      const assistentContents: GeometryLinesContent[] = []
      if (path) {
        assistentContents.push({ type: 'geometry lines', lines: path, strokeColor: 0xff0000 })
      }
      return {
        onStart(s) {
          if (!type) return
          setStartPosition(s)
        },
        reset,
        onMove(p) {
          if (!type) return
          if (!startPosition) return
          setPath(ctx.getLightPath(
            { x: startPosition.x, y: startPosition.y, angle: ctx.radianToAngle(ctx.getTwoPointsRadian(p, startPosition)) },
            line => {
              const result: model.Geometries[] = []
              const region = ctx.getGeometryLineBoundingFromCache(line)
              for (const content of getContentsInRange(region)) {
                if (content) {
                  const geometries = ctx.getContentModel(content)?.getGeometries?.(content, contents)
                  if (geometries) {
                    result.push(geometries)
                  }
                }
              }
              return result
            }
          ))
        },
        assistentContents,
      }
    },
    selectCount: 0,
    icon,
  }
}
