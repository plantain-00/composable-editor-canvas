import type { PluginContext } from './types'
import type * as core from '../../../src'
import type * as model from '../model'
import type { Command } from '../command'
import type { LineContent } from './line-polyline.plugin'

export type LeadContent = model.BaseContent<'lead'> & model.StrokeFields & model.ArrowFields & model.TextFields & {
  ref?: model.ContentRef
  points: core.Position[]
  text: string
  toleranceSymbolId?: number
  bordered?: boolean
}

export function getModel(ctx: PluginContext): model.Model<LeadContent> {
  const LeadContent = ctx.and(ctx.BaseContent('lead'), ctx.StrokeFields, ctx.ArrowFields, ctx.TextFields, {
    ref: ctx.optional(ctx.ContentRef),
    points: [ctx.Position],
    text: ctx.string,
    toleranceSymbolId: ctx.optional(ctx.number),
    bordered: ctx.optional(ctx.boolean),
  })
  const getRefIds = (content: Omit<LeadContent, "type">): model.RefId[] => [...ctx.getStrokeRefIds(content), ...ctx.toRefId(content.ref)]
  const leadCache = new ctx.WeakmapValuesCache<Omit<LeadContent, "type">, model.BaseContent, model.Geometries<{ right: boolean, last: core.Position, first: core.Position, padding: number }>>()
  function getLeadGeometriesFromCache(content: Omit<LeadContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]))
    return leadCache.get(content, refs, () => {
      const ref = ctx.getReference(content.ref, contents, (c): c is model.BaseContent => !ctx.shallowEquals(c, content))
      let p0 = content.points[0]
      let line: core.GeometryLine | undefined
      if (ref && content.points.length > 1) {
        const lines = ctx.getContentModel(ref)?.getGeometries?.(ref, contents)?.lines
        if (lines) {
          const p = ctx.getPerpendicularPointToGeometryLines(content.points[1], lines)
          if (p) {
            p0 = p.point
            line = p.line
          }
        }
      }
      let points: core.Position[]
      let arrow: core.Position[] | undefined
      if (content.points.length > 1) {
        const arrowPoints = ctx.getArrowPoints(content.points[1], p0, content)
        arrow = arrowPoints.arrowPoints
        points = [arrowPoints.endPoint, ...content.points.slice(1)]
      } else {
        points = []
      }
      let extendLine: core.GeometryLine | undefined
      if (line) {
        const { start, end } = ctx.getGeometryLineStartAndEnd(line)
        if (start && (!end || ctx.getTwoPointsDistance(start, p0) < ctx.getTwoPointsDistance(end, p0))) {
          const param0 = ctx.getGeometryLineParamAtPoint(p0, line, true)
          line = ctx.getPartOfGeometryLine(param0, 0, line)
          const marginParam = ctx.getGeometryLineParamByLength(line, -ctx.dimensionStyle.margin)
          if (marginParam !== undefined) {
            extendLine = ctx.getPartOfGeometryLine(marginParam, 1, line)
          }
        } else if (end && (!start || ctx.getTwoPointsDistance(end, p0) < ctx.getTwoPointsDistance(start, p0))) {
          const param0 = ctx.getGeometryLineParamAtPoint(p0, line)
          line = ctx.getPartOfGeometryLine(param0, 1, line)
          const marginParam = ctx.getGeometryLineParamByLength(line, -ctx.dimensionStyle.margin)
          if (marginParam !== undefined) {
            extendLine = ctx.getPartOfGeometryLine(marginParam, 1, line)
          }
        }
      }
      const size = ctx.getTextSize(ctx.getTextStyleFont(content), content.text)
      if (!size) {
        throw 'not supported'
      }
      const previous = content.points[content.points.length - 2]
      const last = content.points[content.points.length - 1]
      const right = !previous || previous.x <= last.x
      const padding = content.fontSize / 4
      const toleranceSymbol = content.toleranceSymbolId !== undefined ? toleranceSymbols[content.toleranceSymbolId] : undefined
      const width = (size.width + content.fontSize * (toleranceSymbol ? 1 : 0) + padding * (toleranceSymbol ? 4 : 2)) * (right ? 1 : -1)
      const height = Math.max(size.height, content.fontSize) / 2 + padding
      const textPoints = [
        { x: last.x, y: last.y - height },
        { x: last.x + width, y: last.y - height },
        { x: last.x + width, y: last.y + height },
        { x: last.x, y: last.y + height },
      ]
      const lines: core.GeometryLine[] = Array.from(ctx.iteratePolylineLines(points))
      const renderingLines: core.Position[][] = ctx.dashedPolylineToLines(points, content.dashArray)
      if (extendLine) {
        lines.push(extendLine)
        renderingLines.push(...ctx.dashedPolylineToLines(ctx.getGeometryLinesPoints([extendLine])))
      }
      return {
        lines,
        first: p0,
        last,
        right,
        padding,
        bounding: ctx.mergeBoundings([ctx.getGeometryLinesBounding(lines), ctx.getPointsBounding(textPoints)]),
        regions: [
          {
            points: textPoints,
            lines: Array.from(ctx.iteratePolygonLines(textPoints)),
          },
          ...(arrow ? [{
            points: arrow,
            lines: Array.from(ctx.iteratePolygonLines(arrow)),
          }] : []),
        ],
        renderingLines,
      }
    })
  }
  const React = ctx.React
  return {
    type: 'lead',
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    ...ctx.textModel,
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
      content.fontSize *= Math.abs(sx)
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line)
      }
    },
    render(content, renderCtx) {
      const { options, target, contents, fillOptions } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const { regions, renderingLines, last, right, padding } = getLeadGeometriesFromCache(content, contents)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, options))
      }
      if (regions && regions.length > 1) {
        children.push(target.renderPolygon(regions[1].points, fillOptions))
      }
      if (content.bordered && regions && regions.length > 0) {
        children.push(target.renderPolygon(regions[0].points, options))
      }
      const textStyleContent = ctx.getTextStyleContent(content, contents)
      const color = renderCtx.transformColor(textStyleContent.color)
      let cacheKey: object | undefined
      if (renderCtx.isAssistence) {
        cacheKey = ctx.assistentTextCache.get(content.text, textStyleContent.fontSize, textStyleContent.color)
      }
      if (!cacheKey) {
        cacheKey = content
      }
      let textX = last.x
      const toleranceSymbol = content.toleranceSymbolId !== undefined ? toleranceSymbols[content.toleranceSymbolId] : undefined
      if (toleranceSymbol) {
        children.push(target.renderGroup([
          toleranceSymbol(target, textStyleContent.fontSize, options),
        ], { translate: { x: last.x + textStyleContent.fontSize * (right ? 0 : -1) + padding * (right ? 1 : -1), y: last.y - textStyleContent.fontSize / 2 } }))
        textX += (textStyleContent.fontSize + padding * 2) * (right ? 1 : -1)
        if (content.bordered && regions && regions.length > 0) {
          children.push(target.renderPolyline([{ x: textX, y: regions[0].points[0].y }, { x: textX, y: regions[0].points[2].y }], options))
        }
      }
      textX += padding * (right ? 1 : -1)
      const textOptions = ctx.getTextStyleRenderOptionsFromRenderContext(color, renderCtx)
      children.push(target.renderText(textX, last.y, content.text, color, textStyleContent.fontSize, textStyleContent.fontFamily, { cacheKey, ...textOptions, textBaseline: 'middle', textAlign: right ? 'left' : 'right' }))
      return target.renderGroup(children)
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const geometries = getLeadGeometriesFromCache(content, contents)
        return {
          editPoints: content.points.map((p, i) => {
            if (i === 0) {
              p = geometries.first
            }
            return {
              ...p,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isLeadContent(c)) {
                  return
                }
                c.points[i].x += cursor.x - start.x
                c.points[i].y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            }
          })
        }
      })
    },
    getSnapPoints(content, contents) {
      return ctx.getSnapPointsFromCache(content, () => {
        const geometries = getLeadGeometriesFromCache(content, contents)
        return content.points.map((p, i) => {
          if (i === 0) {
            p = geometries.first
          }
          return { ...p, type: 'endpoint' as const }
        })
      })
    },
    getGeometries: getLeadGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        ref: [
          <ctx.BooleanEditor value={content.ref !== undefined} readOnly={content.ref === undefined} setValue={(v) => update(c => { if (isLeadContent(c) && !v) { c.ref = undefined } })} />,
          typeof content.ref === 'number' ? <ctx.NumberEditor value={content.ref} setValue={(v) => update(c => { if (isLeadContent(c)) { c.ref = v } })} /> : undefined,
        ],
        points: <ctx.ArrayEditor
          inline
          {...ctx.getArrayEditorProps<core.Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isLeadContent(c)) { v(c) } }))}
          items={content.points.map((f, i) => <ctx.ObjectEditor
            inline
            properties={{
              from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isLeadContent(c)) { c.points[i].x = p.x, c.points[i].y = p.y } }))}>canvas</ctx.Button>,
              x: <ctx.NumberEditor value={f.x} setValue={(v) => update(c => { if (isLeadContent(c)) { c.points[i].x = v } })} />,
              y: <ctx.NumberEditor value={f.y} setValue={(v) => update(c => { if (isLeadContent(c)) { c.points[i].y = v } })} />,
            }}
          />)}
        />,
        text: <ctx.StringEditor textarea value={content.text} setValue={(v) => update(c => { if (isLeadContent(c)) { c.text = v } })} />,
        toleranceSymbolId: [
          <ctx.BooleanEditor value={content.toleranceSymbolId !== undefined} setValue={(v) => update(c => { if (isLeadContent(c)) { c.toleranceSymbolId = v ? 0 : undefined } })} />,
          content.toleranceSymbolId !== undefined ? <ctx.EnumEditor
            enums={toleranceSymbols.map((_, i) => i)}
            enumTitles={toleranceSymbols.map(s => ctx.reactSvgRenderTarget.renderResult([s(ctx.reactSvgRenderTarget, 13)], 13, 13))}
            value={content.toleranceSymbolId}
            setValue={(v) => update(c => { if (isLeadContent(c)) { c.toleranceSymbolId = v } })}
          /> : undefined
        ],
        bordered: <ctx.BooleanEditor value={content.bordered ?? false} setValue={(v) => update(c => { if (isLeadContent(c)) { c.bordered = v } })} />,
        ...ctx.getTextContentPropertyPanel(content, update, contents),
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    editPanel(content, scale, update, contents, cancel, transformPosition) {
      const p = transformPosition(content.points[content.points.length - 1])
      const textStyleContent = ctx.getTextStyleContent(content, contents)
      const fontSize = textStyleContent.fontSize * scale
      return (
        <ctx.StringEditor
          style={{
            zIndex: 10,
            position: 'absolute',
            left: `${p.x - 1}px`,
            top: `${p.y - fontSize - 1}px`,
            fontSize: `${fontSize}px`,
            fontFamily: content.fontFamily,
            color: ctx.getColorString(content.color),
            padding: '0px',
          }}
          textarea
          autoFocus
          onCancel={cancel}
          value={content.text}
          setValue={(v) => {
            update(c => { if (isLeadContent(c)) { c.text = v } })
          }}
        />
      )
    },
    isValid: (c, p) => ctx.validate(c, LeadContent, p),
    getRefIds,
    updateRefId(content, update) {
      if (content.ref !== undefined) {
        const newRefId = update(content.ref)
        if (newRefId !== undefined) {
          content.ref = newRefId
        }
      }
      ctx.updateStrokeRefIds(content, update)
    },
    deleteRefId(content, ids) {
      if (content.ref && ids.includes(content.ref)) {
        content.ref = undefined
      }
      ctx.deleteStrokeRefIds(content, ids)
    },
  }
}

export function isLeadContent(content: model.BaseContent): content is LeadContent {
  return content.type === 'lead'
}

const toleranceSymbols: (<V, P>(target: core.ReactRenderTarget<V, P>, size: number, options?: Partial<core.PathOptions<V>>) => V)[] = [
  (target, size, options) => target.renderPolyline([{ x: 0, y: size * 0.5 }, { x: size, y: size * 0.5 }], options),
  (target, size, options) => target.renderPolygon([{ x: 0, y: size }, { x: size * 0.7, y: size }, { x: size, y: 0 }, { x: size * 0.3, y: 0 }], options),
  (target, size, options) => target.renderCircle(size * 0.5, size * 0.5, size * 0.48, options),
  (target, size, options) => target.renderGroup([
    target.renderCircle(size * 0.5, size * 0.5, size * 0.25, options),
    target.renderPolyline([{ x: 0, y: size }, { x: size * 0.4, y: 0 }], options),
    target.renderPolyline([{ x: size, y: 0 }, { x: size * 0.6, y: size }], options),
  ]),
  (target, size, options) => target.renderArc(size * 0.5, size * 0.7, size * 0.48, -180, 0, options),
  (target, size, options) => target.renderArc(size * 0.5, size * 0.7, size * 0.48, -180, 0, { ...options, closed: true }),
  (target, size, options) => target.renderGroup([
    target.renderPolyline([{ x: 0, y: size }, { x: size * 0.4, y: 0 }], options),
    target.renderPolyline([{ x: size, y: 0 }, { x: size * 0.6, y: size }], options),
  ]),
  (target, size, options) => target.renderGroup([
    target.renderPolyline([{ x: 0, y: size }, { x: size, y: size }], options),
    target.renderPolyline([{ x: size * 0.5, y: 0 }, { x: size * 0.5, y: size }], options),
  ]),
  (target, size, options) => target.renderPolyline([{ x: size, y: size }, { x: 0, y: size }, { x: size, y: 0 }], options),
  (target, size, options) => target.renderGroup([
    target.renderCircle(size * 0.5, size * 0.5, size * 0.25, options),
    target.renderPolyline([{ x: size * 0.5, y: 0 }, { x: size * 0.5, y: size }], options),
    target.renderPolyline([{ x: 0, y: size * 0.5 }, { x: size, y: size * 0.5 }], options),
  ]),
  (target, size, options) => target.renderGroup([
    target.renderCircle(size * 0.5, size * 0.5, size * 0.25, options),
    target.renderCircle(size * 0.5, size * 0.5, size * 0.45, options),
  ]),
  (target, size, options) => target.renderGroup([
    target.renderPolyline([{ x: 0, y: size * 0.5 }, { x: size, y: size * 0.5 }], options),
    target.renderPolyline([{ x: size * 0.25, y: size * 0.25 }, { x: size * 0.75, y: size * 0.25 }], options),
    target.renderPolyline([{ x: size * 0.25, y: size * 0.75 }, { x: size * 0.75, y: size * 0.75 }], options),
  ]),
  (target, size, options) => target.renderGroup([
    target.renderPolyline([{ x: size * 0.2, y: size }, { x: size * 0.8, y: 0 }], options),
    target.renderPolyline([{ x: size * 0.35, y: size * 0.4 }, { x: size * 0.8, y: 0 }, { x: size * 0.65, y: size * 0.55 }], options),
  ]),
  (target, size, options) => target.renderGroup([
    target.renderPolyline([{ x: size * 0.4, y: 0 }, { x: 0, y: size }, { x: size * 0.6, y: size }, { x: size, y: 0 }], options),
    target.renderPolyline([{ x: 0, y: size * 0.4 }, { x: size * 0.4, y: 0 }, { x: size * 0.35, y: size * 0.55 }], options),
    target.renderPolyline([{ x: size * 0.6, y: size * 0.4 }, { x: size, y: 0 }, { x: size * 0.95, y: size * 0.55 }], options),
  ]),
]

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="47,4 96,4" strokeWidth="8" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="71,4 71,54" strokeWidth="8" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polyline points="46,29 5,92" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeOpacity="1" fill="none" stroke="currentColor"></polyline>
      <polygon points="0,100 12,62 30,73" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'create lead',
    icon,
    useCommand({ onEnd, type, scale, textStyleId, transformPosition, contents }) {
      const [lead, setLead] = React.useState<LeadContent>()
      const [editText, setEditText] = React.useState(false)
      let message = ''
      if (type && !editText) {
        message = 'press Enter to end'
      }
      const { input, clearText, setCursorPosition, setInputPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === 'Enter') {
          if (text) {
            clearText()
          } else if (lead) {
            setEditText(true)
            setLead(ctx.produce(lead, draft => {
              draft.text = ''
              draft.points.splice(draft.points.length - 1, 1)
            }))
            e.preventDefault()
          }
        }
      } : undefined)
      const reset = () => {
        setLead(undefined)
        resetInput()
        setEditText(false)
      }
      const assistentContents: LeadContent[] = []
      let panel: JSX.Element | undefined
      if (type) {
        if (lead) {
          assistentContents.push(lead)
          if (editText) {
            const last = lead.points[lead.points.length - 1]
            const p = transformPosition(last)
            const textStyleContent = ctx.getTextStyleContent(lead, contents)
            const fontSize = textStyleContent.fontSize * scale
            panel = (
              <ctx.StringEditor
                style={{
                  zIndex: 10,
                  position: 'absolute',
                  left: `${p.x - 1}px`,
                  top: `${p.y - fontSize - 1}px`,
                  fontSize: `${fontSize}px`,
                  fontFamily: lead.fontFamily,
                  color: ctx.getColorString(lead.color),
                  padding: '0px',
                }}
                textarea
                autoFocus
                onCancel={reset}
                value={lead.text}
                setValue={(v) => {
                  setLead(ctx.produce(lead, draft => {
                    draft.text = v
                  }))
                }}
              />
            )
          }
        }
      }
      return {
        input,
        onStart: (p, target) => {
          if (!type) return
          if (!lead) {
            setLead({
              type: 'lead',
              text: 'abc',
              textStyleId,
              color: 0x000000,
              fontSize: 16 / scale,
              fontFamily: 'monospace',
              points: [p, p],
              ref: target?.id,
            })
          } else if (editText) {
            onEnd({
              updateContents: (contents) => contents.push(lead)
            })
            reset()
          } else {
            const last = lead.points[lead.points.length - 1]
            setLead(ctx.produce(lead, draft => {
              draft.points.push(last)
            }))
          }
        },
        onMove(p, viewportPosition) {
          if (!type) return
          if (editText) return
          setInputPosition(viewportPosition || p)
          setCursorPosition(p)
          if (lead) {
            setLead(ctx.produce(lead, draft => {
              draft.points[lead.points.length - 1] = p
            }))
          }
        },
        assistentContents,
        reset,
        panel,
      }
    },
    selectCount: 0,
  }
}
