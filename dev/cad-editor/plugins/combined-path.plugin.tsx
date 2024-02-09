import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { isLineContent, isPolyLineContent } from './line-polyline.plugin'
import { isArcContent } from './circle-arc.plugin'
import { isEllipseArcContent } from './ellipse.plugin'

export type CombinedPathContent = model.BaseContent<'combined path'> & model.ContainerFields & model.StrokeFields & model.FillFields

export function getModel(ctx: PluginContext): model.Model<CombinedPathContent> {
  const CombinedPathContent = ctx.and(ctx.BaseContent('combined path'), ctx.ContainerFields, ctx.StrokeFields, ctx.FillFields)
  const getGeometries = (content: CombinedPathContent) => {
    return ctx.getGeometriesFromCache(content, () => {
      const lines: core.GeometryLine[] = []
      const result: { points: core.Position[] }[] = []
      const boundings: core.Position[] = []
      content.contents.forEach((c) => {
        if (!c) {
          return
        }
        const r = ctx.getContentModel(c)?.getGeometries?.(c)
        if (r) {
          lines.push(...r.lines)
          if (r.bounding) {
            boundings.push(r.bounding.start, r.bounding.end)
          }
        }
        if (isLineContent(c) || isPolyLineContent(c)) {
          result.push({ points: c.points })
        } else if (isArcContent(c)) {
          result.push({ points: ctx.arcToPolyline(c, c.angleDelta ?? ctx.defaultAngleDelta) })
        } else if (isEllipseArcContent(c)) {
          result.push({ points: ctx.ellipseArcToPolyline(c, c.angleDelta ?? ctx.defaultAngleDelta) })
        }
      })
      ctx.mergePolylinesToPolyline(result)
      const renderingLines = result.map(m => m.points)
      const points = renderingLines.flat()
      return {
        lines,
        bounding: ctx.getPointsBounding(boundings),
        renderingLines,
        regions: ctx.hasFill(content) ? [{
          lines,
          points,
        }] : undefined,
      }
    })
  }
  return {
    type: 'combined path',
    ...ctx.containerModel,
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move: ctx.getContainerMove,
    rotate: ctx.getContainerRotate,
    scale: ctx.getContainerScale,
    explode: ctx.getContainerExplode,
    mirror: ctx.getContainerMirror,
    render(content, renderCtx) {
      const geometries = getGeometries(content)
      const { options } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
      return renderCtx.target.renderGroup(geometries.renderingLines.map(line => {
        return renderCtx.target.renderPolyline(line, options)
      }))
    },
    renderIfSelected: ctx.getContainerRenderIfSelected,
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries,
    propertyPanel(content, update, contents) {
      return {
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, CombinedPathContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
  }
}

export function getCommand(ctx: PluginContext): Command {
  function contentSelectable(content: model.BaseContent, contents: core.Nullable<model.BaseContent>[]) {
    return ctx.contentIsDeletable(content, contents) &&
      (isLineContent(content) || isArcContent(content) || isPolyLineContent(content) || isEllipseArcContent(content))
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="36,93 40,92 43,90 47,88 51,86 55,84 58,81 62,79 65,76 69,73 72,70 75,67 78,64 80,60 83,57 85,54 86,51 88,47 89,44 90,41 90,38 91,36 90,33 90,31 89,28 88,26 87,25 85,23 83,22 81,21 78,20 76,20 73,20 69,20 66,20 63,21 59,22 55,23 52,25 48,27 44,29 40,31 37,34 33,36 30,39 26,42 23,45 20,48 17,51 15,55 12,58 10,61 9,64 36,93" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create combined path',
    execute({ contents, selected, strokeStyleId, fillStyleId }) {
      const newContent: CombinedPathContent = {
        type: 'combined path',
        strokeStyleId,
        fillStyleId,
        contents: contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents)),
      }
      for (let i = contents.length; i >= 0; i--) {
        if (ctx.isSelected([i], selected)) {
          contents[i] = undefined
        }
      }
      contents.push(newContent)
    },
    contentSelectable,
    icon,
  }
}
