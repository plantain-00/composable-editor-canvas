import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import { BlockContent, isBlockContent } from './block.plugin'
import type { LineContent } from './line-polyline.plugin'

export type BlockReferenceContent = model.BaseContent<'block reference'> & core.Position & {
  refId: number
  angle: number
}

export function getModel(ctx: PluginContext): model.Model<BlockReferenceContent> {
  const blockLinesCache = new ctx.WeakmapCache2<Omit<BlockContent, 'type'>, Omit<BlockReferenceContent, "type">, model.Geometries>()
  const blockSnapPointsCache = new ctx.WeakmapCache2<Omit<BlockContent, 'type'>, Omit<BlockReferenceContent, "type">, model.SnapPoint[]>()
  function getBlock(id: number, contents: readonly core.Nullable<model.BaseContent>[]) {
    return contents.find((c, i): c is BlockContent => !!c && isBlockContent(c) && i === id)
  }
  function extractContentInBlockReference(
    target: model.BaseContent,
    content: Omit<BlockReferenceContent, "type">,
    block: BlockContent,
    contents: readonly core.Nullable<model.BaseContent>[],
  ) {
    const model = ctx.getModel(target.type)
    if (!model) {
      return undefined
    }
    return ctx.produce(target, (draft) => {
      model.rotate?.(draft, block.base, content.angle, contents)
      model.move?.(draft, content)
    })
  }
  function getBlockReferenceGeometries(content: Omit<BlockReferenceContent, "type">, contents: readonly core.Nullable<model.BaseContent>[]) {
    const block = getBlock(content.refId, contents)
    if (block) {
      return blockLinesCache.get(block, content, () => {
        const lines: [core.Position, core.Position][] = []
        const points: core.Position[] = []
        const renderingLines: core.Position[][] = []
        block.contents.forEach((c) => {
          if (!c) {
            return
          }
          const extracted = extractContentInBlockReference(c, content, block, contents)
          if (extracted) {
            const r = ctx.getModel(c.type)?.getGeometries?.(extracted)
            if (r) {
              lines.push(...r.lines)
              points.push(...r.points)
              if (r.renderingLines) {
                renderingLines.push(...r.renderingLines)
              }
            }
          }
        })
        return {
          lines,
          points,
          bounding: ctx.getPointsBounding(points),
          renderingLines,
        }
      })
    }
    return { lines: [], points: [], renderingLines: [] }
  }
  const React = ctx.React
  return {
    type: 'block reference',
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    rotate(content, center, angle, contents) {
      const block = getBlock(content.refId, contents)
      if (block) {
        const p = ctx.rotatePositionByCenter({ x: content.x + block.base.x, y: content.y + block.base.y }, center, -angle)
        content.x = p.x - block.base.x
        content.y = p.y - block.base.y
        content.angle += angle
      }
    },
    explode(content, contents) {
      const block = getBlock(content.refId, contents)
      if (block) {
        const result: model.BaseContent[] = []
        block.contents.forEach((c) => {
          if (!c) {
            return
          }
          const extracted = extractContentInBlockReference(c, content, block, contents)
          if (extracted) {
            result.push(extracted)
          }
        })
        return result
      }
      return []
    },
    mirror(content, line, angle, contents) {
      const block = getBlock(content.refId, contents)
      if (block) {
        const p = ctx.getSymmetryPoint({ x: content.x + block.base.x, y: content.y + block.base.y }, line)
        content.x = p.x - block.base.x
        content.y = p.y - block.base.y
        content.angle = 2 * angle - content.angle
      }
    },
    render({ content, target, color, strokeWidth, contents }) {
      const block = getBlock(content.refId, contents)
      if (block) {
        const children = ctx.renderContainerChildren(block, target, strokeWidth, contents, color)
        return target.renderGroup(children, { translate: content, base: block.base, angle: content.angle })
      }
      return target.renderEmpty()
    },
    getOperatorRenderPosition(content, contents) {
      const block = getBlock(content.refId, contents)
      if (block) {
        return { x: content.x + block.base.x, y: content.y + block.base.y }
      }
      return content
    },
    getEditPoints(content, contents) {
      const block = getBlock(content.refId, contents)
      if (!block) {
        return
      }
      return ctx.getEditPointsFromCache(content, () => {
        const p = { x: content.x + block.base.x, y: content.y + block.base.y }
        return {
          editPoints: [
            {
              ...p,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isBlockReferenceContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [p, cursor] } as LineContent] }
              },
            },
          ],
          angleSnapStartPoint: p,
        }
      })
    },
    getSnapPoints(content, contents) {
      const block = getBlock(content.refId, contents)
      if (block) {
        return blockSnapPointsCache.get(block, content, () => {
          const result: model.SnapPoint[] = []
          block.contents.forEach((c) => {
            if (!c) {
              return
            }
            const model = ctx.getModel(c.type)
            const extracted = extractContentInBlockReference(c, content, block, contents)
            if (extracted) {
              const r = model?.getSnapPoints?.(extracted, contents)
              if (r) {
                result.push(...r)
              }
            }
          })
          return result
        })
      }
      return []
    },
    getGeometries: getBlockReferenceGeometries,
    propertyPanel(content, update) {
      return {
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isBlockReferenceContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isBlockReferenceContent(c)) { c.y = v } })} />,
        angle: <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isBlockReferenceContent(c)) { c.angle = v } })} />,
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

export function isBlockReferenceContent(content: model.BaseContent): content is BlockReferenceContent {
  return content.type === 'block reference'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
      <path fill="currentColor" d="M32 119.4C12.9 108.4 0 87.7 0 64C0 28.7 28.7 0 64 0c23.7 0 44.4 12.9 55.4 32H328.6C339.6 12.9 360.3 0 384 0c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V232.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H119.4c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V119.4zM119.4 96c-5.6 9.7-13.7 17.8-23.4 23.4V232.6c9.7 5.6 17.8 13.7 23.4 23.4H328.6c5.6-9.7 13.7-17.8 23.4-23.4V119.4c-9.7-5.6-17.8-13.7-23.4-23.4H119.4zm192 384c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V352h64v40.6c9.7 5.6 17.8 13.7 23.4 23.4H520.6c5.6-9.7 13.7-17.8 23.4-23.4V279.4c-9.7-5.6-17.8-13.7-23.4-23.4h-46c-5.4-15.4-14.6-28.9-26.5-39.6V192h72.6c11.1-19.1 31.7-32 55.4-32c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V392.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H311.4z" />
    </svg>
  )
  return {
    name: 'create block reference',
    useCommand({ onEnd, type, scale }) {
      let message = ''
      if (type) {
        message = 'specify target point'
      }
      const { input, setInputPosition, cursorPosition, setCursorPosition, resetInput } = ctx.useCursorInput(message)

      return {
        onStart(p) {
          resetInput()
          onEnd({
            updateContents: (contents, selected) => {
              contents.push(...contents
                .filter((c, i): c is BlockContent => !!c && ctx.isSelected([i], selected) && isBlockContent(c))
                .map((block) => ({
                  type: 'block reference',
                  refId: ctx.getContentIndex(block, contents),
                  x: p.x - block.base.x,
                  y: p.y - block.base.y,
                  angle: 0,
                } as BlockReferenceContent))
              )
              setCursorPosition(undefined)
            }
          })
        },
        input,
        onMove(p, viewportPosition) {
          setInputPosition(viewportPosition || p)
          if (!type) {
            return
          }
          setCursorPosition(p)
        },
        updateContent(content, contents) {
          if (!isBlockContent(content)) {
            return {}
          }
          if (cursorPosition) {
            return {
              newContents: [
                {
                  type: 'block reference',
                  refId: ctx.getContentIndex(content, contents),
                  x: cursorPosition.x - content.base.x,
                  y: cursorPosition.y - content.base.y,
                  angle: 0,
                } as BlockReferenceContent,
              ],
              assistentContents: [
                {
                  type: 'line',
                  dashArray: [4 / scale],
                  points: [{ x: content.base.x, y: content.base.y }, cursorPosition]
                },
              ]
            }
          }
          return {}
        },
      }
    },
    contentSelectable: isBlockContent,
    selectCount: 1,
    hotkey: 'I',
    icon,
  }
}
