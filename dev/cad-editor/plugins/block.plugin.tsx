import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type BlockContent = model.BaseContent<'block'> & model.ContainerFields & {
  base: core.Position
}
export type BlockReferenceContent = model.BaseContent<'block reference'> & core.Position & model.VariableValuesFields & {
  refId: model.ContentRef
  angle: number
  scale?: number | core.Position
}

export function getModel(ctx: PluginContext): (model.Model<BlockContent> | model.Model<BlockReferenceContent>)[] {
  const React = ctx.React
  const BlockContent = ctx.and(ctx.BaseContent('block'), ctx.ContainerFields, {
    base: ctx.Position,
  })
  const BlockReferenceContent = ctx.and(ctx.BaseContent('block reference'), ctx.Position, ctx.VariableValuesFields, {
    refId: ctx.ContentRef,
    angle: ctx.number,
    scale: ctx.optional(ctx.or(ctx.number, ctx.Position)),
  })
  const getBlockRefIds = (content: Omit<BlockContent, 'type'>) => content.contents
  const getBlockReferenceRefIds = (content: BlockReferenceContent) => [content.refId]
  const blockModel: model.Model<BlockContent> = {
    type: 'block',
    ...ctx.containerModel,
    explode: ctx.getContainerExplode,
    render: ctx.getContainerRender,
    renderIfSelected: (content, renderCtx) => ctx.getContainerRenderIfSelected(content, renderCtx, [content], getBlockRefIds),
    getOperatorRenderPosition(content) {
      return content.base
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content.base,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isBlockContent(c)) {
                  return
                }
                c.base.x += cursor.x - start.x
                c.base.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content.base, cursor] } as LineContent] }
              },
            },
          ],
          angleSnapStartPoint: content.base,
        }
      })
    },
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries: (content, contents) => ctx.getContainerGeometries(content, contents, getBlockRefIds, [content]),
    propertyPanel(content, update, _, { acquirePoint }) {
      return {
        base: <ctx.ObjectEditor
          inline
          properties={{
            from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isBlockContent(c)) { c.base.x = p.x, c.base.y = p.y } }))}>canvas</ctx.Button>,
            x: <ctx.NumberEditor value={content.base.x} setValue={(v) => update(c => { if (isBlockContent(c)) { c.base.x = v } })} />,
            y: <ctx.NumberEditor value={content.base.y} setValue={(v) => update(c => { if (isBlockContent(c)) { c.base.y = v } })} />,
          }}
        />,
        ...ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update),
      }
    },
    isValid: (c, p) => ctx.validate(c, BlockContent, p),
    getRefIds: getBlockRefIds,
  }
  const blockSnapPointsCache = new ctx.WeakmapCache2<Omit<BlockContent, 'type'>, Omit<BlockReferenceContent, "type">, model.SnapPoint[]>()
  function extractContentInBlockReference(
    target: model.BaseContent,
    content: Omit<BlockReferenceContent, "type">,
    block: BlockContent,
    contents: readonly core.Nullable<model.BaseContent>[],
  ) {
    let model = ctx.getContentModel(target)
    if (!model) {
      return undefined
    }
    let newResult: model.BaseContent | undefined
    const result = ctx.produce(target, (draft) => {
      const scale = ctx.getScaleOptionsScale(content)
      if (scale) {
        const r = model?.scale?.(draft, block.base, scale.x, scale.y, contents)
        if (r) {
          model = ctx.getContentModel(r)
          newResult = r
          draft = r
        }
      }
      if (content.angle) {
        model?.rotate?.(draft, block.base, content.angle, contents)
      }
      model?.move?.(draft, content)
    })
    return newResult || result
  }
  function getBlockReferenceGeometries(content: BlockReferenceContent, contents: readonly core.Nullable<model.BaseContent>[]) {
    const refs = new Set(ctx.iterateRefContents(getBlockReferenceRefIds(content), contents, [content]))
    return ctx.getGeometriesFromCache(content, refs, () => {
      const block = ctx.getReference(content.refId, contents, isBlockContent)
      if (block) {
        const lines: core.GeometryLine[] = []
        const boundings: core.TwoPointsFormRegion[] = []
        const renderingLines: core.Position[][] = []
        const regions: NonNullable<model.Geometries['regions']> = []
        block.contents.forEach((c) => {
          if (!c) {
            return
          }
          const extracted = extractContentInBlockReference(c, content, block, contents)
          if (extracted) {
            const r = ctx.getContentModel(extracted)?.getGeometries?.(extracted, contents)
            if (r) {
              lines.push(...r.lines)
              if (r.bounding) {
                boundings.push(r.bounding)
              }
              if (r.renderingLines) {
                renderingLines.push(...r.renderingLines)
              }
              if (r.regions) {
                regions.push(...r.regions)
              }
            }
          }
        })
        return {
          lines,
          bounding: ctx.mergeBoundingsUnsafe(boundings),
          renderingLines,
          regions,
        }
      }
      return { lines: [], renderingLines: [] }
    })
  }
  const blockReferenceModel: model.Model<BlockReferenceContent> = {
    type: 'block reference',
    ...ctx.variableValuesModel,
    move(content, offset) {
      ctx.movePoint(content, offset)
    },
    rotate(content, center, angle, contents) {
      const block = ctx.getReference(content.refId, contents, isBlockContent)
      if (block) {
        const p = ctx.rotatePoint({ x: content.x + block.base.x, y: content.y + block.base.y }, center, angle)
        content.x = p.x - block.base.x
        content.y = p.y - block.base.y
        content.angle += angle
      }
    },
    scale(content, center, sx, sy, contents) {
      const block = ctx.getReference(content.refId, contents, isBlockContent)
      if (block) {
        const p = { x: content.x + block.base.x, y: content.y + block.base.y }
        ctx.scalePoint(p, center, sx, sy)
        content.x = p.x - block.base.x
        content.y = p.y - block.base.y
        const scale = ctx.getScaleOptionsScale(content)
        content.scale = {
          x: (scale?.x ?? 1) * sx,
          y: (scale?.y ?? 1) * sy,
        }
      }
    },
    explode(content, contents) {
      const block = ctx.getReference(content.refId, contents, isBlockContent)
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
      const block = ctx.getReference(content.refId, contents, isBlockContent)
      if (block) {
        const p = ctx.mirrorPoint({ x: content.x + block.base.x, y: content.y + block.base.y }, line)
        content.x = p.x - block.base.x
        content.y = p.y - block.base.y
        content.angle = 2 * angle - content.angle
        const scale = ctx.getScaleOptionsScale(content)
        content.scale = {
          x: scale?.x ?? 1,
          y: -(scale?.y ?? 1),
        }
      }
    },
    render(content, renderCtx) {
      const block = ctx.getReference(content.refId, renderCtx.contents, isBlockContent)
      if (block) {
        const children = ctx.renderContainerChildren({ ...block, variableValues: content.variableValues }, renderCtx)
        return renderCtx.target.renderGroup(children, { translate: content, base: block.base, angle: content.angle, scale: content.scale })
      }
      return renderCtx.target.renderEmpty()
    },
    renderIfSelected(content, renderCtx) {
      const block = ctx.getReference(content.refId, renderCtx.contents, isBlockContent)
      if (block) {
        const children = ctx.renderContainerIfSelected(block, renderCtx, [content], getBlockRefIds)
        return renderCtx.target.renderGroup([children], { translate: content, base: block.base, angle: content.angle, scale: content.scale })
      }
      return renderCtx.target.renderEmpty()
    },
    getOperatorRenderPosition(content, contents) {
      const block = ctx.getReference(content.refId, contents, isBlockContent)
      if (block) {
        return { x: content.x + block.base.x, y: content.y + block.base.y }
      }
      return content
    },
    getEditPoints(content, contents) {
      const block = ctx.getReference(content.refId, contents, isBlockContent)
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
      const block = ctx.getReference(content.refId, contents, isBlockContent)
      if (block) {
        return blockSnapPointsCache.get(block, content, () => {
          const result: model.SnapPoint[] = []
          block.contents.forEach((c) => {
            if (!c) {
              return
            }
            const model = ctx.getContentModel(c)
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
    propertyPanel(content, update, contents, { acquirePoint }) {
      let variableNames: string[] = []
      const block = ctx.getReference(content.refId, contents, isBlockContent)
      if (block) {
        variableNames = ctx.getContainerVariableNames(block)
      }
      const scale = ctx.getScaleOptionsScale(content)
      return {
        refId: typeof content.refId === 'number' ? <ctx.NumberEditor value={content.refId} setValue={(v) => update(c => { if (isBlockReferenceContent(c)) { c.refId = v } })} /> : [],
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isBlockReferenceContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isBlockReferenceContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isBlockReferenceContent(c)) { c.y = v } })} />,
        angle: <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isBlockReferenceContent(c)) { c.angle = v } })} />,
        sx: <ctx.NumberEditor value={scale?.x ?? 1} setValue={(v) => update(c => { if (isBlockReferenceContent(c)) { c.scale = { x: v, y: scale?.y ?? v } } })} />,
        sy: <ctx.NumberEditor value={scale?.y ?? 1} setValue={(v) => update(c => { if (isBlockReferenceContent(c)) { c.scale = { x: scale?.x ?? v, y: v } } })} />,
        ...ctx.getVariableValuesContentPropertyPanel(content, variableNames, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, BlockReferenceContent, p),
    getRefIds: getBlockReferenceRefIds,
    updateRefId(content, update) {
      const newRefId = update(content.refId)
      if (newRefId !== undefined) {
        content.refId = newRefId
      }
    },
  }
  return [
    blockModel,
    blockReferenceModel,
  ]
}

export function isBlockContent(content: model.BaseContent): content is BlockContent {
  return content.type === 'block'
}
export function isBlockReferenceContent(content: model.BaseContent): content is BlockReferenceContent {
  return content.type === 'block reference'
}

export function getCommand(ctx: PluginContext): Command[] {
  function contentSelectable(content: model.BaseContent, contents: core.Nullable<model.BaseContent>[]) {
    return ctx.contentIsDeletable(content, contents)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
      <path fill="currentColor" d="M32 119.4C12.9 108.4 0 87.7 0 64C0 28.7 28.7 0 64 0c23.7 0 44.4 12.9 55.4 32H456.6C467.6 12.9 488.3 0 512 0c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V392.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H119.4c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V119.4zM456.6 96H119.4c-5.6 9.7-13.7 17.8-23.4 23.4V392.6c9.7 5.6 17.8 13.7 23.4 23.4H456.6c5.6-9.7 13.7-17.8 23.4-23.4V119.4c-9.7-5.6-17.8-13.7-23.4-23.4zM128 160c0-17.7 14.3-32 32-32H288c17.7 0 32 14.3 32 32v96c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32V160zM256 320h32c35.3 0 64-28.7 64-64V224h64c17.7 0 32 14.3 32 32v96c0 17.7-14.3 32-32 32H288c-17.7 0-32-14.3-32-32V320z" />
    </svg>
  )
  const referenceIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
      <path fill="currentColor" d="M32 119.4C12.9 108.4 0 87.7 0 64C0 28.7 28.7 0 64 0c23.7 0 44.4 12.9 55.4 32H328.6C339.6 12.9 360.3 0 384 0c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V232.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H119.4c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V119.4zM119.4 96c-5.6 9.7-13.7 17.8-23.4 23.4V232.6c9.7 5.6 17.8 13.7 23.4 23.4H328.6c5.6-9.7 13.7-17.8 23.4-23.4V119.4c-9.7-5.6-17.8-13.7-23.4-23.4H119.4zm192 384c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V352h64v40.6c9.7 5.6 17.8 13.7 23.4 23.4H520.6c5.6-9.7 13.7-17.8 23.4-23.4V279.4c-9.7-5.6-17.8-13.7-23.4-23.4h-46c-5.4-15.4-14.6-28.9-26.5-39.6V192h72.6c11.1-19.1 31.7-32 55.4-32c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V392.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H311.4z" />
    </svg>
  )
  const blockCommand: Command = {
    name: 'create block',
    useCommand({ onEnd, type }) {
      let message = ''
      if (type) {
        message = 'specify base point'
      }
      const { input, setInputPosition, resetInput } = ctx.useCursorInput(message)

      return {
        onStart(p) {
          onEnd({
            updateContents: (contents, selected) => {
              const newContent: BlockContent = {
                type: 'block',
                contents: contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents)),
                base: p,
              }
              contents.forEach((_, i) => {
                if (ctx.isSelected([i], selected)) {
                  contents[i] = undefined
                }
              })
              contents.push(newContent)
            }
          })
        },
        input,
        onMove(_, p) {
          setInputPosition(p)
        },
        reset: resetInput,
      }
    },
    contentSelectable,
    hotkey: 'B',
    icon,
  }
  const blockReferenceCommand: Command = {
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
        updateSelectedContent(content, contents) {
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
        reset: resetInput,
      }
    },
    contentSelectable: isBlockContent,
    selectCount: 1,
    icon: referenceIcon,
  }
  return [blockCommand, blockReferenceCommand]
}
