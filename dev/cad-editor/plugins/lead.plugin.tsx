import type { PluginContext } from './types'
import type * as core from '../../../src'
import type * as model from '../model'
import type { Command } from '../command'

export type LeadContent = model.BaseContent<'lead'> & model.StrokeFields & model.ArrowFields & model.TextFields & {
  ref?: model.ContentRef
  points: core.Position[]
  text: string
}

export function getModel(ctx: PluginContext): model.Model<LeadContent> {
  const LeadContent = ctx.and(ctx.BaseContent('lead'), ctx.StrokeFields, ctx.ArrowFields, ctx.TextFields, {
    ref: ctx.optional(ctx.ContentRef),
    points: [ctx.Position],
    text: ctx.string,
  })
  const leadCache = new ctx.WeakmapCache<Omit<LeadContent, "type">, model.Geometries<{ right: boolean, last: core.Position }>>()
  const leadCache2 = new ctx.WeakmapCache2<Omit<LeadContent, "type">, model.BaseContent, model.Geometries<{ right: boolean, last: core.Position }>>()
  function getLeadGeometriesByPoints(p0: core.Position, content: Omit<LeadContent, "type">, line?: core.GeometryLine): model.Geometries<{ right: boolean, last: core.Position }> {
    let lines: core.GeometryLine[]
    let arrow: core.Position[] | undefined
    if (content.points.length > 1) {
      const arrowPoints = ctx.getArrowPoints(content.points[1], p0, content)
      arrow = arrowPoints.arrowPoints
      lines = Array.from(ctx.iteratePolylineLines([arrowPoints.endPoint, ...content.points.slice(1)]))
    } else {
      lines = []
    }
    if (line) {
      const { start, end } = ctx.getGeometryLineStartAndEnd(line)
      if (start && (!end || ctx.getTwoPointsDistance(start, p0) < ctx.getTwoPointsDistance(end, p0))) {
        const param0 = ctx.getGeometryLineParamAtPoint(p0, line, true)
        line = ctx.getPartOfGeometryLine(param0, 0, line)
        const marginParam = ctx.getGeometryLineParamByLength(line, -ctx.dimensionStyle.margin)
        if (marginParam !== undefined) {
          lines.push(ctx.getPartOfGeometryLine(marginParam, 1, line))
        }
      } else if (end && (!start || ctx.getTwoPointsDistance(end, p0) < ctx.getTwoPointsDistance(start, p0))) {
        const param0 = ctx.getGeometryLineParamAtPoint(p0, line)
        line = ctx.getPartOfGeometryLine(param0, 1, line)
        const marginParam = ctx.getGeometryLineParamByLength(line, -ctx.dimensionStyle.margin)
        if (marginParam !== undefined) {
          lines.push(ctx.getPartOfGeometryLine(marginParam, 1, line))
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
    const textPoints = [
      { x: last.x, y: last.y - size.height / 2 },
      { x: last.x + size.width * (right ? 1 : -1), y: last.y - size.height / 2 },
      { x: last.x + size.width * (right ? 1 : -1), y: last.y + size.height / 2 },
      { x: last.x, y: last.y + size.height / 2 },
    ]
    const points = lines.map(line => ctx.getGeometryLinesPoints([line]))
    return {
      lines,
      last,
      right,
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
      renderingLines: points.map(p => ctx.dashedPolylineToLines(p, content.dashArray)).flat(),
    }
  }
  function getLeadGeometriesFromCache(content: Omit<LeadContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const ref = ctx.getReference(content.ref, contents)
    if (ref && content.points.length > 1) {
      const lines = ctx.getContentModel(ref)?.getGeometries?.(ref, contents)?.lines
      if (lines) {
        const p = ctx.getPerpendicularPointToGeometryLines(content.points[1], lines)
        return leadCache2.get(content, ref, () => getLeadGeometriesByPoints(p.point, content, p.line))
      }
    }
    return leadCache.get(content, () => getLeadGeometriesByPoints(content.points[0], content))
  }
  const React = ctx.React
  return {
    type: 'lead',
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    ...ctx.textModel,
    render(content, renderCtx) {
      const { options, target, contents, fillOptions } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const { regions, renderingLines, last, right } = getLeadGeometriesFromCache(content, contents)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, options))
      }
      if (regions && regions.length > 1) {
        children.push(target.renderPolygon(regions[1].points, fillOptions))
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
      const textOptions = ctx.getTextStyleRenderOptionsFromRenderContext(color, renderCtx)
      children.push(target.renderText(last.x, last.y, content.text, color, textStyleContent.fontSize, textStyleContent.fontFamily, { cacheKey, ...textOptions, textBaseline: 'middle', textAlign: right ? 'left' : 'right' }))
      return target.renderGroup(children)
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
    getRefIds: (content) => [...ctx.getStrokeRefIds(content), ...(typeof content.ref === 'number' ? [content.ref] : [])],
    updateRefId(content, update) {
      if (content.ref !== undefined) {
        const newRefId = update(content.ref)
        if (newRefId !== undefined) {
          content.ref = newRefId
        }
      }
      ctx.updateStrokeRefIds(content, update)
    },
  }
}

export function isLeadContent(content: model.BaseContent): content is LeadContent {
  return content.type === 'lead'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
