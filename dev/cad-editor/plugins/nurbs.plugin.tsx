import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type NurbsContent = model.BaseContent<'nurbs'> & model.StrokeFields & model.FillFields & model.SegmentCountFields & core.Nurbs

export function getModel(ctx: PluginContext): model.Model<NurbsContent>[] {
  const NurbsContent = ctx.and(ctx.BaseContent('nurbs'), ctx.StrokeFields, ctx.FillFields, ctx.SegmentCountFields, ctx.Nurbs)
  const getRefIds = (content: Omit<NurbsContent, "type">) => [content.strokeStyleId, content.fillStyleId]
  const geometriesCache = new ctx.WeakmapValuesCache<Omit<NurbsContent, "type">, model.BaseContent, model.Geometries<{ points: core.Position[] }>>()
  function getNurbsGeometries(content: Omit<NurbsContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]))
    return geometriesCache.get(content, refs, () => {
      let points: core.Position[]
      const nurbsSegmentCount = content.segmentCount ?? ctx.defaultSegmentCount
      let lines: core.GeometryLine[]
      if (content.points.length > 2) {
        if (!content.weights && !content.knots && (content.degree === 2 || content.points.length === 3)) {
          lines = ctx.getQuadraticSplineCurves(content.points).map(c => ({ type: 'quadratic curve' as const, curve: c }))
          points = ctx.getGeometryLinesPoints(lines, nurbsSegmentCount)
        } else if (!content.weights && !content.knots && content.degree === 3) {
          lines = ctx.getBezierSplineCurves(content.points, false).map(c => ({ type: 'bezier curve' as const, curve: c }))
          points = ctx.getGeometryLinesPoints(lines, nurbsSegmentCount)
        } else if (!content.weights && !content.knots && content.degree === 1) {
          points = content.points
          lines = Array.from(ctx.iteratePolylineLines(points))
        } else {
          lines = [{
            type: 'nurbs curve',
            curve: {
              degree: content.degree,
              points: content.points,
              knots: content.knots || ctx.getDefaultNurbsKnots(content.points.length, content.degree),
              weights: content.weights,
            },
          }]
          points = ctx.getGeometryLinesPoints(lines, nurbsSegmentCount)
        }
      } else {
        points = content.points
        lines = Array.from(ctx.iteratePolylineLines(points))
      }
      return {
        lines,
        points,
        bounding: ctx.getGeometryLinesBounding(lines),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points: content.points,
          },
        ] : undefined,
      }
    })
  }
  const React = ctx.React
  const nurbsModel: model.Model<NurbsContent> = {
    type: 'nurbs',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    ...ctx.segmentCountModel,
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
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line)
      }
    },
    break(content, intersectionPoints, contents) {
      const lines = getNurbsGeometries(content, contents).lines
      const result = ctx.breakGeometryLines(lines, intersectionPoints)
      return result.map(r => r.map(t => ctx.geometryLineToContent(t))).flat()
    },
    offset(content, point, distance, contents) {
      const lines = getNurbsGeometries(content, contents).lines
      return ctx.trimGeometryLines(ctx.getParallelGeometryLinesByDistancePoint(point, lines, distance)).map(r => ctx.geometryLineToContent(r))
    },
    render(content, renderCtx) {
      const { points } = getNurbsGeometries(content, renderCtx.contents)
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
      return target.renderPolyline(points, options)
    },
    renderIfSelected(content, { color, target, strokeWidth }) {
      return target.renderPolyline(content.points, { strokeColor: color, dashArray: [4], strokeWidth })
    },
    getOperatorRenderPosition(content) {
      return content.points[0]
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isNurbsContent, false, true) }))
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => content.points.map((p) => ({ ...p, type: 'endpoint' as const })))
    },
    getGeometries: getNurbsGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        points: <ctx.ArrayEditor
          inline
          {...ctx.getArrayEditorProps<core.Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isNurbsContent(c)) { v(c); if (c.points.length !== content.points.length) { c.knots = undefined; c.weights = undefined } } }))}
          items={content.points.map((f, i) => <ctx.ObjectEditor
            inline
            properties={{
              from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isNurbsContent(c)) { c.points[i].x = p.x, c.points[i].y = p.y } }))}>canvas</ctx.Button>,
              x: <ctx.NumberEditor value={f.x} setValue={(v) => update(c => { if (isNurbsContent(c)) { c.points[i].x = v } })} />,
              y: <ctx.NumberEditor value={f.y} setValue={(v) => update(c => { if (isNurbsContent(c)) { c.points[i].y = v } })} />,
            }}
          />)}
        />,
        degree: <ctx.NumberEditor value={content.degree} setValue={(v) => update(c => { if (isNurbsContent(c) && Number.isInteger(v) && v >= 1) { c.degree = v; c.knots = undefined } })} />,
        knots: [
          <ctx.BooleanEditor value={content.knots !== undefined} setValue={(v) => update(c => { if (isNurbsContent(c)) { c.knots = v ? ctx.getDefaultNurbsKnots(content.points.length, content.degree) : undefined } })} />,
          content.knots !== undefined ? <ctx.ArrayEditor
            inline
            {...ctx.getArrayEditorProps<number, typeof content>(v => v.knots || [], () => content.knots && content.knots.length > 0 ? content.knots[content.knots.length - 1] + 1 : 0, (v) => update(c => { if (isNurbsContent(c)) { v(c) } }))}
            items={content.knots.map((f, i) => <ctx.NumberEditor value={f} setValue={(v) => update(c => { if (isNurbsContent(c) && c.knots) { c.knots[i] = v } })} />)}
          /> : undefined
        ],
        weights: [
          <ctx.BooleanEditor value={content.weights !== undefined} setValue={(v) => update(c => { if (isNurbsContent(c)) { c.weights = v ? ctx.getDefaultWeights(content.points.length) : undefined } })} />,
          content.weights !== undefined ? <ctx.ArrayEditor
            inline
            {...ctx.getArrayEditorProps<number, typeof content>(v => v.weights || [], 1, (v) => update(c => { if (isNurbsContent(c)) { v(c) } }))}
            items={content.weights.map((f, i) => <ctx.NumberEditor value={f} setValue={(v) => update(c => { if (isNurbsContent(c) && c.weights) { c.weights[i] = v } })} />)}
          /> : undefined
        ],
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
        ...ctx.getSegmentCountContentPropertyPanel(content, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, NurbsContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    reverse: (content) => ctx.reverseNurbs(content),
  }
  return [
    nurbsModel,
  ]
}

export function isNurbsContent(content: model.BaseContent): content is NurbsContent {
  return content.type === 'nurbs'
}

export function getCommand(ctx: PluginContext): Command[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon1 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="13" cy="22" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="28" cy="79" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="63" cy="22" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="85" cy="80" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <polyline points="13,22 14,24 14,26 15,29 15,31 16,33 17,34 17,36 18,38 18,40 19,41 20,43 20,44 21,46 22,47 22,49 23,50 23,51 24,52 25,53 25,54 26,55 27,56 27,56 28,57 29,58 29,58 30,59 31,59 31,59 32,60 33,60 33,60 34,60 35,60 35,60 36,60 37,60 37,59 38,59 39,58 39,58 40,57 41,57 41,56 42,55 43,55 43,54 44,53 45,52 46,51 46,49 47,48 48,47 48,46 49,46 50,45 50,44 51,44 52,43 53,43 53,42 54,42 55,42 56,41 56,41 57,41 58,41 59,41 59,41 60,42 61,42 62,42 63,43 63,43 64,44 65,44 66,45 67,46 67,47 68,47 69,48 70,49 71,51 71,52 72,53 73,54 74,56 75,57 76,59 76,60 77,62 78,64 79,65 80,67 81,69 82,71 82,73 83,75 84,78 85,80" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  const nurbsCommand: Command = {
    name: 'create nurbs',
    type: [
      { name: 'nurbs', icon: icon1 },
    ],
    useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === 'nurbs',
        (c) => onEnd({
          updateContents: (contents) => contents.push({ points: c, type: 'nurbs', degree: 2, strokeStyleId, fillStyleId } as NurbsContent)
        }),
      )
      const assistentContents: (NurbsContent | LineContent)[] = []
      if (line) {
        assistentContents.push(
          { points: line, type: 'nurbs', strokeStyleId, fillStyleId, degree: 2 },
          { points: line, type: 'polyline', dashArray: [4 / scale] }
        )
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset,
      }
    },
    selectCount: 0,
  }
  return [
    nurbsCommand,
  ]
}
