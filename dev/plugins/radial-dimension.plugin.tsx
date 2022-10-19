import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import { ArcContent, CircleContent, isArcContent, isCircleContent } from './circle-arc.plugin'
import type { LineContent } from './line-polyline.plugin'

export type RadialDimensionReferenceContent = model.BaseContent<'radial dimension reference'> & model.StrokeFields & model.ArrowFields & core.RadialDimension & {
  refId: number
}

export function getModel(ctx: PluginContext): model.Model<RadialDimensionReferenceContent> {
  function getRadialDimensionReferenceGeometriesFromCache(content: Omit<RadialDimensionReferenceContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const target = getRadialDimensionReferenceTarget(content.refId, contents)
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

  function getRadialDimensionReferenceTarget(id: number, contents: readonly core.Nullable<model.BaseContent>[]) {
    return contents.find((c, i): c is CircleContent | ArcContent => !!c && (isCircleContent(c) || isArcContent(c)) && i === id)
  }

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
    render({ content, target, color, strokeWidth, contents }) {
      const { regions, lines } = getRadialDimensionReferenceGeometriesFromCache(content, contents)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of lines) {
        children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth, dashArray: content.dashArray }))
      }
      if (regions && regions.length > 0) {
        children.push(target.renderPolyline(regions[0].points, { strokeColor: color, strokeWidth: 0, fillColor: color }))
      }
      const referenceTarget = getRadialDimensionReferenceTarget(content.refId, contents)
      if (referenceTarget) {
        const { textPosition, textRotation, text } = getTextPosition(content, referenceTarget)
        children.push(target.renderGroup(
          [
            target.renderText(textPosition.x, textPosition.y, text, color, content.fontSize, content.fontFamily),
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
                const target = getRadialDimensionReferenceTarget(c.refId, contents)
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
        refId: <ctx.NumberEditor value={content.refId} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.refId = v } })} />,
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
      return [content.refId]
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

export function getCommand(ctx: PluginContext): Command {
  function contentSelectable(content: model.BaseContent): content is CircleContent | ArcContent {
    return isArcContent(content) || isCircleContent(content)
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="36" cy="64" r="31.622776601683793" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <polyline points="36,64 90.50229352972221,9.497706470277791" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polygon points="75.10199280075491,32.88621938243634 65.39851220628051,22.75526837146677 54.21645977390029,44.31651677899134" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
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
