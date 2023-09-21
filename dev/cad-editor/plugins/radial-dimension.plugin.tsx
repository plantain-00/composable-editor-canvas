import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { ArcContent, CircleContent, isArcContent, isCircleContent } from './circle-arc.plugin'
import type { LineContent } from './line-polyline.plugin'

export type RadialDimensionReferenceContent = model.BaseContent<'radial dimension reference'> & model.StrokeFields & model.ArrowFields & core.RadialDimension & {
  refId: number | model.BaseContent
}

export function getModel(ctx: PluginContext): model.Model<RadialDimensionReferenceContent> {
  const RadialDimensionReferenceContent = ctx.and(ctx.BaseContent('radial dimension reference'), ctx.StrokeFields, ctx.ArrowFields, ctx.RadialDimension, {
    refId: ctx.or(ctx.number, ctx.Content)
  })
  function getRadialDimensionReferenceGeometriesFromCache(content: Omit<RadialDimensionReferenceContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const target = ctx.getReference(content.refId, contents, contentSelectable)
    if (target) {
      return radialDimensionReferenceLinesCache.get(target, content, () => {
        return ctx.getRadialDimensionGeometries(content, target, {
          arrowAngle: content.arrowAngle ?? ctx.dimensionStyle.arrowAngle,
          arrowSize: content.arrowSize ?? ctx.dimensionStyle.arrowSize,
          margin: ctx.dimensionStyle.margin,
        }, getTextPosition)
      })
    }
    return { lines: [], points: [], renderingLines: [] }
  }
  const radialDimensionReferenceLinesCache = new ctx.WeakmapCache2<Omit<CircleContent | ArcContent, 'type'>, Omit<RadialDimensionReferenceContent, "type">, model.Geometries<{ points: core.Position[], lines: [core.Position, core.Position][] }>>()

  const textPositionMap = new ctx.WeakmapCache2<core.RadialDimension, core.Circle, {
    textPosition: core.Position
    textRotation: number
    size?: core.Size
    text: string
  }>()
  function getTextPosition(content: core.RadialDimension, circle: core.Circle) {
    return textPositionMap.get(content, circle, () => {
      return ctx.getRadialDimensionTextPosition(content, circle, ctx.dimensionStyle.margin, ctx.getTextSizeFromCache)
    })
  }
  const React = ctx.React
  return {
    type: 'radial dimension reference',
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    move(content, offset) {
      content.position.x += offset.x
      content.position.y += offset.y
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, contents }) {
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
      const strokeColor = getStrokeColor(strokeStyleContent)
      const strokeWidth = transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content))
      const { regions, lines } = getRadialDimensionReferenceGeometriesFromCache(content, contents)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of lines) {
        children.push(target.renderPolyline(line, { strokeColor, strokeWidth, dashArray: strokeStyleContent.dashArray }))
      }
      if (regions && regions.length > 0) {
        children.push(target.renderPolyline(regions[0].points, { strokeWidth: 0, fillColor: strokeColor }))
      }
      const referenceTarget = ctx.getReference(content.refId, contents, contentSelectable)
      if (referenceTarget) {
        const { textPosition, textRotation, text } = getTextPosition(content, referenceTarget)
        children.push(target.renderGroup(
          [
            target.renderText(textPosition.x, textPosition.y, text, strokeColor, content.fontSize, content.fontFamily),
          ],
          {
            rotation: textRotation,
            base: textPosition,
          },
        ))
      }

      return target.renderGroup(children)
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              x: content.position.x,
              y: content.position.y,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isRadialDimensionReferenceContent(c)) {
                  return
                }
                c.position.x += cursor.x - start.x
                c.position.y += cursor.y - start.y
                const target = ctx.getReference(c.refId, contents, contentSelectable)
                if (!target || ctx.getTwoPointsDistance(target, c.position) > target.r) {
                  return
                }
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [target, cursor] } as LineContent] }
              },
            }
          ]
        }
      })
    },
    getGeometries: getRadialDimensionReferenceGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint, acquireContent }) {
      return {
        refId: typeof content.refId === 'number' ? <ctx.NumberEditor value={content.refId} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.refId = v } })} /> : [],
        refIdFrom: typeof content.refId === 'number' ? <ctx.Button onClick={() => acquireContent({ count: 1, selectable: (i) => contentSelectable(contents[i[0]]) }, p => update(c => { if (isRadialDimensionReferenceContent(c)) { c.refId = p[0][0] } }))}>canvas</ctx.Button> : [],
        position: <ctx.ObjectEditor
          inline
          properties={{
            from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isRadialDimensionReferenceContent(c)) { c.position.x = p.x, c.position.y = p.y } }))}>canvas</ctx.Button>,
            x: <ctx.NumberEditor value={content.position.x} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.position.x = v } })} />,
            y: <ctx.NumberEditor value={content.position.y} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.position.y = v } })} />,
          }}
        />,
        text: [
          <ctx.BooleanEditor value={content.text !== undefined} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.text = v ? '' : undefined } })} />,
          content.text !== undefined ? <ctx.StringEditor value={content.text} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.text = v } })} /> : undefined,
        ],
        fontSize: <ctx.NumberEditor value={content.fontSize} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.fontSize = v } })} />,
        fontFamily: <ctx.StringEditor value={content.fontFamily} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.fontFamily = v } })} />,
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, RadialDimensionReferenceContent, p),
    getRefIds: (content) => [...ctx.getStrokeRefIds(content), ...(typeof content.refId === 'number' ? [content.refId] : [])],
    updateRefId(content, update) {
      const newRefId = update(content.refId)
      if (newRefId !== undefined) {
        content.refId = newRefId
      }
      ctx.updateStrokeRefIds(content, update)
    },
  }
}

export function isRadialDimensionReferenceContent(content: model.BaseContent): content is RadialDimensionReferenceContent {
  return content.type === 'radial dimension reference'
}

function contentSelectable(content: core.Nullable<model.BaseContent>): content is CircleContent | ArcContent {
  return !!content && (isArcContent(content) || isCircleContent(content))
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="36" cy="64" r="31" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <polyline points="36,64 90,9" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polygon points="75,32 65,22 54,44" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'create radial dimension',
    selectCount: 1,
    icon,
    contentSelectable,
    useCommand({ onEnd, selected, type, strokeStyleId }) {
      const [result, setResult] = React.useState<RadialDimensionReferenceContent>()
      const [text, setText] = React.useState<string>()
      let message = ''
      if (type) {
        message = 'input text'
      }
      const { input, clearText, setCursorPosition, setInputPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === 'Enter') {
          setText(text)
          if (result) {
            setResult({ ...result, text })
          }
          clearText()
        }
      } : undefined)
      const reset = () => {
        setResult(undefined)
        resetInput()
        setText(undefined)
      }
      return {
        input,
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                if (!result.refId && selected.length > 0 && type) {
                  const content = selected[0].content
                  if (contentSelectable(content)) {
                    result.refId = ctx.getContentIndex(content, contents)
                  }
                }
                if (result.refId) {
                  contents.push({
                    type: 'radial dimension reference',
                    position: result.position,
                    fontSize: result.fontSize,
                    fontFamily: result.fontFamily,
                    refId: result.refId,
                    text: result.text,
                    strokeStyleId,
                  } as RadialDimensionReferenceContent)
                }
              },
              nextCommand: type,
            })
            reset()
          }
        },
        onMove(p, viewportPosition) {
          setInputPosition(viewportPosition || p)
          setCursorPosition(p)
          if (selected.length > 0 && type) {
            const content = selected[0].content
            if (contentSelectable(content)) {
              setResult({
                type: 'radial dimension reference',
                position: p,
                fontSize: 16,
                fontFamily: 'monospace',
                refId: selected[0].path[0],
                text,
                strokeStyleId,
              })
            }
          }
        },
        assistentContents: result ? [result] : undefined,
        reset,
      }
    },
  }
}
