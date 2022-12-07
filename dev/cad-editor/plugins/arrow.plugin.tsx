import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type ArrowContent = model.BaseContent<'arrow'> & model.StrokeFields & model.ArrowFields & {
  p1: core.Position
  p2: core.Position
}

export function getModel(ctx: PluginContext): model.Model<ArrowContent> {
  const ArrowContent = ctx.and(ctx.BaseContent('arrow'), ctx.StrokeFields, ctx.ArrowFields, {
    p1: ctx.Position,
    p2: ctx.Position,
  })
  function getArrowGeometriesFromCache(content: Omit<ArrowContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const { arrowPoints, endPoint } = ctx.getArrowPoints(content.p1, content.p2, content)
      const points = [content.p1, endPoint]
      return {
        points: [],
        lines: Array.from(ctx.iteratePolylineLines(points)),
        bounding: ctx.getPointsBounding(points),
        regions: [
          {
            points: arrowPoints,
            lines: Array.from(ctx.iteratePolygonLines(arrowPoints)),
          }
        ],
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
      }
    })
  }
  const React = ctx.React
  return {
    type: 'arrow',
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    move(content, offset) {
      content.p1.x += offset.x
      content.p1.y += offset.y
      content.p2.x += offset.x
      content.p2.y += offset.y
    },
    rotate(content, center, angle) {
      content.p1 = ctx.rotatePositionByCenter(content.p1, center, -angle)
      content.p2 = ctx.rotatePositionByCenter(content.p2, center, -angle)
    },
    mirror(content, line) {
      content.p1 = ctx.getSymmetryPoint(content.p1, line)
      content.p2 = ctx.getSymmetryPoint(content.p2, line)
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, contents }) {
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
      const strokeColor = getStrokeColor(strokeStyleContent)
      const strokeWidth = transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content))
      const { regions, renderingLines } = getArrowGeometriesFromCache(content)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, { strokeColor, strokeWidth }))
      }
      if (regions) {
        for (let i = 0; i < 2 && i < regions.length; i++) {
          children.push(target.renderPolyline(regions[i].points, { strokeWidth: 0, fillColor: strokeColor }))
        }
      }
      return target.renderGroup(children)
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content.p1,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isArrowContent(c)) {
                  return
                }
                c.p1.x += cursor.x - start.x
                c.p1.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
            {
              ...content.p2,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isArrowContent(c)) {
                  return
                }
                c.p2.x += cursor.x - start.x
                c.p2.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
          ]
        }
      })
    },
    getGeometries: getArrowGeometriesFromCache,
    propertyPanel(content, update, contents) {
      return {
        p1: <ctx.ObjectEditor
          inline
          properties={{
            x: <ctx.NumberEditor value={content.p1.x} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p1.x = v } })} />,
            y: <ctx.NumberEditor value={content.p1.y} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p1.y = v } })} />,
          }}
        />,
        p2: <ctx.ObjectEditor
          inline
          properties={{
            x: <ctx.NumberEditor value={content.p2.x} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p2.x = v } })} />,
            y: <ctx.NumberEditor value={content.p2.y} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p2.y = v } })} />,
          }}
        />,
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, ArrowContent, p),
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds,
  }
}

export function isArrowContent(content: model.BaseContent): content is ArrowContent {
  return content.type === 'arrow'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path fill="currentColor" d="M334.5 414c8.8 3.8 19 2 26-4.6l144-136c4.8-4.5 7.5-10.8 7.5-17.4s-2.7-12.9-7.5-17.4l-144-136c-7-6.6-17.2-8.4-26-4.6s-14.5 12.5-14.5 22l0 88L32 208c-17.7 0-32 14.3-32 32l0 32c0 17.7 14.3 32 32 32l288 0 0 88c0 9.6 5.7 18.2 14.5 22z" />
    </svg>
  )
  return {
    name: 'create arrow',
    hotkey: 'AR',
    icon,
    useCommand({ onEnd, type, strokeStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === 'create arrow',
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'arrow',
            p1: c[0],
            p2: c[1],
            strokeStyleId,
          } as ArrowContent)
        }),
        {
          once: true,
        },
      )
      const assistentContents: (ArrowContent)[] = []
      if (line) {
        assistentContents.push({
          type: 'arrow',
          p1: line[0],
          p2: line[1],
          strokeStyleId,
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
