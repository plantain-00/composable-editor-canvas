import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { isCoordinateAxisContent } from './coordinate-axis.plugin'

export type ParametricEquationContent = model.BaseContent<'parametric equation'> & model.StrokeFields & model.SegmentCountFields & {
  axisId: model.ContentRef
  xExpression: string
  yExpression: string
  min: number
  max: number
}

export function getModel(ctx: PluginContext): model.Model<ParametricEquationContent> {
  const ParametricEquationContent = ctx.and(ctx.BaseContent('parametric equation'), ctx.StrokeFields, ctx.SegmentCountFields, {
    axisId: ctx.ContentRef,
    xExpression: ctx.string,
    yExpression: ctx.string,
    min: ctx.number,
    max: ctx.number,
  })
  const getRefIds = (content: Omit<ParametricEquationContent, "type">) => [content.strokeStyleId, content.axisId]
  const equationCache = new ctx.WeakmapValuesCache<Omit<ParametricEquationContent, 'type'>, model.BaseContent, model.Geometries<{ points: core.Position[] }>>()
  function getGeometriesFromCache(content: Omit<ParametricEquationContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents))
    return equationCache.get(content, refs, () => {
      const axis = ctx.getReference(content.axisId, contents, isCoordinateAxisContent)
      if (axis) {
        if (content.xExpression && content.yExpression) {
          try {
            const xExpression = ctx.parseExpression(ctx.tokenizeExpression(content.xExpression))
            const yExpression = ctx.parseExpression(ctx.tokenizeExpression(content.yExpression))
            const points: core.Position[] = []
            const segmentCount = content.segmentCount ?? ctx.defaultSegmentCount
            const step = (content.max - content.min) / segmentCount
            for (let t = content.min; t <= content.max; t += step) {
              const x = ctx.evaluateExpression(xExpression, { Math, t })
              const y = ctx.evaluateExpression(yExpression, { Math, t })
              if (typeof x === 'number' && !isNaN(x) && typeof y === 'number' && !isNaN(y)) {
                points.push({ x: x + axis.x, y: y * (axis.flipY ? -1 : 1) + axis.y })
              }
            }
            const lines = Array.from(ctx.iteratePolylineLines(points))
            return {
              points,
              lines,
              bounding: ctx.getPointsBounding(points),
              renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
            }
          } catch (e) {
            console.info(e)
          }
        }
        return { lines: [], points: [], renderingLines: [] }
      }
      return { lines: [], points: [], renderingLines: [] }
    })
  }
  const React = ctx.React
  return {
    type: 'parametric equation',
    ...ctx.strokeModel,
    ...ctx.segmentCountModel,
    render(content, renderCtx) {
      const { options, contents, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const { points } = getGeometriesFromCache(content, contents)
      return target.renderPolyline(points, options)
    },
    getGeometries: getGeometriesFromCache,
    propertyPanel(content, update, contents) {
      return {
        xExpression: <ctx.ExpressionEditor suggestionSources={ctx.math} validate={ctx.validateExpression} value={content.xExpression} setValue={(v) => update(c => { if (isParametricEquationContent(c)) { c.xExpression = v } })} />,
        yExpression: <ctx.ExpressionEditor suggestionSources={ctx.math} validate={ctx.validateExpression} value={content.yExpression} setValue={(v) => update(c => { if (isParametricEquationContent(c)) { c.yExpression = v } })} />,
        min: <ctx.NumberEditor value={content.min} setValue={(v) => update(c => { if (isParametricEquationContent(c)) { c.min = v } })} />,
        max: <ctx.NumberEditor value={content.max} setValue={(v) => update(c => { if (isParametricEquationContent(c)) { c.max = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getSegmentCountContentPropertyPanel(content, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, ParametricEquationContent, p),
    getRefIds,
    updateRefId(content, update) {
      const newAxisId = update(content.axisId)
      if (newAxisId !== undefined) {
        content.axisId = newAxisId
      }
      ctx.updateStrokeRefIds(content, update)
    },
  }
}

export function isParametricEquationContent(content: model.BaseContent): content is ParametricEquationContent {
  return content.type === 'parametric equation'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="7,93 88,93" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline><polyline points="7,12 7,93" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="97,93 68,101 68,85" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline><polyline points="7,3 15,32 1,32" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline>
      <polyline points="76,49 76,47 76,46 76,44 76,43 75,41 75,40 74,38 73,37 73,35 72,34 71,33 70,32 69,31 67,29 66,29 65,28 64,27 62,26 61,26 59,25 58,25 56,24 55,24 53,24 51,24 50,24 48,24 47,24 45,25 44,25 42,26 41,26 39,27 38,28 37,29 36,29 34,31 33,32 32,33 31,34 30,35 30,37 29,38 28,40 28,41 27,43 27,44 27,46 27,47 26,49 27,50 27,52 27,53 27,55 28,56 28,58 29,59 30,61 30,62 31,63 32,65 33,66 34,67 36,68 37,69 38,70 39,71 41,71 42,72 44,73 45,73 47,73 48,74 50,74 51,74 53,74 55,74 56,73 58,73 59,73 61,72 62,71 64,71 65,70 66,69 67,68 69,67 70,66 71,65 72,63 73,62 73,61 74,59 75,58 75,56 76,55 76,53 76,52 76,50 76,49" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create parametric equation',
    icon,
    execute({ contents, selected }) {
      contents.push({
        type: 'parametric equation',
        axisId: selected[0][0],
        min: 0,
        max: Math.PI * 2,
        xExpression: '25 + 25 * Math.cos(t)',
        yExpression: '25 + 25 * Math.sin(t)',
      } as ParametricEquationContent)
    },
    contentSelectable: isCoordinateAxisContent,
    selectCount: 1,
  }
}
