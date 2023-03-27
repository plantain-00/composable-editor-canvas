import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type TextContent = model.BaseContent<'text'> & core.Text & {
  width?: number
  lineHeight?: number
  textVariableName?: string
}

export function getModel(ctx: PluginContext): model.Model<TextContent> {
  const TextContent = ctx.and(ctx.BaseContent('text'), ctx.Text, {
    width: ctx.optional(ctx.number),
    lineHeight: ctx.optional(ctx.number),
    textVariableName: ctx.optional(ctx.string),
  })
  const textLayoutResultCache = new ctx.WeakmapCache<object, ReturnType<typeof ctx.flowLayout<string>>>()
  function getTextLayoutResult(content: Omit<core.RequiredField<TextContent, "width">, "type">, variableContext?: Record<string, unknown>) {
    return textLayoutResultCache.get(content, () => {
      const state = getText(content, variableContext).split('')
      const getTextWidth = (text: string) => ctx.getTextSizeFromCache(`${content.fontSize}px ${content.fontFamily}`, text)?.width ?? 0
      return ctx.flowLayout({
        state,
        width: content.width,
        lineHeight: content.lineHeight ?? content.fontSize * 1.2,
        getWidth: getTextWidth,
        endContent: '',
        isNewLineContent: content => content === '\n',
        isPartOfComposition: content => ctx.isWordCharactor(content),
        getComposition: (index: number) => ctx.getTextComposition(index, state, getTextWidth, c => c),
        scrollY: 0,
      })
    })
  }
  function hasWidth(content: Omit<TextContent, 'type'>): content is Omit<core.RequiredField<TextContent, "width">, "type"> {
    return content.width !== undefined
  }
  function getText(content: Omit<TextContent, 'type'>, variableContext?: Record<string, unknown>) {
    if (content.textVariableName && variableContext) {
      const text = variableContext[content.textVariableName]
      if (typeof text === 'string') {
        return text
      }
    }
    return content.text
  }
  function getTextGeometries(content: Omit<TextContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      let points: core.Position[]
      if (hasWidth(content)) {
        const { newContentHeight } = getTextLayoutResult(content)
        points = [
          { x: content.x, y: content.y + newContentHeight },
          { x: content.x + content.width, y: content.y + newContentHeight },
          { x: content.x + content.width, y: content.y },
          { x: content.x, y: content.y },
        ]
      } else {
        const size = ctx.getTextSize(`${content.fontSize}px ${content.fontFamily}`, content.text)
        if (!size) {
          throw 'not supported'
        }
        points = [
          { x: content.x, y: content.y - size.height },
          { x: content.x + size.width, y: content.y - size.height },
          { x: content.x + size.width, y: content.y },
          { x: content.x, y: content.y },
        ]
      }
      const lines = Array.from(ctx.iteratePolygonLines(points))
      return {
        lines: [],
        bounding: ctx.getPointsBounding(points),
        regions: [
          {
            lines,
            points,
          },
        ],
        renderingLines: [],
      }
    })
  }
  const React = ctx.React
  return {
    type: 'text',
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              x: content.x,
              y: content.y,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isTextContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
              },
            },
          ],
        }
      })
    },
    render(content, { target, transformColor, isAssistence, variableContext }) {
      const color = transformColor(content.color)
      const text = getText(content, variableContext)
      let cacheKey: object | undefined
      if (isAssistence) {
        cacheKey = ctx.assistentTextCache.get(text, content.fontSize, content.color)
      }
      if (!cacheKey) {
        cacheKey = content
      }
      if (hasWidth(content)) {
        const { layoutResult } = getTextLayoutResult(content, variableContext)
        const children: ReturnType<typeof target.renderGroup>[] = []
        for (const { x, y, content: text } of layoutResult) {
          const textWidth = ctx.getTextSizeFromCache(`${content.fontSize}px ${content.fontFamily}`, text)?.width ?? 0
          children.push(target.renderText(content.x + x + textWidth / 2, content.y + y + content.fontSize, text, content.color, content.fontSize, content.fontFamily, { textAlign: 'center', cacheKey }))
        }
        return target.renderGroup(children)
      }
      return target.renderText(content.x, content.y, text, color, content.fontSize, content.fontFamily, { cacheKey })
    },
    getGeometries: getTextGeometries,
    propertyPanel(content, update, _, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isTextContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isTextContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isTextContent(c)) { c.y = v } })} />,
        fontSize: <ctx.NumberEditor value={content.fontSize} setValue={(v) => update(c => { if (isTextContent(c)) { c.fontSize = v } })} />,
        fontFamily: <ctx.StringEditor value={content.fontFamily} setValue={(v) => update(c => { if (isTextContent(c)) { c.fontFamily = v } })} />,
        text: <ctx.StringEditor textarea value={content.text} setValue={(v) => update(c => { if (isTextContent(c)) { c.text = v } })} />,
        color: <ctx.NumberEditor type='color' value={content.color} setValue={(v) => update(c => { if (isTextContent(c)) { c.color = v } })} />,
        width: [
          <ctx.BooleanEditor value={content.width !== undefined} setValue={(v) => update(c => { if (isTextContent(c)) { c.width = v ? 600 : undefined } })} />,
          content.width !== undefined ? <ctx.NumberEditor value={content.width} setValue={(v) => update(c => { if (isTextContent(c)) { c.width = v } })} /> : undefined,
        ],
        lineHeight: [
          content.width !== undefined ? <ctx.BooleanEditor value={content.lineHeight !== undefined} setValue={(v) => update(c => { if (isTextContent(c)) { c.lineHeight = v ? content.fontSize * 1.2 : undefined } })} /> : undefined,
          content.width !== undefined && content.lineHeight !== undefined ? <ctx.NumberEditor value={content.lineHeight} setValue={(v) => update(c => { if (isTextContent(c)) { c.lineHeight = v } })} /> : undefined,
        ],
        textVariableName: [
          <ctx.BooleanEditor value={content.textVariableName !== undefined} setValue={(v) => update(c => { if (isTextContent(c)) { c.textVariableName = v ? '' : undefined } })} />,
          content.textVariableName !== undefined ? <ctx.StringEditor value={content.textVariableName} setValue={(v) => update(c => { if (isTextContent(c)) { c.textVariableName = v } })} /> : undefined,
        ],
      }
    },
    isValid: (c, p) => ctx.validate(c, TextContent, p),
    getVariableNames: (content) => content.textVariableName ? [content.textVariableName] : [],
  }
}

export function isTextContent(content: model.BaseContent): content is TextContent {
  return content.type === 'text'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="16,22 83,22" strokeWidth="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="49,22 49,89" strokeWidth="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create text',
    icon,
    useCommand({ onEnd, type, scale }) {
      const { text, onClick, onMove, input, reset } = ctx.useTextClickCreate(
        type === 'create text',
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'text',
            ...c,
          } as TextContent)
        }),
        {
          scale,
        }
      )
      const assistentContents: (TextContent)[] = []
      if (text) {
        assistentContents.push({
          type: 'text',
          ...text,
        })
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        reset,
      }
    },
    selectCount: 0,
    hotkey: 'T',
  }
}
