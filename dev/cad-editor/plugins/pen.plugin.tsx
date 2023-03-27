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
  function getGeometries(content: Omit<PenContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
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
        point.x += offset.x
        point.y += offset.y
      }
    },
    rotate(content, center, angle) {
      content.points = content.points.map((p) => ctx.rotatePositionByCenter(p, center, -angle))
    },
    mirror(content, line) {
      content.points = content.points.map((p) => ctx.getSymmetryPoint(p, line))
    },
    render(content, { target, transformStrokeWidth, getStrokeColor, contents }) {
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
      const options = {
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content)),
        dashArray: strokeStyleContent.dashArray,
      }
      return target.renderPolyline(content.points, options)
    },
    getGeometries: getGeometries,
    propertyPanel(content, update, contents) {
      return ctx.getStrokeContentPropertyPanel(content, update, contents)
    },
    isValid: (c, p) => ctx.validate(c, PenContent, p),
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds,
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
