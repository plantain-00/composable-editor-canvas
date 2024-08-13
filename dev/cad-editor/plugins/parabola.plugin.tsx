import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type ParabolaContent = model.BaseContent<'parabola'> & model.StrokeFields & core.ParabolaSegment & model.SegmentCountFields

export function getModel(ctx: PluginContext): model.Model<ParabolaContent> {
  const ParabolaContent = ctx.and(ctx.BaseContent('parabola'), ctx.StrokeFields, ctx.ParabolaSegment, ctx.SegmentCountFields)
  const geometriesCache = new ctx.WeakmapValuesCache<Omit<ParabolaContent, "type">, model.BaseContent, model.Geometries<{ points: core.Position[] }>>()
  function getParabolaGeometries(content: Omit<ParabolaContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(ctx.getStrokeRefIds(content), contents, [content]))
    return geometriesCache.get(content, refs, () => {
      const segmentCount = content.segmentCount ?? ctx.defaultSegmentCount
      const rate = (content.t2 - content.t1) / segmentCount
      const points: core.Position[] = []
      const matrix = ctx.getCoordinateMatrix2D(content, ctx.getParabolaXAxisRadian(content))
      for (let i = 0; i <= segmentCount; i++) {
        const vec = ctx.getCoordinateVec2D(ctx.getParabolaCoordinatePointAtParam(content, content.t1 + i * rate))
        const p = ctx.matrix.multiplyVec(matrix, vec)
        points.push(ctx.vec2ToPosition(ctx.slice2(p)))
      }
      const lines: core.GeometryLine[] = [
        // { type: 'parabola curve', curve: content },
      ]
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
    type: 'parabola',
    ...ctx.strokeModel,
    move(content, offset) {
      ctx.movePoint(content, offset)
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const { points } = getParabolaGeometries(content, renderCtx.contents)
      return target.renderPolyline(points, options)
    },
    getGeometries: getParabolaGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isParabolaContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isParabolaContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isParabolaContent(c)) { c.y = v } })} />,
        p: <ctx.NumberEditor value={content.p} setValue={(v) => update(c => { if (isParabolaContent(c) && v > 0) { c.p = v } })} />,
        t1: <ctx.NumberEditor value={content.t1} setValue={(v) => update(c => { if (isParabolaContent(c)) { c.t1 = v } })} />,
        t2: <ctx.NumberEditor value={content.t2} setValue={(v) => update(c => { if (isParabolaContent(c)) { c.t2 = v } })} />,
        angle: <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isParabolaContent(c)) { c.angle = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getSegmentCountContentPropertyPanel(content, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, ParabolaContent, p),
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    deleteRefId: ctx.deleteStrokeRefIds,
  }
}

export function isParabolaContent(content: model.BaseContent): content is ParabolaContent {
  return content.type === 'parabola'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="99,3 98,7 97,10 96,14 95,18 94,21 93,25 92,28 91,31 90,34 89,38 88,41 87,44 86,46 85,49 84,52 83,55 82,57 81,60 80,62 79,64 78,67 77,69 76,71 75,73 75,75 74,77 73,79 72,80 71,82 70,84 69,85 68,87 67,88 66,89 65,90 64,91 63,93 62,93 61,94 60,95 59,96 58,97 57,97 56,98 55,98 54,98 53,99 52,99 51,99 50,99 49,99 48,99 47,99 46,98 45,98 44,98 43,97 42,97 41,96 40,95 39,94 38,93 37,93 36,91 35,90 34,89 33,88 32,87 31,85 30,84 29,82 28,80 27,79 26,77 26,75 25,73 24,71 23,69 22,67 21,64 20,62 19,60 18,57 17,55 16,52 15,49 14,46 13,44 12,41 11,38 10,34 9,31 8,28 7,25 6,21 5,18 4,14 3,10 2,7 1,3" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
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
            const x = ctx.getPerpendicularParamToLine2D(p, content, ctx.getParabolaXAxisRadian(content))
            const y = ctx.getPerpendicularParamToLine2D(p, content, ctx.angleToRadian(content.angle))
            setContent({
              ...content,
              t1: x,
              p: Math.abs(y) / x / x / 2,
            })
          } else if (status === 't2') {
            setContent({
              ...content,
              t2: ctx.minimumBy(ctx.getPerpendicularParamsToParabola(p, content), t => ctx.getTwoPointsDistanceSquare(p, ctx.getParabolaPointAtParam(content, t))),
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
