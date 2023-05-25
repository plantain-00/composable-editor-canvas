import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type TextContent = model.BaseContent<'text'> & core.Position & model.TextFields & {
  text: string
  width?: number
  textVariableName?: string
}

export function getModel(ctx: PluginContext): model.Model<TextContent> {
  const TextContent = ctx.and(ctx.BaseContent('text'), ctx.Position, ctx.TextFields, {
    text: ctx.string,
    width: ctx.optional(ctx.number),
    textVariableName: ctx.optional(ctx.string),
  })
  const textLayoutResultCache = new ctx.WeakmapCache2<object, object, ReturnType<typeof ctx.flowLayout<string>>>()
  function getTextLayoutResult(content: Omit<core.RequiredField<TextContent, "width">, "type">, c: model.TextFields, variableContext?: Record<string, unknown>) {
    return textLayoutResultCache.get(content, c, () => {
      const state = getText(content, variableContext).split('')
      const getTextWidth = (text: string) => ctx.getTextSizeFromCache(ctx.getTextStyleFont(c), text)?.width ?? 0
      return ctx.flowLayout({
        state,
        width: content.width,
        lineHeight: c.lineHeight ?? c.fontSize * 1.2,
        getWidth: getTextWidth,
        align: c.align,
        endContent: '',
        isNewLineContent: c => c === '\n',
        isPartOfComposition: c => ctx.isWordCharactor(c),
        getComposition: (index: number) => ctx.getTextComposition(index, state, getTextWidth, c => c),
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
  function getTextGeometries(content: Omit<TextContent, "type">, contents: readonly core.Nullable<model.BaseContent<string>>[]) {
    return ctx.getGeometriesFromCache(content, () => {
      let points: core.Position[]
      if (hasWidth(content)) {
        const textStyleContent = ctx.getTextStyleContent(content, contents)
        const { newContentHeight } = getTextLayoutResult(content, textStyleContent)
        points = [
          { x: content.x, y: content.y + newContentHeight },
          { x: content.x + content.width, y: content.y + newContentHeight },
          { x: content.x + content.width, y: content.y },
          { x: content.x, y: content.y },
        ]
      } else {
        const size = ctx.getTextSize(ctx.getTextStyleFont(content), content.text)
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
    ...ctx.textModel,
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
            {
              x: content.x,
              y: content.y + content.fontSize * (content.width ? 1 : -1),
              cursor: 'move',
              update(c, { cursor, scale }) {
                if (!isTextContent(c)) {
                  return
                }
                c.fontSize = Math.abs(cursor.y - content.y)
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
              },
            },
            ...(content.width ? [{
              x: content.x + content.width,
              y: content.y,
              cursor: 'move',
              update(c, { cursor, scale }) {
                if (!isTextContent(c)) {
                  return
                }
                c.width = Math.abs(cursor.x - content.x)
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
              },
            } as core.EditPoint<model.BaseContent>] : []),
          ],
        }
      })
    },
    render(content, { target, transformColor, isAssistence, variableContext, contents }) {
      const textStyleContent = ctx.getTextStyleContent(content, contents)
      const color = transformColor(textStyleContent.color)
      const text = getText(content, variableContext)
      let cacheKey: object | undefined
      if (isAssistence) {
        cacheKey = ctx.assistentTextCache.get(text, textStyleContent.fontSize, textStyleContent.color)
      }
      if (!cacheKey) {
        cacheKey = content
      }

      if (hasWidth(content)) {
        const { layoutResult } = getTextLayoutResult(content, textStyleContent, variableContext)
        const children: ReturnType<typeof target.renderGroup>[] = []
        for (const { x, y, content: text } of layoutResult) {
          const textWidth = ctx.getTextSizeFromCache(ctx.getTextStyleFont(textStyleContent), text)?.width ?? 0
          children.push(target.renderText(content.x + x + textWidth / 2, content.y + y + textStyleContent.fontSize, text, textStyleContent.color, textStyleContent.fontSize, textStyleContent.fontFamily, { textAlign: 'center', cacheKey }))
        }
        return target.renderGroup(children)
      }
      return target.renderText(content.x, content.y, text, color, textStyleContent.fontSize, textStyleContent.fontFamily, { cacheKey })
    },
    getGeometries: getTextGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isTextContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isTextContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isTextContent(c)) { c.y = v } })} />,
        ...ctx.getTextContentPropertyPanel(content, update, contents),
        text: <ctx.StringEditor textarea value={content.text} setValue={(v) => update(c => { if (isTextContent(c)) { c.text = v } })} />,
        width: [
          <ctx.BooleanEditor value={content.width !== undefined} setValue={(v) => update(c => { if (isTextContent(c)) { c.width = v ? 600 : undefined } })} />,
          content.width !== undefined ? <ctx.NumberEditor value={content.width} setValue={(v) => update(c => { if (isTextContent(c)) { c.width = v } })} /> : undefined,
        ],
        textVariableName: [
          <ctx.BooleanEditor value={content.textVariableName !== undefined} setValue={(v) => update(c => { if (isTextContent(c)) { c.textVariableName = v ? '' : undefined } })} />,
          content.textVariableName !== undefined ? <ctx.StringEditor value={content.textVariableName} setValue={(v) => update(c => { if (isTextContent(c)) { c.textVariableName = v } })} /> : undefined,
        ],
      }
    },
    editPanel(content, scale, update, contents, cancel, transformPosition) {
      const p = transformPosition(content)
      const textStyleContent = ctx.getTextStyleContent(content, contents)
      const fontSize = textStyleContent.fontSize * scale
      if (content.width) {
        return <ctx.TextEditor
          fontSize={fontSize}
          width={content.width * scale}
          color={textStyleContent.color}
          fontFamily={textStyleContent.fontFamily}
          align={textStyleContent.align}
          lineHeight={textStyleContent.lineHeight ? textStyleContent.lineHeight * scale : undefined}
          onCancel={cancel}
          x={p.x}
          y={p.y}
          value={content.text} setValue={(v) => update(c => { if (isTextContent(c)) { c.text = v } })} />
      }
      return <ctx.StringEditor style={{
        zIndex: 10,
        position: 'absolute',
        left: `${p.x - 1}px`,
        top: `${p.y - fontSize - 1}px`,
        fontSize: `${fontSize}px`,
        fontFamily: content.fontFamily,
        color: ctx.getColorString(content.color),
        padding: '0px',
      }} textarea autoFocus onCancel={cancel} value={content.text} setValue={(v) => update(c => { if (isTextContent(c)) { c.text = v } })} />
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
    useCommand({ onEnd, type, scale, textStyleId }) {
      const { text, onClick, onMove, input, reset } = ctx.useTextClickCreate(
        type === 'create text',
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'text',
            textStyleId,
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
          textStyleId,
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
