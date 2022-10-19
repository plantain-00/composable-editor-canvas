import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import type { LineContent } from './line-polyline.plugin'

export type PolygonContent = model.BaseContent<'polygon'> & model.StrokeFields & model.FillFields & {
  points: core.Position[]
}

export function getModel(ctx: PluginContext): model.Model<PolygonContent> {
  function getPolygonGeometries(content: Omit<PolygonContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const lines = Array.from(ctx.iteratePolygonLines(content.points))
      return {
        lines,
        points: content.points,
        bounding: ctx.getPointsBounding(content.points),
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(content.points), content.dashArray),
        regions: content.fillColor !== undefined ? [
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
        point.x += offset.x
        point.y += offset.y
      }
    },
    rotate(content, center, angle) {
      content.points = content.points.map((p) => ctx.rotatePositionByCenter(p, center, -angle))
    },
    mirror(content, line) {
      content.points = content.points.map((p) => ctx.getSymmetryPoint(p, line))
    },
    explode(content) {
      const { lines } = getPolygonGeometries(content)
      return lines.map((line) => ({ type: 'line', points: line } as LineContent))
    },
    break(content, intersectionPoints) {
      const { lines } = getPolygonGeometries(content)
      return ctx.breakPolyline(lines, intersectionPoints)
    },
    render({ content, color, target, strokeWidth }) {
      const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
      if (content.fillColor !== undefined) {
        strokeWidth = 0
      }
      return target.renderPolygon(content.points, { [colorField]: color, dashArray: content.dashArray, strokeWidth })
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
    propertyPanel(content, update) {
      return {
        points: <ctx.ArrayEditor
          inline
          {...ctx.getArrayEditorProps<core.Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isPolygonContent(c)) { v(c) } }))}
          items={content.points.map((f, i) => <ctx.ObjectEditor
            inline
            properties={{
              x: <ctx.NumberEditor value={f.x} setValue={(v) => update(c => { if (isPolygonContent(c)) { c.points[i].x = v } })} />,
              y: <ctx.NumberEditor value={f.y} setValue={(v) => update(c => { if (isPolygonContent(c)) { c.points[i].y = v } })} />,
            }}
          />)}
        />,
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update),
      }
    },
  }
}

export function isPolygonContent(content: model.BaseContent): content is PolygonContent {
  return content.type === 'polygon'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="10.964331152381801,81 86.72644978417914,83.3559397330022 88.44676768044036,39.61510448168846 52.00408203830702,10.225841867064801 12.791823135476555,35.80311391824452" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'create polygon',
    useCommand({ onEnd, type, scale }) {
      const [createType, setCreateType] = React.useState<'point' | 'edge'>('point')
      const { polygon, onClick, onMove, input, startSetSides, startPosition, cursorPosition, reset } = ctx.usePolygonClickCreate(
        type === 'create polygon',
        (c) => onEnd({
          updateContents: (contents) => contents.push({ points: c, type: 'polygon' } as PolygonContent)
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
        assistentContents.push({ points: polygon, type: 'polygon' })
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
