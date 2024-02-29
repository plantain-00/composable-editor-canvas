import type { PluginContext } from './types'
import type * as core from '../../../src'
import type * as model from '../model'

export type LeadContent = model.BaseContent<'lead'> & model.StrokeFields & model.ArrowFields & model.TextFields & {
  ref: model.ContentRef
  points: core.Position[]
  text: string
}

export function getModel(ctx: PluginContext): model.Model<LeadContent> {
  const LeadContent = ctx.and(ctx.BaseContent('lead'), ctx.StrokeFields, ctx.ArrowFields, ctx.TextFields, {
    ref: ctx.ContentRef,
    points: [ctx.Position],
    text: ctx.string,
  })
  const leadCache = new ctx.WeakmapCache<Omit<LeadContent, "type">, model.Geometries>()
  const leadCache2 = new ctx.WeakmapCache2<Omit<LeadContent, "type">, model.BaseContent, model.Geometries>()
  function getLeadGeometriesByPoints(p0: core.Position, p1: core.Position, content: Omit<LeadContent, "type">, line?: core.GeometryLine): model.Geometries {
    const { arrowPoints, endPoint } = ctx.getArrowPoints(p1, p0, content)
    const lines: core.GeometryLine[] = Array.from(ctx.iteratePolylineLines([endPoint, ...content.points.slice(1)]))
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
    const points = ctx.getGeometryLinesPoints(lines)
    return {
      lines,
      bounding: ctx.mergeBoundings([ctx.getGeometryLinesBounding(lines), ctx.getPointsBounding(textPoints)]),
      regions: [
        {
          points: arrowPoints,
          lines: Array.from(ctx.iteratePolygonLines(arrowPoints)),
        },
        {
          points: textPoints,
          lines: Array.from(ctx.iteratePolygonLines(textPoints)),
        }
      ],
      renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
    }
  }
  function getLeadGeometriesFromCache(content: Omit<LeadContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const ref = ctx.getReference(content.ref, contents)
    let p0 = content.points[0]
    const p1 = content.points[1]
    if (ref) {
      const lines = ctx.getContentModel(ref)?.getGeometries?.(ref, contents)?.lines
      if (lines) {
        const p = ctx.getPerpendicularPointToGeometryLines(p1, lines)
        p0 = p.point
        return leadCache2.get(content, ref, () => getLeadGeometriesByPoints(p0, p1, content, p.line))
      }
    }
    return leadCache.get(content, () => getLeadGeometriesByPoints(p0, p1, content))
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
      if (regions) {
        children.push(target.renderPolygon(regions[0].points, fillOptions))
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
