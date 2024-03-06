import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type ImageContent = model.BaseContent<'image'> & core.Image & model.ClipFields

export function getModel(ctx: PluginContext): model.Model<ImageContent> {
  const ImageContent = ctx.and(ctx.BaseContent('image'), ctx.Image, ctx.ClipFields)
  function getImageGeometries(content: Omit<ImageContent, "type">) {
    return ctx.getGeometriesFromCache(content, new Set(), () => {
      const points = [
        { x: content.x, y: content.y + content.height },
        { x: content.x + content.width, y: content.y + content.height },
        { x: content.x + content.width, y: content.y },
        { x: content.x, y: content.y },
      ]
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
    type: 'image',
    ...ctx.clipModel,
    move(content, offset) {
      ctx.movePoint(content, offset)
      if (content.clip) {
        ctx.getContentModel(content.clip.border)?.move?.(content.clip.border, offset)
      }
    },
    scale(content, center, sx, sy, contents) {
      ctx.scalePoint(content, center, sx, sy)
      content.width *= sx
      content.height *= sy
      if (content.clip) {
        return ctx.getContentModel(content.clip.border)?.scale?.(content.clip.border, center, sx, sy, contents)
      }
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              x: content.x,
              y: content.y,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isImageContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
              },
            },
            ...ctx.getClipContentEditPoints(content, contents),
          ],
        }
      })
    },
    render(content, renderCtx) {
      const { target, isHoveringOrSelected, transformStrokeWidth } = renderCtx
      const strokeWidth = transformStrokeWidth(0)
      const fuzzy = isHoveringOrSelected && strokeWidth !== 0
      let image = target.renderImage(content.url, content.x, content.y, content.width, content.height)
      image = ctx.renderClipContent(content, image, renderCtx)
      if (fuzzy) {
        return target.renderGroup([
          target.renderRect(content.x, content.y, content.width, content.height, {
            strokeWidth,
            ...ctx.fuzzyStyle,
          }),
          image,
        ])
      }
      return image
    },
    renderIfSelected(content, renderCtx) {
      const { color, target, strokeWidth } = renderCtx
      const result = target.renderRect(content.x, content.y, content.width, content.height, { strokeColor: color, dashArray: [4], strokeWidth })
      return ctx.renderClipContentIfSelected(content, result, renderCtx)
    },
    getOperatorRenderPosition(content) {
      return content
    },
    getGeometries: getImageGeometries,
    propertyPanel(content, update, contents, { acquirePoint, acquireContent }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isImageContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isImageContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isImageContent(c)) { c.y = v } })} />,
        width: <ctx.NumberEditor value={content.width} setValue={(v) => update(c => { if (isImageContent(c)) { c.width = v } })} />,
        height: <ctx.NumberEditor value={content.height} setValue={(v) => update(c => { if (isImageContent(c)) { c.height = v } })} />,
        url: <ctx.StringEditor value={content.url} setValue={(v) => update(c => { if (isImageContent(c)) { c.url = v } })} />,
        ...ctx.getClipContentPropertyPanel(content, contents, acquireContent, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, ImageContent, p),
  }
}

export function isImageContent(content: model.BaseContent): content is ImageContent {
  return content.type === 'image'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="100,100 100,50 66,67 28,11 0,36 0,100" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
      <circle cx="70" cy="22" r="13" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
    </svg>
  )
  return {
    name: 'create image',
    useCommand({ onEnd, type }) {
      const { image, onClick, onMove, input, reset } = ctx.useImageClickCreate(
        type === 'create image',
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'image',
            ...c,
          } as ImageContent)
        }),
      )
      const assistentContents: ImageContent[] = []
      if (image) {
        assistentContents.push({
          type: 'image',
          ...image,
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
    hotkey: 'I',
    icon,
  }
}
