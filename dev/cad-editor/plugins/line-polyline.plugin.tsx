import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { isArcContent, type ArcContent } from './circle-arc.plugin'
import type { TextContent } from './text.plugin'
import type { PolygonContent } from './polygon.plugin'

export type LineContent = model.BaseContent<'line' | 'polyline'> & model.StrokeFields & model.FillFields & {
  points: core.Position[]
}

export function getModel(ctx: PluginContext) {
  const LineContent = ctx.and(ctx.BaseContent(ctx.or('line', 'polyline')), ctx.StrokeFields, ctx.FillFields, {
    points: ctx.minItems(2, [ctx.Position])
  })
  const getRefIds = (content: Omit<LineContent, "type">) => [content.strokeStyleId, content.fillStyleId]
  const geometriesCache = new ctx.WeakmapValuesCache<Omit<LineContent, "type">, model.BaseContent, model.Geometries<{ points: core.Position[], lines: [core.Position, core.Position][] }>>()
  function getPolylineGeometries(content: Omit<LineContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents))
    return geometriesCache.get(content, refs, () => {
      const lines = Array.from(ctx.iteratePolylineLines(content.points))
      return {
        lines,
        points: content.points,
        bounding: ctx.getPointsBounding(content.points),
        renderingLines: ctx.dashedPolylineToLines(content.points, content.dashArray),
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
  const lineModel: model.Model<LineContent> = {
    type: 'line',
    ...ctx.strokeModel,
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
    scale(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.scalePoint(point, center, sx, sy)
      }
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line)
      }
    },
    break(content, intersectionPoints, contents) {
      const { lines } = getPolylineGeometries(content, contents)
      return ctx.breakPolyline(lines, intersectionPoints)
    },
    offset(content, point, distance, contents) {
      const { lines } = getPolylineGeometries(content, contents)
      if (!distance) {
        distance = Math.min(...lines.map(line => ctx.getPointAndGeometryLineMinimumDistance(point, line)))
      }
      const index = ctx.getLinesOffsetDirection(point, lines)
      const points = ctx.getParallelPolylineByDistance(lines, index, distance)
      return ctx.trimOffsetResult(points, point, closed, contents).map(p => ctx.produce(content, (d) => {
        d.points = p
      }))
    },
    join(content, target, contents) {
      if (isLineContent(target) || isPolyLineContent(target)) {
        const lines = [
          ...getPolylineGeometries(content, contents).lines.map(n => ({ type: 'line', points: [...n] }) as LineContent),
          ...getPolylineGeometries(target, contents).lines.map(n => ({ type: 'line', points: [...n] }) as LineContent),
        ]
        ctx.mergePolylines(lines)
        if (lines.length === 1) {
          return {
            ...content,
            points: lines[0].points,
          } as LineContent
        }
      }
      if (isArcContent(target)) {
        const newLines = ctx.mergeGeometryLines([{ type: 'arc', curve: target }], getPolylineGeometries(content, contents).lines)
        if (newLines) {
          return ctx.geometryLinesToPline(newLines)
        }
      }
      return
    },
    extend(content, point, contents) {
      const { lines } = getPolylineGeometries(content, contents)
      if (ctx.pointIsOnRay(point, { ...lines[0][0], angle: ctx.radianToAngle(ctx.getTwoPointsRadian(lines[0][0], lines[0][1])) })) {
        content.points[0] = point
      } else {
        content.points[content.points.length - 1] = point
      }
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      return target.renderPolyline(content.points, options)
    },
    getOperatorRenderPosition(content) {
      return content.points[0]
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isLineContent) }))
    },
    getSnapPoints(content, contents) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, lines } = getPolylineGeometries(content, contents)
        return [
          ...points.map((p) => ({ ...p, type: 'endpoint' as const })),
          ...lines.map(([start, end]) => ({
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
            type: 'midpoint' as const,
          })),
        ]
      })
    },
    getGeometries: getPolylineGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        points: <ctx.ArrayEditor
          inline
          {...ctx.getArrayEditorProps<core.Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isLineContent(c)) { v(c) } }))}
          items={content.points.map((f, i) => <ctx.ObjectEditor
            inline
            properties={{
              from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isLineContent(c)) { c.points[i].x = p.x, c.points[i].y = p.y } }))}>canvas</ctx.Button>,
              x: <ctx.NumberEditor value={f.x} setValue={(v) => update(c => { if (isLineContent(c)) { c.points[i].x = v } })} />,
              y: <ctx.NumberEditor value={f.y} setValue={(v) => update(c => { if (isLineContent(c)) { c.points[i].y = v } })} />,
            }}
          />)}
        />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, LineContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    reverse: (content) => ({
      ...content,
      points: content.points.slice().reverse(),
    }),
  }
  return [
    lineModel,
    {
      ...lineModel,
      type: 'polyline',
      ...ctx.fillModel,
      explode(content, contents) {
        const { lines } = getPolylineGeometries(content, contents)
        return lines.map((line) => ({ type: 'line', points: line } as LineContent))
      },
      render(content, renderCtx) {
        const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
        return target.renderPolyline(content.points, options)
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isPolyLineContent) }))
      },
      canSelectPart: true,
      propertyPanel(content, update, contents, { acquirePoint }) {
        return {
          points: <ctx.ArrayEditor
            inline
            {...ctx.getArrayEditorProps<core.Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isPolyLineContent(c)) { v(c) } }))}
            items={content.points.map((f, i) => <ctx.ObjectEditor
              inline
              properties={{
                from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isPolyLineContent(c)) { c.points[i].x = p.x, c.points[i].y = p.y } }))}>canvas</ctx.Button>,
                x: <ctx.NumberEditor value={f.x} setValue={(v) => update(c => { if (isPolyLineContent(c)) { c.points[i].x = v } })} />,
                y: <ctx.NumberEditor value={f.y} setValue={(v) => update(c => { if (isPolyLineContent(c)) { c.points[i].y = v } })} />,
              }}
            />)}
          />,
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
          ...ctx.getFillContentPropertyPanel(content, update, contents),
        }
      },
    } as model.Model<LineContent>,
  ]
}

export function isLineContent(content: model.BaseContent): content is LineContent {
  return content.type === 'line'
}

export function isPolyLineContent(content: model.BaseContent): content is LineContent {
  return content.type === 'polyline'
}

export function getCommand(ctx: PluginContext): Command[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon1 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="10" cy="87" r="12" strokeWidth="0" vectorEffect="non-scaling-stroke" fill="currentColor" stroke="#000000"></circle>
      <circle cx="87" cy="9" r="12" strokeWidth="0" vectorEffect="non-scaling-stroke" fill="currentColor" stroke="#000000"></circle>
      <polyline points="10,87 87,9" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  const icon2 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="12,86 38,24 62,64 88,13" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return [
    {
      name: 'create line',
      useCommand({ onEnd, scale, type, strokeStyleId, fillStyleId }) {
        const { line, onClick, onMove, input, inputMode, lastPosition, reset } = ctx.useLineClickCreate(
          type === 'create line',
          (c) => onEnd({
            updateContents: (contents) => contents.push(...Array.from(ctx.iteratePolylineLines(c)).map((line) => ({ points: line, strokeStyleId, fillStyleId, type: 'line' } as LineContent)))
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
          for (const lineSegment of ctx.iteratePolylineLines(line)) {
            assistentContents.push({ points: lineSegment, strokeStyleId, fillStyleId, type: 'line' })
          }
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
      hotkey: 'L',
      icon: icon1,
    },
    {
      name: 'create polyline',
      useCommand({ onEnd, scale, type, strokeStyleId, fillStyleId }) {
        const { line, onClick, onMove, input, inputMode, lastPosition, reset, positions } = ctx.useLineClickCreate(
          type === 'create polyline',
          (c) => onEnd({
            updateContents: (contents) => contents.push({ points: c, strokeStyleId, fillStyleId, type: 'polyline' } as LineContent)
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
          subcommand: type === 'create polyline' && positions.length > 2
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
      hotkey: 'PL',
      icon: icon2,
    },
  ]
}
