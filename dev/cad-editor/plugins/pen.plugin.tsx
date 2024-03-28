import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type PenContent = model.BaseContent<'pen'> & model.StrokeFields & {
  points: core.Position[]
}

export function getModel(ctx: PluginContext): model.Model<PenContent> {
  const PenContent = ctx.and(ctx.BaseContent('pen'), ctx.StrokeFields, {
    points: ctx.minItems(2, [ctx.Position]),
  })
  const getRefIds = (content: Omit<PenContent, "type">): model.RefId[] => ctx.getStrokeRefIds(content)
  function getGeometries(content: Omit<PenContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]))
    return ctx.getGeometriesFromCache(content, refs, () => {
      const lines = Array.from(ctx.iteratePolylineLines(content.points))
      return {
        lines,
        bounding: ctx.getPointsBounding(content.points),
        renderingLines: ctx.dashedPolylineToLines(content.points, content.dashArray),
      }
    })
  }
  return {
    type: 'pen',
    ...ctx.strokeModel,
    move(content, offset) {
      for (const point of content.points) {
        ctx.movePoint(point, offset)
      }
    },
    rotate(content, center, angle) {
      for (const point of content.points) {
        ctx.rotatePoint(point, center, angle)
      }
    },
    scale(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.scalePoint(point, center, sx, sy)
      }
    },
    skew(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.skewPoint(point, center, sx, sy)
      }
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line)
      }
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      return target.renderPolyline(content.points, options)
    },
    getGeometries: getGeometries,
    propertyPanel(content, update, contents) {
      return ctx.getStrokeContentPropertyPanel(content, update, contents)
    },
    isValid: (c, p) => ctx.validate(c, PenContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    deleteRefId: ctx.deleteStrokeRefIds,
    reverse: (content) => ({
      ...content,
      points: content.points.slice().reverse(),
    }),
  }
}

export function isPenContent(content: model.BaseContent): content is PenContent {
  return content.type === 'pen'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" >
      <path d="m199.04 672.64 193.984 112 224-387.968-193.92-112-224 388.032zm-23.872 60.16 32.896 148.288 144.896-45.696L175.168 732.8zM455.04 229.248l193.92 112 56.704-98.112-193.984-112-56.64 98.112zM104.32 708.8l384-665.024 304.768 175.936L409.152 884.8h.064l-248.448 78.336L104.32 708.8zm384 254.272v-64h448v64h-448z" fill="currentColor"></path>
    </svg>
  )
  return {
    name: 'create pen',
    useCommand({ onEnd, type, strokeStyleId }) {
      const { reset, points, onClick, onMove } = ctx.usePenClickCreate(
        type === 'create pen',
        () => onEnd({
          updateContents: contents => contents.push({ points, strokeStyleId, type: 'pen' } as PenContent),
        }),
      )
      const assistentContents: PenContent[] = []
      if (points.length > 1) {
        assistentContents.push({ points, strokeStyleId, type: 'pen' })
      }
      return {
        onStart: onClick,
        onMove: onMove,
        assistentContents,
        reset,
      }
    },
    selectCount: 0,
    icon,
  }
}
