import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { LineContent, isLineContent } from './line-polyline.plugin'

export type CenterLineReferenceContent = model.BaseContent<'center line'> & {
  ref1: model.PartRef
  ref2: model.PartRef
}

export function getModel(ctx: PluginContext): model.Model<CenterLineReferenceContent> {
  const CenterLineReferenceContent = ctx.and(ctx.BaseContent('center line'), {
    ref1: ctx.PartRef,
    ref2: ctx.PartRef,
  })
  function getCenterLineGeometriesFromCache(content: Omit<CenterLineReferenceContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const ref1 = ctx.getRefPart(content.ref1, contents, isLineContent)
    const ref2 = ctx.getRefPart(content.ref2, contents, isLineContent)
    if (ref1 && ref2) {
      return centerMarkLinesCache.get(ref1, ref2, content, () => {
        const line = ctx.maxmiumBy([
          [ctx.getTwoPointCenter(ref1.points[0], ref2.points[0]), ctx.getTwoPointCenter(ref1.points[1], ref2.points[1])] as [core.Position, core.Position],
          [ctx.getTwoPointCenter(ref1.points[0], ref2.points[1]), ctx.getTwoPointCenter(ref1.points[1], ref2.points[0])] as [core.Position, core.Position],
        ].map(r => ({ line: r, length: ctx.getTwoPointsDistance(...r) })), v => v.length).line
        return {
          lines: [line],
          bounding: ctx.getPointsBounding(line),
          renderingLines: ctx.dashedPolylineToLines(line, [8, 4]),
        }
      })
    }
    return { lines: [], renderingLines: [] }
  }
  const centerMarkLinesCache = new ctx.WeakmapCache3<Omit<LineContent, 'type'>, Omit<LineContent, 'type'>, Omit<CenterLineReferenceContent, "type">, model.Geometries<{ lines: [core.Position, core.Position][] }>>()

  const React = ctx.React
  return {
    type: 'center line',
    render(content, renderCtx) {
      const { options, target, contents } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const { renderingLines } = getCenterLineGeometriesFromCache(content, contents)
      return target.renderGroup(renderingLines.map(line => target.renderPolyline(line, options)))
    },
    getGeometries: getCenterLineGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        ref1: [
          typeof content.ref1.id === 'number' ? <ctx.NumberEditor value={content.ref1.id} setValue={(v) => update(c => { if (isCenterLineContent(c)) { c.ref1.id = v } })} /> : undefined,
          content.ref1.partIndex !== undefined ? <ctx.NumberEditor value={content.ref1.partIndex} setValue={(v) => update(c => { if (isCenterLineContent(c)) { c.ref1.partIndex = v } })} /> : undefined,
        ],
        ref2: [
          typeof content.ref2.id === 'number' ? <ctx.NumberEditor value={content.ref2.id} setValue={(v) => update(c => { if (isCenterLineContent(c)) { c.ref2.id = v } })} /> : undefined,
          content.ref2.partIndex !== undefined ? <ctx.NumberEditor value={content.ref2.partIndex} setValue={(v) => update(c => { if (isCenterLineContent(c)) { c.ref2.partIndex = v } })} /> : undefined,
        ],
      }
    },
    isValid: (c, p) => ctx.validate(c, CenterLineReferenceContent, p),
    getRefIds: (content) => [
      ...(content.ref1 && typeof content.ref1.id === 'number' ? [content.ref1.id] : []),
      ...(content.ref2 && typeof content.ref2.id === 'number' ? [content.ref2.id] : []),
    ],
    updateRefId(content, update) {
      if (content.ref1) {
        const newRefId = update(content.ref1.id)
        if (newRefId !== undefined) {
          content.ref1.id = newRefId
        }
      }
      if (content.ref2) {
        const newRefId = update(content.ref2.id)
        if (newRefId !== undefined) {
          content.ref2.id = newRefId
        }
      }
    },
  }
}

export function isCenterLineContent(content: model.BaseContent): content is CenterLineReferenceContent {
  return content.type === 'center line'
}

function contentSelectable(content: core.Nullable<model.BaseContent>): content is LineContent {
  return !!content && isLineContent(content)
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="48,0 48,100" strokeWidth="5" strokeDasharray="8" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="100,0 100,100" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="0,1 0,99" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create center line',
    icon,
    contentSelectable,
    selectCount: 2,
    selectType: 'select part',
    execute({ contents, selected }) {
      contents.push({
        type: 'center line',
        ref1: {
          id: selected[0][0],
          partIndex: selected[0][1],
        },
        ref2: {
          id: selected[1][0],
          partIndex: selected[1][1],
        },
      } as CenterLineReferenceContent)
    },
  }
}