import type { PluginContext } from './types'
import type * as core from '../../../src'
import type * as model from '../model'
import type { Command } from '../command'

export type LeadContent = model.BaseContent<'lead'> & model.StrokeFields & model.ArrowFields & model.TextFields & {
  ref?: model.ContentRef
  points: core.Position[]
  text: string
}

export function getModel(ctx: PluginContext): model.Model<LeadContent> {
  const LeadContent = ctx.and(ctx.BaseContent('lead'), ctx.StrokeFields, ctx.ArrowFields, ctx.TextFields, {
    ref: ctx.optional(ctx.ContentRef),
    points: [ctx.Position],
    text: ctx.string,
  })
  const leadCache = new ctx.WeakmapCache<Omit<LeadContent, "type">, model.Geometries>()
  const leadCache2 = new ctx.WeakmapCache2<Omit<LeadContent, "type">, model.BaseContent, model.Geometries>()
  function getLeadGeometriesByPoints(p0: core.Position, content: Omit<LeadContent, "type">, line?: core.GeometryLine): model.Geometries {
    let lines: core.GeometryLine[]
    let arrow: core.Position[] | undefined
    if (content.points.length > 1) {
      const arrowPoints = ctx.getArrowPoints(content.points[1], p0, content)
      arrow = arrowPoints.arrowPoints
      lines = Array.from(ctx.iteratePolylineLines([arrowPoints.endPoint, ...content.points.slice(1)]))
    } else {
      lines = []
    }
    if (line) {
      const param0 = ctx.getGeometryLineParamAtPoint(p0, line)
      const { start, end } = ctx.getGeometryLineStartAndEnd(line)
      if (start && (!end || ctx.getTwoPointsDistance(start, p0) < ctx.getTwoPointsDistance(end, p0))) {
        line = ctx.getPartOfGeometryLine(param0, 0, line)
        const marginParam = ctx.getGeometryLineParamByLength(line, -ctx.dimensionStyle.margin)
        if (marginParam !== undefined) {
          lines.push(ctx.getPartOfGeometryLine(marginParam, 1, line))
        }
      } else if (end && (!start || ctx.getTwoPointsDistance(end, p0) < ctx.getTwoPointsDistance(start, p0))) {
        line = ctx.getPartOfGeometryLine(param0, 1, line)
        const marginParam = ctx.getGeometryLineParamByLength(line, -ctx.dimensionStyle.margin)
        if (marginParam !== undefined) {
          lines.push(ctx.getPartOfGeometryLine(marginParam, 1, line))
        }
      }
    }
    const size = ctx.getTextSize(ctx.getTextStyleFont(content), content.text)
    if (!size) {
      throw 'not supported'
    }
    const last = content.points[content.points.length - 1]
    const textPoints = [
      { x: last.x, y: last.y - size.height },
      { x: last.x + size.width, y: last.y - size.height },
      { x: last.x + size.width, y: last.y },
      { x: last.x, y: last.y },
    ]
    const points = lines.map(line => ctx.getGeometryLinesPoints([line]))
    return {
      lines,
      bounding: ctx.mergeBoundings([ctx.getGeometryLinesBounding(lines), ctx.getPointsBounding(textPoints)]),
      regions: [
        {
          points: textPoints,
          lines: Array.from(ctx.iteratePolygonLines(textPoints)),
        },
        ...(arrow ? [{
          points: arrow,
          lines: Array.from(ctx.iteratePolygonLines(arrow)),
        }] : []),
      ],
      renderingLines: points.map(p => ctx.dashedPolylineToLines(p, content.dashArray)).flat(),
    }
  }
  function getLeadGeometriesFromCache(content: Omit<LeadContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const ref = ctx.getReference(content.ref, contents)
    if (ref && content.points.length > 1) {
      const lines = ctx.getContentModel(ref)?.getGeometries?.(ref, contents)?.lines
      if (lines) {
        const p = ctx.getPerpendicularPointToGeometryLines(content.points[1], lines)
        return leadCache2.get(content, ref, () => getLeadGeometriesByPoints(p.point, content, p.line))
      }
    }
    return leadCache.get(content, () => getLeadGeometriesByPoints(content.points[0], content))
  }
  return {
    type: 'lead',
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    ...ctx.textModel,
    render(content, renderCtx) {
      const { options, target, contents, fillOptions } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const { regions, renderingLines } = getLeadGeometriesFromCache(content, contents)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, options))
      }
      if (regions && regions.length > 1) {
        children.push(target.renderPolygon(regions[1].points, fillOptions))
      }
      const textStyleContent = ctx.getTextStyleContent(content, contents)
      const color = renderCtx.transformColor(textStyleContent.color)
      let cacheKey: object | undefined
      if (renderCtx.isAssistence) {
        cacheKey = ctx.assistentTextCache.get(content.text, textStyleContent.fontSize, textStyleContent.color)
      }
      if (!cacheKey) {
        cacheKey = content
      }
      const last = content.points[content.points.length - 1]
      const textOptions = ctx.getTextStyleRenderOptionsFromRenderContext(color, renderCtx)
      children.push(target.renderText(last.x, last.y, content.text, color, textStyleContent.fontSize, textStyleContent.fontFamily, { cacheKey, ...textOptions, textBaseline: 'middle' }))
      return target.renderGroup(children)
    },
    getGeometries: getLeadGeometriesFromCache,
    isValid: (c, p) => ctx.validate(c, LeadContent, p),
  }
}

export function isLeadContent(content: model.BaseContent): content is LeadContent {
  return content.type === 'lead'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="16,22 83,22" strokeWidth="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="49,22 49,89" strokeWidth="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create lead',
    icon,
    useCommand({ onEnd, type, scale, textStyleId }) {
      const [lead, setLead] = React.useState<LeadContent>()
      let message = ''
      if (type) {
        message = 'press Enter to end'
      }
      const { input, clearText, setCursorPosition, setInputPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === 'Enter') {
          if (text) {
            clearText()
          } else if (lead) {
            onEnd({ updateContents: (contents) => contents.push(ctx.produce(lead, draft => {
              draft.points.splice(draft.points.length - 1, 1)
              return
            })) })
            reset()
          }
        }
      } : undefined)
      const reset = () => {
        setLead(undefined)
        resetInput()
      }
      const assistentContents: LeadContent[] = []
      let panel: JSX.Element | undefined
      if (type) {
        if (lead) {
          assistentContents.push(lead)
        }
      }
      return {
        input,
        onStart: (p, target) => {
          if (!type) return
          if (!lead) {
            setLead({
              type: 'lead',
              text: 'abc',
              textStyleId,
              color: 0x000000,
              fontSize: 16 / scale,
              fontFamily: 'monospace',
              points: [p, p],
              ref: target?.id,
            })
          } else {
            const last = lead.points[lead.points.length - 1]
            setLead(ctx.produce(lead, draft => {
              draft.points.push(last)
              return
            }))
          }
        },
        onMove(p, viewportPosition) {
          if (!type) return
          setInputPosition(viewportPosition || p)
          setCursorPosition(p)
          if (lead) {
            setLead(ctx.produce(lead, draft => {
              draft.points[lead.points.length - 1] = p
              return
            }))
          }
        },
        assistentContents,
        reset,
        panel,
      }
    },
    selectCount: 0,
  }
}
