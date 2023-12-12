import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { CoordinateAxisContent, isCoordinateAxisContent } from './coordinate-axis.plugin'

export type EquationContent = model.BaseContent<'equation'> & model.StrokeFields & model.SegmentCountFields & {
  axisId: number | model.BaseContent
  dependentVariable: 'x' | 'y'
  expression: string
}

export function getModel(ctx: PluginContext): model.Model<EquationContent> {
  const EquationContent = ctx.and(ctx.BaseContent('equation'), ctx.StrokeFields, ctx.SegmentCountFields, {
    axisId: ctx.or(ctx.number, ctx.Content),
    dependentVariable: ctx.or('x', 'y'),
    expression: ctx.string,
  })
  const equationCache = new ctx.WeakmapCache2<Omit<EquationContent, 'type'>, Omit<CoordinateAxisContent, "type">, model.Geometries<{ points: core.Position[] }>>()
  function getGeometriesFromCache(content: Omit<EquationContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const axis = ctx.getReference(content.axisId, contents, isCoordinateAxisContent)
    if (axis) {
      return equationCache.get(content, axis, () => {
        if (content.expression) {
          try {
            const expression = ctx.parseExpression(ctx.tokenizeExpression(content.expression))
            const points: core.Position[] = []
            const segmentCount = content.segmentCount ?? ctx.defaultSegmentCount
            if (content.dependentVariable === 'y') {
              const step = (axis.xMax - axis.xMin) / segmentCount
              for (let x = axis.xMin; x <= axis.xMax; x += step) {
                const y = ctx.evaluateExpression(expression, {
                  Math,
                  x,
                })
                if (typeof y === 'number' && !isNaN(y)) {
                  points.push({ x: x + axis.x, y: y * (axis.flipY ? -1 : 1) + axis.y })
                }
              }
            } else {
              const step = (axis.yMax - axis.yMin) / segmentCount
              for (let y = axis.yMin; y <= axis.yMax; y += step) {
                const x = ctx.evaluateExpression(expression, {
                  Math,
                  y,
                })
                if (typeof x === 'number' && !isNaN(x)) {
                  points.push({ x: x + axis.x, y: y * (axis.flipY ? -1 : 1) + axis.y })
                }
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
      })
    }
    return { lines: [], points: [], renderingLines: [] }
  }
  const React = ctx.React
  return {
    type: 'equation',
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
        dependentVariable: <ctx.EnumEditor value={content.dependentVariable} enums={['x', 'y']} setValue={(v) => update(c => { if (isEquationContent(c)) { c.dependentVariable = v } })} />,
        expression: <ctx.ExpressionEditor suggestionSources={ctx.math} validate={ctx.validateExpression} value={content.expression} setValue={(v) => update(c => { if (isEquationContent(c)) { c.expression = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getSegmentCountContentPropertyPanel(content, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, EquationContent, p),
    getRefIds: (content) => [...ctx.getStrokeRefIds(content), ...(typeof content.axisId === 'number' ? [content.axisId] : [])],
    updateRefId(content, update) {
      const newAxisId = update(content.axisId)
      if (newAxisId !== undefined) {
        content.axisId = newAxisId
      }
      ctx.updateStrokeRefIds(content, update)
    },
  }
}

export function isEquationContent(content: model.BaseContent): content is EquationContent {
  return content.type === 'equation'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="7,93 88,93" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline><polyline points="7,12 7,93" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="97,93 68,101 68,85" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline><polyline points="7,3 15,32 1,32" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline>
      <polyline points="7,93 8,85 9,81 10,78 11,76 12,74 12,72 13,71 14,69 15,68 16,66 17,65 18,64 19,62 20,61 21,60 21,59 22,58 23,57 24,56 25,55 26,54 27,53 28,52 29,51 29,51 30,50 31,49 32,48 33,47 34,47 35,46 36,45 37,44 38,44 38,43 39,42 40,41 41,41 42,40 43,39 44,39 45,38 46,37 47,37 47,36 48,35 49,35 50,34 51,34 52,33 53,32 54,32 55,31 56,31 56,30 57,30 58,29 59,28 60,28 61,27 62,27 63,26 64,26 65,25 65,25 66,24 67,24 68,23 69,23 70,22 71,22 72,21 73,21 74,20 74,20 75,19 76,19 77,18 78,18 79,17 80,17 81,16 82,16 83,15 84,15 84,14 85,14 86,13 87,13 88,13 89,12 90,12 91,11 92,11 93,10 93,10 94,9 95,9 96,9" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create equation',
    icon,
    useCommand({ onEnd, type, selected }) {
      const [dependentVariable, setDependentVariable] = React.useState<'x' | 'y'>('y')
      const enabled = type === 'create equation'
      let message = ''
      if (enabled) {
        message = dependentVariable === 'x' ? 'input f(y)' : 'input f(x)'
      }
      const { input, setCursorPosition, clearText, setInputPosition, resetInput } = ctx.useCursorInput(message, enabled ? (e, text) => {
        if (e.key === 'Enter') {
          onEnd({
            updateContents(contents) {
              contents.push({
                type: 'equation',
                axisId: selected[0].path[0],
                dependentVariable: dependentVariable,
                expression: text,
              } as EquationContent)
            }
          })
          clearText()
        }
      } : undefined)

      const reset = () => {
        resetInput()
        setDependentVariable('y')
      }

      return {
        input,
        onStart() {
          //
        },
        onMove(p, viewportPosition) {
          setInputPosition(viewportPosition || p)
          setCursorPosition(p)
        },
        subcommand: enabled
          ? (
            <span>
              <button onClick={() => setDependentVariable(dependentVariable === 'x' ? 'y' : 'x')} style={{ position: 'relative' }}>f({dependentVariable})</button>
            </span>
          )
          : undefined,
        reset,
      }
    },
    contentSelectable: isCoordinateAxisContent,
    selectCount: 1,
  }
}
