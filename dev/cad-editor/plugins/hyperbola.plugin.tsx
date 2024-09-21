import type { PluginContext } from './types'
import type * as core from '../../../src'
import type * as model from '../model'
import type { Command } from '../command'
import type { GeometryLinesContent } from './geometry-lines.plugin'

export type HyperbolaContent = model.BaseContent<'hyperbola'> & model.StrokeFields & core.HyperbolaSegment & model.SegmentCountFields

export function getModel(ctx: PluginContext): model.Model<HyperbolaContent> {
  const HyperbolaContent = ctx.and(ctx.BaseContent('hyperbola'), ctx.StrokeFields, ctx.HyperbolaSegment, ctx.SegmentCountFields)
  const geometriesCache = new ctx.WeakmapValuesCache<Omit<HyperbolaContent, "type">, model.BaseContent, model.Geometries<{ points: core.Position[] }>>()
  function getHyperbolaGeometries(content: Omit<HyperbolaContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(ctx.getStrokeRefIds(content), contents, [content]))
    return geometriesCache.get(content, refs, () => {
      const points = ctx.getHyperbolaPoints(content, content.segmentCount ?? ctx.defaultSegmentCount)
      const lines: core.GeometryLine[] = [{ type: 'hyperbola curve', curve: content }]
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
    rotate(content, center, angle) {
      ctx.rotateHyperbola(content, center, angle)
    },
    scale(content, center, sx, sy, contents) {
      const lines = getHyperbolaGeometries(content, contents).lines
      ctx.scaleGeometryLines(lines, center, sx, sy)
    },
    skew(content, center, sx, sy, contents) {
      const lines = getHyperbolaGeometries(content, contents).lines
      ctx.skewGeometryLines(lines, center, sx, sy)
    },
    mirror(content, line, angle) {
      ctx.mirrorHyperbola(content, line, angle)
    },
    break(content, intersectionPoints, contents) {
      const lines = getHyperbolaGeometries(content, contents).lines
      return ctx.breakGeometryLines(lines, intersectionPoints).map(lines => ({ ...content, type: 'geometry lines', lines }) as GeometryLinesContent)
    },
    offset(content, point, distance, contents) {
      if (!distance) {
        distance = Math.min(...getHyperbolaGeometries(content, contents).lines.map(line => ctx.getPointAndGeometryLineMinimumDistance(point, line)))
      }
      return ctx.getParallelHyperbolaSegmentsByDistance(content, distance)[ctx.pointSideToIndex(ctx.getPointSideOfHyperbolaSegment(point, content))]
    },
    join(content, target, contents) {
      const line2 = ctx.getContentModel(target)?.getGeometries?.(target, contents)?.lines
      if (!line2) return
      const lines = getHyperbolaGeometries(content, contents).lines
      const newLines = ctx.mergeGeometryLines(lines, line2)
      if (!newLines) return
      return { ...content, type: 'geometry lines', lines: newLines } as GeometryLinesContent
    },
    extend(content, point) {
      const t = ctx.getHyperbolaParamAtPoint(content, point)
      if (ctx.isBefore(t, content.t1, content.t2)) {
        content.t1 = t
      } else {
        content.t2 = t
      }
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

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="100,93 99,92 99,92 98,91 97,90 96,89 96,88 95,87 94,86 93,86 93,85 92,84 91,83 91,82 90,81 89,80 89,79 88,79 87,78 87,77 86,76 85,75 85,74 84,73 84,73 83,72 83,71 82,70 81,69 81,68 80,67 80,66 79,66 79,65 79,64 78,63 78,62 77,61 77,60 77,60 76,59 76,58 76,57 76,56 76,55 75,54 75,53 75,53 75,52 75,51 75,50 75,49 75,48 75,47 75,47 75,46 76,45 76,44 76,43 76,42 76,41 77,40 77,40 77,39 78,38 78,37 79,36 79,35 79,34 80,34 80,33 81,32 81,31 82,30 83,29 83,28 84,27 84,27 85,26 85,25 86,24 87,23 87,22 88,21 89,21 89,20 90,19 91,18 91,17 92,16 93,15 93,14 94,14 95,13 96,12 96,11 97,10 98,9 99,8 99,8 100,7" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="0,93 1,92 1,92 2,91 3,90 4,89 4,88 5,87 6,86 7,86 7,85 8,84 9,83 9,82 10,81 11,80 11,79 12,79 13,78 13,77 14,76 15,75 15,74 16,73 16,73 17,72 17,71 18,70 19,69 19,68 20,67 20,66 21,66 21,65 21,64 22,63 22,62 23,61 23,60 23,60 24,59 24,58 24,57 24,56 24,55 25,54 25,53 25,53 25,52 25,51 25,50 25,49 25,48 25,47 25,47 25,46 24,45 24,44 24,43 24,42 24,41 23,40 23,40 23,39 22,38 22,37 21,36 21,35 21,34 20,34 20,33 19,32 19,31 18,30 17,29 17,28 16,27 16,27 15,26 15,25 14,24 13,23 13,22 12,21 11,21 11,20 10,19 9,18 9,17 8,16 7,15 7,14 6,14 5,13 4,12 4,11 3,10 2,9 1,8 1,8 0,7" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="100,0 0,100" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="0,0 100,100" strokeWidth="5" strokeDasharray="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create hyperbola',
    icon,
    useCommand({ onEnd, type, strokeStyleId }) {
      const [content, setContent] = React.useState<HyperbolaContent>()
      const [status, setStatus] = React.useState<'position' | 'angle' | 't1' | 't2'>('position')
      const reset = () => {
        setContent(undefined)
        setStatus('position')
      }
      const assistentContents: HyperbolaContent[] = []
      if (content) {
        assistentContents.push(content)
      }
      return {
        onStart() {
          if (type !== 'create hyperbola') return
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
          if (type !== 'create hyperbola') return
          if (!content) {
            setContent({
              type: 'hyperbola',
              x: p.x,
              y: p.y,
              a: 100,
              b: 100,
              t1: -2,
              t2: 2,
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
            // x = b t
            // y = a((t^2 + 1)^0.5 - 1)
            const t = x / content.b
            const a = y / (Math.sqrt(t ** 2 + 1) - 1)
            setContent({
              ...content,
              a,
              t1: t,
            })
          } else if (status === 't2') {
            setContent({
              ...content,
              t2: ctx.minimumBy(ctx.getPerpendicularParamsToHyperbola(p, content), t => ctx.getTwoPointsDistanceSquare(p, ctx.getHyperbolaPointAtParam(content, t))),
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
