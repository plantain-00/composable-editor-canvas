import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import { ArcContent, CircleContent, isArcContent, isCircleContent } from './circle-arc.plugin'
import type { LineContent } from './line-polyline.plugin'

export type RadialDimensionReferenceContent = model.BaseContent<'radial dimension reference'> & model.StrokeFields & model.ArrowFields & core.RadialDimension & {
  refId: number | model.BaseContent
}

export function getModel(ctx: PluginContext): model.Model<RadialDimensionReferenceContent> {
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
  const radialDimensionReferenceLinesCache = new ctx.WeakmapCache2<Omit<CircleContent | ArcContent, 'type'>, Omit<RadialDimensionReferenceContent, "type">, model.Geometries>()

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
      const strokeColor = getStrokeColor(content)
      const strokeWidth = transformStrokeWidth(ctx.getStrokeWidth(content))
      const { regions, lines } = getRadialDimensionReferenceGeometriesFromCache(content, contents)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of lines) {
        children.push(target.renderPolyline(line, { strokeColor, strokeWidth, dashArray: content.dashArray }))
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
    propertyPanel(content, update) {
      return {
        refId: typeof content.refId === 'number' ? <ctx.NumberEditor value={content.refId} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.refId = v } })} /> : [],
        position: <ctx.ObjectEditor
          inline
          properties={{
            x: <ctx.NumberEditor value={content.position.x} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.position.x = v } })} />,
            y: <ctx.NumberEditor value={content.position.y} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.position.y = v } })} />,
          }}
        />,
        text: [
          <ctx.BooleanEditor value={content.text !== undefined} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.text = v ? '' : undefined } })} style={{ marginRight: '5px' }} />,
          content.text !== undefined ? <ctx.StringEditor value={content.text} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.text = v } })} /> : undefined,
        ],
        fontSize: <ctx.NumberEditor value={content.fontSize} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.fontSize = v } })} />,
        fontFamily: <ctx.StringEditor value={content.fontFamily} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.fontFamily = v } })} />,
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update),
      }
    },
    getRefIds(content) {
      return typeof content.refId === 'number' ? [content.refId] : undefined
    },
    updateRefId(content, update) {
      const newRefId = update(content.refId)
      if (newRefId !== undefined) {
        content.refId = newRefId
      }
    },
  }
}

export function isRadialDimensionReferenceContent(content: model.BaseContent): content is RadialDimensionReferenceContent {
  return content.type === 'radial dimension reference'
}

function contentSelectable(content: model.BaseContent): content is CircleContent | ArcContent {
  return isArcContent(content) || isCircleContent(content)
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
    useCommand({ onEnd, selected, type }) {
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
      ctx.useKey((e) => e.key === 'Escape', reset, [setResult])
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
