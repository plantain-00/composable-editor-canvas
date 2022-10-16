import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import type { LineContent } from './line-polyline.plugin'

export type LinearDimensionContent = model.BaseContent<'linear dimension'> & model.StrokeFields & core.LinearDimension

export function getModel(ctx: PluginContext): model.Model<LinearDimensionContent> {
  function getLinearDimensionGeometriesFromCache(content: Omit<LinearDimensionContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      return ctx.getLinearDimensionGeometries(content, ctx.dimensionStyle, getTextPosition)
    })
  }
  const textPositionMap = new ctx.WeakmapCache<Omit<LinearDimensionContent, 'type'>, {
    textPosition: core.Position
    size?: core.Size
    text: string
    textRotation: number
  }>()
  function getTextPosition(content: Omit<LinearDimensionContent, 'type'>) {
    return textPositionMap.get(content, () => {
      return ctx.getLinearDimensionTextPosition(content, ctx.dimensionStyle.margin, ctx.getTextSizeFromCache)
    })
  }
  const React = ctx.React
  return {
    type: 'linear dimension',
    ...ctx.strokeModel,
    move(content, offset) {
      content.p1.x += offset.x
      content.p1.y += offset.y
      content.p2.x += offset.x
      content.p2.y += offset.y
      content.position.x += offset.x
      content.position.y += offset.y
    },
    render({ content, target, color, strokeWidth }) {
      const { regions, lines } = getLinearDimensionGeometriesFromCache(content)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of lines) {
        children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth, dashArray: content.dashArray }))
      }
      if (regions) {
        for (let i = 0; i < 2 && i < regions.length; i++) {
          children.push(target.renderPolyline(regions[i].points, { strokeColor: color, strokeWidth, fillColor: color }))
        }
      }
      const { textPosition, text, textRotation } = getTextPosition(content)
      children.push(target.renderGroup(
        [
          target.renderText(textPosition.x, textPosition.y, text, color, content.fontSize, content.fontFamily, { cacheKey: content }),
        ],
        {
          rotation: textRotation,
          base: textPosition,
        }
      ))
      return target.renderGroup(children)
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              x: content.position.x,
              y: content.position.y,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isLinearDimensionContent(c)) {
                  return
                }
                c.position.x += cursor.x - start.x
                c.position.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            }
          ]
        }
      })
    },
    getGeometries: getLinearDimensionGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        p1: <ctx.ObjectEditor
          inline
          properties={{
            x: <ctx.NumberEditor value={content.p1.x} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.p1.x = v } })} />,
            y: <ctx.NumberEditor value={content.p1.y} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.p1.y = v } })} />,
          }}
        />,
        p2: <ctx.ObjectEditor
          inline
          properties={{
            x: <ctx.NumberEditor value={content.p2.x} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.p2.x = v } })} />,
            y: <ctx.NumberEditor value={content.p2.y} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.p2.y = v } })} />,
          }}
        />,
        position: <ctx.ObjectEditor
          inline
          properties={{
            x: <ctx.NumberEditor value={content.position.x} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.position.x = v } })} />,
            y: <ctx.NumberEditor value={content.position.y} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.position.y = v } })} />,
          }}
        />,
        direct: <ctx.BooleanEditor value={content.direct === true} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.direct = v ? true : undefined } })} />,
        text: [
          <ctx.BooleanEditor value={content.text !== undefined} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.text = v ? '' : undefined } })} style={{ marginRight: '5px' }} />,
          content.text !== undefined ? <ctx.StringEditor value={content.text} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.text = v } })} /> : undefined,
        ],
        fontSize: <ctx.NumberEditor value={content.fontSize} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.fontSize = v } })} />,
        fontFamily: <ctx.StringEditor value={content.fontFamily} setValue={(v) => update(c => { if (isLinearDimensionContent(c)) { c.fontFamily = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update),
      }
    },
  }
}

export function isLinearDimensionContent(content: model.BaseContent): content is LinearDimensionContent {
  return content.type === 'linear dimension'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  return {
    name: 'create linear dimension',
    selectCount: 0,
    useCommand({ onEnd, type, scale }) {
      const [p1, setP1] = React.useState<core.Position>()
      const [p2, setP2] = React.useState<core.Position>()
      const [direct, setDirect] = React.useState(false)
      const [result, setResult] = React.useState<LinearDimensionContent>()
      const [text, setText] = React.useState<string>()
      let message = ''
      if (type) {
        message = 'input text'
      }
      const { input, cursorPosition, setCursorPosition, clearText, setInputPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === 'Enter') {
          setText(text)
          if (result) {
            setResult({ ...result, text })
          }
          clearText()
        }
      } : undefined)
      const reset = () => {
        setP1(undefined)
        setP2(undefined)
        setResult(undefined)
        resetInput()
        setText(undefined)
      }
      ctx.useKey((e) => e.key === 'Escape', reset, [setResult])
      const assistentContents: (LinearDimensionContent | LineContent)[] = []
      if (result) {
        assistentContents.push(result)
      } else if (p1 && cursorPosition) {
        assistentContents.push({ type: 'line', points: [p1, cursorPosition], dashArray: [4 / scale] })
      }
      return {
        input,
        onStart(p) {
          if (!p1) {
            setP1(p)
          } else if (!p2) {
            setP2(p)
          } else if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push(result)
              },
              nextCommand: type,
            })
            reset()
          }
        },
        onMove(p, viewportPosition) {
          setInputPosition(viewportPosition || p)
          setCursorPosition(p)
          if (type && p1 && p2) {
            setResult({
              type: 'linear dimension',
              position: p,
              p1,
              p2,
              direct,
              fontSize: 16,
              fontFamily: 'monospace',
              text,
            })
          }
        },
        subcommand: type
          ? (
            <span>
              <button onClick={() => {
                if (result) {
                  setResult({ ...result, direct: !direct })
                }
                setDirect(!direct)
              }} style={{ position: 'relative' }}>{direct ? 'direct' : 'axis'}</button>
            </span>
          )
          : undefined,
        assistentContents,
        lastPosition: p2 ?? p1,
      }
    },
  }
}
