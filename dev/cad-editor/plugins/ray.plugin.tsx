import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type RayContent = model.BaseContent<'ray'> & model.StrokeFields & core.Ray

export function getModel(ctx: PluginContext) {
  const RayContent = ctx.and(ctx.BaseContent('ray'), ctx.StrokeFields, ctx.Ray)
  const React = ctx.React
  function getRayGeometries(content: Omit<RayContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      return {
        lines: [{ type: 'ray', line: content }],
        renderingLines: [],
      }
    })
  }
  const rayModel: model.Model<RayContent> = {
    type: 'ray',
    ...ctx.strokeModel,
    move(content, offset) {
      ctx.movePoint(content, offset)
    },
    rotate(content, center, angle) {
      ctx.rotatePoint(content, center, angle)
      content.angle += angle
    },
    mirror(content, line, angle) {
      ctx.mirrorPoint(content, line)
      content.angle = 2 * angle - content.angle
    },
    break(content, intersectionPoints) {
      return ctx.breakGeometryLines(getRayGeometries(content).lines, intersectionPoints).flat().map(n => ctx.geometryLineToContent(n))
    },
    offset(content, point, distance) {
      if (!distance) {
        distance = ctx.getPointAndRayNearestPointAndDistance(point, content).distance
      }
      const index = ctx.pointSideToIndex(ctx.getPointSideOfGeometryLine(point, { type: 'ray', line: content }))
      return ctx.getParallelRaysByDistance(content, distance)[index]
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      return target.renderRay(content.x, content.y, content.angle, { ...options, bidirectional: content.bidirectional })
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({
        editPoints: [{
          x: content.x,
          y: content.y,
          cursor: 'move',
          type: 'move',
          update(c, { cursor, start, scale }) {
            if (!isRayContent(c)) {
              return
            }
            c.x += cursor.x - start.x
            c.y += cursor.y - start.y
            return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
          },
        }]
      }))
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        return [{ x: content.x, y: content.y, type: 'endpoint' }]
      })
    },
    getGeometries: getRayGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isRayContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isRayContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isRayContent(c)) { c.y = v } })} />,
        angle: <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isRayContent(c)) { c.angle = v } })} />,
        bidirectional: <ctx.BooleanEditor value={content.bidirectional || false} setValue={(v) => update(c => { if (isRayContent(c)) { c.bidirectional = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, RayContent, p),
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    reverse: content => ({ ...content, ...ctx.reverseRay(content) }),
  }
  return rayModel
}

export function isRayContent(content: model.BaseContent): content is RayContent {
  return content.type === 'ray'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="10" cy="87" r="12" strokeWidth="0" vectorEffect="non-scaling-stroke" fill="currentColor" stroke="#000000"></circle>
      <polyline points="10,87 87,9" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create ray',
    useCommand({ onEnd, type, strokeStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === 'create ray',
        (c) => onEnd({
          updateContents: (contents) => contents.push({ type: 'ray', x: c[0].x, y: c[0].y, angle: ctx.radianToAngle(ctx.getTwoPointsRadian(c[1], c[0])), strokeStyleId } as RayContent)
        }),
        { once: true },
      )
      const assistentContents: RayContent[] = []
      if (line && line.length > 1) {
        const start = line[line.length - 2]
        const end = line[line.length - 1]
        const angle = ctx.radianToAngle(ctx.getTwoPointsRadian(end, start))
        assistentContents.push({ type: 'ray', x: start.x, y: start.y, angle, strokeStyleId })
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
    icon,
  }
}
