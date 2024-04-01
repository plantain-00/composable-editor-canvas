import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type GeometryLinesContent = model.BaseContent<'geometry lines'> & model.StrokeFields & model.FillFields & {
  lines: core.GeometryLine[]
}

export function getModel(ctx: PluginContext): model.Model<GeometryLinesContent> {
  const GeometryLinesContent = ctx.and(ctx.BaseContent('geometry lines'), ctx.StrokeFields, ctx.FillFields, {
    lines: [ctx.GeometryLine],
  })
  const refGeometriesCache = new ctx.WeakmapValuesCache<object, model.BaseContent, model.Geometries<{ points: core.Position[], rays: core.Ray[] }>>()
  function getGeometryLinesGeometries(content: Omit<GeometryLinesContent, "type">) {
    return refGeometriesCache.get(content, [], () => {
      const points = ctx.getGeometryLinesPoints(content.lines)
      const rays: core.Ray[] = []
      for (const line of content.lines) {
        if (!Array.isArray(line) && line.type === 'ray') {
          rays.push(line.line)
        }
      }
      const geometries = {
        lines: content.lines,
        points,
        rays,
        bounding: ctx.getGeometryLinesBounding(content.lines),
        renderingLines: rays.length > 0 ? [] : ctx.dashedPolylineToLines(points, content.dashArray),
        region: rays.length > 0 ? [] : undefined,
      }
      if (ctx.hasFill(content)) {
        return {
          ...geometries,
          lines: [],
          regions: [{
            lines: geometries.lines,
            points,
          }],
          renderingLines: [],
        }
      }
      return geometries
    })
  }
  return {
    type: 'geometry lines',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      for (const line of content.lines) {
        ctx.moveGeometryLine(line, offset)
      }
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
      const { points, rays } = getGeometryLinesGeometries(content)
      return target.renderGroup([
        target.renderPath([points], options),
        ...rays.map(r => target.renderRay(r.x, r.y, r.angle, { ...options, bidirectional: r.bidirectional }),)
      ])
    },
    getGeometries: getGeometryLinesGeometries,
    propertyPanel(content, update, contents) {
      return {
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isValid: (c, p) => ctx.validate(c, GeometryLinesContent, p),
  }
}

export function isGeometryLinesContent(content: model.BaseContent): content is GeometryLinesContent {
  return content.type === 'geometry lines'
}

export function getCommand(ctx: PluginContext): Command[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  return [
    {
      name: 'create geometry lines',
      useCommand({ type, onEnd, width, height }) {
        const [json, setJson] = React.useState('')
        const reset = () => {
          setJson('')
        }
        return {
          reset,
          subcommand: type === 'create geometry lines'
            ? (
              <span style={{ position: 'relative' }}>
                <ctx.StringEditor textarea value={json} style={{ width: width * 0.7 + 'px', height: height * 0.7 + 'px' }} setValue={setJson} />
                <ctx.Button onClick={() => {
                  if (json) {
                    try {
                      const lines: core.GeometryLine[] = JSON.parse(json)
                      const result = ctx.validate(lines, [ctx.GeometryLine])
                      if (result === true && lines.length > 0) {
                        const target: GeometryLinesContent = {
                          type: 'geometry lines',
                          lines,
                        }
                        onEnd({
                          updateContents: (contents) => {
                            contents.push(target)
                          }
                        })
                      } else {
                        console.info(result)
                      }
                    } catch (error) {
                      console.info(error)
                    }
                  }
                }}>OK</ctx.Button>
              </span>
            )
            : undefined,
        }
      },
      selectCount: 0,
    },
  ]
}
