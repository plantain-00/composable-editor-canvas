import type ReactType from 'react'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

type RingContent = model.StrokeBaseContent<'ring'> & model.FillFields & core.Position & {
  outerRadius: number
  innerRadius: number
}

export function getModel(ctx: typeof core & typeof model & { React: typeof ReactType }): model.Model<RingContent> {
  function getRingGeometriesFromCache(content: Omit<RingContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const points1 = ctx.arcToPolyline({ ...content, r: content.outerRadius, startAngle: 0, endAngle: 360 }, ctx.angleDelta)
      const points2 = ctx.arcToPolyline({ ...content, r: content.innerRadius, startAngle: 0, endAngle: 360 }, ctx.angleDelta)
      const points = [...points1, ...points2]
      const lines1 = Array.from(ctx.iteratePolygonLines(points1))
      const lines2 = Array.from(ctx.iteratePolygonLines(points2))
      return {
        points,
        lines: [...lines1, ...lines1],
        bounding: ctx.getPointsBounding(points),
        regions: content.fillColor !== undefined ? [
          {
            lines: lines1,
            points: points1,
          },
          {
            lines: lines2,
            points: points2,
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
    subTypes: ['stroke', 'fill'],
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    render({ content, target, color, strokeWidth }) {
      const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
      if (content.fillColor !== undefined) {
        strokeWidth = 0
      }
      const { renderingLines, regions } = getRingGeometriesFromCache(content)
      if (regions) {
        return target.renderPath([regions[0].points, regions[1].points], { [colorField]: color, strokeWidth })
      }
      return target.renderGroup(renderingLines.map(r => target.renderPolyline(r, { [colorField]: color, strokeWidth })))
    },
    getDefaultColor(content) {
      return content.fillColor !== undefined ? content.fillColor : content.strokeColor
    },
    getDefaultStrokeWidth(content) {
      return content.strokeWidth
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
    propertyPanel(content, update) {
      return {
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isRingContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isRingContent(c)) { c.y = v } })} />,
        outerRadius: <ctx.NumberEditor value={content.outerRadius} setValue={(v) => update(c => { if (isRingContent(c)) { c.outerRadius = v } })} />,
        innerRadius: <ctx.NumberEditor value={content.innerRadius} setValue={(v) => update(c => { if (isRingContent(c)) { c.innerRadius = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update),
      }
    },
  }
}

function isRingContent(content: model.BaseContent): content is RingContent {
  return content.type === 'ring'
}

export function getCommand(ctx: typeof core & typeof model): Command {
  return {
    name: 'create ring',
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
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
        })
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
      }
    },
    selectCount: 0,
  }
}
