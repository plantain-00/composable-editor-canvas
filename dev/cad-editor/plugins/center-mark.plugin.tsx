import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { ArcContent, CircleContent, isArcContent, isCircleContent } from './circle-arc.plugin'

export type CenterMarkReferenceContent = model.BaseContent<'center mark'> & {
  refId: number | model.BaseContent
}

export function getModel(ctx: PluginContext): model.Model<CenterMarkReferenceContent> {
  const CenterMarkReferenceContent = ctx.and(ctx.BaseContent('center mark'), {
    refId: ctx.or(ctx.number, ctx.Content)
  })
  function getCenterMarkGeometriesFromCache(content: Omit<CenterMarkReferenceContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const target = ctx.getReference(content.refId, contents, contentSelectable)
    if (target) {
      return centerMarkLinesCache.get(target, content, () => {
        const lines: [core.Position, core.Position][] = [
          [{ x: target.x - target.r, y: target.y }, { x: target.x + target.r, y: target.y }],
          [{ x: target.x, y: target.y - target.r, }, { x: target.x, y: target.y + target.r }],
        ]
        return {
          lines,
          bounding: ctx.getPointsBounding(lines.flat()),
          renderingLines: lines.map(line => ctx.dashedPolylineToLines(line, [8, 4])).flat(),
        }
      })
    }
    return { lines: [], renderingLines: [] }
  }
  const centerMarkLinesCache = new ctx.WeakmapCache2<Omit<CircleContent | ArcContent, 'type'>, Omit<CenterMarkReferenceContent, "type">, model.Geometries<{ lines: [core.Position, core.Position][] }>>()

  const React = ctx.React
  return {
    type: 'center mark',
    render(content, { target, transformStrokeWidth, contents }) {
      const strokeWidth = transformStrokeWidth(ctx.getDefaultStrokeWidth(content))
      const { renderingLines } = getCenterMarkGeometriesFromCache(content, contents)
      return target.renderGroup(renderingLines.map(line => target.renderPolyline(line, { strokeWidth })))
    },
    getGeometries: getCenterMarkGeometriesFromCache,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquireContent }) {
      return {
        refId: typeof content.refId === 'number' ? <ctx.NumberEditor value={content.refId} setValue={(v) => update(c => { if (isCenterMarkContent(c)) { c.refId = v } })} /> : [],
        refIdFrom: typeof content.refId === 'number' ? <ctx.Button onClick={() => acquireContent({ count: 1, selectable: (i) => contentSelectable(contents[i[0]]) }, p => update(c => { if (isCenterMarkContent(c)) { c.refId = p[0][0] } }))}>canvas</ctx.Button> : [],
      }
    },
    isValid: (c, p) => ctx.validate(c, CenterMarkReferenceContent, p),
    getRefIds: (content) => typeof content.refId === 'number' ? [content.refId] : [],
    updateRefId(content, update) {
      const newRefId = update(content.refId)
      if (newRefId !== undefined) {
        content.refId = newRefId
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
    execute({ contents, selected }) {
      const newContents: CenterMarkReferenceContent[] = []
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          newContents.push({
            type: 'center mark',
            refId: index,
          })
        }
      })
      contents.push(...newContents)
    },
  }
}