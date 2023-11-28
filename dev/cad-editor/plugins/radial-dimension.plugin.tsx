import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { ArcContent, CircleContent, isArcContent, isCircleContent } from './circle-arc.plugin'
import type { LineContent } from './line-polyline.plugin'

export type RadialDimensionReferenceContent = model.BaseContent<'radial dimension reference'> & model.StrokeFields & model.ArrowFields & core.RadialDimension & {
  ref: model.PartRef
}

export function getModel(ctx: PluginContext): model.Model<RadialDimensionReferenceContent> {
  const RadialDimensionReferenceContent = ctx.and(ctx.BaseContent('radial dimension reference'), ctx.StrokeFields, ctx.ArrowFields, ctx.RadialDimension, {
    ref: ctx.PartRef,
  })
  function getRadialDimensionReferenceGeometriesFromCache(content: Omit<RadialDimensionReferenceContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const target = ctx.getRefPart(content.ref, contents, contentSelectable)
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
    render(content, renderCtx) {
      const { options, contents, target, fillOptions, strokeColor } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx)
      const { regions, lines } = getRadialDimensionReferenceGeometriesFromCache(content, contents)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of lines) {
        children.push(target.renderPolyline(line, options))
      }
      if (regions && regions.length > 0) {
        children.push(target.renderPolygon(regions[0].points, fillOptions))
      }
      const referenceTarget = ctx.getRefPart(content.ref, contents, contentSelectable)
      if (referenceTarget) {
        const { textPosition, textRotation, text } = getTextPosition(content, referenceTarget)
        const textOptions = ctx.getTextStyleRenderOptionsFromRenderContext(strokeColor, renderCtx)
        children.push(target.renderGroup(
          [
            target.renderText(textPosition.x, textPosition.y, text, strokeColor, content.fontSize, content.fontFamily, textOptions),
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
                const target = ctx.getRefPart(content.ref, contents, contentSelectable)
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
        ref: [
          <ctx.Button onClick={() => acquireContent({ count: 1, part: true, selectable: (v) => contentSelectable(ctx.getContentByIndex(contents, v)) }, r => update(c => { if (isRadialDimensionReferenceContent(c)) { c.ref = r[0] } }))}>select</ctx.Button>,
          typeof content.ref.id === 'number' ? <ctx.NumberEditor value={content.ref.id} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.ref.id = v } })} /> : undefined,
          content.ref.partIndex !== undefined ? <ctx.NumberEditor value={content.ref.partIndex} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.ref.partIndex = v } })} /> : undefined,
        ],
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
    getRefIds: (content) => [...ctx.getStrokeRefIds(content), ...(typeof content.ref === 'number' ? [content.ref] : [])],
    updateRefId(content, update) {
      if (content.ref) {
        const newRefId = update(content.ref.id)
        if (newRefId !== undefined) {
          content.ref.id = newRefId
        }
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
    selectType: 'select part',
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
              updateContents: (draft) => {
                if (selected.length > 0 && type) {
                  const { content, path } = selected[0]
                  if (contentSelectable(content)) {
                    result.ref = {
                      id: path[0],
                      partIndex: path[1],
                    }
                  }
                }
                draft.push({
                  type: 'radial dimension reference',
                  position: result.position,
                  fontSize: result.fontSize,
                  fontFamily: result.fontFamily,
                  ref: result.ref,
                  text: result.text,
                  strokeStyleId,
                } as RadialDimensionReferenceContent)
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
            const { content, path } = selected[0]
            if (contentSelectable(content)) {
              setResult({
                type: 'radial dimension reference',
                position: p,
                fontSize: 16,
                fontFamily: 'monospace',
                ref: {
                  id: path[0],
                  partIndex: path[1],
                },
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
