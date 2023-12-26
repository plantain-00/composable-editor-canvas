import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type PolygonContent = model.BaseContent<'polygon'> & model.StrokeFields & model.FillFields & {
  points: core.Position[]
}

export function getModel(ctx: PluginContext): model.Model<PolygonContent> {
  const PolygonContent = ctx.and(ctx.BaseContent('polygon'), ctx.StrokeFields, ctx.FillFields, {
    points: [ctx.Position]
  })
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ points: core.Position[], lines: [core.Position, core.Position][] }>>()
  function getPolygonGeometries(content: Omit<PolygonContent, "type">) {
    return geometriesCache.get(content, () => {
      const lines = Array.from(ctx.iteratePolygonLines(content.points))
      return {
        lines,
        points: content.points,
        bounding: ctx.getPointsBounding(content.points),
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(content.points), content.dashArray),
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
  return {
    type: 'polygon',
    ...ctx.strokeModel,
    ...ctx.fillModel,
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
    explode(content) {
      const { lines } = getPolygonGeometries(content)
      return lines.map((line) => ({ type: 'line', points: line } as LineContent))
    },
    break(content, intersectionPoints) {
      const { lines } = getPolygonGeometries(content)
      return ctx.breakPolyline(lines, intersectionPoints)
    },
    offset(content, point, distance) {
      const { lines } = getPolygonGeometries(content)
      if (!distance) {
        distance = Math.min(...lines.map(line => ctx.getPointAndGeometryLineMinimumDistance(point, line)))
      }
      const generalFormLines = lines.map(line => ctx.twoPointLineToGeneralFormLine(...line))
      const index = ctx.getLinesOffsetDirection(point, lines)
      const parallelLines = generalFormLines.map(line => ctx.getParallelLinesByDistance(line, distance)[index])
      const points: core.Position[] = []
      for (let i = 0; i < parallelLines.length; i++) {
        const previous = parallelLines[i === 0 ? parallelLines.length - 1 : i - 1]
        const p = ctx.getTwoGeneralFormLinesIntersectionPoint(previous, parallelLines[i])
        if (p) {
          points.push(p)
        }
      }
      return ctx.trimOffsetResult(points, point, true).map(p => ctx.produce(content, (d) => {
        d.points = p
      }))
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
      return target.renderPolygon(content.points, options)
    },
    getOperatorRenderPosition(content) {
      return content.points[0]
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isPolygonContent, true) }))
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, lines } = getPolygonGeometries(content)
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
    getGeometries: getPolygonGeometries,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        points: <ctx.ArrayEditor
          inline
          {...ctx.getArrayEditorProps<core.Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isPolygonContent(c)) { v(c) } }))}
          items={content.points.map((f, i) => <ctx.ObjectEditor
            inline
            properties={{
              from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isPolygonContent(c)) { c.points[i].x = p.x, c.points[i].y = p.y } }))}>canvas</ctx.Button>,
              x: <ctx.NumberEditor value={f.x} setValue={(v) => update(c => { if (isPolygonContent(c)) { c.points[i].x = v } })} />,
              y: <ctx.NumberEditor value={f.y} setValue={(v) => update(c => { if (isPolygonContent(c)) { c.points[i].y = v } })} />,
            }}
          />)}
        />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, PolygonContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, content.points),
  }
}

export function isPolygonContent(content: model.BaseContent): content is PolygonContent {
  return content.type === 'polygon'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="10,81 86,83 88,39 52,10 12,35" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'create polygon',
    useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
      const [createType, setCreateType] = React.useState<'point' | 'edge'>('point')
      const { polygon, onClick, onMove, input, startSetSides, startPosition, cursorPosition, reset } = ctx.usePolygonClickCreate(
        type === 'create polygon',
        (c) => onEnd({
          updateContents: (contents) => contents.push({ points: c, strokeStyleId, fillStyleId, type: 'polygon' } as PolygonContent)
        }),
        {
          toEdge: createType === 'edge',
          setSidesKey: 'S',
          switchTypeKey: 'T',
          switchType: () => setCreateType(createType === 'edge' ? 'point' : 'edge'),
        },
      )
      const assistentContents: (LineContent | PolygonContent)[] = []
      if (startPosition && cursorPosition) {
        assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] })
      }
      if (polygon) {
        assistentContents.push({ points: polygon, strokeStyleId, fillStyleId, type: 'polygon' })
      }
      return {
        onStart: onClick,
        input,
        onMove,
        reset,
        subcommand: type === 'create polygon'
          ? (
            <span>
              <button onClick={startSetSides} style={{ position: 'relative' }}>set sides(S)</button>
              <button onClick={() => setCreateType(createType === 'edge' ? 'point' : 'edge')} style={{ position: 'relative' }}>{createType}(T)</button>
            </span>
          )
          : undefined,
        assistentContents,
        lastPosition: startPosition,
      }
    },
    selectCount: 0,
    hotkey: 'POL',
    icon,
  }
}
