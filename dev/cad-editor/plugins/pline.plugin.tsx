import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { ArcContent } from './circle-arc.plugin'
import type { TextContent } from './text.plugin'
import type { PolygonContent } from './polygon.plugin'
import { LineContent } from './line-polyline.plugin'

export type PlineContent = model.BaseContent<'pline'> & model.StrokeFields & model.FillFields & {
  points: { point: core.Position, bulge: number }[]
  closed?: boolean
}

export function getModel(ctx: PluginContext) {
  const PlineContent = ctx.and(ctx.BaseContent('pline'), ctx.StrokeFields, ctx.FillFields, {
    points: ctx.minItems(2, [{ point: ctx.Position, bulge: ctx.number }]),
    closed: ctx.optional(ctx.boolean),
  })
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ points: core.Position[] }>>()
  function getPlineGeometries(content: Omit<PlineContent, "type">) {
    return geometriesCache.get(content, () => {
      const lines: core.GeometryLine[] = []
      for (let i = 0; i < content.points.length; i++) {
        const p = content.points[i]
        if (i === content.points.length - 1) {
          if (content.closed) {
            lines.push(ctx.getGeometryLineByStartEndBulge(p.point, content.points[0].point, p.bulge))
          }
        } else {
          lines.push(ctx.getGeometryLineByStartEndBulge(p.point, content.points[i + 1].point, p.bulge))
        }
      }
      const points = ctx.getGeometryLinesPoints(lines)
      return {
        lines,
        points,
        bounding: ctx.getGeometryLinesBounding(lines),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points,
          },
        ] : undefined,
      }
    })
  }
  const React = ctx.React
  return {
    type: 'pline',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      for (const point of content.points) {
        ctx.movePoint(point.point, offset)
      }
    },
    rotate(content, center, angle) {
      for (const point of content.points) {
        ctx.rotatePoint(point.point, center, angle)
      }
    },
    scale(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.scalePoint(point.point, center, sx, sy)
      }
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point.point, line)
      }
    },
    explode(content) {
      const { lines } = getPlineGeometries(content)
      return lines.map((line) => ctx.geometryLineToContent(line))
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
      return target.renderPath([getPlineGeometries(content).points], options)
    },
    getOperatorRenderPosition(content) {
      return content.points[0].point
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        return content.points.map((p) => ({ ...p.point, type: 'endpoint' as const }))
      })
    },
    getGeometries: getPlineGeometries,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        points: <ctx.ArrayEditor
          inline
          {...ctx.getArrayEditorProps<{ point: core.Position, bulge: number }, typeof content>(v => v.points, { point: { x: 0, y: 0 }, bulge: 0 }, (v) => update(c => { if (isPlineContent(c)) { v(c) } }))}
          items={content.points.map((f, i) => <ctx.ObjectEditor
            inline
            properties={{
              from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isPlineContent(c)) { c.points[i].point.x = p.x, c.points[i].point.y = p.y } }))}>canvas</ctx.Button>,
              x: <ctx.NumberEditor value={f.point.x} setValue={(v) => update(c => { if (isPlineContent(c)) { c.points[i].point.x = v } })} />,
              y: <ctx.NumberEditor value={f.point.y} setValue={(v) => update(c => { if (isPlineContent(c)) { c.points[i].point.y = v } })} />,
              bulge: <ctx.NumberEditor value={f.bulge} setValue={(v) => update(c => { if (isPlineContent(c)) { c.points[i].bulge = v } })} />,
            }}
          />)}
        />,
        closed: <ctx.BooleanEditor value={content.closed ?? false} setValue={(v) => update(c => { if (isPlineContent(c)) { c.closed = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, PlineContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    reverse: (content) => ({
      ...content,
      points: content.points.slice().reverse(),
    }),
    isPointIn: (content, point) => ctx.pointInPolygon(point, getPlineGeometries(content).points),
  } as model.Model<PlineContent>
}

export function isPlineContent(content: model.BaseContent): content is PlineContent {
  return content.type === 'pline'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="6,92 56,92" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <path d="M 54 15 A 38 38 0 0 1 55 92" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fillOpacity="1" strokeOpacity="1" fill="none" stroke="currentColor"></path>
    </svg>
  )
  return {
    name: 'create pline',
    useCommand({ onEnd, scale, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, inputMode, lastPosition, reset, positions } = ctx.useLineClickCreate(
        type === 'create pline',
        (c) => onEnd({
          updateContents: (contents) => contents.push({ points: c.map(p => ({ point: p, bulge: 0 })), strokeStyleId, fillStyleId, type: 'pline' } as PlineContent)
        }),
      )
      const assistentContents: (LineContent | ArcContent | TextContent)[] = []
      if (line && line.length > 1) {
        const start = line[line.length - 2]
        const end = line[line.length - 1]
        const r = ctx.getTwoPointsDistance(start, end)
        const angle = ctx.radianToAngle(ctx.getTwoPointsRadian(end, start))
        assistentContents.push(
          {
            type: 'arc',
            x: start.x,
            y: start.y,
            r,
            dashArray: [4 / scale],
            startAngle: angle > 180 || angle < 0 ? angle : 0,
            endAngle: angle > 180 || angle < 0 ? 0 : angle,
          },
          {
            type: 'line',
            dashArray: [4 / scale],
            points: [start, { x: start.x + r, y: start.y }]
          },
          ...ctx.getAssistentText(
            r.toFixed(2),
            16 / scale,
            (start.x + end.x) / 2 - 20,
            (start.y + end.y) / 2 + 4,
            inputMode === 'length' ? 0xff0000 : 0xffcccc,
          ),
          ...ctx.getAssistentText(
            `${angle.toFixed(1)}°`,
            16 / scale,
            end.x + 10,
            end.y - 10,
            inputMode === 'angle' ? 0xff0000 : 0xffcccc,
          ),
        )
      }
      if (line) {
        assistentContents.push({ points: line, strokeStyleId, fillStyleId, type: 'polyline' })
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset,
        subcommand: type === 'create pline' && positions.length > 2
          ? (
            <span>
              <button
                onClick={() => {
                  onEnd({
                    updateContents: (contents) => contents.push({ points: positions, type: 'polygon' } as PolygonContent)
                  })
                  reset()
                }}
                style={{ position: 'relative' }}
              >
                close
              </button>
            </span>
          )
          : undefined,
      }
    },
    selectCount: 0,
    icon: icon,
  }
}
