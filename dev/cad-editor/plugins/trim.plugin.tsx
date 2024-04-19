import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'
import { HatchContent, isHatchContent } from './hatch.plugin'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" >
      <path d="M567.1 512l318.5-319.3c5-5 1.5-13.7-5.6-13.7h-90.5c-2.1 0-4.2.8-5.6 2.3l-273.3 274-90.2-90.5c12.5-22.1 19.7-47.6 19.7-74.8 0-83.9-68.1-152-152-152s-152 68.1-152 152 68.1 152 152 152c27.7 0 53.6-7.4 75.9-20.3l90 90.3-90.1 90.3A151.04 151.04 0 00288 582c-83.9 0-152 68.1-152 152s68.1 152 152 152 152-68.1 152-152c0-27.2-7.2-52.7-19.7-74.8l90.2-90.5 273.3 274c1.5 1.5 3.5 2.3 5.6 2.3H880c7.1 0 10.7-8.6 5.6-13.7L567.1 512zM288 370c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80zm0 444c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path>
    </svg>
  )
  return {
    name: 'trim',
    useCommand({ onEnd, type, selected, backgroundColor, contents, getContentsInRange }) {
      const [candidates, setCandidates] = React.useState<{ content: model.BaseContent, children: model.BaseContent[] }[]>([])
      const [currents, setCurrents] = React.useState<{ content: model.BaseContent, children: model.BaseContent[] }[]>([])
      const [trackPoints, setTrackPoints] = React.useState<core.Position[]>([])
      const { state, setState, resetHistory, undo, redo } = ctx.useUndoRedo<{ content: model.BaseContent, children: model.BaseContent[] }[]>([])

      React.useEffect(() => {
        if (type) {
          const allContents: { content: model.BaseContent, children: model.BaseContent[] }[] = []
          for (let i = 0; i < selected.length; i++) {
            const content = selected[i].content
            let intersectionPoints: core.Position[] = []
            for (let j = 0; j < selected.length; j++) {
              const c = selected[j].content
              if (c && i !== j) {
                const p = i < j ? [c, content] as const : [content, c] as const
                intersectionPoints.push(...ctx.getIntersectionPoints(...p, contents))
              }
            }
            intersectionPoints = ctx.deduplicatePosition(intersectionPoints)
            if (intersectionPoints.length > 0) {
              const result = ctx.getContentModel(content)?.break?.(content, intersectionPoints, contents)
              if (result) {
                allContents.push({ content, children: result })
              }
            } else {
              allContents.push({ content, children: [content] })
            }
          }
          setCandidates(allContents)
        }
      }, [type])

      const assistentContents: ((model.BaseContent & model.StrokeFields) | HatchContent)[] = []
      const collectAssistentContent = (child: model.BaseContent) => {
        if (ctx.isStrokeContent(child)) {
          assistentContents.push({
            ...child,
            strokeWidth: (child.strokeWidth ?? ctx.getDefaultStrokeWidth(child)) + 2,
            strokeColor: backgroundColor,
            trueStrokeColor: true,
          })
        } else if (isHatchContent(child)) {
          assistentContents.push({
            ...child,
            fillPattern: undefined,
            fillColor: backgroundColor,
            trueFillColor: true,
          })
        }
      }
      for (const current of currents) {
        for (const child of current.children) {
          collectAssistentContent(child)
        }
      }
      if (trackPoints.length > 1) {
        assistentContents.push({ points: trackPoints, type: 'polyline' } as LineContent)
      }
      for (const { children } of state) {
        for (const child of children) {
          collectAssistentContent(child)
        }
      }
      const reset = () => {
        setCandidates([])
        setCurrents([])
        resetHistory()
        setTrackPoints([])
      }

      return {
        onStart() {
          if (currents.length > 0) {
            setState(draft => {
              for (const current of currents) {
                const index = state.findIndex(s => s.content === current.content)
                if (index >= 0) {
                  draft[index].children.push(...current.children)
                } else {
                  draft.push(current)
                }
              }
            })
          }
          setTrackPoints([])
        },
        onMouseDown(p) {
          if (currents.length === 0) {
            setTrackPoints([p])
          }
        },
        onMove(p) {
          if (trackPoints.length > 0) {
            const newTracePoints = [...trackPoints, p]
            if (newTracePoints.length > 1) {
              const trackLines = Array.from(ctx.iteratePolylineLines(newTracePoints))
              const newCurrents: typeof currents = []
              for (const candidate of candidates) {
                for (const child of candidate.children) {
                  const geometries = ctx.getContentModel(child)?.getGeometries?.(child, contents)
                  if (geometries) {
                    for (const line of geometries.lines) {
                      if (trackLines.some(t => ctx.getTwoGeometryLinesIntersectionPoint(line, t).length > 0)) {
                        const index = newCurrents.findIndex(s => s.content === candidate.content)
                        if (index >= 0) {
                          newCurrents[index].children.push(child)
                        } else {
                          newCurrents.push({ content: candidate.content, children: [child] })
                        }
                        break
                      }
                    }
                  }
                }
              }
              setCurrents(newCurrents)
            }
            setTrackPoints(newTracePoints)
            return
          }
          for (const candidate of candidates) {
            for (const child of candidate.children) {
              const geometries = ctx.getContentModel(child)?.getGeometries?.(child, contents)
              if (geometries) {
                if (isHatchContent(child) && geometries.regions && geometries.bounding) {
                  for (const region of geometries.regions) {
                    if (region.holesPoints && region.holesPoints.some(h => ctx.pointInPolygon(p, h))) {
                      continue
                    }
                    if (ctx.pointInPolygon(p, region.points)) {
                      const getGeometriesInRange = (region: core.TwoPointsFormRegion | undefined) => getContentsInRange(region).map(c => ctx.getContentHatchGeometries(c, contents))
                      const border = ctx.getHatchByPosition(p, line => getGeometriesInRange(ctx.getGeometryLineBoundingFromCache(line)), geometries.bounding.end.x)
                      if (border) {
                        const holes = ctx.getHatchHoles(border.lines, getGeometriesInRange)
                        setCurrents([{
                          children: [{
                            type: 'hatch',
                            border: border.lines,
                            holes: holes?.holes,
                            ref: {
                              point: p,
                              ids: [...border.ids, ...(holes?.ids || [])],
                            },
                          } as HatchContent],
                          content: candidate.content
                        }])
                      }
                      return
                    }
                  }
                }
                for (const line of geometries.lines) {
                  if (ctx.getPointAndGeometryLineMinimumDistance(p, line) < 5) {
                    setCurrents([{ children: [child], content: candidate.content }])
                    return
                  }
                }
              }
            }
          }
          setCurrents([])
        },
        onKeyDown(e) {
          if (e.code === 'KeyZ' && ctx.metaKeyIfMacElseCtrlKey(e)) {
            if (e.shiftKey) {
              redo(e)
            } else {
              undo(e)
            }
          } else if (e.key === 'Enter') {
            if (!type) return
            const removedIndexes: number[] = []
            const newContents: model.BaseContent[] = []
            for (const { content, children } of state) {
              const parentModel = ctx.getContentModel(content)
              if (parentModel?.break) {
                let points: core.Position[] = []
                for (const child of children) {
                  const geometries = ctx.getContentModel(child)?.getGeometries?.(child, contents)
                  if (geometries) {
                    const { start, end } = ctx.getGeometryLinesStartAndEnd(geometries.lines)
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
                }
                points = ctx.deduplicatePosition(points)
                const r = parentModel.break(content, points, contents)
                if (r) {
                  removedIndexes.push(ctx.getContentIndex(content, contents))
                  newContents.push(...r.filter(c => children.every(f => !ctx.deepEquals(f, c))))
                }
              } else if (isHatchContent(content)) {
                const holes: core.GeometryLine[][] = []
                const ids: model.ContentRef[] = []
                if (content.ref) {
                  ids.push(...content.ref.ids)
                }
                const borders = [content.border]
                if (content.holes) {
                  holes.push(...content.holes)
                }
                for (const child of children) {
                  if (isHatchContent(child)) {
                    holes.push(child.border)
                    if (child.holes) {
                      borders.push(...child.holes)
                    }
                    if (child.ref) {
                      ids.push(...child.ref.ids)
                    }
                  }
                }
                removedIndexes.push(ctx.getContentIndex(content, contents))
                const result = borders.map(b => {
                  const polygon = ctx.getGeometryLinesPoints(b)
                  return ctx.optimizeHatch(b, holes.filter(h => {
                    const start = ctx.getGeometryLineStartAndEnd(h[0]).start
                    return start && (ctx.pointIsOnGeometryLines(start, b) || ctx.pointInPolygon(start, polygon))
                  }))
                }).flat()
                newContents.push(...result.map(r => {
                  let ref: { point: core.Position, ids: model.ContentRef[] } | undefined
                  if (content.ref) {
                    const p = content.ref.point
                    if (
                      ctx.pointInPolygon(p, ctx.getGeometryLinesPoints(r.border)) &&
                      r.holes.every(h => !ctx.pointInPolygon(p, ctx.getGeometryLinesPoints(h)))
                    ) {
                      ref = {
                        point: p,
                        ids: Array.from(new Set(ids)),
                      }
                    }
                  }
                  return { ...content, border: r.border, holes: r.holes, ref }
                }))
              }
            }
            onEnd({
              updateContents: (contents) => {
                ctx.deleteSelectedContents(contents, removedIndexes)
                contents.push(...newContents)
              },
            })
            reset()
          }
        },
        assistentContents,
        reset,
      }
    },
    contentSelectable(content, contents) {
      return ctx.contentIsDeletable(content, contents)
    },
    hotkey: 'TR',
    icon,
    pointSnapDisabled: true,
  }
}
