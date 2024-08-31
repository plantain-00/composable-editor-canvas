import type { PluginContext } from './types'
import type * as core from '../../../src'
import type * as model from '../model'

export type HyperbolaContent = model.BaseContent<'hyperbola'> & model.StrokeFields & core.HyperbolaSegment & model.SegmentCountFields

export function getModel(ctx: PluginContext): model.Model<HyperbolaContent> {
  const HyperbolaContent = ctx.and(ctx.BaseContent('hyperbola'), ctx.StrokeFields, ctx.HyperbolaSegment, ctx.SegmentCountFields)
  const geometriesCache = new ctx.WeakmapValuesCache<Omit<HyperbolaContent, "type">, model.BaseContent, model.Geometries<{ points: core.Position[] }>>()
  function getHyperbolaGeometries(content: Omit<HyperbolaContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(ctx.getStrokeRefIds(content), contents, [content]))
    return geometriesCache.get(content, refs, () => {
      const points = ctx.getHyperbolaPoints(content, content.segmentCount ?? ctx.defaultSegmentCount)
      const lines: core.GeometryLine[] = []
      return {
        lines,
        points,
        bounding: ctx.getGeometryLinesBounding(lines),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
      }
    })
  }
  const React = ctx.React
  return {
    type: 'hyperbola',
    ...ctx.strokeModel,
    ...ctx.segmentCountModel,
    move(content, offset) {
      ctx.movePoint(content, offset)
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const { points } = getHyperbolaGeometries(content, renderCtx.contents)
      return target.renderPolyline(points, options)
    },
    renderIfSelected(content, { color, target, strokeWidth }) {
      return target.renderRay(content.x, content.y, content.angle, { strokeColor: color, dashArray: [4], strokeWidth })
    },
    getGeometries: getHyperbolaGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isHyperbolaContent(c)) { c.x = p.x; c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isHyperbolaContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isHyperbolaContent(c)) { c.y = v } })} />,
        a: <ctx.NumberEditor value={content.a} setValue={(v) => update(c => { if (isHyperbolaContent(c) && v > 0) { c.a = v } })} />,
        b: <ctx.NumberEditor value={content.b} setValue={(v) => update(c => { if (isHyperbolaContent(c) && v > 0) { c.b = v } })} />,
        t1: <ctx.NumberEditor value={content.t1} setValue={(v) => update(c => { if (isHyperbolaContent(c)) { c.t1 = v } })} />,
        t2: <ctx.NumberEditor value={content.t2} setValue={(v) => update(c => { if (isHyperbolaContent(c)) { c.t2 = v } })} />,
        angle: <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isHyperbolaContent(c)) { c.angle = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getSegmentCountContentPropertyPanel(content, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, HyperbolaContent, p),
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    deleteRefId: ctx.deleteStrokeRefIds,
    reverse: ctx.reverseHyperbola,
  }
}

export function isHyperbolaContent(content: model.BaseContent): content is HyperbolaContent {
  return content.type === 'hyperbola'
}
