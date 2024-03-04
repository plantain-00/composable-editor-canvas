import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="-0,0 101,0" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="56,-0 43,57" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="43,57 35,100" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'extend',
    useCommand({ onEnd, selected, contents, backgroundColor, setSelected }) {
      const [hovering, setHovering] = React.useState<{ content: model.BaseContent, point: core.Position, path: core.ContentPath }>()
      const [trimHovering, setTrimHovering] = React.useState<{ content: model.BaseContent, path: core.ContentPath }>()
      const [shift, setShift] = React.useState(false)
      const reset = () => {
        setHovering(undefined)
        setTrimHovering(undefined)
      }
      const assistentContents: (model.BaseContent & model.StrokeFields)[] = []
      if (hovering) {
        assistentContents.push(hovering.content)
      } else if (trimHovering) {
        if (ctx.isStrokeContent(trimHovering.content)) {
          assistentContents.push({
            ...trimHovering.content,
            strokeWidth: (trimHovering.content.strokeWidth ?? ctx.getDefaultStrokeWidth(trimHovering.content)) + 2,
            strokeColor: backgroundColor,
            trueStrokeColor: true,
          })
        }
      }
      return {
        onStart() {
          if (hovering) {
            onEnd({
              updateContents(contents) {
                const content = ctx.getContentByIndex(contents, hovering.path)
                if (content) {
                  ctx.getContentModel(content)?.extend?.(content, hovering.point)
                }
              },
            })
          } else if (trimHovering) {
            const content = ctx.getContentByIndex(contents, trimHovering.path)
            if (content) {
              const points: core.Position[] = []
              const lines = ctx.getContentModel(trimHovering.content)?.getGeometries?.(trimHovering.content, contents)?.lines
              if (lines) {
                const { start, end } = ctx.getGeometryLinesStartAndEnd(lines)
                if (start && end) {
                  if (!ctx.isSamePoint(start, end)) {
                    points.push(start, end)
                  }
                } else if (start) {
                  points.push(start)
                } else if (end) {
                  points.push(end)
                }
              }
              if (points.length > 0) {
                const r = ctx.getContentModel(content)?.break?.(content, points, contents)
                if (r) {
                  const index = ctx.getContentIndex(content, contents)
                  const newContents = r.filter(c => !ctx.deepEquals(trimHovering.content, c))
                  onEnd({
                    updateContents: (contents) => {
                      contents[index] = undefined
                      contents.push(...newContents)
                    },
                  })
                  const newSelected = selected.map(s => s.path)
                  for (let i = 0; i < newContents.length; i++) {
                    newSelected.push([contents.length + i])
                  }
                  setSelected(...newSelected)
                }
              }
            }
          }
          reset()
        },
        onMove(p) {
          for (const s of selected) {
            const lines = ctx.getContentModel(s.content)?.getGeometries?.(s.content, contents)?.lines
            if (lines?.some(line => ctx.getPointAndGeometryLineMinimumDistance(p, line) < 5)) {
              let points: core.Position[] = []
              for (const c of selected) {
                if (c !== s) {
                  const lines2 = ctx.getContentModel(c.content)?.getGeometries?.(c.content, contents)?.lines
                  if (lines2) {
                    for (let i = 0; i < lines.length; i++) {
                      const extend = i === 0 || i === lines.length - 1
                      for (const line of lines2) {
                        if (shift) {
                          points.push(...ctx.getTwoGeometryLinesIntersectionPoint(lines[i], line))
                        } else {
                          points.push(...ctx.getTwoGeometryLinesIntersectionPoint(lines[i], line, extend).filter(p => lines.every(n => !ctx.pointIsOnGeometryLine(p, n))))
                        }
                      }
                    }
                  }
                }
              }
              points = ctx.deduplicatePosition(points)
              if (shift) {
                let parts = [s.content]
                if (points.length > 0) {
                  parts = ctx.getContentModel(s.content)?.break?.(s.content, points, contents) || [s.content]
                }
                const content = parts.length === 1 ? parts[0] : parts.find(f => ctx.getContentModel(f)?.getGeometries?.(f, contents)?.lines.some(n => ctx.getPointAndGeometryLineMinimumDistance(p, n) < 5))
                if (content) {
                  setTrimHovering({
                    ...s,
                    content,
                  })
                  return
                }
              } else if (points.length > 0) {
                const point = points.length === 1 ? points[0] : ctx.minimumBy(points.map(point => ({
                  point,
                  distance: ctx.getTwoPointsDistanceSquare(p, point),
                })), n => n.distance).point
                setHovering({
                  ...s,
                  point,
                  content: ctx.produce(s.content, draft => {
                    ctx.getContentModel(s.content)?.extend?.(draft, point)
                  }),
                })
                return
              }
            }
          }
          setHovering(undefined)
          setTrimHovering(undefined)
        },
        onKeyDown(e) {
          setShift(e.shiftKey)
        },
        onKeyUp(e) {
          setShift(e.shiftKey)
        },
        reset,
        assistentContents,
        hovering: hovering ? [hovering.path] : trimHovering ? [trimHovering.path] : undefined,
      }
    },
    contentSelectable(content, contents) {
      return !content.readonly && !!ctx.getContentModel(content)?.getGeometries?.(content, contents)?.lines?.length
    },
    icon,
    repeatedly: true,
  }
}
