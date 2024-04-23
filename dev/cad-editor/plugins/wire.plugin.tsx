import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type WireContent = model.BaseContent<'wire'> & model.StrokeFields & {
  points: core.Position[]
  refs: model.ContentRef[]
}

export type LampContent = model.BaseContent<'lamp'> & model.StrokeFields & core.Position & {
  size: number
}

export function getModel(ctx: PluginContext): [model.Model<WireContent>, model.Model<LampContent>] {
  const WireContent = ctx.and(ctx.BaseContent('wire'), {
    points: ctx.minItems(2, [ctx.Position]),
    refs: [ctx.ContentRef],
  })
  const LampContent = ctx.and(ctx.BaseContent('lamp'), ctx.Position, {
    size: ctx.number,
  })
  const getIntersectedWires = (content: Omit<WireContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) => {
    const lines = Array.from(ctx.iteratePolylineLines(content.points))
    const wires: WireContent[] = []
    for (const c of ctx.getSortedContents(contents).contents) {
      if (!c) continue
      if (ctx.shallowEquals(c, content)) {
        return wires
      }
      if (isWireContent(c) && ctx.first(ctx.iterateGeometryLinesIntersectionPoints(getWireGeometries(c, contents).lines, lines))) {
        wires.push(c)
      }
    }
    return wires
  }
  const getWireRefIds = (content: Omit<WireContent, "type">): model.RefId[] => [...ctx.getStrokeRefIds(content), ...ctx.toRefIds(content.refs)]
  const getLampRefIds = (content: Omit<LampContent, "type">): model.RefId[] => ctx.getStrokeRefIds(content)
  const wireGeometriesCache = new ctx.WeakmapValuesCache<Omit<WireContent, "type">, model.BaseContent, model.Geometries<{ joints: core.Position[] }>>()
  function getWireGeometries(content: Omit<WireContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getWireRefIds(content), contents, [content]))
    getIntersectedWires(content, contents).forEach(e => refs.add(e))
    return wireGeometriesCache.get(content, refs, () => {
      let lines: core.GeometryLine[] = Array.from(ctx.iteratePolylineLines(content.points))
      const joints: { position: core.Position, count: number }[] = []
      for (const ref of refs) {
        if (isWireContent(ref)) {
          const intersections = Array.from(ctx.iterateGeometryLinesIntersectionPoints(lines, getWireGeometries(ref, contents).lines))
          for (const intersection of intersections) {
            const param = ctx.getGeometryLinesParamAtPoint(intersection, lines)
            if (ctx.isZero(param) || ctx.isSameNumber(lines.length, param)) {
              let joint = joints.find(j => ctx.isSamePoint(j.position, intersection))
              if (!joint) {
                joint = { position: intersection, count: 1 }
                joints.push(joint)
              }
              joint.count++
              continue
            }
            const radian = ctx.getGeometryLinesTangentRadianAtParam(param, lines)
            if (radian === undefined) continue
            const angle = ctx.radianToAngle(radian)
            const radius = 5
            const startPoint = ctx.getPointByLengthAndRadian(intersection, -radius, radian)
            const endPoint = ctx.getPointByLengthAndRadian(intersection, radius, radian)
            lines = [
              ...ctx.getPartOfGeometryLines(0, ctx.getGeometryLinesParamAtPoint(startPoint, lines), lines),
              { type: 'arc', curve: { x: intersection.x, y: intersection.y, r: radius, startAngle: angle, endAngle: ctx.reverseAngle(angle) } },
              ...ctx.getPartOfGeometryLines(ctx.getGeometryLinesParamAtPoint(endPoint, lines), lines.length, lines),
            ]
          }
        } else if (isLampContent(ref)) {
          const params = ctx.deduplicate(Array.from(ctx.iterateGeometryLinesIntersectionPoints(lines, getLampGeometries(ref, contents).lines)).map(p => ctx.getGeometryLinesParamAtPoint(p, lines)), ctx.isSameNumber)
          if (params.length === 1) {
            const param = params[0]
            if (param < lines.length / 2) {
              lines = ctx.getPartOfGeometryLines(param, lines.length, lines)
            } else {
              lines = ctx.getPartOfGeometryLines(0, param, lines)
            }
          } else if (params.length > 1) {
            lines = [
              ...ctx.getPartOfGeometryLines(0, Math.min(...params), lines),
              ...ctx.getPartOfGeometryLines(Math.max(...params), lines.length, lines),
            ]
          }
        }
      }
      const validJoints = joints.filter(j => j.count === 3).map(j => j.position)
      return {
        lines,
        joints: validJoints,
        bounding: ctx.getPointsBounding(content.points),
        regions: validJoints.length > 0 ? [] : undefined,
        renderingLines: lines.map(line => ctx.dashedPolylineToLines(ctx.getGeometryLinesPoints([line]), content.dashArray)).flat(),
      }
    })
  }
  function getLampGeometries(content: Omit<LampContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getLampRefIds(content), contents, [content]))
    const arc = ctx.circleToArc({ x: content.x, y: content.y, r: content.size })
    return ctx.getGeometriesFromCache(content, refs, () => {
      const size = content.size * Math.SQRT1_2
      const lineSegments: [core.Position, core.Position][] = [
        [{ x: content.x - size, y: content.y - size }, { x: content.x + size, y: content.y + size }],
        [{ x: content.x - size, y: content.y + size }, { x: content.x + size, y: content.y - size }],
      ]
      const points = ctx.arcToPolyline(arc, ctx.defaultAngleDelta)
      return {
        lines: [{ type: 'arc', curve: arc }, ...lineSegments],
        bounding: {
          start: { x: content.x - content.size, y: content.y - content.size },
          end: { x: content.x + content.size, y: content.y + content.size },
        },
        renderingLines: [
          ...ctx.dashedPolylineToLines(points, content.dashArray),
          ...lineSegments.map(s => ctx.dashedPolylineToLines(s, content.dashArray)).flat(),
        ],
      }
    })
  }
  const React = ctx.React
  return [
    {
      type: 'wire',
      ...ctx.strokeModel,
      move(content, offset) {
        for (const point of content.points) {
          ctx.movePoint(point, offset)
        }
      },
      render(content, renderCtx) {
        const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
        const { renderingLines, joints } = getWireGeometries(content, renderCtx.contents)
        return target.renderGroup([
          ...renderingLines.map(line => target.renderPolyline(line, options)),
          ...joints.map(joint => target.renderCircle(joint.x, joint.y, 1, { fillColor: 0x000000 }))
        ])
      },
      getGeometries: getWireGeometries,
      propertyPanel(content, update, contents) {
        return {
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        }
      },
      isValid: (c, p) => ctx.validate(c, WireContent, p),
      getRefIds: getWireRefIds,
      updateRefId(content, update) {
        for (const [i, id] of content.refs.entries()) {
          const newRefId = update(id)
          if (newRefId !== undefined) {
            content.refs[i] = newRefId
          }
        }
        ctx.updateStrokeRefIds(content, update)
      },
      deleteRefId(content, ids) {
        for (const id of ids) {
          const index = content.refs.indexOf(id)
          if (index >= 0) {
            content.refs.splice(index, 1)
          }
        }
        ctx.deleteStrokeRefIds(content, ids)
      },
    },
    {
      type: 'lamp',
      ...ctx.strokeModel,
      move(content, offset) {
        ctx.movePoint(content, offset)
      },
      render(content, renderCtx) {
        const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
        const geometries = getLampGeometries(content, renderCtx.contents)
        const children = [target.renderCircle(content.x, content.y, content.size, options)]
        for (const line of geometries.lines) {
          if (Array.isArray(line)) {
            children.push(target.renderPolyline(line, options))
          }
        }
        return target.renderGroup(children)
      },
      getGeometries: getLampGeometries,
      getEditPoints(content, contents) {
        return ctx.getEditPointsFromCache(content, () => {
          const editPoints: core.EditPoint<model.BaseContent>[] = [{
            x: content.x,
            y: content.y,
            cursor: 'move',
            update(c, { cursor, start, target }) {
              if (!isLampContent(c)) {
                return
              }
              c.x += cursor.x - start.x
              c.y += cursor.y - start.y
              return {
                updateRelatedContents() {
                  const index = ctx.getContentIndex(content, contents)
                  const targetIndex = target ? ctx.getContentIndex(target.content, contents) : undefined
                  const [, patches, reversePatches] = ctx.produceWithPatches(contents, draft => {
                    for (let i = 0; i < draft.length; i++) {
                      const c = draft[i]
                      if (!c) continue
                      if (i === targetIndex && isWireContent(c)) {
                        if (!c.refs.includes(index)) {
                          c.refs.push(index)
                        }
                      } else {
                        ctx.getContentModel(c)?.deleteRefId?.(c, [index])
                      }
                    }
                  })
                  return { patches, reversePatches }
                },
              }
            },
          }]
          return { editPoints }
        })
      },
      propertyPanel(content, update, contents) {
        return {
          size: <ctx.NumberEditor value={content.size} setValue={(v) => update(c => { if (isLampContent(c)) { c.size = v } })} />,
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        }
      },
      isValid: (c, p) => ctx.validate(c, LampContent, p),
      getRefIds: getLampRefIds,
      updateRefId: ctx.updateStrokeRefIds,
      deleteRefId: ctx.deleteStrokeRefIds,
    },
  ]
}

export function isWireContent(content: model.BaseContent): content is WireContent {
  return content.type === 'wire'
}

export function isLampContent(content: model.BaseContent): content is LampContent {
  return content.type === 'lamp'
}

export function getCommand(ctx: PluginContext): Command[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon1 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="4,4 97,4 97,96" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  const icon2 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></circle>
      <polyline points="18,18 82,82" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="18,82 82,18" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return [
    {
      name: 'create wire',
      useCommand({ onEnd, type, strokeStyleId }) {
        const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
          type === 'create wire',
          (c) => onEnd({
            updateContents: (contents) => contents.push({ points: c, refs: [], strokeStyleId, type: 'wire' } as WireContent)
          }),
        )
        const assistentContents: WireContent[] = []
        if (line) {
          assistentContents.push({ points: line, refs: [], strokeStyleId, type: 'wire' })
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
      icon: icon1,
    },
    {
      name: 'create lamp',
      useCommand({ onEnd, type, strokeStyleId }) {
        const [lamp, setLamp] = React.useState<LampContent>()
        const [wireId, setWireId] = React.useState<number>()
        const reset = () => {
          setWireId(undefined)
          setLamp(undefined)
        }
        const assistentContents: LampContent[] = []
        if (lamp) {
          assistentContents.push(lamp)
        }
        return {
          onStart: (p) => {
            onEnd({
              updateContents: (contents) => {
                if (wireId !== undefined) {
                  const content = contents[wireId]
                  if (content && isWireContent(content)) {
                    content.refs.push(contents.length)
                  }
                }
                contents.push({ x: p.x, y: p.y, size: 5, strokeStyleId, type: 'lamp' } as LampContent)
              }
            })
          },
          onMove(p, _, target) {
            if (!type) return
            setWireId(target?.id)
            setLamp({ x: p.x, y: p.y, size: 5, strokeStyleId, type: 'lamp' })
          },
          assistentContents,
          reset,
        }
      },
      selectCount: 0,
      icon: icon2,
    },
  ]
}
