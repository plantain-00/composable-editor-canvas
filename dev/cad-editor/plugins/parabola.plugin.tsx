import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type ParabolaContent = model.BaseContent<'parabola'> & model.StrokeFields & core.ParabolaSegment & model.SegmentCountFields

export function getModel(ctx: PluginContext): model.Model<ParabolaContent> {
  const ParabolaContent = ctx.and(ctx.BaseContent('parabola'), ctx.StrokeFields, ctx.ParabolaSegment, ctx.SegmentCountFields)
  const getRefIds = (content: Omit<ParabolaContent, "type">): model.RefId[] => ctx.getStrokeRefIds(content)
  return {
    type: 'parabola',
    ...ctx.strokeModel,
    move(content, offset) {
      ctx.movePoint(content, offset)
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const segmentCount = content.segmentCount ?? ctx.defaultSegmentCount
      const rate = (content.t2 - content.t1) / segmentCount
      const points: core.Position[] = []
      const matrix = ctx.getCoordinateMatrix2D(content, ctx.angleToRadian(content.angle - 90))
      for (let i = 0; i <= segmentCount; i++) {
        const x = content.t1 + i * rate
        const y = 2 * content.p * x ** 2
        const vec = ctx.getCoordinateVec2D({ x, y })
        const p = ctx.matrix.multiplyVec(matrix, vec)
        points.push({ x: p[0], y: p[1] })
      }
      return target.renderPolyline(points, options)
    },
    isValid: (c, p) => ctx.validate(c, ParabolaContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    deleteRefId: ctx.deleteStrokeRefIds,
  }
}

export function isParabolaContent(content: model.BaseContent): content is ParabolaContent {
  return content.type === 'parabola'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="52,5 97,50 52,96 6,50" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'create parabola',
    icon,
    useCommand({ onEnd, type, strokeStyleId }) {
      const [content, setContent] = React.useState<ParabolaContent>()
      const [status, setStatus] = React.useState<'position' | 'angle' | 't1' | 't2'>('position')
      const reset = () => {
        setContent(undefined)
        setStatus('position')
      }
      const assistentContents: ParabolaContent[] = []
      if (content) {
        assistentContents.push(content)
      }
      return {
        onStart() {
          if (type !== 'create parabola') return
          if (status === 'position') {
            setStatus('angle')
          } else if (status === 'angle') {
            setStatus('t1')
          } else if (status === 't1') {
            setStatus('t2')
          } else if (status === 't2') {
            onEnd({
              updateContents: (contents) => contents.push(content),
            })
            reset()
          }
        },
        onMove(p) {
          if (type !== 'create parabola') return
          if (!content) {
            setContent({
              type: 'parabola',
              x: p.x,
              y: p.y,
              p: 0.01,
              t1: -100,
              t2: 100,
              angle: -90,
              strokeStyleId,
            })
          } else if (status === 'position') {
            setContent({
              ...content,
              x: p.x,
              y: p.y,
            })
          } else if (status === 'angle') {
            setContent({
              ...content,
              angle: ctx.radianToAngle(ctx.getTwoPointsRadian(p, content)),
            })
          } else if (status === 't1') {
            const x = ctx.getPerpendicularParamToLine2D(p, content, ctx.angleToRadian(content.angle - 90))
            const y = ctx.getPerpendicularParamToLine2D(p, content, ctx.angleToRadian(content.angle))
            setContent({
              ...content,
              t1: x,
              p: Math.abs(y) / x / x / 2,
            })
          } else if (status === 't2') {
            setContent({
              ...content,
              t2: ctx.getPerpendicularParamToLine2D(p, content, ctx.angleToRadian(content.angle - 90)),
            })
          }
        },
        assistentContents,
        reset,
      }
    },
    selectCount: 0,
  }
}
