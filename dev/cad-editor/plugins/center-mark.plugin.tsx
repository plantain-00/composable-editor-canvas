import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { ArcContent, CircleContent, isArcContent, isCircleContent } from './circle-arc.plugin'

export type CenterMarkReferenceContent = model.BaseContent<'center mark'> & {
  ref: model.PartRef
}

export function getModel(ctx: PluginContext): model.Model<CenterMarkReferenceContent> {
  const CenterMarkReferenceContent = ctx.and(ctx.BaseContent('center mark'), {
    ref: ctx.PartRef,
  })
  const getRefIds = (content: CenterMarkReferenceContent) => [content.ref.id]
  function getCenterMarkGeometriesFromCache(content: CenterMarkReferenceContent, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]))
    return ctx.getGeometriesFromCache(content, refs, () => {
      const target = ctx.getRefPart(content.ref, contents, contentSelectable)
      if (target) {
        const lines: [core.Position, core.Position][] = [
          [{ x: target.x - target.r, y: target.y }, { x: target.x + target.r, y: target.y }],
          [{ x: target.x, y: target.y - target.r, }, { x: target.x, y: target.y + target.r }],
        ]
        return {
          lines,
          bounding: ctx.getPointsBounding(lines.flat()),
          renderingLines: lines.map(line => ctx.dashedPolylineToLines(line, [8, 4])).flat(),
        }
      }
      return { lines: [], renderingLines: [] }
    })
  }
  const React = ctx.React
  return {
    type: 'center mark',
    render(content, renderCtx) {
      const { options, target, contents } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const { renderingLines } = getCenterMarkGeometriesFromCache(content, contents)
      return target.renderGroup(renderingLines.map(line => target.renderPolyline(line, options)))
    },
    getGeometries: getCenterMarkGeometriesFromCache,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquireContent }) {
      return {
        ref: [
          <ctx.Button onClick={() => acquireContent({ count: 1, part: true, selectable: (v) => contentSelectable(ctx.getContentByIndex(contents, v)) }, r => update(c => { if (isCenterMarkContent(c)) { c.ref = r[0] } }))}>select</ctx.Button>,
          typeof content.ref.id === 'number' ? <ctx.NumberEditor value={content.ref.id} setValue={(v) => update(c => { if (isCenterMarkContent(c)) { c.ref.id = v } })} /> : undefined,
          content.ref.partIndex !== undefined ? <ctx.NumberEditor value={content.ref.partIndex} setValue={(v) => update(c => { if (isCenterMarkContent(c)) { c.ref.partIndex = v } })} /> : undefined,
        ],
      }
    },
    isValid: (c, p) => ctx.validate(c, CenterMarkReferenceContent, p),
    getRefIds,
    updateRefId(content, update) {
      if (content.ref) {
        const newRefId = update(content.ref.id)
        if (newRefId !== undefined) {
          content.ref.id = newRefId
        }
      }
    },
  }
}

export function isCenterMarkContent(content: model.BaseContent): content is CenterMarkReferenceContent {
  return content.type === 'center mark'
}

function contentSelectable(content: core.Nullable<model.BaseContent>): content is CircleContent | ArcContent {
  return !!content && (isArcContent(content) || isCircleContent(content))
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="48,0 48,100" strokeWidth="5" strokeDasharray="8" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="0,49 100,49" strokeWidth="5" strokeDasharray="8" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create center mark',
    icon,
    contentSelectable,
    selectType: 'select part',
    execute({ contents, selected }) {
      contents.push(...selected.map(([index, partIndex]) => ({
        type: 'center mark',
        ref: {
          id: index,
          partIndex,
        },
      })))
    },
  }
}