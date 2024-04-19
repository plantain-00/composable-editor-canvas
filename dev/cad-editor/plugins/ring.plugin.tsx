import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type RingContent = model.BaseContent<'ring'> & model.StrokeFields & model.FillFields & model.AngleDeltaFields & core.Position & {
  outerRadius: number
  innerRadius: number
}

export function getModel(ctx: PluginContext): model.Model<RingContent> {
  const RingContent = ctx.and(ctx.BaseContent('ring'), ctx.StrokeFields, ctx.FillFields, ctx.AngleDeltaFields, ctx.Position, {
    outerRadius: ctx.number,
    innerRadius: ctx.number,
  })
  const getRefIds = (content: Omit<RingContent, "type">): model.RefId[] => ctx.getStrokeAndFillRefIds(content)
  function getRingGeometriesFromCache(content: Omit<RingContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]))
    return ctx.getGeometriesFromCache(content, refs, () => {
      const angleDelta = content.angleDelta ?? ctx.defaultAngleDelta
      const arc1 = ctx.circleToArc({ ...content, r: content.outerRadius })
      const arc2 = ctx.circleToArc({ ...content, r: content.innerRadius })
      const points1 = ctx.arcToPolyline(arc1, angleDelta)
      const points2 = ctx.arcToPolyline(arc2, angleDelta)
      const lines = [{ type: 'arc' as const, curve: arc1 }, { type: 'arc' as const, curve: arc2 }]
      return {
        lines,
        bounding: ctx.getCircleBounding({ ...content, r: content.outerRadius }),
        regions: ctx.hasFill(content) ? [
          {
            lines: [lines[0]],
            points: points1,
            holesPoints: [points2],
            holes: [[lines[1]]]
          },
        ] : undefined,
        renderingLines: [
          ...ctx.dashedPolylineToLines(ctx.polygonToPolyline(points1), content.dashArray),
          ...ctx.dashedPolylineToLines(ctx.polygonToPolyline(points2), content.dashArray),
        ],
      }
    })
  }
  const React = ctx.React
  return {
    type: 'ring',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    ...ctx.angleDeltaModel,
    move(content, offset) {
      ctx.movePoint(content, offset)
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content, center, sx, sy)
      content.innerRadius *= sx
      content.outerRadius *= sx
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
      const { renderingLines, regions } = getRingGeometriesFromCache(content, renderCtx.contents)
      if (regions) {
        return target.renderPath([regions[0].points, ...(regions[0].holesPoints || [])], options)
      }
      return target.renderGroup(renderingLines.map(r => target.renderPolyline(r, options)))
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isRingContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] }] }
              },
            },
          ]
        }
      })
    },
    getGeometries: getRingGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isRingContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isRingContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isRingContent(c)) { c.y = v } })} />,
        outerRadius: <ctx.NumberEditor value={content.outerRadius} setValue={(v) => update(c => { if (isRingContent(c)) { c.outerRadius = v } })} />,
        innerRadius: <ctx.NumberEditor value={content.innerRadius} setValue={(v) => update(c => { if (isRingContent(c)) { c.innerRadius = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
        ...ctx.getAngleDeltaContentPropertyPanel(content, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, RingContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
  }
}

export function isRingContent(content: model.BaseContent): content is RingContent {
  return content.type === 'ring'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="91,50 91,53 91,57 90,60 89,64 87,67 86,70 84,74 82,76 79,79 76,82 74,84 70,86 67,87 64,89 60,90 57,91 53,91 50,91 46,91 42,91 39,90 35,89 32,87 29,86 25,84 23,82 20,79 17,76 15,74 13,70 12,67 10,64 9,60 8,57 8,53 8,50 8,46 8,42 9,39 10,35 12,32 13,29 15,25 17,23 20,20 23,17 25,15 29,13 32,12 35,10 39,9 42,8 46,8 49,8 53,8 57,8 60,9 64,10 67,12 70,13 74,15 76,17 79,20 82,23 84,25 86,29 87,32 89,35 90,39 91,42 91,46 91,49" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline><polyline points="70,50 70,51 70,53 70,55 69,57 68,58 68,60 67,62 66,63 64,64 63,66 62,67 60,68 58,68 57,69 55,70 53,70 51,70 50,70 48,70 46,70 44,70 42,69 41,68 39,68 37,67 36,66 35,64 33,63 32,62 31,60 31,58 30,57 29,55 29,53 29,51 29,50 29,48 29,46 29,44 30,42 31,41 31,39 32,37 33,36 35,35 36,33 37,32 39,31 41,31 42,30 44,29 46,29 48,29 49,29 51,29 53,29 55,29 57,30 58,31 60,31 62,32 63,33 64,35 66,36 67,37 68,39 68,41 69,42 70,44 70,46 70,48 70,49" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create ring',
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === 'create ring',
        (c) => onEnd({
          updateContents: (contents) => {
            const outerRadius = ctx.getTwoPointsDistance(c[0], c[1])
            contents.push({
              type: 'ring',
              x: c[0].x,
              y: c[0].y,
              outerRadius,
              innerRadius: outerRadius * 0.5,
              strokeStyleId,
              fillStyleId,
            } as RingContent)
          }
        }),
        {
          once: true,
        },
      )
      const assistentContents: RingContent[] = []
      if (line) {
        const outerRadius = ctx.getTwoPointsDistance(line[0], line[1])
        assistentContents.push({
          type: 'ring',
          x: line[0].x,
          y: line[0].y,
          outerRadius,
          innerRadius: outerRadius * 0.5,
          strokeStyleId,
          fillStyleId,
        })
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
}
