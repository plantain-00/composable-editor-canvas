import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type TimeAxisContent = model.BaseContent<'time axis'> & model.StrokeFields & model.ArrowFields & core.Position & {
  max: number
}

export function getModel(ctx: PluginContext): model.Model<TimeAxisContent> {
  const TimeAxisContent = ctx.and(ctx.BaseContent('time axis'), ctx.StrokeFields, ctx.ArrowFields, ctx.Position, {
    max: ctx.number,
  })
  const getRefIds = (content: Omit<TimeAxisContent, "type">): model.RefId[] => ctx.toRefId(content.strokeStyleId)
  function getGeometriesFromCache(content: Omit<TimeAxisContent, "type">, contents: readonly core.Nullable<model.BaseContent>[], time?: number) {
    const getGeometries = (): model.Geometries => {
      const { arrowPoints, endPoint } = ctx.getArrowPoints(content, { x: content.x + content.max / 10, y: content.y }, content)
      const points = [content, endPoint]
      const result = {
        lines: Array.from(ctx.iteratePolylineLines(points)),
        bounding: ctx.getPointsBounding(points),
        regions: [
          {
            points: arrowPoints,
            lines: Array.from(ctx.iteratePolygonLines(arrowPoints)),
          }
        ],
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
      }
      if (time) {
        const timePoints = ctx.arcToPolyline(ctx.circleToArc({ x: content.x + time / 10, y: content.y, r: 5 }), ctx.defaultAngleDelta)
        result.regions.push({
          points: timePoints,
          lines: Array.from(ctx.iteratePolygonLines(timePoints)),
        })
      }
      return result
    }
    if (time) {
      return getGeometries()
    }
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]))
    return ctx.getGeometriesFromCache(content, refs, getGeometries)
  }
  const React = ctx.React
  return {
    type: 'time axis',
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    move(content, offset) {
      ctx.movePoint(content, offset)
    },
    render(content, renderCtx) {
      const { options, contents, time, target, fillOptions } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const { regions, renderingLines } = getGeometriesFromCache(content, contents, time)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, options))
      }
      if (regions) {
        for (let i = 0; i < regions.length; i++) {
          children.push(target.renderPolygon(regions[i].points, fillOptions))
        }
      }
      return target.renderGroup(children)
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isTimeAxisContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
          ]
        }
      })
    },
    getGeometries: getGeometriesFromCache,
    propertyPanel(content, update, contents, { startTime, acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isTimeAxisContent(c)) { c.x = p.x; c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isTimeAxisContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isTimeAxisContent(c)) { c.y = v } })} />,
        max: <ctx.NumberEditor value={content.max} setValue={(v) => update(c => { if (isTimeAxisContent(c) && v > 0) { c.max = v } })} />,
        action: <ctx.Button onClick={() => startTime(content.max)}>start</ctx.Button>,
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, TimeAxisContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    deleteRefId: ctx.deleteStrokeRefIds,
  }
}

export function isTimeAxisContent(content: model.BaseContent): content is TimeAxisContent {
  return content.type === 'time axis'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <g transform=""><polyline points="3,52 90,53" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline><polyline points="99,53 70,60 70,45" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline></g>
    </svg>
  )
  return {
    name: 'create time axis',
    selectCount: 0,
    icon,
    useCommand({ onEnd, type }) {
      const [result, setResult] = React.useState<TimeAxisContent>()
      const reset = () => {
        setResult(undefined)
      }
      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                if (result) {
                  contents.push(result)
                }
              },
            })
            reset()
          }
        },
        onMove(p) {
          if (type) {
            setResult({
              type: 'time axis',
              x: p.x,
              y: p.y,
              max: 5000,
            })
          }
        },
        assistentContents: result ? [result] : undefined,
        reset,
      }
    },
  }
}
