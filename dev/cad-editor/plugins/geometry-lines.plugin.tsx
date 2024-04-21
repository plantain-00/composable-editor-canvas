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
  const refGeometriesCache = new ctx.WeakmapValuesCache<object, model.BaseContent, model.Geometries<{ points: core.Position[], endPoints: core.Position[], rays: core.Ray[] }>>()
  function getGeometryLinesGeometries(content: Omit<GeometryLinesContent, "type">) {
    return refGeometriesCache.get(content, [], () => {
      const points = ctx.getGeometryLinesPoints(content.lines)
      const rays: core.Ray[] = []
      const endPoints: core.Position[] = []
      for (const line of content.lines) {
        if (!Array.isArray(line) && line.type === 'ray') {
          rays.push(line.line)
        }
        const { start, end } = ctx.getGeometryLineStartAndEnd(line)
        if (start && endPoints.every(p => !ctx.isSamePoint(p, start))) {
          endPoints.push(start)
        }
        if (end && endPoints.every(p => !ctx.isSamePoint(p, end))) {
          endPoints.push(end)
        }
      }
      const geometries = {
        lines: content.lines,
        points,
        endPoints,
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
    rotate(content, center, angle) {
      for (const line of content.lines) {
        ctx.rotateGeometryLine(line, center, angle)
      }
    },
    scale(content, center, sx, sy) {
      ctx.scaleGeometryLines(content.lines, center, sx, sy)
    },
    skew(content, center, sx, sy) {
      ctx.skewGeometryLines(content.lines, center, sx, sy)
    },
    explode(content) {
      return content.lines.map(line => ctx.geometryLineToContent(line))
    },
    break(content, intersectionPoints) {
      return ctx.breakGeometryLines(content.lines, intersectionPoints).map(lines => ({ ...content, type: 'geometry lines', lines }) as GeometryLinesContent)
    },
    mirror(content, line, angle) {
      for (const n of content.lines) {
        ctx.mirrorGeometryLine(n, line, angle)
      }
    },
    offset(content, point, distance, _, lineJoin) {
      const newLines = ctx.trimGeometryLinesOffsetResult(ctx.getParallelGeometryLinesByDistancePoint(point, content.lines, distance, lineJoin), point)
      return newLines.map(n => ctx.geometryLinesToPline(n))
    },
    join(content, target, contents) {
      const line2 = ctx.getContentModel(target)?.getGeometries?.(target, contents)?.lines
      if (!line2) return
      const newLines = ctx.mergeGeometryLines(content.lines, line2)
      if (!newLines) return
      return { ...content, lines: newLines } as GeometryLinesContent
    },
    extend(content, point) {
      ctx.extendGeometryLines(content.lines, point)
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
      const { points, rays } = getGeometryLinesGeometries(content)
      return target.renderGroup([
        target.renderPath([points], options),
        ...rays.map(r => target.renderRay(r.x, r.y, r.angle, { ...options, bidirectional: r.bidirectional }),)
      ])
    },
    getSnapPoints(content) {
      const { endPoints } = getGeometryLinesGeometries(content)
      return ctx.getSnapPointsFromCache(content, () => {
        return endPoints.map(p => ({ ...p, type: 'endpoint' as const }))
      })
    },
    getGeometries: getGeometryLinesGeometries,
    canSelectPart: true,
    propertyPanel(content, update, contents) {
      return {
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isValid: (c, p) => ctx.validate(c, GeometryLinesContent, p),
    reverse(content) {
      const newLines = ctx.reverseGeometryLines(content.lines)
      return { ...content, lines: newLines } as GeometryLinesContent
    },
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
                        const allLines = ctx.getSeparatedGeometryLines(lines)
                        onEnd({
                          updateContents: (contents) => {
                            contents.push(...allLines.map(n => ({ type: 'geometry lines', lines: n } as GeometryLinesContent)))
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
