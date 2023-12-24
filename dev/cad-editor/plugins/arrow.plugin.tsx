import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type ArrowContent = model.BaseContent<'arrow'> & model.StrokeFields & model.ArrowFields & {
  p1: core.Position
  p2: core.Position
  ref1?: model.PositionRef
  ref2?: model.PositionRef
}

export function getModel(ctx: PluginContext): model.Model<ArrowContent> {
  const ArrowContent = ctx.and(ctx.BaseContent('arrow'), ctx.StrokeFields, ctx.ArrowFields, {
    p1: ctx.Position,
    p2: ctx.Position,
    ref1: ctx.optional(ctx.PositionRef),
    ref2: ctx.optional(ctx.PositionRef),
  })
  const arrowCache = new ctx.WeakmapCache3<Omit<ArrowContent, "type">, core.Position, core.Position, model.Geometries>()
  function getArrowGeometriesFromCache(content: Omit<ArrowContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const p1 = ctx.getRefPosition(content.ref1, contents) ?? content.p1
    const p2 = ctx.getRefPosition(content.ref2, contents) ?? content.p2
    return arrowCache.get(content, p1, p2, () => {
      const { arrowPoints, endPoint } = ctx.getArrowPoints(p1, p2, content)
      const points = [p1, endPoint]
      return {
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
      ctx.movePoint(content.p1, offset)
      ctx.movePoint(content.p2, offset)
    },
    rotate(content, center, angle) {
      content.p1 = ctx.rotatePositionByCenter(content.p1, center, -angle)
      content.p2 = ctx.rotatePositionByCenter(content.p2, center, -angle)
    },
    mirror(content, line) {
      content.p1 = ctx.getSymmetryPoint(content.p1, line)
      content.p2 = ctx.getSymmetryPoint(content.p2, line)
    },
    render(content, renderCtx) {
      const { options, target, contents, fillOptions } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const { regions, renderingLines } = getArrowGeometriesFromCache(content, contents)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, options))
      }
      if (regions) {
        for (let i = 0; i < 2 && i < regions.length; i++) {
          children.push(target.renderPolygon(regions[i].points, fillOptions))
        }
      }
      return target.renderGroup(children)
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content.p1,
              cursor: 'move',
              update(c, { cursor, start, scale, target }) {
                if (!isArrowContent(c)) {
                  return
                }
                c.p1.x += cursor.x - start.x
                c.p1.y += cursor.y - start.y
                c.ref1 = ctx.getSnapTargetRef(target, contents)
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
            {
              ...content.p2,
              cursor: 'move',
              update(c, { cursor, start, scale, target }) {
                if (!isArrowContent(c)) {
                  return
                }
                c.p2.x += cursor.x - start.x
                c.p2.y += cursor.y - start.y
                c.ref2 = ctx.getSnapTargetRef(target, contents)
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
          ]
        }
      })
    },
    getGeometries: getArrowGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        p1: <ctx.ObjectEditor
          inline
          properties={{
            from: <ctx.Button onClick={() => acquirePoint((p, ref) => update(c => { if (isArrowContent(c)) { c.p1.x = p.x; c.p1.y = p.y; c.ref1 = ref } }))}>canvas</ctx.Button>,
            x: <ctx.NumberEditor value={content.p1.x} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p1.x = v } })} />,
            y: <ctx.NumberEditor value={content.p1.y} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p1.y = v } })} />,
          }}
        />,
        p2: <ctx.ObjectEditor
          inline
          properties={{
            from: <ctx.Button onClick={() => acquirePoint((p, ref) => update(c => { if (isArrowContent(c)) { c.p2.x = p.x; c.p2.y = p.y; c.ref2 = ref } }))}>canvas</ctx.Button>,
            x: <ctx.NumberEditor value={content.p2.x} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p2.x = v } })} />,
            y: <ctx.NumberEditor value={content.p2.y} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p2.y = v } })} />,
          }}
        />,
        ref1: [
          <ctx.BooleanEditor value={content.ref1 !== undefined} readOnly={content.ref1 === undefined} setValue={(v) => update(c => { if (isArrowContent(c) && !v) { c.ref1 = undefined } })} />,
          content.ref1 !== undefined && typeof content.ref1.id === 'number' ? <ctx.NumberEditor value={content.ref1.id} setValue={(v) => update(c => { if (isArrowContent(c) && c.ref1) { c.ref1.id = v } })} /> : undefined,
          content.ref1 !== undefined ? <ctx.NumberEditor value={content.ref1.snapIndex} setValue={(v) => update(c => { if (isArrowContent(c) && c.ref1) { c.ref1.snapIndex = v } })} /> : undefined,
          content.ref1?.param !== undefined ? <ctx.NumberEditor readOnly value={content.ref1.param} /> : undefined,
        ],
        ref2: [
          <ctx.BooleanEditor value={content.ref2 !== undefined} readOnly={content.ref2 === undefined} setValue={(v) => update(c => { if (isArrowContent(c) && !v) { c.ref2 = undefined } })} />,
          content.ref2 !== undefined && typeof content.ref2.id === 'number' ? <ctx.NumberEditor value={content.ref2.id} setValue={(v) => update(c => { if (isArrowContent(c) && c.ref2) { c.ref2.id = v } })} /> : undefined,
          content.ref2 !== undefined ? <ctx.NumberEditor value={content.ref2.snapIndex} setValue={(v) => update(c => { if (isArrowContent(c) && c.ref2) { c.ref2.snapIndex = v } })} /> : undefined,
          content.ref2?.param !== undefined ? <ctx.NumberEditor readOnly value={content.ref2.param} /> : undefined,
        ],
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, ArrowContent, p),
    getRefIds: (content) => [
      ...ctx.getStrokeRefIds(content),
      ...(content.ref1 && typeof content.ref1.id === 'number' ? [content.ref1.id] : []),
      ...(content.ref2 && typeof content.ref2.id === 'number' ? [content.ref2.id] : []),
    ],
    updateRefId(content, update) {
      if (content.ref1) {
        const newRefId = update(content.ref1.id)
        if (newRefId !== undefined) {
          content.ref1.id = newRefId
        }
      }
      if (content.ref2) {
        const newRefId = update(content.ref2.id)
        if (newRefId !== undefined) {
          content.ref2.id = newRefId
        }
      }
      ctx.updateStrokeRefIds(content, update)
    },
    reverse: (content) => ({
      ...content,
      p1: content.p2,
      p2: content.p1,
      ref1: content.ref2,
      ref2: content.ref1,
    }),
  }
}

export function isArrowContent(content: model.BaseContent): content is ArrowContent {
  return content.type === 'arrow'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <g transform=""><polyline points="12,86 81,20" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline><polyline points="88,14 72,39 62,28" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polyline></g>
    </svg>
  )
  return {
    name: 'create arrow',
    hotkey: 'AR',
    icon,
    useCommand({ onEnd, type, strokeStyleId }) {
      const { line, positionTargets, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate<model.SnapTarget>(
        type === 'create arrow',
        (c, targets) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'arrow',
            p1: c[0],
            p2: c[1],
            ref1: targets[0],
            ref2: targets[1],
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
          ref1: positionTargets[0],
          ref2: positionTargets[1],
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
