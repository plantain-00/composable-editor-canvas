import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { ArcContent } from './circle-arc.plugin'
import type { TextContent } from './text.plugin'
import type { PolygonContent } from './polygon.plugin'
import type { LineContent } from './line-polyline.plugin'

export type PlineContent = model.BaseContent<'pline'> & model.StrokeFields & model.FillFields & {
  points: { point: core.Position, bulge: number }[]
  closed?: boolean
}

export function getModel(ctx: PluginContext) {
  const PlineContent = ctx.and(ctx.BaseContent('pline'), ctx.StrokeFields, ctx.FillFields, {
    points: ctx.minItems(2, [{ point: ctx.Position, bulge: ctx.number }]),
    closed: ctx.optional(ctx.boolean),
  })
  const getRefIds = (content: Omit<PlineContent, "type">): model.RefId[] => ctx.getStrokeAndFillRefIds(content)
  const geometriesCache = new ctx.WeakmapValuesCache<Omit<PlineContent, "type">, model.BaseContent, model.Geometries<{ points: core.Position[], centers: core.Position[], middles: core.Position[] }>>()
  function getPlineGeometries(content: Omit<PlineContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]))
    return geometriesCache.get(content, refs, () => {
      const lines: core.GeometryLine[] = []
      const centers: core.Position[] = []
      const middles: core.Position[] = []
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
      for (const line of lines) {
        if (Array.isArray(line)) {
          middles.push(ctx.getTwoPointCenter(...line))
        } else if (line.type === 'arc') {
          centers.push(line.curve)
          middles.push(ctx.getArcPointAtAngle(line.curve, ctx.getTwoNumberCenter(line.curve.startAngle, ctx.getFormattedEndAngle(line.curve))))
        }
      }
      const points = ctx.getGeometryLinesPoints(lines)
      return {
        lines,
        points,
        centers,
        middles,
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
    skew(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.skewPoint(point.point, center, sx, sy)
      }
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point.point, line)
        point.bulge *= -1
      }
    },
    break(content, intersectionPoints, contents) {
      const { lines } = getPlineGeometries(content, contents)
      const newLines = ctx.breakGeometryLines(lines, intersectionPoints)
      return newLines.map(line => ctx.geometryLinesToPline(line))
    },
    explode(content, contents) {
      const { lines } = getPlineGeometries(content, contents)
      return lines.map((line) => ctx.geometryLineToContent(line))
    },
    offset(content, point, distance, contents, lineJoin) {
      const { lines } = getPlineGeometries(content, contents)
      const newLines = ctx.trimGeometryLines(ctx.getParallelGeometryLinesByDistancePoint(point, lines, distance, lineJoin))
      return ctx.geometryLinesToPline(newLines)
    },
    join(content, target, contents) {
      const { lines } = getPlineGeometries(content, contents)
      const line2 = ctx.getContentModel(target)?.getGeometries?.(target, contents)?.lines
      if (!line2) return
      const newLines = ctx.mergeGeometryLines(lines, line2)
      if (!newLines) return
      return ctx.geometryLinesToPline(newLines)
    },
    extend(content, point, contents) {
      if (content.closed) return
      const { lines } = getPlineGeometries(content, contents)
      const first = lines[0], last = lines[lines.length - 1]
      if (Array.isArray(first)) {
        if (ctx.pointIsOnRay(point, { ...first[0], angle: ctx.radianToAngle(ctx.getTwoPointsRadian(...first)) })) {
          content.points[0].point = point
        }
      } else if (first.type === 'arc') {
        if (ctx.pointIsOnCircle(point, first.curve)) {
          content.points[0].point = point
          content.points[0].bulge = ctx.getArcBulge({ ...first.curve, startAngle: ctx.radianToAngle(ctx.getCircleRadian(point, first.curve)) }, point)
        }
      }
      if (Array.isArray(last)) {
        if (ctx.pointIsOnRay(point, { ...last[1], angle: ctx.radianToAngle(ctx.getTwoPointsRadian(last[1], last[0])) })) {
          content.points[content.points.length - 1].point = point
        }
      } else if (last.type === 'arc') {
        if (ctx.pointIsOnCircle(point, last.curve)) {
          content.points[0].point = point
          content.points[0].bulge = ctx.getArcBulge({ ...last.curve, endAngle: ctx.radianToAngle(ctx.getCircleRadian(point, last.curve)) }, undefined, point)
        }
      }
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
      return target.renderPath([getPlineGeometries(content, renderCtx.contents).points], options)
    },
    getOperatorRenderPosition(content) {
      return content.points[0].point
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const { middles } = getPlineGeometries(content, contents)
        const endpoints: core.EditPoint<model.BaseContent>[] = content.points.map((p, i) => ({
          x: p.point.x,
          y: p.point.y,
          cursor: 'move',
          type: 'move',
          update(c, { cursor, start, scale }) {
            if (!isPlineContent(c)) {
              return
            }
            c.points[i].point.x += cursor.x - start.x
            c.points[i].point.y += cursor.y - start.y
            return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [p.point, cursor] } as LineContent] }
          },
          menu: [
            {
              title: 'Remove',
              execute(draft) {
                if (isPlineContent(draft)) {
                  draft.points.splice(i, 1)
                }
              },
            },
            ...(i === 0 || i === content.points.length - 1 ? [{
              title: 'Add',
              update(c, { cursor, scale }) {
                if (!isPlineContent(c)) {
                  return
                }
                c.points.splice(i === 0 ? 0 : i + 1, 0, { point: { x: cursor.x, y: cursor.y }, bulge: 0 })
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [p.point, cursor] } as LineContent] }
              },
            } as core.EditPointMenu<model.BaseContent>] : []),
          ]
        }))
        const midpoints: core.EditPoint<model.BaseContent>[] = middles.map((p, i) => ({
          x: p.x,
          y: p.y,
          cursor: 'move',
          type: 'move',
          update(c, { cursor, start, scale }) {
            if (!isPlineContent(c)) {
              return
            }
            const j = i === content.points.length - 1 ? 0 : i + 1
            if (ctx.isZero(content.points[i].bulge)) {
              c.points[i].point.x += cursor.x - start.x
              c.points[i].point.y += cursor.y - start.y
              c.points[j].point.x += cursor.x - start.x
              c.points[j].point.y += cursor.y - start.y
            } else {
              const bulge = ctx.getArcBulgeByStartEndPoint(content.points[i].point, content.points[j].point, cursor)
              if (bulge !== undefined) {
                c.points[i].bulge = bulge
              }
            }
            return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [p, cursor] } as LineContent] }
          },
          menu: [
            {
              title: 'Add',
              update(c, { cursor, scale }) {
                if (!isPlineContent(c)) {
                  return
                }
                c.points.splice(i + 1, 0, { point: { x: cursor.x, y: cursor.y }, bulge: 0 })
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [p, cursor] } as LineContent] }
              },
            },
            ctx.isZero(content.points[i].bulge) ? {
              title: 'To Arc',
              update(c, { cursor, scale }) {
                if (!isPlineContent(c)) {
                  return
                }
                const j = i === content.points.length - 1 ? 0 : i + 1
                const bulge = ctx.getArcBulgeByStartEndPoint(content.points[i].point, content.points[j].point, cursor)
                if (bulge !== undefined) {
                  c.points[i].bulge = bulge
                }
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [p, cursor] } as LineContent] }
              },
            } : {
              title: 'To Line',
              execute(draft) {
                if (isPlineContent(draft)) {
                  draft.points[i].bulge = 0
                }
              },
            },
          ]
        }))
        return {
          editPoints: [
            ...endpoints,
            ...midpoints,
          ]
        }
      })
    },
    getSnapPoints(content, contents) {
      const { centers, middles } = getPlineGeometries(content, contents)
      return ctx.getSnapPointsFromCache(content, () => {
        return [
          ...content.points.map((p) => ({ ...p.point, type: 'endpoint' as const })),
          ...centers.map((p) => ({ ...p, type: 'center' as const })),
          ...middles.map((p) => ({ ...p, type: 'midpoint' as const })),
        ]
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
              radius: f.bulge ? <ctx.NumberEditor value={ctx.getArcByStartEndBulge(f.point, (content.points[i + 1] || content.points[0]).point, f.bulge).r} setValue={(v) => update(c => {
                if (isPlineContent(c)) {
                  c.points[i].bulge = ctx.getArcBulgeByStartEndRadius(f.point, (content.points[i + 1] || content.points[0]).point, v, f.bulge) || 0
                }
              })} /> : [],
            }}
          />)}
        />,
        closed: <ctx.BooleanEditor value={content.closed ?? false} setValue={(v) => update(c => { if (isPlineContent(c)) { c.closed = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, PlineContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    reverse: (content) => ({
      ...content,
      points: content.points.slice().reverse().map((p, i, points) => ({
        point: p.point,
        bulge: -points[i === points.length - 1 ? 0 : i + 1].bulge,
      })),
    }),
    isPointIn: (content, point, contents) => ctx.pointInPolygon(point, getPlineGeometries(content, contents).points),
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
